<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { ChevronLeft, CirclePlus } from "lucide-svelte";
  import { page } from "$app/stores";
  import * as Card from "$lib/components/ui/card"
  import questionTypes from "./question-types"
  import { onMount, onDestroy } from "svelte"
  import { pb } from "$lib/pocketbase/client"
  import { toast } from "svelte-sonner"
	import type { EventsResponse, QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
  import Question from "./question.svelte"
  import AddQuestion from "./add-question.svelte"
  import * as Tabs from "$lib/components/ui/tabs"
  import * as m from '$lib/paraglide/messages.js'
	import { PUBLIC_BASE_PATH } from "$env/static/public";

  let questions: QuestionsResponse[] = []
  let editingId: string | null = null

  const loadQuestions = async () => {
    try {
      const event = await pb
        .collection('events')
        .getOne<EventsResponse<{ questions: QuestionsResponse[] }>>($page.params.id, {
          expand: 'questions'
        })
      questions = event.expand?.questions || []
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
        console.error(err)
      }
    }
  }

  const handleNewPage = async () => {
    let question: QuestionsResponse | null = null

    try {
      question = await pb.collection('questions').create({
        type: 'info',
        count: 0,
        options: {},
        page: questions.length > 0 ? Math.max(...questions.map(i => i.page)) + 1 : '1',
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
        console.error(err)
      }
      return;
    }

    if (!question) return;

    try {
      await pb
        .collection('events')
        .update<EventsResponse<{ questions: QuestionsResponse[] }>>(
          $page.params.id, 
          { "questions+": question.id }
        )
      editingId = question.id
      currentPage = question.page.toString()
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
        console.error(err)
      }
      await pb.collection('questions').delete(question.id)
    }
  }

  onMount(async () => {
    loadQuestions()
    try {
      await pb
        .collection('events')
        .subscribe<EventsResponse<{ questions: QuestionsResponse[] }>>($page.params.id, e => {
           questions = e.record.expand?.questions || []
        }, {
          expand: 'questions'
        })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
        console.error(err)
      }
    }
  })

  onDestroy(() => {
    pb.collection('events').unsubscribe($page.params.id)
  })

  let currentPage = '1'

</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href="{PUBLIC_BASE_PATH}/events/{$page.params.id}">
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Back</span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    {m.editing_event_questions()}
  </h1>
</div>

<Tabs.Root bind:value={currentPage}>
  <div class="flex items-center gap-2">
    <Tabs.List>
      {#each [...new Set(questions.map(i=>i.page))] as page, index}
        <Tabs.Trigger value={page.toString()}>{m.page()} {page}</Tabs.Trigger>
      {/each}
    </Tabs.List>
    <Button variant="outline" size="sm" class="flex gap-2 h-7" on:click={handleNewPage}>
      <CirclePlus size="16" />
      <span>{m.new_page()}</span>
    </Button>
  </div>
  {#each [...new Set(questions.map(i=>i.page))] as page}
    <Tabs.Content value={page.toString()}>
      <div class="flex flex-col">
        {#each questions.filter(i=>i.page==page) as question, index (question.id)}
          <Question
            question={question} 
            refresh={loadQuestions} 
            bind:editingId={editingId} 
            index={index}
          />
          <AddQuestion bind:currentPage bind:editingId {index} long />
        {/each}
      </div>
    </Tabs.Content>
  {/each}
  {#if questions.length <= 0}
    <div class="mt-2 flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16">
      <div class="flex flex-col items-center gap-1 text-center">
        <h3 class="text-2xl font-bold tracking-tight">
          {m.no_questions()}
        </h3>
        <p class="text-muted-foreground text-sm mb-4">
          {m.no_questions_desc()}
        </p>
        <AddQuestion bind:currentPage bind:editingId />
      </div>
    </div>
  {/if}
</Tabs.Root>

<!-- <div class="flex lg:flex-row flex-col-reverse gap-x-8 gap-y-4">
  <div class="flex-1 flex flex-col lg:gap-8 gap-4">

  </div>
  <div class="lg:w-64 flex-shrink-0">
    
  </div>
</div> -->