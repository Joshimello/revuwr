<script>
	import { Input } from "$lib/components/ui/input";
  import * as Dialog from "$lib/components/ui/dialog"
	import { Label } from "$lib/components/ui/label";
	import { Button } from "$lib/components/ui/button";
	import { createUser, getAllUsers } from "./methods";
  import { users } from './stores'
 
  export let open = false

  let details = {
    userId: '',
    name: '',
    email: '',
    password: ''
  }

</script>

<Dialog.Root bind:open={open}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>
        Creating new user
      </Dialog.Title>
      <Dialog.Description>
        These details are mandatory, other details can be added by the user later, or edited by an admin.
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid grid-cols-2 gap-y-3 gap-x-2">
      <div class="flex flex-col gap-1">
        <Label>User ID</Label>
        <Input bind:value={details.userId} />
      </div>
      <div class="flex flex-col gap-1">
        <Label>Name</Label>
        <Input bind:value={details.name} />
      </div>
      <div class="flex flex-col gap-1">
        <Label>Email</Label>
        <Input bind:value={details.email} />
      </div>
      <div class="flex flex-col gap-1">
        <Label>Password</Label>
        <Input bind:value={details.password} />
      </div>
    </div>
    <Dialog.Footer>
      <Button class="w-full" on:click={() => {
        createUser(details, async () => {
          open = false
          $users = await getAllUsers() || []
        })
      }}>
        Create user
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>