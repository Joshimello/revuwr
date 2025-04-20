import { pb } from '$lib/pocketbase/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	try {
		const colleges = await pb.collection('colleges').getFullList();
		return { colleges };
	} catch (err) {
		throw new Error('Failed to fetch colleges from PocketBase');
	}
};
