<script lang="ts">
	import { Button } from "$lib/components/ui/button";
  import { PUBLIC_ACME } from "$env/static/public"
  import { pb } from "$lib/pocketbase/client";
  import * as Card from "$lib/components/ui/card";
	import { RefreshCcw, ArrowUpRight } from "lucide-svelte";
  import { Progress } from "$lib/components/ui/progress";
  import { Badge } from "$lib/components/ui/badge";
  import * as Tabs from "$lib/components/ui/tabs"
	import { onMount } from "svelte";
	import type { ApplicationsResponse, AnswersResponse, EventsResponse } from "$lib/pocketbase/pocketbase-types";
  import { format } from "timeago.js"
	import { toast } from "svelte-sonner";
  import Status from "$lib/components/status.svelte";
  
  type ExpandedApplications = ApplicationsResponse<{ 
    response: AnswersResponse[],
    event: EventsResponse
  }>

  let applications: ExpandedApplications[] = []
  const getApplications = async () => {
    pb.authStore.loadFromCookie(document.cookie)
    try {
      applications = await pb.collection("applications").getFullList<ExpandedApplications>({
        expand: "response,event"
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred.")
      }
    }
  }

  onMount(async () => {
    getApplications()
  })

  $: editableApplications = applications.filter(a => editableStatus.includes(a.status))
  $: otherApplications = applications.filter(a => !editableStatus.includes(a.status))
  const editableStatus = ['draft', 'editsRequested']

  export let data
  $: ({ user } = data)
</script>

{#if user}

<div class="flex md:flex-row flex-col-reverse gap-2">
  <div class="flex flex-col flex-1 gap-6">

    <Tabs.Root value="active">
      <div class="flex justify-between items-center">
        <Tabs.List>
          <Tabs.Trigger value="active">Active</Tabs.Trigger>
          <Tabs.Trigger value="archived">Archived</Tabs.Trigger>
        </Tabs.List>
        <div>
          <Button variant="outline" size="sm" class="h-7 flex items-center gap-2" on:click={getApplications}>
            <RefreshCcw size="14" />
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs.Content value="active">

        {#if editableApplications.length > 0}
        <div class="flex flex-col pb-6">
          <div class="mt-2 mx-2 flex flex-col mb-4">
            <span class="text-2xl">
              Applications in progress
            </span>
            <span class="text-muted-foreground text-sm">
              There are {editableApplications.length} application(s) in progress waiting for you to complete.
            </span>
          </div>
          <div class="grid md:grid-cols-2 grid-cols-1 gap-2">
            {#each editableApplications as application}
              <Card.Root>
                <Card.Header>
                  {#if application.serial}
                    <span class="text-lg font-bold leading-3">
                      {application.expand?.event.responsePrefix}{application.serial.toString().padStart(3, '0')}
                    </span>
                  {/if}                    
                  <span class="text-xl leading-4">
                    {application.expand?.event.name}
                  </span>
                  <div>
                    <Status type={application.status} />
                    <Badge variant="outline">Updated {format(application.updated)}</Badge>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div class="flex gap-2 items-end">
                    <div class="flex flex-col w-full gap-1">
                      <div class="flex items-center gap-1">
                        <Badge variant="secondary" class="text-muted-foreground">
                          <span class="text-foreground">{application.expand?.response.filter(i=>i.valid).length}</span>/{application.response.length}
                          Completed
                        </Badge>
                      </div>
                      <Progress value={(application.expand?.response.filter(i=>i.valid).length ?? 0)/application.response.length*100} />
                    </div>
                    <!-- <Button size="icon" variant="outline" class="shrink-0">
                      <Ellipsis size="16" />
                    </Button> -->
                    <Button size="icon" variant="default" class="shrink-0" href={`/application/${application.id}`}>
                      <ArrowUpRight size="16" />
                    </Button>
                  </div>
                </Card.Content>
              </Card.Root>
            {/each}
          </div>
        </div>
        {/if}
        
        {#if otherApplications.length > 0}
        <div class="flex flex-col pb-12">
          <div class="mt-2 mx-2 flex flex-col mb-4">
            <span class="text-2xl">
              Other active applications
            </span>
            <span class="text-muted-foreground text-sm">
              All other applications that are going on but no action is required from you.
            </span>
          </div>
          <div class="grid md:grid-cols-2 grid-cols-1 gap-2">
            {#each otherApplications as application}
              <Card.Root>
                <Card.Header>
                  {#if application.serial}
                    <span class="text-lg font-bold leading-3">
                      {application.expand?.event.responsePrefix}{application.serial.toString().padStart(3, '0')}
                    </span>
                  {/if}                    
                  <span class="text-xl leading-4">
                    {application.expand?.event.name}
                  </span>
                  <div>
                    <Status type={application.status} />
                    <Badge variant="outline">Updated {format(application.updated)}</Badge>
                  </div>
                </Card.Header>
                <Card.Content>
                  <div class="flex gap-2 items-end justify-end">
                    <!-- <Button size="icon" variant="outline" class="shrink-0">
                      <Ellipsis size="16" />
                    </Button> -->
                    <Button size="icon" variant="default" class="shrink-0" href={`/application/${application.id}`}>
                      <ArrowUpRight size="16" />
                    </Button>
                  </div>
                </Card.Content>
              </Card.Root>
            {/each}
          </div>
        </div>
        {/if}

        {#if applications.length == 0}
        <div class="flex flex-col items-center gap-1">
          <h3 class="text-2xl font-bold tracking-tight">
            No applications found
          </h3>
          <p class="text-muted-foreground text-sm">
            You have not submitted any applications yet.
          </p>
        </div>
        {/if}

      </Tabs.Content>
      <Tabs.Content value="archived">

        <div class="flex flex-col items-center gap-1">
          <h3 class="text-2xl font-bold tracking-tight">
            No archived applications found
          </h3>
          <p class="text-muted-foreground text-sm">
            TODO
          </p>
        </div>

      </Tabs.Content>
    </Tabs.Root>    

  </div>
</div>

{:else}

<div class="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-16 h-full">
  <div class="flex flex-col items-center gap-1 text-center">
    <h3 class="text-2xl font-bold tracking-tight">
      Welcome to {PUBLIC_ACME}'s application platform
    </h3>
    <p class="text-muted-foreground text-sm mb-4">
      Start by logging in to your account.
    </p>
    <Button href="/api/auth/signin">
      Login
    </Button>
  </div>
</div>

{/if}