<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { pb } from '$lib/pocketbase/client'
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft } from 'lucide-svelte';
  import { page } from '$app/stores'
	import type { AnswersResponse, ApplicationsResponse, EventsResponse, QuestionsResponse, ReviewsResponse, UsersResponse } from '$lib/pocketbase/pocketbase-types';
  import { writable, readable } from 'svelte/store'
  import { toast } from 'svelte-sonner'
	import DataTable from './data-table.svelte';
  import * as m from '$lib/paraglide/messages.js'
	import { PUBLIC_BASE_PATH } from '$env/static/public';
  import { reviewRequests, event } from './stores';
  import { refreshReviewRequests } from './methods';
	import type { ExpandedApplication } from './types';

  $: reviewApplications = (() => {
    let arr: Record<string, {
      application: ExpandedApplication,
      reviews: {
        reviewId: string,
        reviewer: string,
        status: string | undefined,
        comment: string | undefined
      }[]
    }> = {}
    $reviewRequests.forEach(rr => {
      rr.expand?.applications.forEach(a => {
        const reviewData = rr.review?.[a.id];
        if (arr[a.id]) {
          arr[a.id].reviews = [
            ...arr[a.id].reviews,
            {
              reviewId: rr.id,
              reviewer: rr.reviewerEmail,
              status: reviewData?.status,
              comment: reviewData?.comment
            }
          ];
        } 
        else {
          arr[a.id] = {
            application: a,
            reviews: [{
              reviewId: rr.id,
              reviewer: rr.reviewerEmail,
              status: reviewData?.status,
              comment: reviewData?.comment
            }]
          };
        }
      });
    });
    return writable(Object.values(arr))
  })()

  onMount(() => {
    refreshReviewRequests()
  })

</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href={`${PUBLIC_BASE_PATH}/events/${$page.params.id}`}>
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Back</span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    {m.review_applications_overview()}
  </h1>
</div>

{#if $reviewApplications.length > 0 && $event}
  {#key reviewApplications}
    <div class="flex">
      <div class="flex-1 overflow-auto w-0">
        <DataTable data={reviewApplications} event={$event} />
      </div>
    </div>
  {/key}
{:else}
  {m.no_review_requests_yet()}
{/if}