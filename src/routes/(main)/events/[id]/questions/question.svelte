<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card"
  import { Checkbox } from "$lib/components/ui/checkbox";
  import Editor from "$lib/components/editor.svelte";
  import { type EventsResponse, type QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
	import { Copy, Edit, Save, Trash, SaveOff, MoveUp, MoveDown } from "lucide-svelte";
  import { pb } from "$lib/pocketbase/client";
  import questionTypes from "./question-types";
  import { toast } from "svelte-sonner";
  import { page } from "$app/stores";
  import * as m from '$lib/paraglide/messages.js'
  import { refreshQuestions } from './methods'

  export let question: QuestionsResponse;
  export let editingId: string | null;
  export let index: number;

  $: isEditing = editingId == question.id;

  const handleEdit = async () => {
    editingId = question.id;
    refreshQuestions();
  }

  const handleDelete = async () => {
    try {
      await pb.collection('questions').delete(question.id)
      toast.success("Question deleted successfully")
      refreshQuestions();
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

  const handleCopy = async () => {
    let copied: QuestionsResponse | null = null

    try {
      copied = await pb.collection('questions').create({
        type: question.type,
        title: question.title,
        description: question.description,
        required: question.required,
        options: question.options,
        page: question.page,
        count: 0,
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

    if (!copied) return;

    try {
      const event = await pb
        .collection('events')
        .getOne<EventsResponse<{ questions: QuestionsResponse[] }>>(
          $page.params.id, 
          { expand: 'questions' }
        )

      const questions = [...event.expand?.questions || []]
      let pages: Record<number, string[]> = {}
      questions.forEach(q => {
        if (!pages[q.page]) pages[q.page] = []
        pages[q.page].push(q.id)
      })

      const index = pages[question.page].indexOf(question.id)
      pages[question.page].splice(index+1, 0, copied.id)

      const questionsIds = Object.values(pages).flat()

      await pb
        .collection('events')
        .update<EventsResponse<{ questions: QuestionsResponse[] }>>(
          $page.params.id, 
          { "questions": questionsIds }
        )

      refreshQuestions();
      editingId = copied.id
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
        console.error(err)
      }
      await pb.collection('questions').delete(copied.id)
    }
  }

  const handleCancel = async () => {
    editingId = null;
    refreshQuestions();
  }

  const handleSave = async () => {
    try {
      await pb.collection('questions').update(question.id, {
        title: question.title,
        description: question.description,
        options: question.options,
        required: question.required
      })
      toast.success("Question saved successfully")
      editingId = null;
      refreshQuestions();
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

  const handleMoveUp = async () => {
    if (index == 0) return;

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

        const index = pages[question.page].indexOf(question.id)
        pages[question.page].splice(index, 1)
        pages[question.page].splice(index-1, 0, question.id)

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
      refreshQuestions();
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

  const handleMoveDown = async () => {
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

        const index = pages[question.page].indexOf(question.id)

        if (index == pages[question.page].length - 1) return;

        pages[question.page].splice(index, 1)
        pages[question.page].splice(index+1, 0, question.id)

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
      refreshQuestions();
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

</script>

{#if questionTypes[question.type]}
  <Card.Root class="flex relative overflow-hidden">
    <div class="border-r flex flex-col overflow-hidden w-6">
      <Button 
        class="px-0 h-full rounded-none text-muted-foreground" 
        variant="ghost"
        on:click={handleMoveUp}
      >
        <MoveUp size="12" />
      </Button>
      <Button 
        class="px-0 h-full rounded-none text-muted-foreground" 
        variant="ghost"
        on:click={handleMoveDown}
      >
        <MoveDown size="12" />
      </Button>
    </div>
    <div class="w-full">
      <Card.Header>
        <Card.Title>
          {#if isEditing}
            <Editor bind:value={question.title} placeholder="Question" class="outline-none" />
          {:else}
            {@html question.title}
          {/if}
        </Card.Title>
        <Card.Description>
          {#if isEditing}
            <Editor bind:value={question.description} placeholder="Description" class="outline-none" />
          {:else}
            {@html question.description}
          {/if}
        </Card.Description>
      </Card.Header>
      <Card.Content class="{question.type == 'info' ? 'pb-0': ''}">

        <svelte:component 
          this={questionTypes[question.type].component} 
          bind:options={question.options}
          isEditing={isEditing}
          required={question.required}
        />

        {#if isEditing && question.type != 'info'}
          <div class="flex items-center gap-2">
            <Checkbox bind:checked={question.required} />
            <span>
              {m.required()}
            </span>
          </div>
        {/if}

        {#if !isEditing}
          <Button on:click={handleEdit} variant="ghost" size="icon" class="absolute right-1 top-1">
            <Edit size="16" />
          </Button>
        {/if}
        
      </Card.Content>

      {#if isEditing}
      <Card.Footer class="border-t p-1 flex justify-end gap-1">
        <span class="text-xs text-muted-foreground mr-auto ml-2">
          {question.type}.{question.id}
        </span>
        <Button on:click={handleDelete} variant="ghost" size="icon" class="hover:bg-destructive hover:text-destructive-foreground text-destructive">
          <Trash size="16" />
        </Button>
        <Button on:click={handleCopy} variant="ghost" size="icon">
          <Copy size="16" />
        </Button>
        <Button on:click={handleCancel} variant="ghost" size="icon">
          <SaveOff size="16" />
        </Button>
        <Button on:click={handleSave} variant="ghost" size="icon">
          <Save size="16" />
        </Button>
      </Card.Footer>
      {/if}

    </div>
  </Card.Root>

{:else}
  <div class="flex items-center w-full justify-between">
    <span class="text-sm text-muted-foreground">
      [{question.type}.{question.id}]: Unknown question type
    </span>
    <Button variant="outline" size="icon" on:click={handleDelete}>
      <Trash size="16" />
    </Button>
  </div>
{/if}