import type { EventsResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';

type Terms = {
	title: string;
	description: string;
}[];

type ConditionalAnswer = Record<string, string>;

type Options = Record<string, unknown>;

export type Question = QuestionsResponse<ConditionalAnswer, Options>;

export type ExpandedEvent = EventsResponse<
	Terms,
	{
		questions: Question[];
	}
>;
