<script lang="ts">
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { Textarea } from "$lib/components/ui/textarea";
  import * as Select from "$lib/components/ui/select"
  import { Button } from "$lib/components/ui/button"
  import { pb, pbImage } from "$lib/pocketbase/client"
  import { toast } from "svelte-sonner"
	import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import * as Dialog from "$lib/components/ui/dialog";
  import { parseDate } from '@internationalized/date';
	import { ChevronLeft } from "lucide-svelte";
  import DatePicker from "$lib/components/date-picker.svelte";
  import { fromDate } from "@internationalized/date"

  let collectionId = ""

  let settings: {
    status: string,
    name: string,
    description: string,
    image: string,
    moreInfo: string,
    targetAudience: string,
    startDate: Date | null,
    endDate: Date | null,
    beforeStartDate: string,
    afterStartDate: string,
    responseLimit: number,
    responsePrefix: string
  } = {
    status: "active",
    name: "",
    description: "",
    image: "",
    moreInfo: "",
    targetAudience: "all",
    startDate: null,
    endDate: null,
    beforeStartDate: "disallow",
    afterStartDate: "disallow",
    responseLimit: 1,
    responsePrefix: ""
  }

  let prevSettings = JSON.stringify(settings)

  const handleNumberInput = (event: InputEvent) => {
    const target = event.target as HTMLInputElement
    const value = Number(target.value)
    settings.responseLimit = value
  }

  const handleFileInput = async (event: InputEvent) => {
    const target = event.target as HTMLInputElement
    if (!target.files || target.files.length <= 0) return
    const file = target.files[0]
    try {
      const event = await pb.collection('events').update($page.params.id, { image: file })
      toast.success("Image uploaded successfully")
      settings.image = event.image
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

  const handleImageRemove = async () => {
    settings.image = "",
    handleChange()
  }

  const handleDeleteEvent = async () => {
    try {
      await pb.collection('events').delete($page.params.id)
      toast.success("Event deleted successfully")
      goto('/events')
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

  const handleChange = () => {
    if (prevSettings == JSON.stringify(settings)) {
      return
    }
    toast.promise(
      pb.collection('events').update($page.params.id, settings), 
      {
        loading: "Saving changes...",
        success: (data) => {
          prevSettings = JSON.stringify(settings)
          return "Saved successfully"
        },
        error: (err) => {
          if (err instanceof Error) {
            return err.message
          }
          else {
            console.error(err)
            return "An error occurred"
          }
        }
      }
    )
  }
  
  onMount(async () => {
    try {
      const event = await pb.collection('events').getOne($page.params.id)
      collectionId = event.collectionId
      settings = {
        status: event.status,
        name: event.name,
        description: event.description,
        image: event.image,
        moreInfo: event.moreInfo,
        targetAudience: event.targetAudience,
        startDate: event.startDate ? new Date(event.startDate) : null,
        endDate: event.endDate ? new Date(event.endDate) : null,
        beforeStartDate: event.beforeStartDate,
        afterStartDate: event.afterStartDate,
        responseLimit: event.responseLimit,
        responsePrefix: event.responsePrefix,
      }
      prevSettings = JSON.stringify(settings)
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
  })

</script> 

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href="/events/{$page.params.id}">
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Back</span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    Editing event settings
  </h1>
</div>

<span class="text-sm text-gray-400">Changes will be auto-saved.</span>

<Card.Root class="max-w-3xl">
  <Card.Header>
    <Card.Title>Event details</Card.Title>
    <Card.Description>

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
          on:blur={handleChange}
        />
      </div>
      <div class="grid gap-3">
        <Label for="description">Description</Label>
        <Textarea
          id="description"
          class="min-h-16"
          bind:value={settings.description}
          on:blur={handleChange}
        />
      </div>
      <div class="grid gap-3">
        <Label for="targetAudience">Target audience</Label>
        <Select.Root 
          selected={
            [
              { label: 'All', value: 'all' },
              { label: 'Students', value: 'students' },
              { label: 'Teachers', value: 'teachers' }
            ].find(v => v.value === settings.targetAudience) || { label: 'All', value: 'all' }
          }
          onSelectedChange={v => {
            settings.targetAudience = v?.value || 'all'
            handleChange()
          }}
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
      <div class="grid gap-3">
        <Label for="posterImage">Poster image</Label>
        <div class="flex gap-4">
          {#if settings.image && collectionId}
            <img 
              src={pbImage(collectionId, $page.params.id, settings.image)} 
              class="h-32 w-32 md:h-72 md:w-72 rounded-md border-1 border object-cover" 
              alt="" 
            />
          {:else}
            <div class="bg-gray-100 h-32 w-32 md:h-72 md:w-72 rounded-md"></div>
          {/if}
          <div class="flex flex-col max-w-72 gap-2">
            <Input type="file" on:input={handleFileInput} />
            <Button variant="outline" on:click={handleImageRemove}>Remove Image</Button>
          </div>
        </div>
      </div>
      <div class="grid gap-3">
        <Label for="moreInfoUrl">More info URL</Label>
        <Input
          id="moreInfoUrl"
          type="url"
          bind:value={settings.moreInfo}
          on:blur={handleChange}
        />
      </div>
    </div>
  </Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
  <Card.Header>
    <Card.Title>Event visibility</Card.Title>
    <Card.Description>

    </Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="grid gap-6">
      <div class="grid gap-3">
        <Label for="name">Start date</Label>
        <DatePicker value={settings.startDate ? fromDate(settings.startDate, "Asia/Singapore") : undefined} onValueChange={v => {
          settings.startDate = v?.toDate("Asia/Singapore") || null
          handleChange()
        }} />
      </div>
      <div class="grid gap-3">
        <Label for="name">End date</Label>
        <DatePicker value={settings.endDate ? fromDate(settings.endDate, "Asia/Singapore") : undefined} onValueChange={v => {
          settings.endDate = v?.toDate("Asia/Singapore") || null
          handleChange()
        }} />
      </div>
      <div class="grid gap-3">
        <Label for="description">Before start date...</Label>
        <Select.Root 
          selected={
            [
              { label: 'Disallow new responses', value: 'disallow' },
              { label: 'Allow new responses', value: 'allow' }
            ].find(v => v.value === settings.beforeStartDate) || { label: 'Disallow new responses', value: 'disallow' }
          }
          onSelectedChange={v => {
            settings.beforeStartDate = v?.value || 'disallow'
            handleChange()
          }}
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
          selected={
            [
              { label: 'Disallow new responses', value: 'disallow' },
              { label: 'Allow new responses', value: 'allow' }
            ].find(v => v.value === settings.afterStartDate) || { label: 'Disallow new responses', value: 'disallow' }
          }
          onSelectedChange={v => {
            settings.afterStartDate = v?.value || 'disallow'
            handleChange()
          }}
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
          value={settings.responseLimit}
          on:blur={handleChange}
        />
      </div>
      <div class="grid gap-3">
        <Label for="name">Response serial ID prefix</Label>
        <Input
          id="name"
          type="text"
          class="w-72"
          bind:value={settings.responsePrefix}
          on:blur={handleChange}
        />
      </div>
    </div>
  </Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl border-destructive" >
  <Card.Header>
    <Card.Title>Danger zone</Card.Title>
    <Card.Description>

    </Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="grid gap-6">
      <div class="grid gap-3">
        <Label for="name">Change event status (active / archived)</Label>
        <Select.Root 
          selected={
            [
              { label: 'Active', value: 'active' },
              { label: 'Archived', value: 'archived' }
            ].find(v => v.value === settings.status) || { label: 'Active', value: 'active' }
          }
          onSelectedChange={v => {
            settings.status = v?.value || 'active'
            handleChange()
          }}
        >
          <Select.Trigger class="w-72">
            <Select.Value />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="active">Active</Select.Item>
            <Select.Item value="archived">Archived</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div class="grid gap-3">
        <Label for="name">Delete this event forever</Label>

        <Dialog.Root>
          <Dialog.Trigger asChild let:builder>
            <Button
              builders={[builder]}
              class="w-72"
              variant="destructive"
            >
              Delete event
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Are you sure absolutely sure?</Dialog.Title>
              <Dialog.Description>
                This action cannot be undone. This will permanently delete the event and all associated data.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Button on:click={handleDeleteEvent} variant="destructive">
                Delete event
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Root>

      </div>
    </div>
  </Card.Content>
</Card.Root>