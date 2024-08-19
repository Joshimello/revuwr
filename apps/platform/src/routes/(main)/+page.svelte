<script lang="ts">
	import { Button } from "$lib/components/ui/button";
  import { PUBLIC_ACME } from "$env/static/public"
  import { pb } from "$lib/pocketbase/client";
  import * as Card from "$lib/components/ui/card";
  import { user } from "$lib/stores";
  import * as Alert from "$lib/components/ui/alert";
	import { NotepadTextDashed, Settings, Eye, Pencil, Trash, RefreshCcw } from "lucide-svelte";
	import { Description } from "$lib/components/ui/alert-dialog";
  import { Progress } from "$lib/components/ui/progress";
  import { Badge } from "$lib/components/ui/badge";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import * as Tabs from "$lib/components/ui/tabs"
  import * as Table from "$lib/components/ui/table"
  import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import type { ApplicationsResponse, AnswersResponse, EventsResponse, NotificationsResponse } from "$lib/pocketbase/pocketbase-types";
  import { format } from "timeago.js"
	import { toast } from "svelte-sonner";
  import Status from "$lib/components/status.svelte";

  type ExpandedApplications = ApplicationsResponse<{ 
    response: AnswersResponse[],
    event: EventsResponse
  }>
  let applications: ExpandedApplications[] = []

  let lastLoad: Date | null = null;

  const getApplications = async () => {
    if (lastLoad && new Date().getTime() - lastLoad.getTime() < 30000) {
      toast.info(`Please wait ${30 - Math.floor((new Date().getTime() - lastLoad.getTime()) / 1000)} seconds.`)
      return
    }

    lastLoad = new Date()

    try {
      applications = await pb.collection("applications").getFullList<ExpandedApplications>({
        expand: "response,event"
      })
      toast.success("Applications loaded.")
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

  let notifications: NotificationsResponse[] = []
  const getNotifications = async () => {
    try {
      notifications = await pb.collection("notifications").getFullList<NotificationsResponse>({
        sort: "-created"
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
    getNotifications()
  })

  const editableStatus = ['draft', 'editsRequested']

  $: if ($user && $user.isValid && $user.model && $user.model.init == false) {
    goto("/onboard");
  }

</script>

{#if $user && $user.isValid && $user.model}

<div class="flex flex-row gap-2">
  <div class="flex flex-col flex-1 gap-6">

    {#if applications.filter(a => editableStatus.includes(a.status)).length == 0}
      <Alert.Root class="p-4 border-400 bg-orange-50 text-orange-800">
        <NotepadTextDashed size="18" class="!text-orange-800" />
        <Alert.Title class="text-lg leading-none">Welcome!</Alert.Title>
        <Alert.Description class="leading-none">
          You currently have no applications waiting for you to complete.
          Keep an eye out for new events to apply to! :)
        </Alert.Description>
      </Alert.Root>
    {:else}
      <Alert.Root class="p-4 border-400 bg-orange-50 text-orange-800">
        <NotepadTextDashed size="18" class="!text-orange-800" />
        <Alert.Title class="text-lg leading-none">Heads up!</Alert.Title>
        <Alert.Description class="leading-none">
          There are draft applications waiting for you to complete.
        </Alert.Description>
        <Alert.Description class="pt-4 flex flex-col w-max gap-2">
          {#each applications.filter(a => editableStatus.includes(a.status)) as application}
          <Button class="h-auto p-2" variant="outline" href={`/application/${application.id}`}>
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-1">
                <Badge variant="secondary" class="text-muted-foreground">
                  <span class="text-foreground">{application.expand?.response.filter(i=>i.valid).length}</span>/{application.response.length}
                  Completed
                </Badge>
                <Badge variant="outline">
                  {application.expand?.event.name}
                </Badge> 
              </div>
              <Progress value={(application.expand?.response.filter(i=>i.valid).length ?? 0)/application.response.length*100} />
            </div>
          </Button>
          {/each}
        </Alert.Description>
      </Alert.Root>
    {/if}
    
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
        
        <Card.Root>
          <Card.Header>
            <Card.Title>Active applications</Card.Title>
            <Card.Description>Applications you have submitted to active events.</Card.Description>
          </Card.Header>
          <Card.Content>
            
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Event</Table.Head>
                  <Table.Head>Serial</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Updated</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {#each applications as application}
                  <Table.Row>
                    <Table.Cell class="max-w-48">
                      <a href={`/application/${application.id}`} class="underline">
                        {application.expand?.event.name}
                      </a>
                    </Table.Cell>
                    <Table.Cell class="font-medium">
                      {#if application.serial}
                        {application.expand?.event.responsePrefix}{application.serial.toString().padStart(3, '0')}
                      {/if}
                    </Table.Cell>
                    <Table.Cell>
                      <Status type={application.status} />
                    </Table.Cell>
                    <Table.Cell>
                      {format(application.updated)}
                    </Table.Cell>
                  </Table.Row>
                {/each}
              </Table.Body>
            </Table.Root>

          </Card.Content>
        </Card.Root>

      </Tabs.Content>
      <Tabs.Content value="archived">

        <Card.Root>
          <Card.Header>
            <Card.Title>Archived applications</Card.Title>
            <Card.Description>Record of applications you have submitted to archived events.</Card.Description>
          </Card.Header>
          <Card.Content>
            <p>Todo</p>
          </Card.Content>
          <Card.Footer>
            <p></p>
          </Card.Footer>
        </Card.Root>

      </Tabs.Content>
    </Tabs.Root>    

  </div>
  <div class="flex flex-col w-72 gap-2">
    
    <Card.Root>
      <Card.Header class="pb-4">
        <Card.Title>{$user.model.username}</Card.Title>
        <Card.Description>{$user.model.email}</Card.Description>
      </Card.Header>
      <Card.Content>
        <Button class="w-full flex items-center gap-2 justify-start" href="/settings">
          <Settings size="16" />
          User Settings
        </Button>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-4">
        <Card.Title class="flex items-center justify-between">
          Notificaitons
          <Button variant="ghost" size="icon" class="w-7 h-4" href="/settings#notifications">
            <Settings size="16" />
          </Button>
        </Card.Title>
      </Card.Header>
      <ScrollArea class="h-96">
        {#each notifications as notification}
          <div class="border-t px-6 py-2 text-xs flex flex-col">
            <span>{notification.message}</span>
            <span class="text-muted-foreground">{format(notification.created)}</span>
            {#if notification.link}
              <Button size="sm" class="h-5 w-max mt-1" href={notification.link}>
                View
              </Button>
            {/if}
          </div>
        {/each}
      </ScrollArea>
    </Card.Root>

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
    <Button href="/auth">
      Login
    </Button>
  </div>
</div>

{/if}