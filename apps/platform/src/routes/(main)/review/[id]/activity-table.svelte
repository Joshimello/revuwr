<script lang="ts">
	import { Badge } from "$lib/components/ui/badge";
  import * as Table from "$lib/components/ui/table"
  export let value: {
    date: string,
    startTime: string,
    endTime: string,
    form: string,
    location: string,
    topic: string,
    note: string
  }[]
</script>

<Table.Root class="border">
  <Table.Header>
    <Table.Row>
      <Table.Head>When</Table.Head>
      <Table.Head>Topic</Table.Head>
      <Table.Head>Venue</Table.Head>
      <Table.Head>Note</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each value as session}
      <Table.Row>
        <Table.Cell>
          <div class="font-medium">
            {new Date(session.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
          <div class="text-muted-foreground hidden text-sm md:inline">
            {session.startTime} - {session.endTime}
          </div>
        </Table.Cell>
        <Table.Cell>
          <div class="font-medium">
            {session.topic}
          </div>
        </Table.Cell>
        <Table.Cell>
          <div class="font-medium">
            {session.form}
          </div>
          <div class="text-muted-foreground hidden text-sm md:inline">
            {session.location}
          </div>
        </Table.Cell>
        <Table.Cell>
          {session.note}
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>