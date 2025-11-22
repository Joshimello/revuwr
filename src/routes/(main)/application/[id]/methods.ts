import { pb } from '$lib/pocketbase/client';
import { toast } from 'svelte-sonner';
import type { ExpandedApplication, ExpandedResponse } from './types';
import { application } from './stores';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { processConditionalQuestions } from './conditional-utils';

export const removeFile = async (id: string, file: string) => {
	try {
		const record = await pb.collection('files').update(id, {
			'file-': file
		});
		if (record.file.length === 0) {
			await pb.collection('files').delete(id);
		}
		return true;
	} catch (err) {
		if (err instanceof Error) {
			toast.error(err.message);
		} else {
			toast.error('Unknown error: remove file');
		}
		return false;
	}
};

export const createFiles = async (files: File[]) => {
	if (!get(page).data.user.id) {
		toast.error('User not found');
		return;
	}
	try {
		const promises = files.map(async (file) =>
			pb.collection('files').create({
				file: file,
				user: get(page).data.user.id
			})
		);
		const responses = await Promise.all(promises);
		return responses;
	} catch (err) {
		if (err instanceof Error) {
			toast.error(err.message);
		} else {
			toast.error('Unknown error: create files');
		}
	}
};

export const getApplication = async (id: string) => {
	try {
		const response = await pb.collection('applications').getOne<ExpandedApplication>(id, {
			expand: 'event,response,response.question'
		});

		// Process conditional questions and update answers that should be automatically valid
		if (response.expand?.response) {
			const processedAnswers = await processConditionalQuestions(response.expand.response);

			// Update any answers that were marked as valid due to conditional logic
			for (let i = 0; i < processedAnswers.length; i++) {
				const originalAnswer = response.expand.response[i];
				const processedAnswer = processedAnswers[i];

				// If the processed answer is now valid but the original wasn't, update it in the database
				if (processedAnswer.valid && !originalAnswer.valid) {
					await pb.collection('answers').update(originalAnswer.id, {
						valid: true
					});
				}
			}

			// Update the response with processed answers
			response.expand.response = processedAnswers;
		}

		return response;
	} catch (err) {
		if (err instanceof Error) {
			toast.error(err.message);
		} else {
			toast.error('Unknown error: get application');
		}
	}
};

export const updateConditionalAnswers = async (answers: ExpandedResponse[]) => {
	try {
		const processedAnswers = await processConditionalQuestions(answers);

		// Update any answers that were marked as valid due to conditional logic
		const updatePromises = processedAnswers.map(async (processedAnswer, index) => {
			const originalAnswer = answers[index];

			// If the processed answer is now valid but the original wasn't, update it in the database
			if (processedAnswer.valid && !originalAnswer.valid) {
				return pb.collection('answers').update(originalAnswer.id, {
					valid: true
				});
			}
			return null;
		});

		await Promise.all(updatePromises.filter(Boolean));

		// Update the application store
		application.update((app) => {
			if (app?.expand?.response) {
				app.expand.response = processedAnswers;
			}
			return app;
		});

		return processedAnswers;
	} catch (err) {
		if (err instanceof Error) {
			toast.error(err.message);
		} else {
			toast.error('Unknown error: update conditional answers');
		}
		return answers;
	}
};

export const updateAnswer = async (id: string, answer: unknown) => {
	try {
		console.log(answer);
		const response = await pb.collection('answers').update<ExpandedResponse>(
			id,
			{
				response: answer,
				valid: true
			},
			{
				expand: 'question'
			}
		);
		application.update((application) => {
			const answerIndex = application?.expand?.response.findIndex((a) => a.id === id);
			if (answerIndex !== undefined && application && application.expand) {
				application.expand.response[answerIndex] = response;
				return application;
			}
			return application;
		});
		console.log('Answer updated');
		return [true, response];
	} catch (err) {
		if (err instanceof Error) {
			toast.error(err.message);
		} else {
			toast.error('Unknown error: update answer');
		}
		return [false, null];
	}
};
