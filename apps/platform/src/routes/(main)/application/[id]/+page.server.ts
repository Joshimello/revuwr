import { fail, redirect, isRedirect, error } from '@sveltejs/kit';
import type { ExpandedApplication } from './types.js';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import { PUBLIC_ACME } from '$env/static/public';
import { generateApplicationSummaryEmail } from '$lib/emails/application-summary';
import { processConditionalQuestions } from './conditional-utils.js';

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

		// Process conditional questions and update answers that should be automatically valid
		if (application.expand?.response) {
			const processedAnswers = await processConditionalQuestions(application.expand.response);

			// Update any answers that were marked as valid due to conditional logic
			for (let i = 0; i < processedAnswers.length; i++) {
				const originalAnswer = application.expand.response[i];
				const processedAnswer = processedAnswers[i];

				// If the processed answer is now valid but the original wasn't, update it in the database
				if (processedAnswer.valid && !originalAnswer.valid) {
					await locals.pb.collection('answers').update(originalAnswer.id, {
						valid: true
					});
				}
			}

			// Update the response with processed answers
			application.expand.response = processedAnswers;
		}

		return {
			application
		};
	} catch (err) {
		if (err instanceof Error) {
			throw error(500, err.message);
		}
		throw error(500, 'Failed to load application');
	}
};

export const actions: Actions = {
	async createFiles({ request, locals }) {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		try {
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

	async removeFile({ request, locals }) {
		if (!locals.user) {
			return fail(401, { message: 'Unauthorized' });
		}

		try {
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

			// Get the application to verify user access
			const application = await locals.pb.collection('applications').getOne(params.id);
			if (application.responder !== locals.user?.id) {
				return fail(403, { message: 'Access denied' });
			}

			// Update the answer
			const updatedAnswer = await locals.pb.collection('answers').update(
				answerId,
				{
					response: answer,
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
			const application = await locals.pb
				.collection('applications')
				.getOne<ExpandedApplication>(params.id, {
					expand: 'event,response,response.question'
				});

			if (application.expand?.event.status != 'active') {
				return fail(400, { message: 'Event has been archived' });
			}

			if (!locals.user || application.responder !== locals.user.id) {
				return fail(400, { message: 'Invalid user' });
			}

			if (!application.expand?.response) {
				return fail(400, { message: 'Responses could not be fetched' });
			}

			if (!['draft', 'editsRequested'].includes(application.status)) {
				return fail(400, { message: 'Invalid application status' });
			}

			const responses = application.expand.response;

			if (responses.some((i) => i.valid === false)) {
				return fail(400, { message: 'Some responses are invalid' });
			}

			await locals.apb.collection('applications').update(params.id, {
				status: application.status == 'editsRequested' ? 'resubmitted' : 'submitted'
			});

			// Send confirmation email to the user
			const emailHtml = generateApplicationSummaryEmail(application);
			const eventName = application.expand?.event?.name || 'Event';

			await locals.rs.emails.send({
				from: `${PUBLIC_ACME} <notification@mail.nthumods.com>`,
				to: [locals.user.email],
				subject: `Application Submitted - ${eventName}`,
				html: emailHtml
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
