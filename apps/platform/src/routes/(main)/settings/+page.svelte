<script lang="ts">
  import { ChevronLeft } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card"
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
  import { pb } from "$lib/pocketbase/client";
	import type { UsersLanguageOptions, UsersOccupationOptions, UsersResponse } from "$lib/pocketbase/pocketbase-types";
	import { toast } from "svelte-sonner";
	import { onMount } from "svelte";
  import * as RadioGroup from "$lib/components/ui/radio-group"
  import { Switch } from "$lib/components/ui/switch"
  

  let account: UsersResponse | null = null;
  let stringAccount: string | null = null;

  const getAccount = async () => {
    if (!pb.authStore.model) {
      toast.error("You are not logged in.")
      return
    }

    try {
      account = await pb.collection("users").getOne<UsersResponse>(pb.authStore.model.id)
      toast.success("Account loaded.")
      stringAccount = JSON.stringify(account)
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

  const saveAccount = async () => {
    if (!account) return
    if (JSON.stringify(account) === stringAccount) return

    try {
      account = await pb.collection("users").update(account.id, {
        name: account.name,
        username: account.username,
        email: account.email,
        phone: account.phone,
        occupation: account.occupation,
        department: account.department,
        year: account.year,
        language: account.language,
        disableNotify: account.disableNotify
      })
      toast.success("Account saved.")
      stringAccount = JSON.stringify(account)
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

  const handleOccupationChange = (value: string) => {
    if (!account) return
    account.occupation = value as UsersOccupationOptions
    saveAccount()
  }

  const handleLanguageChange = (value: string) => {
    if (!account) return
    account.language = value as UsersLanguageOptions
    saveAccount()
  }

  const handleNotifChange = (value: boolean) => {
    if (!account) return
    account.disableNotify = value
    saveAccount()
  }

  onMount(async () => {
    getAccount()
  })

</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href="/">
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Back</span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    Settings
  </h1>
</div>

{#if account}
  <div class="flex mt-6">
    <div class="sticky h-max top-20 hidden md:flex flex-col w-64 text-muted-foreground gap-4 text-sm flex-shrink-0">
      <a href="#account">Account</a>
      <a href="#preferences">Preferences</a>
      <a href="#notifications">Notifications</a>
    </div>
    <div class="flex flex-col gap-2 w-full">
      
      <span class="text-muted-foreground text-xs">* All changes are saved automatically.</span>

      <Card.Root id="account">
        <Card.Header>
          <Card.Title>Basic details</Card.Title>
        </Card.Header>
        <Card.Content class="grid grid-cols-2 gap-2">
          <div>
            <Label>Name</Label>
            <Input class="w-full" bind:value={account.name} on:blur={saveAccount} />
          </div>
          <div>
            <Label>Student / Staff ID</Label>
            <Input class="w-full" bind:value={account.username} on:blur={saveAccount} />
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Contact details</Card.Title>
        </Card.Header>
        <Card.Content class="grid grid-cols-2 gap-2">
          <div>
            <Label>Email</Label>
            <Input class="w-full" bind:value={account.email} on:blur={saveAccount} disabled />
            <span class="text-xs text-muted-foreground">Cannot be changed.</span>
          </div>
          <div>
            <Label>Phone number</Label>
            <Input class="w-full" bind:value={account.phone} on:blur={saveAccount} />
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Card.Title>Occupation details</Card.Title>
        </Card.Header>
        <Card.Content class="grid grid-cols-2 gap-2">
          <div class="col-span-2 mb-3">
            <RadioGroup.Root value={account.occupation} onValueChange={handleOccupationChange}>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="student"/>
                <Label>Student</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="teacher"/>
                <Label>Teacher</Label>
              </div>
            </RadioGroup.Root>
          </div>
          {#if account.occupation === "student"}
            <div>
              <Label>Department</Label>
              <Input class="w-full" bind:value={account.department} />
            </div>
            <div>
              <Label>Year</Label>
              <Input class="w-full" bind:value={account.year} />
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <Card.Root id="preferences">
        <Card.Header>
          <Card.Title>Language</Card.Title>
        </Card.Header>
        <Card.Content class="grid grid-cols-2 gap-2">
          <div class="col-span-2">
            <RadioGroup.Root value={account.language} onValueChange={handleLanguageChange}>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="en"/>
                <Label>English</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroup.Item value="zh"/>
                <Label>Chinese</Label>
              </div>
              <span class="text-xs text-muted-foreground">More languages coming soon!</span>
            </RadioGroup.Root>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root id="notifications">
        <Card.Header>
          <Card.Title>Notifications</Card.Title>
        </Card.Header>
        <Card.Content class="grid grid-cols-2 gap-2">
          <div class="flex items-center space-x-2 col-span-2">
            <Switch id="notify-email" checked={account.disableNotify} onCheckedChange={handleNotifChange} />
            <Label for="notify-email">Disable sending notifications to email</Label>
          </div>
        </Card.Content>
      </Card.Root>

      <div class="h-screen"></div>

    </div>
  </div>
{/if}