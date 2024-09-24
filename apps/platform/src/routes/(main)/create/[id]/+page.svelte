<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
  import * as Card from "$lib/components/ui/card"
	import { pbImage } from "$lib/pocketbase/client";
  import * as Table from "$lib/components/ui/table"
	import { Button } from "$lib/components/ui/button";
	import { toast } from "svelte-sonner";

  export let data
  const { event } = data

  let isCreating = false
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
    <form class="mt-6" action="" method="post" on:submit={() => {
      isCreating = true
      toast.loading("Creating application...", {
        duration: Number.POSITIVE_INFINITY
      })
    }}>
      <Button size="lg" type="submit"
        disabled={isCreating || new Date(event.startDate) > new Date() || new Date(+new Date(event.endDate) + 86400000) < new Date()}
      >
        {#if new Date(event.startDate) > new Date()}
          Event has not started yet
        {:else if new Date(+new Date(event.endDate) + 86400000) < new Date()}
          Event has ended
        {:else}
          Apply now !
        {/if}
      </Button>
    </form>
  </Card.Footer>
</Card.Root>