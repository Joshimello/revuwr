import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase/client';
import { error } from '@sveltejs/kit';
import type { EventsResponse } from '$lib/pocketbase/pocketbase-types';
import { toast } from 'svelte-sonner';

export const load = async ({ fetch }) => {
	if (browser) {
		if (!pb.authStore.isValid) {
			return error(401, 'Unauthorized');
		}
		if (!pb.authStore.isSuperuser) {
			return error(401, 'Unauthorized');
		}
	}

	let events: EventsResponse[] = [];

	try {
		const eventsList = await pb.collection('events').getList(1, 50, {
			fields: 'id,name',
			requestKey: 'breadcrumbs',
			fetch
		});
		events = eventsList.items;
	} catch (error) {
		if (error instanceof Error) {
			toast.error(error.message);
		} else {
			toast.error(JSON.stringify(error));
		}
	}

	return {
		events
	};
};
