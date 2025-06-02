import type { EventsResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
import { pb } from '$lib/pocketbase/client';
import { toast } from 'svelte-sonner';
import { page } from '$app/stores';
import { questions } from './stores';
import { get } from 'svelte/store';

type ExpandedEvent = EventsResponse<
	any,
	{
		questions: QuestionsResponse[];
	}
>;

export const refreshQuestions = async () => {
	try {
		const event = await pb.collection('events').getOne<ExpandedEvent>(get(page).params.id, {
			expand: 'questions'
		});
		questions.set(event.expand?.questions || []);
	} catch (err) {
		if (err instanceof Error) {
			toast.error(err.message);
		} else {
			toast.error('An error occurred');
			console.error(err);
		}
	}
};
