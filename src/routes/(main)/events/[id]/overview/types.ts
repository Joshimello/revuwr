import type { AnswersResponse, ApplicationsResponse, EventsResponse, QuestionsResponse, ReviewsResponse, UsersResponse } from "$lib/pocketbase/pocketbase-types";

export type ExpandedApplication = ApplicationsResponse<{
  event: EventsResponse;
  responder: UsersResponse;
  response: AnswersResponse[];
}>;

export type ExpandedReviews = ReviewsResponse<Record<string, { status: string, comment: string }>, {
  applications: ExpandedApplication[],
  questions: QuestionsResponse[],
}>