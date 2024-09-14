import type { AnswersResponse, ApplicationsResponse, UsersResponse } from "$lib/pocketbase/pocketbase-types";
import { writable } from "svelte/store";

type ExpandedApplication = ApplicationsResponse<{
  responder: UsersResponse,
  response: AnswersResponse[]
}>

export const applications = writable<ExpandedApplication[]>([])