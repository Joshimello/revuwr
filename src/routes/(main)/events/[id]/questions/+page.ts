import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase/client';
import { error } from '@sveltejs/kit';
import type { ExpandedEvent } from './types';

export const load: PageLoad = async ({ params }) => {
	try {
		const event = await pb.collection('events').getOne<ExpandedEvent>(params.id, {
			expand: 'questions'
		});

		return {
			event: {
				id: event.id,
				name: event.name
			},
			questions: event.expand?.questions || []
		};
	} catch (err) {
		console.error('Failed to load event questions:', err);
		throw error(404, 'Event not found');
	}
};
