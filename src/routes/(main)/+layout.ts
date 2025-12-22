import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase/client';
import { error } from '@sveltejs/kit';

export const load = async () => {
	if (browser) {
		if (!pb.authStore.isValid) {
			return error(401, 'Unauthorized');
		}
		if (!pb.authStore.isSuperuser) {
			return error(401, 'Unauthorized');
		}
	}
};
