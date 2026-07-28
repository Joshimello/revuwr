import { fail, redirect, isRedirect, error, isHttpError } from '@sveltejs/kit';
import type { ExpandedApplication } from './types.js';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import { PUBLIC_ACME } from '$env/static/public';
import { generateApplicationSummaryEmail } from '$lib/emails/application-summary';
import {
	isAnswerApplicable,
	normalizeAnswerResponse,
	validateAnswer,
	validateApplicationAnswers
} from './answer-validation.js';

async function validateFileReferences(
	locals: App.Locals,
	userId: string,
	response: unknown
): Promise<boolean> {
	if (!Array.isArray(response)) return false;

	try {
		for (const item of response) {
			if (
				typeof item !== 'object' ||
				item === null ||
				typeof item.recordId !== 'string' ||
				typeof item.collectionId !== 'string' ||
				!Array.isArray(item.files)
			) {
				return false;
			}

			const fileRecord = await locals.apb.collection('files').getOne(item.recordId);
			const filenames = item.files as unknown[];
			if (
				fileRecord.user !== userId ||
				fileRecord.collectionId !== item.collectionId ||
				filenames.some(
					(file) => typeof file !== 'string' || !(fileRecord.file as string[]).includes(file)
				)
			) {
				return false;
			}
		}
		return true;
	} catch {
		return false;
	}
}

export const load: ServerLoad = async ({ params, locals }) => {
	if (!params.id) {
		throw error(400, 'Invalid application ID');
	}

	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	try {
		const application = (await locals.pb.collection('applications').getOne(params.id, {
			expand: 'event,response,response.question'
		})) as ExpandedApplication;

		// Check if user has access to this application
		if (application.responder !== locals.user.id) {
			throw error(403, 'Access denied');
		}

		if (application.status === 'trashed') {
			throw error(404, 'Application not found');
		}

		return {
			application
		};
	} catch (err) {
		if (isHttpError(err)) {
			throw err;
		}
		if (err instanceof Error) {
			throw error(500, err.message);
		}
		throw error(500, 'Failed to load application');
	}
};

export const actions: Actions = {
	async createFiles({ request, params, locals }) {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		if (!params.id) {
			return fail(400, { message: 'Invalid application ID' });
		}

		try {
			const application = await locals.pb.collection('applications').getOne(params.id);
			if (application.responder !== locals.user.id) {
				return fail(403, { message: 'Access denied' });
			}
			if (application.status === 'trashed') {
				return fail(404, { message: 'Application not found' });
			}

			const formData = await request.formData();
			const files = formData.getAll('files') as File[];

			if (files.length === 0) {
				return fail(400, { message: 'No files provided' });
			}

			const promises = files.map(async (file) =>
				locals.pb.collection('files').create({
					file: file,
					user: locals.user?.id
				})
			);

			const responses = await Promise.all(promises);
			return {
				success: true,
				files: responses
			};
		} catch (err) {
			if (err instanceof Error) {
				return fail(400, { message: err.message });
			}
			return fail(400, { message: 'Failed to create files' });
		}
	},

	async removeFile({ request, params, locals }) {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		if (!params.id) {
			return fail(400, { message: 'Invalid application ID' });
		}

		try {
			const application = await locals.pb.collection('applications').getOne(params.id);
			if (application.responder !== locals.user.id) {
				return fail(403, { message: 'Access denied' });
			}
			if (application.status === 'trashed') {
				return fail(404, { message: 'Application not found' });
			}

			const formData = await request.formData();
			const fileId = formData.get('fileId')?.toString();
			const fileName = formData.get('fileName')?.toString();

			if (!fileId || !fileName) {
				return fail(400, { message: 'File ID and name are required' });
			}

			// First verify the user owns this file
			const fileRecord = await locals.pb.collection('files').getOne(fileId);
			if (fileRecord.user !== locals.user?.id) {
				return fail(403, { message: 'Access denied' });
			}

			const record = await locals.pb.collection('files').update(fileId, {
				'file-': fileName
			});

			if (record.file.length === 0) {
				await locals.pb.collection('files').delete(fileId);
			}

			return {
				success: true,
				record
			};
		} catch (err) {
			if (err instanceof Error) {
				return fail(400, { message: err.message });
			}
			return fail(400, { message: 'Failed to remove file' });
		}
	},
	async updateAnswer({ request, params, locals }) {
		if (!params.id) {
			return fail(400, { message: 'Invalid application ID' });
		}

		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		try {
			const formData = await request.formData();
			const answerId = formData.get('answerId')?.toString();
			const answerString = formData.get('answer')?.toString();

			if (!answerId) {
				return fail(400, { message: 'Answer ID is required' });
			}

			if (!answerString) {
				return fail(400, { message: 'Answer is required' });
			}

			// Parse the JSON answer
			let answer;
			try {
				answer = JSON.parse(answerString);
			} catch {
				return fail(400, { message: 'Invalid answer format' });
			}

			const application = await locals.apb
				.collection('applications')
				.getOne<ExpandedApplication>(params.id, {
					expand: 'event,response,response.question'
				});
			if (application.responder !== locals.user?.id) {
				return fail(403, { message: 'Access denied' });
			}
			if (application.status === 'trashed') {
				return fail(404, { message: 'Application not found' });
			}
			if (!['draft', 'editsRequested'].includes(application.status)) {
				return fail(409, { message: 'This application can no longer be edited' });
			}
			if (application.expand?.event.status !== 'active') {
				return fail(409, { message: 'This event is not accepting application updates' });
			}

			const storedAnswer = application.expand?.response?.find(
				(applicationAnswer) => applicationAnswer.id === answerId
			);
			if (!storedAnswer || storedAnswer.application !== application.id) {
				return fail(400, { message: 'Answer does not belong to this application' });
			}
			if (application.status === 'editsRequested' && storedAnswer.status !== 'edit') {
				return fail(403, { message: 'This answer was not requested for editing' });
			}

			const question = storedAnswer.expand?.question;
			const validation = validateAnswer(question, answer);
			if (!validation.valid) {
				return fail(422, {
					message: validation.message,
					invalidAnswers: [
						{
							answerId: storedAnswer.id,
							questionId: question?.id ?? '',
							code: validation.code,
							message: validation.message
						}
					]
				});
			}
			if (
				question?.type === 'file' &&
				!(await validateFileReferences(locals, locals.user.id, answer))
			) {
				return fail(422, {
					message: 'One or more file references are invalid',
					invalidAnswers: [
						{
							answerId: storedAnswer.id,
							questionId: question.id,
							code: 'invalid_file_reference',
							message: 'One or more file references are invalid'
						}
					]
				});
			}

			const normalizedAnswer = question ? normalizeAnswerResponse(question, answer) : answer;

			const updatedAnswer = await locals.apb.collection('answers').update(
				answerId,
				{
					response: normalizedAnswer,
					valid: true
				},
				{
					expand: 'question'
				}
			);

			return {
				success: true,
				answer: updatedAnswer
			};
		} catch (err) {
			if (err instanceof Error) {
				return fail(400, { message: err.message });
			}
			return fail(400, { message: 'Failed to update answer' });
		}
	},

	async submit({ params, locals }) {
		if (!params.id) {
			return fail(400, { message: 'Invalid application ID' });
		}

		try {
			if (!locals.user) {
				return fail(401, { message: 'Unauthorized' });
			}

			const application = await locals.apb
				.collection('applications')
				.getOne<ExpandedApplication>(params.id, {
					expand: 'event,response,response.question'
				});

			if (application.responder !== locals.user.id) {
				return fail(403, { message: 'Access denied' });
			}

			if (application.status === 'trashed') {
				return fail(404, { message: 'Application not found' });
			}
			if (['submitted', 'resubmitted'].includes(application.status)) {
				return redirect(303, `/`);
			}

			if (application.expand?.event.status != 'active') {
				return fail(400, { message: 'Event has been archived' });
			}

			if (!application.expand?.response) {
				return fail(400, { message: 'Responses could not be fetched' });
			}

			if (!['draft', 'editsRequested'].includes(application.status)) {
				return fail(400, { message: 'Invalid application status' });
			}

			const responses = application.expand.response;
			const validation = validateApplicationAnswers(responses);

			for (let index = 0; index < responses.length; index++) {
				const answer = responses[index];
				if (
					answer.expand?.question?.type === 'file' &&
					isAnswerApplicable(answer, responses) &&
					validateAnswer(answer.expand.question, answer.response).valid &&
					!(await validateFileReferences(locals, locals.user.id, answer.response))
				) {
					validation.invalidAnswers.push({
						answerId: answer.id,
						questionId: answer.expand.question.id,
						index,
						code: 'invalid_file_reference',
						message: 'One or more file references are invalid'
					});
				}
			}

			if (validation.invalidAnswers.length > 0) {
				return fail(422, {
					message: 'Please correct the highlighted response before submitting',
					invalidAnswers: validation.invalidAnswers
				});
			}

			await locals.apb.collection('applications').update(params.id, {
				status: application.status == 'editsRequested' ? 'resubmitted' : 'submitted',
				submissionTime: new Date().toISOString()
			});

			// Send confirmation email to the user
			const emailHtml = generateApplicationSummaryEmail(application);
			const eventName = application.expand?.event?.name || 'Event';

			try {
				const emailResult = await locals.rs.emails.send({
					from: `${PUBLIC_ACME} <notification@mail.nthumods.com>`,
					to: [locals.user.email],
					subject: `Application Submitted - ${eventName}`,
					html: emailHtml
				});
				if (emailResult.error) {
					console.error('Application confirmation email failed', {
						applicationId: application.id,
						error: emailResult.error
					});
				}
			} catch (emailError) {
				console.error('Application confirmation email failed', {
					applicationId: application.id,
					error: emailError
				});
			}

			return redirect(303, `/`);
		} catch (err) {
			if (isRedirect(err)) {
				return redirect(err.status, err.location);
			}

			if (err instanceof Error) {
				return fail(400, {
					message: err.message
				});
			} else {
				return fail(400, {
					message: 'An unknown error occurred'
				});
			}
		}
	},

	async delete({ params, locals }) {
		if (!params.id) {
			return fail(400, { message: 'Invalid application ID' });
		}

		try {
			const application = await locals.pb
				.collection('applications')
				.getOne<ExpandedApplication>(params.id, {
					expand: 'response,response.question'
				});

			if (!locals.user || application.responder !== locals.user.id) {
				return fail(400, { message: 'Invalid user' });
			}

			if (application.status === 'trashed') {
				return fail(404, { message: 'Application not found' });
			}

			if (!application.expand?.response) {
				return fail(400, { message: 'Responses could not be fetched' });
			}

			if (!['draft'].includes(application.status)) {
				return fail(400, { message: 'Invalid application status' });
			}

			await locals.apb.collection('applications').delete(params.id);

			for (const response of application.expand.response) {
				await locals.apb.collection('answers').delete(response.id, {
					requestKey: response.id
				});
			}

			return redirect(303, `/`);
		} catch (err) {
			if (isRedirect(err)) {
				return redirect(err.status, err.location);
			}

			if (err instanceof Error) {
				return fail(400, {
					message: err.message
				});
			} else {
				return fail(400, {
					message: 'An unknown error occurred'
				});
			}
		}
	},

	async withdraw({ params, locals }) {
		if (!params.id) {
			return fail(400, { message: 'Invalid application ID' });
		}

		try {
			const application = await locals.apb.collection('applications').getOne(params.id);

			if (!locals.user || application.responder !== locals.user.id) {
				return fail(400, { message: 'Invalid user' });
			}

			if (application.status === 'trashed') {
				return fail(404, { message: 'Application not found' });
			}

			if (['draft', 'withdrawn'].includes(application.status)) {
				return fail(400, { message: 'Invalid application status' });
			}

			await locals.apb.collection('applications').update(params.id, {
				status: 'withdrawn'
			});

			return redirect(303, `/`);
		} catch (err) {
			if (isRedirect(err)) {
				return redirect(err.status, err.location);
			}

			if (err instanceof Error) {
				return fail(400, {
					message: err.message
				});
			} else {
				return fail(400, {
					message: 'An unknown error occurred'
				});
			}
		}
	}
};
