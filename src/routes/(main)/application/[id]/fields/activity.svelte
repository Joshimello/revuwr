<script lang="ts">
	import { Input } from "$lib/components/ui/input";
  import { onMount } from "svelte";
  import * as Table from "$lib/components/ui/table"
	import { Button } from "$lib/components/ui/button";
	import { CirclePlus, Trash } from "lucide-svelte";
  import * as Dialog from "$lib/components/ui/dialog"
	import { Label } from "$lib/components/ui/label";
  import DatePicker from "$lib/components/date-picker.svelte"
  import * as RadioGroup from "$lib/components/ui/radio-group"
	import type { QuestionsResponse } from "$lib/pocketbase/pocketbase-types";
  
  export let question: QuestionsResponse;
  const options = question.options as {
    isControlCount: boolean,
    minCount: number,
    maxCount: number,
  }

  export let disabled = false;
  export let value: {
    date: string,
    startTime: string,
    endTime: string,
    topic: string,
    form: string,
    location: string,
    note: string
  }[];

  export const checkValid = () => {
    if (value == null || disabled) {
      return [false, ""]
    }
    if (options.isControlCount && (value.length < options.minCount || value.length > options.maxCount)) {
      return [false, `Please add ${options.minCount}-${options.maxCount} sessions`];
    }
    if (question.required && value.length == 0) {
      return [false, "Please fill in this field"];
    }
    return [true, ""];
  }

  onMount(() => {
    if (!value) {
      value = [];
    }
  });

  let newActivity = {
    date: "",
    startTime: "",
    endTime: "",
    topic: "",
    form: "",
    location: "",
    note: ""
  }

  let open = false;

  const handleAdd = () => {
    open = false;
    value = [...value, newActivity];
    newActivity = {
      date: "",
      startTime: "",
      endTime: "",
      topic: "",
      form: "",
      location: "",
      note: ""
    }
  }

</script>

{#if value}

  <div class="border rounded-md">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>When</Table.Head>
          <Table.Head>Topic</Table.Head>
          <Table.Head>Venue</Table.Head>
          <Table.Head>Note</Table.Head>
          <Table.Head></Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each value as session, index}
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
            <Table.Cell class="text-end">
              <Button {disabled} size="icon" variant="ghost" on:click={() => {
                value = value.filter((_, i) => i !== index);
              }}>
                <Trash size="16" />
              </Button>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
    <div class="border-t p-1 flex justify-center">
      

      <Dialog.Root bind:open={open}>
        <Dialog.Trigger asChild let:builder>
          <Button {disabled} variant="ghost" class="w-full" builders={[builder]}>
            <CirclePlus size="16" />
            Add an activity session
          </Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Adding an activity session</Dialog.Title>
            <Dialog.Description>

            </Dialog.Description>
          </Dialog.Header>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div class="">
              <Label for="topic">Learning topic</Label>
              <Input bind:value={newActivity.topic} id="topic" />
            </div>
            <div class="">
              <Label for="date">Date</Label>
              <DatePicker onValueChange={v => {
                newActivity.date = v?.toString() ?? "";
              }} />
            </div>
            <div class="">
              <Label for="time">Starting time</Label>
              <Input bind:value={newActivity.startTime} id="time" type="time" />
            </div>
            <div class="">
              <Label for="time">Ending time</Label>
              <Input bind:value={newActivity.endTime} id="time" type="time" />
            </div>
            <div class="mt-2.5">
              <RadioGroup.Root bind:value={newActivity.form}>
                <div class="flex items-center space-x-2">
                  <RadioGroup.Item value="physical" />
                  <Label>Physical session</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroup.Item value="online" />
                  <Label>Online session</Label>
                </div>
              </RadioGroup.Root>
            </div>
            <div class="">
              <Label for="location">Location</Label>
              <Input bind:value={newActivity.location} id="location" />
            </div>
            <div class="md:col-span-2">
              <Label for="note">Extra info</Label>
              <Input bind:value={newActivity.note} id="note" />
            </div>
            <Button class="md:col-span-2 mt-6" on:click={handleAdd}
              disabled={Object.values(newActivity).filter((_,i) => i != 6).some(i => i === "")}
            >
              Add session
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>


    </div>
  </div>
{/if}