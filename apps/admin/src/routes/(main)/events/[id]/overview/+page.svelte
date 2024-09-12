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

  type ExpandedApplication = ApplicationsResponse<{
		event: EventsResponse;
		responder: UsersResponse;
		response: AnswersResponse[];
	}>;

  type ExpandedReviews = ReviewsResponse<Record<string, { status: string, comment: string }>, {
    applications: ExpandedApplication[],
    questions: QuestionsResponse[],
  }>

  let event: EventsResponse | null = null
  const reviewRequests = writable<ExpandedReviews[]>([])
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
        if (arr[a.id]) {
          arr[a.id].reviews = [
            ...arr[a.id].reviews,
            {
              reviewId: rr.id,
              reviewer: rr.reviewerEmail,
              status: rr.review?.[a.id]?.status,
              comment: rr.review?.[a.id]?.comment
            }
          ]
        }
        else {
          arr[a.id] = {
            application: a,
            reviews: [{
              reviewId: rr.id,
              reviewer: rr.reviewerEmail,
              status: rr.review?.[a.id].status,
              comment: rr.review?.[a.id].comment
            }]
          }
        }
      })
    })
    return writable(Object.values(arr))
  })()

  onMount(async () => {
    try {
      pb.collection('applications').subscribe<ExpandedApplication>("*", e => {
        const index = $reviewApplications.findIndex(i => i.application.id === e.record.id)
        if (index < 0) return
        $reviewApplications[index].application = e.record
        event = e.record.expand?.event ?? event
      }, {
        filter: `event="${$page.params.id}"`,
        expand: 'responder,event'
      })
      $reviewRequests = await pb.collection('reviews').getFullList<ExpandedReviews>({
        filter: `applications.event?~"${$page.params.id}"`,
        sort: '-created',
        expand: 'applications,questions,applications.responder'
      });
      event = await pb.collection('events').getOne($page.params.id)
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
      else {
        toast.error('An error occurred');
      }
    }
  })

  onDestroy(() => {
    pb.collection('applications').unsubscribe();
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

{#if $reviewApplications.length > 0 && event}
  <div class="flex">
    <div class="flex-1 overflow-auto w-0">
      <DataTable data={reviewApplications} event={event} />
    </div>
  </div>
{:else}
  {m.no_review_requests_yet()}
{/if}