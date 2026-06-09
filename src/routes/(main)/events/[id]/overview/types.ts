import type {
	AnswersResponse,
	ApplicationsResponse,
	EventsResponse,
	QuestionsResponse,
	ReviewsResponse,
	UsersResponse
} from '$lib/pocketbase/pocketbase-types';

export type ExpandedApplication = ApplicationsResponse<{
	event: EventsResponse;
	responder: UsersResponse;
	response: AnswersResponse[];
}>;

export type ExpandedReviews = ReviewsResponse<
	Record<
		string,
		{
			status: string;
			comment: string;
			files: {
				collectionId: string;
				recordId: string;
				file: string;
			}[];
		}
	>,
	{
		applications: ExpandedApplication[];
		questions: QuestionsResponse[];
	}
>;
