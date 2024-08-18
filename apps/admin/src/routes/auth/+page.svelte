<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { pb } from "$lib/pocketbase/client";
  import { toast } from "svelte-sonner";
  import { goto } from "$app/navigation";

  async function login() {
    const email = (document.getElementById("email") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    try {
      await pb.admins.authWithPassword(email, password);
      document.cookie = pb.authStore.exportToCookie({ httpOnly: false, secure: false });
      goto("/", { invalidateAll: true });
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
      else {
        toast.error("An error occurred");
        console.error(err);
      }
    } 
  }
</script>

<div class="h-screen w-screen flex items-center justify-center">
  <Card.Root class="w-full max-w-sm">
    <Card.Header>
      <Card.Title class="text-2xl">Admin Login</Card.Title>
    </Card.Header>
    <Card.Content class="grid gap-4">
      <div class="grid gap-2">
        <Label for="email">Email</Label>
        <Input id="email" type="email" placeholder="admin@example.com" required />
      </div>
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <Input id="password" type="password" required />
      </div>
    </Card.Content>
    <Card.Footer>
      <Button class="w-full" on:click={login}>Sign in</Button>
    </Card.Footer>
  </Card.Root>
</div>