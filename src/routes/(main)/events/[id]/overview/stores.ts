import type { AnswersResponse, ApplicationsResponse, EventsResponse, QuestionsResponse, ReviewsResponse, UsersResponse } from "$lib/pocketbase/pocketbase-types";
import { writable } from "svelte/store";
import type { ExpandedReviews } from "./types";

export const reviewRequests = writable<ExpandedReviews[]>([])
export const event = writable<EventsResponse | null>(null)