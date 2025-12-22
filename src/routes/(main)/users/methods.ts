import { pb } from '$lib/pocketbase/client';
import { toast } from 'svelte-sonner';
import type { CreateUserDetails, ExpandedUsersResponse } from './types';

export const getAllUsers = async () => {
	try {
		const records = await pb.collection('users').getFullList<ExpandedUsersResponse>({
			expand: 'applications'
		});
		toast.success('Users loaded');
		return records;
	} catch (err) {
		console.error(err);
		if (err instanceof Error) {
			toast.error(err.message);
		} else {
			toast.error('An error occurred');
		}
	}
};

export const createUser = async (details: CreateUserDetails, cb?: () => void) => {
	try {
		console.log('Creating user:', details);
		await pb.collection('users').create({
			username: details.userId,
			name: details.name,
			email: details.email,
			password: details.password,
			passwordConfirm: details.password,
			init: false
		});
		toast.success('User created');
		if (cb) cb();
	} catch (err) {
		console.error(err);
		if (err instanceof Error) {
			toast.error(err.message);
		} else {
			toast.error('Unknown error');
		}
	}
};

export const deleteUser = async (userId: string, deleteUserAccount: boolean = false) => {
	const applications = await pb.collection('applications').getFullList({
		filter: `responder = "${userId}"`
	});

	if (applications.length > 0) {
		const batch = pb.createBatch();
		for (const application of applications) {
			for (const answerId of application.response) {
				batch.collection('answers').delete(answerId);
			}
			batch.collection('applications').delete(application.id);
		}
		await batch.send();
	}

	if (deleteUserAccount) {
		await pb.collection('users').delete(userId);
	}

	return deleteUserAccount ? 'User and all data deleted' : 'User associated data deleted';
};
