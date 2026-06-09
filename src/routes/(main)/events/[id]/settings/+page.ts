import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase/client';
import { error } from '@sveltejs/kit';
import {
	Collections,
	type EventsResponse,
	type QuestionsResponse
} from '$lib/pocketbase/pocketbase-types';

export type EventSettings = Omit<
	EventsResponse,
	'startDate' | 'endDate' | 'status' | 'targetAudience' | 'beforeStartDate' | 'afterStartDate'
> & {
	startDate: Date | null;
	endDate: Date | null;
	status: string;
	targetAudience: string;
	beforeStartDate: string;
	afterStartDate: string;
};

export const load: PageLoad = async ({ params, fetch }) => {
	try {
		const event = await pb
			.collection(Collections.Events)
			.getOne<EventsResponse<unknown, { [Collections.Questions]: QuestionsResponse }>>(params.id, {
				expand: Collections.Questions,
				fetch
			});

		return {
			event: {
				...event,
				startDate: event.startDate ? new Date(event.startDate) : null,
				endDate: event.endDate ? new Date(event.endDate) : null
			} as EventSettings,
			questions: event.expand?.[Collections.Questions]
		};
	} catch (err) {
		if (err instanceof Error) {
			throw error(500, err.message);
		} else {
			throw error(500, JSON.stringify(err));
		}
	}
};
