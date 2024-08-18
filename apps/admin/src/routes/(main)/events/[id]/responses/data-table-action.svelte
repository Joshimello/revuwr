<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import type { AnswersResponse, ApplicationsResponse, UsersResponse } from "$lib/pocketbase/pocketbase-types";
  import { SquareArrowOutUpRight, SquareMenu } from "lucide-svelte";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { statuses, default as Status } from "$lib/components/status.svelte"
  import { pb } from "$lib/pocketbase/client";
  import * as Dialog from "$lib/components/ui/dialog";
	import { Textarea } from "$lib/components/ui/textarea";
	import { toast } from "svelte-sonner";

  type ExpandedApplication = ApplicationsResponse<{
    responder: UsersResponse,
    response: AnswersResponse[]
  }>

  export let record: ExpandedApplication
  let prevNote = record.adminNote
  let addNotesOpen = false

  const handleChangeStatus = async (status: string) => {
    try {
      record.status = status
      await pb.collection("applications").update(record.id, {
        status: status
      })
      toast.success("Status updated")
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
      }
    }
  }

  const handleSaveNotes = async () => {
    if (prevNote === record.adminNote) return
    try {
      await pb.collection("applications").update(record.id, {
        adminNote: record.adminNote
      })
      toast.success("Notes saved")
      prevNote = record.adminNote
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
      }
    }
  }
</script>

<div class="flex">
  <Button variant="ghost" size="icon" href={`/response/${record.id}`}>
    <SquareArrowOutUpRight size="20" class="text-muted-foreground" />
  </Button>
  <DropdownMenu.Root>
    <DropdownMenu.Trigger asChild let:builder>
      <Button variant="ghost" size="icon" builders={[builder]}>
        <SquareMenu size="20" class="text-muted-foreground" />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content>
      <DropdownMenu.Group>
        <DropdownMenu.Item href={`/response/${record.id}`}>View response</DropdownMenu.Item>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Edit status</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent class="w-max">
            {#each Object.entries(statuses) as [key, value]}
              <DropdownMenu.Item on:click={() => handleChangeStatus(key)}>
                <Status type={key} />
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>Download</DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item href={`/export/pdf/${record.id}`} target="_blank">PDF</DropdownMenu.Item>
            <DropdownMenu.Item disabled>CSV</DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Item href={`mailto:${record.expand?.responder.email}`} target="_blank">Mail user</DropdownMenu.Item>
        <DropdownMenu.Item on:click={() => addNotesOpen = true}>Add notes</DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.Label class="text-xs font-normal font-mono text-muted-foreground p-0 px-2">{record.id}</DropdownMenu.Label>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<Dialog.Root bind:open={addNotesOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Notes for <span class="font-mono font-normal">{record.id}</span></Dialog.Title>
      <Textarea class="h-64" bind:value={record.adminNote} on:blur={handleSaveNotes} />
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>