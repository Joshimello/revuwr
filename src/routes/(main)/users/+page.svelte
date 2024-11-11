<script lang="ts">
	import { onMount } from "svelte";
  import * as m from '$lib/paraglide/messages.js'
  import DataTable from './data-table.svelte'
  import { users } from './stores'
	import { Button } from "$lib/components/ui/button";
  import { getAllUsers } from "./methods";
  import NewUser from './new-user.svelte'

  onMount(async () => {
    $users = await getAllUsers() || []
  })

  let createUserOpen = false

</script>

<div class="flex items-center">
  <h1 class="text-lg font-semibold md:text-2xl">
    {m.users()}
  </h1>
</div>

<div class="flex gap-2">
  <Button variant="outline" on:click={async () => {
    $users = await getAllUsers() || []
  }}>
    Refresh list
  </Button>
  <Button variant="outline" on:click={() => {
    createUserOpen = true
  }}>
    Create new user
  </Button>
</div>

<DataTable />

<NewUser bind:open={createUserOpen} />