<script lang="ts">
	import { CalendarFold, CalendarArrowDown, Users, FileText } from "lucide-svelte";
  import * as Card from "$lib/components/ui/card"
  import { pb } from "$lib/pocketbase/client"
  import { onMount } from "svelte"
	import { toast } from "svelte-sonner";
	import type { ApplicationsResponse, EventsResponse, UsersResponse } from "$lib/pocketbase/pocketbase-types";
	import { PUBLIC_BASE_PATH } from "$env/static/public";
  import * as m from '$lib/paraglide/messages.js'

  let events: EventsResponse[] = []
  let users: UsersResponse[] = []
  let applications: ApplicationsResponse[] = []

  onMount(async () => {
    try {
      events = await pb.collection('events').getFullList()
      users = await pb.collection('users').getFullList()
      applications = await pb.collection('applications').getFullList()
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
  <h1 class="text-lg font-semibold md:text-2xl">
    {m.overview()}
  </h1>
</div>

<div class="grid grid-cols-2 gap-4">

  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
      <Card.Title class="text-sm font-medium">
        {m.events()}
      </Card.Title>
      <CalendarFold class="text-muted-foreground h-4 w-4" />
    </Card.Header>
    <Card.Content class="pt-6">
      <div class="text-2xl font-bold">
        {events.filter(i => i.status == 'active').length} {m.active()}
      </div>
      <a class="text-blue-500 text-xs" href={`${PUBLIC_BASE_PATH}/events`}>
        {m.view_all()}
      </a>
    </Card.Content>
  </Card.Root>
  
  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
      <Card.Title class="text-sm font-medium">
        {m.events()}
      </Card.Title>
      <CalendarArrowDown class="text-muted-foreground h-4 w-4" />
    </Card.Header>
    <Card.Content class="pt-6">
      <div class="text-2xl font-bold">
        {events.filter(i => i.status == 'archived').length} {m.archived()}
      </div>
      <a class="text-blue-500 text-xs" href={`${PUBLIC_BASE_PATH}/events`}>
        {m.view_all()}
      </a>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
      <Card.Title class="text-sm font-medium">
        {m.users()}
      </Card.Title>
      <Users class="text-muted-foreground h-4 w-4" />
    </Card.Header>
    <Card.Content class="pt-6">
      <div class="text-2xl font-bold">
        {users.length} {m.total()}
      </div>
      <a class="text-blue-500 text-xs" href={`${PUBLIC_BASE_PATH}/users`}>
        {m.view_all()}
      </a>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
      <Card.Title class="text-sm font-medium">
        {m.applications()}
      </Card.Title>
      <FileText class="text-muted-foreground h-4 w-4" />
    </Card.Header>
    <Card.Content class="pt-6">
      <div class="text-2xl font-bold">
        {applications.length} {m.total()}
      </div>
      <a class="text-blue-500 text-xs" href={`${PUBLIC_BASE_PATH}/applications`}>
        {m.view_in_events()}
      </a>
    </Card.Content>
  </Card.Root>

</div>