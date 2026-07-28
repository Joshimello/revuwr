import { pb } from '$lib/pocketbase/client';
import { toast } from 'svelte-sonner';
import type { ExpandedApplication } from './types';
import { page } from '$app/stores';
import { get } from 'svelte/store';

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

		return response;
	} catch (err) {
		if (err instanceof Error) {
			toast.error(err.message);
		} else {
			toast.error('Unknown error: get application');
		}
	}
};
