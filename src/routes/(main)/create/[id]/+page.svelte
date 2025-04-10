<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
  import * as Card from "$lib/components/ui/card"
	import { pbImage } from "$lib/pocketbase/client";
  import * as Table from "$lib/components/ui/table"
	import { Button } from "$lib/components/ui/button";
	import { toast } from "svelte-sonner";
  import * as Dialog from "$lib/components/ui/dialog"
	import { Checkbox } from "$lib/components/ui/checkbox";

  export let data
  const { event, user } = data
  const notStarted = new Date(event.startDate) > new Date()
  const isEnded = new Date(+new Date(event.endDate) + 86400000) < new Date()
  const canApply = 
    notStarted && event.beforeStartDate == 'allow' ||
    isEnded && event.afterStartDate == 'allow' ||
    !notStarted && !isEnded

  let isCreating = false
  let termsOpen = false
  let checked: boolean[] = []

  $: isAllChecked = checked.every(i => i === true)

</script>

<Card.Root>

  
  {#if event.image}
    <div class="w-full h-64 p-2">
      <img src={pbImage(event.collectionId, event.id, event.image)} alt={event.name} class="w-full h-full object-cover rounded-lg border" />
    </div>
  {/if}
  <Card.Header class="pt-2">
    <Card.Title class="text-2xl">
      {event.name}
    </Card.Title>
    <Card.Description>
      {event.description}
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <Table.Root class="border">
      <Table.Header>
        <Table.Row>
          <Table.Head>Event Target</Table.Head>
          <Table.Head>Event Duration</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        <Table.Row>
          <Table.Cell class="capitalize">{event.targetAudience}</Table.Cell>
          <Table.Cell>
            {new Date(event.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} &nbsp; -> &nbsp;
            {new Date(event.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table.Root>
    <div class="mt-6">
      <span>More info &nbsp; -> &nbsp;&nbsp;</span>
      <a href={event.moreInfo} target="_blank" rel="noopener noreferrer" class="text-blue-500 underline">{event.moreInfo}</a>
    </div>
  </Card.Content>
  <Card.Footer class="justify-end">
    <Button size="lg" type="submit"
      disabled={isCreating || !canApply || !user}
      on:click={() => {
        termsOpen = true
      }}
    >
      {#if notStarted && event.beforeStartDate == 'disallow'}
        Event has not started yet
      {:else if isEnded && event.afterStartDate == 'disallow'}
        Event has ended
      {:else if !user}
        Login to continue
      {:else}
        Apply now !
      {/if}
    </Button>
  </Card.Footer>
</Card.Root>

<Dialog.Root bind:open={termsOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Terms and conditions</Dialog.Title>
      <Dialog.Description>
        You have to agree to the terms and conditions to apply for this event.
      </Dialog.Description>
    </Dialog.Header>
    <div class="flex flex-col gap-2">
      {#each event.terms || [] as term, index}
        <div class="flex gap-2">
          <Checkbox bind:checked={checked[index]} class="mr-2 mt-2" />
          <div>
            <p class="font-semibold">{@html term.title}</p>
            <p>{@html term.description}</p>
          </div>
        </div>
      {/each}
    </div>
    <Dialog.Footer>
      <form class="mt-6" action="" method="post" on:submit={() => {
        isCreating = true
        toast.loading("Creating application...", {
          duration: Number.POSITIVE_INFINITY
        })
      }}>
        <Button size="lg" type="submit"
          disabled={isCreating || !canApply || !isAllChecked || !user}
        >
          {#if notStarted && event.beforeStartDate == 'disallow'}
            Event has not started yet
          {:else if isEnded && event.afterStartDate == 'disallow'}
            Event has ended
          {:else}
            Apply now !
          {/if}
        </Button>
      </form>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>