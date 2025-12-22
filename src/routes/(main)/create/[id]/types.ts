import type {
	EventsResponse,
	QuestionsResponse,
	UsersResponse
} from '$lib/pocketbase/pocketbase-types';

export type Terms = {
	title: string;
	description: string;
}[];

export type Event = EventsResponse<
	Terms,
	{
		questions: QuestionsResponse[];
	}
>;

export type User = UsersResponse | null;
