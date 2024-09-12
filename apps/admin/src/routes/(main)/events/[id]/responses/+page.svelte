<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { ChevronLeft } from "lucide-svelte";
  import { page } from "$app/stores"
  import { pb } from "$lib/pocketbase/client";
  import { onDestroy, onMount } from "svelte";
	import type { AnswersResponse, ApplicationsResponse, EventsResponse, QuestionsResponse, UsersResponse } from "$lib/pocketbase/pocketbase-types";
	import { toast } from "svelte-sonner";
  import DataTable from "./data-table.svelte"
	import DataTableBatch from "./data-table-batch.svelte";
  import { writable } from "svelte/store";
  import * as m from '$lib/paraglide/messages.js'
	import { PUBLIC_BASE_PATH } from "$env/static/public";
  
  type ExpandedApplication = ApplicationsResponse<{
    responder: UsersResponse,
    response: AnswersResponse[]
  }>

  type ExpandedEvents = EventsResponse<{
    questions: QuestionsResponse[]
  }>

  const applications = writable<ExpandedApplication[]>([])
  let event: ExpandedEvents | null = null

  onMount(async () => {
    try {
      pb.collection("applications").subscribe<ExpandedApplication>("*", e => {
        if (e.record.event != $page.params.id) return
        $applications = $applications
      })
      $applications = await pb.collection("applications").getFullList<ExpandedApplication>({
        filter: `event="${$page.params.id}"`,
        sort: "-created",
        expand: "responder,response"
      })
      event = await pb.collection("events").getOne($page.params.id, {
        expand: "questions"
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
      }
    }
  })

  onDestroy(() => {
    pb.collection("applications").unsubscribe()
  })

  let selectedRecords: Record<string, boolean>

</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href={`${PUBLIC_BASE_PATH}/events/${$page.params.id}`}>
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">
      {m.back()}
    </span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    {m.event_responses()}
  </h1>
</div>

{#if event && $applications.length > 0}
  <div class="flex">
    <div class="flex-1 overflow-auto w-0">
      <DataTable data={applications} event={event} bind:selectedRecords />
    </div>
  </div>
{:else}
  {m.no_responses_yet()}
{/if}

<DataTableBatch bind:applications={$applications} selectedRecords={selectedRecords} />