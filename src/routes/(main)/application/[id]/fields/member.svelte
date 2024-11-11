<script lang="ts">
	import { Input } from "$lib/components/ui/input";
  import { onMount } from "svelte";
  import * as Table from "$lib/components/ui/table"
	import { Button } from "$lib/components/ui/button";
	import { CirclePlus, Trash } from "lucide-svelte";
	import { Badge } from "$lib/components/ui/badge";
  import * as Dialog from "$lib/components/ui/dialog"
	import { Label } from "$lib/components/ui/label";
  import * as RadioGroup from "$lib/components/ui/radio-group"
  import { page } from "$app/stores"
	import type { QuestionsResponse } from "$lib/pocketbase/pocketbase-types";

  export let question: QuestionsResponse;
  const options = question.options as {
    isControlCount: boolean,
    minCount: number,
    maxCount: number,
  }

  export let disabled = false;
  export let value: {
    name: string,
    username: string,
    email: string,
    phone: string,
    department: string,
    year: string,
    status: string
  }[];

  export const checkValid = () => {
    if (value == null || disabled) {
      return [false, ""]
    }
    if (options.isControlCount && value && value.length < options.minCount) {
      return [false, `At least ${options.minCount} members required`];
    }
    if (options.isControlCount && value && value.length > options.maxCount) {
      return [false, `Maximum ${options.maxCount} members allowed`];
    }
    if (question.required && value.length == 0) {
      return [false, "Please fill in this field"];
    }
    return [true, ""];
  }

  const { user } = $page.data

  onMount(() => {
    if (!value) {
      value = [{
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        department: user.department,
        year: user.year,
        status: ""
      }];
    }
  });

  let newMember = {
    name: "",
    username: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    status: ""
  }

  let open = false;

  const handleAdd = () => {
    open = false;
    value = [...value, newMember];
    newMember = {
      name: "",
      username: "",
      email: "",
      phone: "",
      department: "",
      year: "",
      status: ""
    }
  }

</script>

{#if value}
  <div class="border rounded-md">
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.Head>Member</Table.Head>
          <Table.Head>Contact</Table.Head>
          <Table.Head>Dept/Grade</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head></Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#each value as member, index}
          <Table.Row>
            <Table.Cell>
              <div class="font-medium">{member.name}</div>
              <div class="text-muted-foreground hidden text-sm md:inline">
                {member.username}
              </div>
            </Table.Cell>
            <Table.Cell>
              <div class="font-medium">{member.email}</div>
              <div class="text-muted-foreground hidden text-sm md:inline">
                {member.phone}
              </div>
            </Table.Cell>
            <Table.Cell>
              <div class="font-medium">{member.department}</div>
              <div class="text-muted-foreground hidden text-sm md:inline">
                Year {member.year}
              </div>
            </Table.Cell>
            <Table.Cell>
              <Badge variant="secondary">{member.status}</Badge>
            </Table.Cell>
            <Table.Cell class="text-end">
              {#if index > 0}
              <Button {disabled} size="icon" variant="ghost" on:click={() => {
                value = value.filter((_, i) => i !== index);
              }}>
                <Trash size="16" />
              </Button>
              {/if}
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
            Add Member
          </Button>
        </Dialog.Trigger>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Adding a new member</Dialog.Title>
            <Dialog.Description>

            </Dialog.Description>
          </Dialog.Header>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div class="">
              <Label>Name</Label>
              <Input bind:value={newMember.name} />
            </div>
            <div class="">
              <Label>Student / Staff ID</Label>
              <Input bind:value={newMember.username} />
            </div>
            <div class="">
              <Label>Email</Label>
              <Input bind:value={newMember.email} />
            </div>
            <div class="">
              <Label>Phone number</Label>
              <Input bind:value={newMember.phone} />
            </div>
            <div class="">
              <Label>Department</Label>
              <Input bind:value={newMember.department} />
            </div>
            <div class="">
              <Label>Year</Label>
              <Input bind:value={newMember.year} />
            </div>
            <div class="">
              <Label>Nationality status</Label>
              <RadioGroup.Root class="mt-1" bind:value={newMember.status}>
                <div class="flex items-center space-x-2">
                  <RadioGroup.Item value="local" />
                  <Label>Local</Label>
                </div>
                <div class="flex items-center space-x-2">
                  <RadioGroup.Item value="foreigner" />
                  <Label>Foreigner</Label>
                </div>
              </RadioGroup.Root>
            </div>
            <Button class="md:col-span-2 mt-6" on:click={handleAdd}
              disabled={Object.values(newMember).some(i => i === "")}
            >
              Add member
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>

      
    </div>
  </div>

{/if}