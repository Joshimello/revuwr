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
	unknown,
	{
		question: QuestionsResponse<unknown>;
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
				unknown,
				{
					question: QuestionsResponse<unknown>;
				}
			>[];
			responder: UsersResponse;
		}>[];
	}
>;
