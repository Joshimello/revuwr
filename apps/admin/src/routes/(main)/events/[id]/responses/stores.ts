import type {
	AnswersResponse,
	ApplicationsResponse,
	QuestionsResponse,
	UsersResponse
} from '$lib/pocketbase/pocketbase-types';
import { writable } from 'svelte/store';

type ExpandedApplication = ApplicationsResponse<{
	responder: UsersResponse;
	response: AnswersResponse<
		any,
		{
			question: QuestionsResponse;
		}
	>[];
}>;

export const applications = writable<ExpandedApplication[]>([]);
