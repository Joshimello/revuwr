import { reviewRequests, event } from "./stores";
import type { ExpandedReviews } from "./types";
import { pb } from "$lib/pocketbase/client";
import { toast } from "svelte-sonner";
import { page } from "$app/stores";
import { get } from "svelte/store";

export const refreshReviewRequests = async () => {
  try {
    const records = await pb.collection('reviews').getFullList<ExpandedReviews>({
      filter: `applications.event?~"${get(page).params.id}"`,
      sort: '-created',
      expand: 'applications,questions,applications.responder'
    });
    reviewRequests.set(records);
    const record = await pb.collection('events').getOne(get(page).params.id)
    event.set(record);
  }
  catch (err) {
    if (err instanceof Error) {
      toast.error(err.message);
    }
    else {
      toast.error('An error occurred');
    }
  }
}