<script lang="ts">
  import * as Table from "$lib/components/ui/table"

  export let headers: string[]
  export let rows: Record<string, string>[]
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      {#each headers as header}
        <Table.Head>{header}</Table.Head>
      {/each}
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each rows as row}
      <Table.Row>
        {#each Object.values(row) as cell}
          <Table.Cell>{cell}</Table.Cell>
        {/each}
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>