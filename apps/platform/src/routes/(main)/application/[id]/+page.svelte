<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { pb, pbImage } from "$lib/pocketbase/client";
  import { toast } from "svelte-sonner";
  import { user } from "$lib/stores";
  import { Button } from "$lib/components/ui/button";
	import type { AnswersResponse, ApplicationsResponse, EventsResponse, QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
	import { ArrowLeft, ArrowRight, ChevronLeft, FilePen, Send } from "lucide-svelte";
  import * as Card from "$lib/components/ui/card"
	import { Progress } from "$lib/components/ui/progress";
	import { Badge } from "$lib/components/ui/badge";
  import Question from "./question.svelte"
  import { browser } from "$app/environment";
	import Status from "$lib/components/status.svelte";

  type ExpandedResponse = AnswersResponse<any, {
    question: QuestionsResponse
  }>

  type ExpandedApplication = ApplicationsResponse<{
    event: EventsResponse,
    response: ExpandedResponse[],
  }>

  let event: EventsResponse | null = null;
  let application: ExpandedApplication | null = null;
  let response: AnswersResponse<any, { question: QuestionsResponse }>[] = [];
  export let form

  onMount(async () => {
    if (form) {
      toast.error(form.message)
    }

    try {
      application = await pb.collection("applications").getOne<ExpandedApplication>($page.params.id, { 
        expand: "event,response,response.question"
      })
      event = application.expand?.event ?? null;
      response = application.expand?.response ?? [];
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred");
      }
    }
  });

  let currentPage = 1;
  $: pageAnswers = response.filter(i=>i.expand?.question.page==currentPage);
  $: pageInputs = pageAnswers.filter(i=>i.expand?.question.type!='info')
  $: isPageValid = pageInputs.length == pageInputs.filter(i=>i.valid).length;
  $: isLastPage = currentPage == Math.max(...response.map(i=>i.expand?.question.page ?? 99));

  const handleNextPage = () => {
    currentPage = currentPage + 1;
    scrollTo(0, 0);
  }

  const handleBackPage = () => {
    currentPage = currentPage - 1;
    scrollTo(0, 0);
  }

  if (browser) {
    try {
      pb.collection('answers').subscribe<ExpandedResponse>('*', function (e) {
        if (!(e.action == 'update' && e.record.application == application?.id)) return;
        const index = response.findIndex(i => i.id == e.record.id);
        if (index == -1) return;
        response[index] = e.record;
      }, {
        expand: "question"
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred");
      }
    }
  }

  onDestroy(() => {
    pb.collection('answers').unsubscribe('*')
  })

  let isCreating = false

  const handleSubmit = () => {
    isCreating = true
    toast.loading("Submitting application...", {
      duration: Number.POSITIVE_INFINITY
    })
  }

</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href="/">
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Back</span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    {#if event}
      {event.name}
    {:else}
      Application not found
    {/if}
  </h1>
</div>

{#if event && application && response && response.length > 0 && $user}
  <div class="flex flex-col gap-4 mt-4">
    <Card.Root>
      <Card.Header>
        <Card.Title>
          <Status type={application.status}  />
        </Card.Title>
        <Card.Description>
          All answers are saved automatically
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <div class="flex flex-col w-full">
          <span class="text-muted-foreground text-sm">
            {response.filter(i=>i.valid).length}/{response.length} Questions completed
          </span>
          <Progress value={(response.filter(i=>i.valid).length) / (response.length) * 100} />
        </div>
      </Card.Footer>
    </Card.Root>

    {#if response}
      {#each pageAnswers as answer (answer.id)}
        <Question answer={answer} application={application} />
      {/each}

      <div class="flex justify-end gap-2">
        {#if currentPage > 1}
        <Button class="flex items-center gap-2" variant="ghost" on:click={handleBackPage}>
          <ArrowLeft size="16"/> Back
        </Button>
        {/if}
        {#if isLastPage}
          {#if application.status == 'draft'}
            <form method="post" class="flex-1 md:flex-none" on:submit={handleSubmit}>
              <input type="hidden" name="userId" value={$user.model.id}/>
              <Button
                class="flex items-center gap-2 w-full" 
                disabled={isCreating || !isPageValid}
                type="submit"
              >
                Submit <Send size="16" />
              </Button>
            </form>
          {:else if application.status == 'editsRequested'}
            <form method="post" class="flex-1 md:flex-none" on:submit={handleSubmit}>
              <input type="hidden" name="userId" value={$user.model.id}/>
              <Button
                class="flex items-center gap-2 w-full" 
                disabled={isCreating || !isPageValid}
                type="submit"
              >
                Resubmit <Send size="16" />
              </Button>
            </form>
          {:else}
            <div></div>
          {/if}
        {:else}
          <Button 
            class="flex items-center gap-2 flex-1 md:flex-none" 
            disabled={!isPageValid}
            on:click={handleNextPage}
          >
            Next <ArrowRight size="16" />
          </Button>
        {/if}
      </div>
    {:else}
      Error loading questions, please refresh the page or try again later.
    {/if}

  </div>
{/if}