import { pb } from '$lib/pocketbase/client';
import { toast } from 'svelte-sonner';
import type { ExpandedApplication, ExpandedResponse } from './types';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import { processConditionalQuestions } from './conditional-utils';

/**
 * @deprecated Use server action ?/removeFile instead
 * This function is kept for backwards compatibility but should not be used for new code
 */
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

/**
 * @deprecated Use server action ?/createFiles instead
 * This function is kept for backwards compatibility but should not be used for new code
 */
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

/**
 * @deprecated Use server-side loading in +page.server.ts load function instead
 * This function is kept for backwards compatibility but should not be used for new code
 */
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

		// Note: Store updates are now handled by invalidateAll() in the components
		// to ensure server-side data is the source of truth
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
