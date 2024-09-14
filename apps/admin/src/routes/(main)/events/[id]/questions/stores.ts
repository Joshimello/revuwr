import type { QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
import { writable } from "svelte/store";

export const questions = writable<QuestionsResponse[]>([]);