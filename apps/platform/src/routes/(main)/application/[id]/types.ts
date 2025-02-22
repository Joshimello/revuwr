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
	response: ExpandedResponse[];
}>;

export type ExpandedResponse = AnswersResponse<
	any,
	{
		question: QuestionsResponse;
	}
>;

export type FileRecord = {
	collectionId: string;
	recordId: string;
	file: string;
};

export type ExpandedReviewsResponse = ReviewsResponse<
	Record<
		string,
		{
			status: string;
			comment: string;
			files: FileRecord[];
		}
	>,
	{
		applications: ApplicationsResponse<{
			event: EventsResponse;
			response: AnswersResponse<
				any,
				{
					question: QuestionsResponse<any>;
				}
			>[];
			responder: UsersResponse;
		}>[];
	}
>;
