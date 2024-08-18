<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Select from "$lib/components/ui/select"
  import DateRangePicker from "$lib/components/date-range-picker.svelte"
  import { Button } from "$lib/components/ui/button"
  import { pb } from "$lib/pocketbase/client"
  import { toast } from "svelte-sonner"
	import { goto } from "$app/navigation";

  let settings = {
    status: "active",
    name: "",
    description: "",
    targetAudience: "all",
    startDate: new Date(),
    endDate: new Date(),
    beforeStartDate: "disallow",
    afterStartDate: "disallow",
    responseLimit: 1,
    responsePrefix: ""
  }

  const handleNumberInput = (event: InputEvent) => {
    const target = event.target as HTMLInputElement
    const value = Number(target.value)
    settings.responseLimit = value
  }

  const handleCreateEvent = async () => {
    try {
      const response = await pb.collection('events').create(settings)
      toast.success("Event created")
      goto(`/events/${response.id}`)
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
        console.error(err)
      }
    }
  }

</script>

<div class="flex items-center">
  <h1 class="text-lg font-semibold md:text-2xl">Create a new event</h1>
</div>

<Card.Root class="max-w-3xl">
  <Card.Header>
    <Card.Title>Event details</Card.Title>
    <Card.Description>
      You may change these details later in the event settings.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="grid gap-6">
      <div class="grid gap-3">
        <Label for="name">Name</Label>
        <Input
          id="name"
          type="text"
          class="w-full"
          bind:value={settings.name}
        />
      </div>
      <div class="grid gap-3">
        <Label for="description">Description</Label>
        <Textarea
          id="description"
          class="min-h-16"
          bind:value={settings.description}
        />
      </div>
      <div class="grid gap-3">
        <Label for="description">Target audience</Label>
        <Select.Root 
          selected={{ label: 'All', value: 'all' }} 
          onSelectedChange={v => settings.targetAudience = v?.value || 'all'}
        >
          <Select.Trigger class="w-72">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="all">All</Select.Item>
            <Select.Item value="students">Students</Select.Item>
            <Select.Item value="teachers">Teachers</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  </Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
  <Card.Header>
    <Card.Title>Event visibility</Card.Title>
    <Card.Description>
      You may change these details later in the event settings.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="grid gap-6">
      <div class="grid gap-3">
        <Label for="name">Start and end date</Label>
        <DateRangePicker
          bind:sValue={settings.startDate}
          bind:eValue={settings.endDate}
        />
      </div>
      <div class="grid gap-3">
        <Label for="description">Before start date...</Label>
        <Select.Root 
          selected={{ label: 'Disallow new responses', value: 'disallow' }}
          onSelectedChange={v => settings.beforeStartDate = v?.value || 'disallow'}
        >
          <Select.Trigger class="w-72">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="disallow">Disallow new responses</Select.Item>
            <Select.Item value="allow">Allow new responses</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div class="grid gap-3">
        <Label for="description">After start date...</Label>
        <Select.Root 
          selected={{ label: 'Disallow new responses', value: 'disallow' }}
          onSelectedChange={v => settings.afterStartDate = v?.value || 'disallow'}  
        >
          <Select.Trigger class="w-72">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="disallow">Disallow new responses</Select.Item>
            <Select.Item value="allow">Allow new responses</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
    </div>
  </Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
  <Card.Header>
    <Card.Title>Event responses</Card.Title>
    <Card.Description>
      You may change these details later in the event settings.
    </Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="grid gap-6">
      <div class="grid gap-3">
        <Label for="name">Response limit per user</Label>
        <Input
          id="name"
          type="number"
          class="w-72"
          min="1"
          on:input={handleNumberInput}
        />
      </div>
      <div class="grid gap-3">
        <Label for="name">Response serial ID prefix</Label>
        <Input
          id="name"
          type="text"
          class="w-72"
          bind:value={settings.responsePrefix}
        />
      </div>
    </div>
  </Card.Content>
</Card.Root>

<span>You will be able to customize the event more after this creation.</span>

<Button class="max-w-3xl py-8" on:click={handleCreateEvent}>Create event</Button>