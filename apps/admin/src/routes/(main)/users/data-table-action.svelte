<script lang="ts">
	import { PUBLIC_BASE_PATH } from "$env/static/public";
  import { Button } from "$lib/components/ui/button"
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
	import { SquareArrowOutUpRight, SquareMenu } from "lucide-svelte";
  import * as m from '$lib/paraglide/messages.js' 
	import type { ExpandedUsersResponse } from "./types";
  import * as Dialog from "$lib/components/ui/dialog"
	import { Separator } from "$lib/components/ui/separator";
	import { Label } from "$lib/components/ui/label";
  import { deleteUserAccount, deleteUserAssociated, deleteUserExsistance, getAllUsers } from "./methods";
	import { users } from "./stores";
  
  export let record: ExpandedUsersResponse;

  let deleteUserOpen = false;

</script>

<div class="flex">
  <Button variant="ghost" size="icon" href={`${PUBLIC_BASE_PATH}/users/${record.id}`}>
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
        <DropdownMenu.Item href={`${PUBLIC_BASE_PATH}/users/${record.id}`}>
          User details
        </DropdownMenu.Item>
        <DropdownMenu.Item href={`mailto:${record.email}`} target="_blank">
          {m.mail_user()}
        </DropdownMenu.Item>
        <DropdownMenu.Separator/>
        <DropdownMenu.Item on:click={() => deleteUserOpen = true}>
          Delete data
        </DropdownMenu.Item>
      </DropdownMenu.Group>
      <DropdownMenu.Separator />
      <DropdownMenu.Label class="text-xs font-normal font-mono text-muted-foreground p-0 px-2">
        {record.id}
      </DropdownMenu.Label>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

<Dialog.Root bind:open={deleteUserOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        Deleting data of {record.name} ({record.username})
      </Dialog.Title>
      <Dialog.Description>
        Be careful, these actions are destructive and difficult to reverse.
      </Dialog.Description>
    </Dialog.Header>
    <Separator />
    <div class="flex flex-col gap-2">
      <Button variant="destructive" on:click={() => {
        deleteUserAssociated(record.id, async () => {
          deleteUserOpen = false
          $users = await getAllUsers() || []
        })
      }}>
        Delete just data
      </Button>
      <Label class="text-muted-foreground ">
        This will delete all applications submitted by this user. The user account will be kept.
      </Label>
    </div>
    <Separator />
    <div class="flex flex-col gap-2">
      <Button variant="destructive" on:click={() => {
        deleteUserAccount(record.id, async () => {
          deleteUserOpen = false
          $users = await getAllUsers() || []
        })
      }}>
        Delete just account
      </Button>
      <Label class="text-muted-foreground ">
        This will delete the user account keeping the applications. The applications will be anonymized.
      </Label>
    </div>
    <Separator />
    <div class="flex flex-col gap-2">
      <Button variant="destructive" on:click={() => {
        deleteUserExsistance(record.id, async () => {
          deleteUserOpen = false
          $users = await getAllUsers() || []
        })
      }}>
        DELETE ALL
      </Button>
      <Label class="text-muted-foreground ">
        This will leave no trace of the user in the system.
      </Label>
    </div>
  </Dialog.Content>
</Dialog.Root>