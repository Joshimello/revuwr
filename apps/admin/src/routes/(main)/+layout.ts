import { pb } from '$lib/pocketbase/client';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	if (!(pb.authStore.isValid && pb.authStore.isSuperuser)) {
		return error(401, 'Unauthorized');
	}
};
