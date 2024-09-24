import type { AnswersResponse, ApplicationsResponse, EventsResponse, QuestionsResponse } from "$lib/pocketbase/pocketbase-types"

export type ExpandedResponse = AnswersResponse<any, {
  question: QuestionsResponse
}>

export type ExpandedApplication = ApplicationsResponse<{
  event: EventsResponse,
  response: ExpandedResponse[],
}>