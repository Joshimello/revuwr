import type { ReviewsResponse } from "$lib/pocketbase/pocketbase-types";
import { writable } from "svelte/store";

export const reviewRequests = writable<ReviewsResponse[]>([]);