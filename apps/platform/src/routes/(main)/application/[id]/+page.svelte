<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { pb, pbImage } from "$lib/pocketbase/client";
  import { toast } from "svelte-sonner";
  import { Button } from "$lib/components/ui/button";
	import type { AnswersResponse, EventsResponse, QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
	import { ArrowLeft, ArrowRight, ChevronLeft, Menu, Send, Trash } from "lucide-svelte";
  import * as Card from "$lib/components/ui/card"
	import { Progress } from "$lib/components/ui/progress";
  import Question from "./question.svelte"
	import Status from "$lib/components/status.svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import * as Dialog from "$lib/components/ui/dialog"
	import type { ExpandedApplication } from "./types";
  import { application } from "./stores";

  let event: EventsResponse | null = null;
  let response: AnswersResponse<any, { question: QuestionsResponse }>[] = [];
  
  export let form, data
  const { user } = data

  onMount(async () => {
    pb.authStore.loadFromCookie(document.cookie)
    if (form) {
      toast.error(form.message)
    }
    try {
      $application = await pb.collection("applications").getOne<ExpandedApplication>($page.params.id, { 
        expand: "event,response,response.question"
      })
      event = $application.expand?.event ?? null;
      response = $application.expand?.response ?? [];
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("An error occurred");
      }
    }
  });

  $: response = $application?.expand?.response ?? [];

  let currentPage = 1;
  $: pageAnswers = response.filter(i=>i.expand?.question.page==currentPage);
  $: pageInputs = pageAnswers.filter(i=>i.expand?.question.type!='info')
  $: isPageValid = pageInputs.length == pageInputs.filter(i=>i.valid).length || $application?.status != 'draft';
  $: isLastPage = currentPage == Math.max(...response.map(i=>i.expand?.question.page ?? 99));
  
  $: applicationInputs = response.filter(i=>i.expand?.question.type!='info');
  $: applicationValidCount = applicationInputs.filter(i=>i.valid).length;

  const handleNextPage = () => {
    currentPage = currentPage + 1;
    scrollTo(0, 0);
  }

  const handleBackPage = () => {
    currentPage = currentPage - 1;
    scrollTo(0, 0);
  }

  let isCreating = false

  const handleSubmit = () => {
    isCreating = true
    toast.loading("Submitting application...", {
      duration: Number.POSITIVE_INFINITY
    })
  }

  let deleteOpen = false
  let withdrawOpen = false

</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href="/">
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Back</span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl mr-auto">
    {#if event}
      {event.name}
    {:else}
      Application not found
    {/if}
  </h1>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button variant="ghost" builders={[builder]}>
        <Menu size="16" />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Group>
        {#if $application?.status == 'draft'}
        <DropdownMenu.Item on:click={() => deleteOpen = true}>
          Delete draft
        </DropdownMenu.Item>
        {:else if $application?.status != 'withdrawn'}
        <DropdownMenu.Item on:click={() => withdrawOpen = true}>
          Withdraw
        </DropdownMenu.Item>
        {/if}
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

{#if event && $application && response && response.length > 0 && user}
  <div class="flex flex-col gap-4 mt-4">
    <Card.Root>
      <Card.Header>
        <Card.Title>
          <Status type={$application.status}  />
        </Card.Title>
        <Card.Description>
          All answers are saved automatically
        </Card.Description>
      </Card.Header>
      <Card.Footer>
        <div class="flex flex-col w-full">
          <span class="text-muted-foreground text-sm">
            {applicationValidCount} of {applicationInputs.length} questions answered
          </span>
          <Progress value={(applicationValidCount) / (applicationInputs.length) * 100} />
        </div>
      </Card.Footer>
    </Card.Root>

    {#if response}
      {#each pageAnswers as answer (answer.id)}
        <Question answer={answer} />
      {/each}

      <div class="flex justify-end gap-2">
        {#if currentPage > 1}
        <Button class="flex items-center gap-2" variant="ghost" on:click={handleBackPage}>
          <ArrowLeft size="16"/> Back
        </Button>
        {/if}
        {#if isLastPage}
          {#if $application.status == 'draft'}
            <form method="post" action="?/submit" class="flex-1 md:flex-none" on:submit={handleSubmit}>
              <input type="hidden" name="userId" value={user.id}/>
              <Button
                class="flex items-center gap-2 w-full" 
                disabled={isCreating || !isPageValid}
                type="submit"
              >
                Submit <Send size="16" />
              </Button>
            </form>
          {:else if $application.status == 'editsRequested'}
            <form method="post" action="?/submit" class="flex-1 md:flex-none" on:submit={handleSubmit}>
              <input type="hidden" name="userId" value={user.id}/>
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

<Dialog.Root bind:open={deleteOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="text-red-500">Deleting draft</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this draft? This will remove the application and all answers. You will not be able to recover them.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <form method="post" action="?/delete" class="flex-1 md:flex-none" on:submit={() => {
        isCreating = true
        toast.loading("Deleting draft...", {
          duration: Number.POSITIVE_INFINITY
        })
      }}>
        <input type="hidden" name="userId" value={user?.id}/>
        <Button
          class="flex items-center gap-2 w-full" 
          disabled={isCreating}
          type="submit"
          variant="destructive"
        >
          <Trash size="16" /> Delete draft
        </Button>
      </form>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={withdrawOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title class="text-red-500">
        Withdrawing application
      </Dialog.Title>
      <Dialog.Description>
        Are you sure you want to withdraw this application?
        Your application will be archived but you will not be able to edit or resubmit it.
        Your application will be marked as withdrawn and will no longer participate in the event.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <form method="post" action="?/withdraw" class="flex-1 md:flex-none" on:submit={() => {
        isCreating = true
        toast.loading("Withdrawing...", {
          duration: Number.POSITIVE_INFINITY
        })
      }}>
        <input type="hidden" name="userId" value={user?.id}/>
        <Button
          class="flex items-center gap-2 w-full" 
          disabled={isCreating}
          type="submit"
          variant="destructive"
        >
          <Trash size="16" /> Withdraw application
        </Button>
      </form>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>