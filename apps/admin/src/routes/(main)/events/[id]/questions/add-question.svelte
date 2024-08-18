<script lang="ts">
  import * as Popover from "$lib/components/ui/popover";
  import { Button } from "$lib/components/ui/button";
  import questionTypes from "./question-types";
  import { pb } from "$lib/pocketbase/client";
  import { toast } from "svelte-sonner";
  import type { EventsResponse, QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
  import { page } from "$app/stores";

  export let currentPage: string
  export let editingId: string | null
  export let long: boolean = false
  export let index: number | null = null

  const addQuestion = async (type: string) => {
    let question: QuestionsResponse | null = null

    open = false
    
    try {
      question = await pb.collection('questions').create({
        type: type,
        count: 0,
        options: {},
        page: parseInt(currentPage),
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
      const event = await pb
        .collection('events')
        .getOne<EventsResponse<{ questions: QuestionsResponse[] }>>(
          $page.params.id, 
          { expand: 'questions' }
        )

      if (event.questions.length > 0) {
        const questions = [...event.expand?.questions || []]
        let pages: Record<number, string[]> = {}
        questions.forEach(q => {
          if (!pages[q.page]) pages[q.page] = []
          pages[q.page].push(q.id)
        })

        if (index != null) pages[parseInt(currentPage)].splice(index+1, 0, question.id)
        else pages[parseInt(currentPage)].push(question.id)

        const questionsIds = Object.values(pages).flat()

        await pb
          .collection('events')
          .update<EventsResponse<{ questions: QuestionsResponse[] }>>(
            $page.params.id, 
            { "questions": questionsIds }
          )
      }
      else {
        await pb
          .collection('events')
          .update<EventsResponse<{ questions: QuestionsResponse[] }>>(
            $page.params.id, 
            { "questions+": question.id }
          )
      }

      editingId = question.id
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

  let open = false

</script>
 
<Popover.Root bind:open={open}>
  <Popover.Trigger asChild let:builder>
    {#if long}
      <Button builders={[builder]} class="w-full h-2 text-muted-foreground text-xs hover:opacity-100 opacity-0 transition-opacity duration-75" variant="ghost">
        Add New Question
      </Button>
    {:else}
      <Button builders={[builder]}>
        Add a new question
      </Button>
    {/if}
  </Popover.Trigger>
  <Popover.Content>
    {#each Object.entries(questionTypes) as [type, { label, icon, component }]}
      <Button 
        class="w-full flex justify-start gap-2" 
        variant="outline"
        size="sm"
        on:click={() => addQuestion(type)}
      >
        <svelte:component this={icon} size="16" class="shrink-0" />
        <span>{label}</span>
      </Button>
    {/each}
  </Popover.Content>
</Popover.Root>