<script lang="ts">
  import * as Table from "$lib/components/ui/table"
	import { pb } from "$lib/pocketbase/client";
	import type { UsersResponse } from "$lib/pocketbase/pocketbase-types";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
  import * as Card from "$lib/components/ui/card"
  
  
  let users: UsersResponse[] = []

  onMount(async () => {
    try {
      users = await pb.collection('users').getFullList()
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

</script>

<div class="flex items-center">
  <h1 class="text-lg font-semibold md:text-2xl">Users</h1>
</div>

<Card.Root>
  <Card.Content class="pt-6">
    
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Internal ID</Table.Head>
          <Table.Head>Name</Table.Head>
          <Table.Head>ID</Table.Head>
          <Table.Head>Email</Table.Head>
          <Table.Head>Phone</Table.Head>
          <Table.Head>Occupation</Table.Head>
          <Table.Head>Department</Table.Head>
          <Table.Head>Year</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each users as user}
          <Table.Row>
            <Table.Cell>{user.id}</Table.Cell>
            <Table.Cell>{user.email}</Table.Cell>
            <Table.Cell>{user.username}</Table.Cell>
            <Table.Cell>{user.email}</Table.Cell>
            <Table.Cell>{user.phone}</Table.Cell>
            <Table.Cell>{user.occupation}</Table.Cell>
            <Table.Cell>{user.department}</Table.Cell>
            <Table.Cell>{user.year}</Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>

  </Card.Content>
</Card.Root>