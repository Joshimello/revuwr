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
  import * as m from '$lib/paraglide/messages.js'
	import { PUBLIC_BASE_PATH } from "$env/static/public";
  import { applications } from './stores'

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
      let recordRef = $applications.find(a => a.id === record.id)
      if (recordRef) {
        recordRef.status = status
        $applications = $applications
      }
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
      let recordRef = $applications.find(a => a.id === record.id)
      if (recordRef) {
        recordRef.adminNote = record.adminNote
        $applications = $applications
      }
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
  <Button variant="ghost" size="icon" href={`${PUBLIC_BASE_PATH}/response/${record.id}`}>
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
        <DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/response/${record.id}`}>
          {m.view_response()}
        </DropdownMenu.Item>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>
            {m.edit_status()}
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent class="w-max">
            {#each Object.entries(statuses) as [key, value]}
              <DropdownMenu.Item on:click={() => handleChangeStatus(key)}>
                <Status type={key} />
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Sub>
          <DropdownMenu.SubTrigger>
            {m.download()}
          </DropdownMenu.SubTrigger>
          <DropdownMenu.SubContent>
            <DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/export/pdf/${record.id}`} target="_blank">PDF</DropdownMenu.Item>
            <DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/export/csv?ids=${record.id}`} target="_blank">
              CSV
            </DropdownMenu.Item>
          </DropdownMenu.SubContent>
        </DropdownMenu.Sub>
        <DropdownMenu.Item href={`mailto:${record.expand?.responder.email}`} target="_blank">
          {m.mail_user()}
        </DropdownMenu.Item>
        <DropdownMenu.Item on:click={() => addNotesOpen = true}>
          {m.add_note()}
        </DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.Label class="text-xs font-normal font-mono text-muted-foreground p-0 px-2">
        {record.id}
      </DropdownMenu.Label>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<Dialog.Root bind:open={addNotesOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{m.note_for()} <span class="font-mono font-normal">{record.id}</span></Dialog.Title>
      <Textarea class="h-64" bind:value={record.adminNote} on:blur={handleSaveNotes} />
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>