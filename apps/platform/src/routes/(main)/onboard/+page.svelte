<script lang="ts">
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { ArrowRight, ArrowLeft, Bird, UserPen, BriefcaseBusiness } from "lucide-svelte";
  import * as Card from "$lib/components/ui/card"
	import { Button } from "$lib/components/ui/button";
  import * as ToggleGroup from "$lib/components/ui/toggle-group";
  import { pb } from "$lib/pocketbase/client";
  import { toast } from "svelte-sonner"
  import { goto } from "$app/navigation";

  export let data
  const { user } = data

  const stages = [
    { 
      title: "Welcome! Lets get you started", 
      description: "Before anything, what language would you prefer? Don't worry, you will be able to change this anytime in your user settings later.",
      icon: Bird,
    },
    {
      title: "Basic Information",
      description: "We need some basic information to get you started. You will have the options to modify this later as well.",
      icon: UserPen,
    },
    {
      title: "Occupation status",
      description: "Are you a student or a staff member? This will help us to provide you with the right resources.",
      icon: BriefcaseBusiness,
    }
  ]

  let page = 0;

  let values = {
    language: '',
    name: user?.name,
    username: user?.username,
    email: user?.email,
    phone: '',
    occupation: '',
    department: '',
    year: '',
  }

  let isLoading = false

  const phoneRegex = /^(?:\+8869\d{8}|09\d{8})$/
  $: isPhoneValid = phoneRegex.test(values.phone)
  
</script>

<Card.Root>
  <Card.Header>
    <svelte:component this={stages[page].icon} size="64" strokeWidth="1" class="my-6 text-orange-600" />
    <Card.Title>
      {stages[page].title}
    </Card.Title>
    <Card.Description class="max-w-md">
      {stages[page].description}
    </Card.Description>
  </Card.Header>
  <Card.Content>

    {#if page == 0}
      <div class="w-full flex gap-6">
        <ToggleGroup.Root variant="outline" type="single" class="w-full grid grid-cols-2" bind:value={values.language}>
          <ToggleGroup.Item value="en" class="h-20 data-[state=on]:bg-orange-500 data-[state=on]:text-white">
            English
          </ToggleGroup.Item>
          <ToggleGroup.Item  value="zh" class="h-20 data-[state=on]:bg-orange-500 data-[state=on]:text-white">
            中文
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
    {:else if page == 1}
      <div class="grid grid-cols-2 gap-6">
        <div class="flex-1">
          <Label>Full Name</Label>
          <Input type="text" bind:value={values.name} disabled />
        </div>
        <div class="flex-1">
          <Label>Student or Staff ID</Label>
          <Input type="text" bind:value={values.username} disabled />
        </div>
        <div class="flex-1">
          <Label>Email</Label>
          <Input type="text" bind:value={values.email} disabled />
        </div>
        <div class="flex-1">
          <Label>
            Phone number
            {#if values.phone && !isPhoneValid}
              <span class:text-destructive={true} >(Invalid mobile number)</span>  
            {/if}
          </Label>
          <Input type="text" bind:value={values.phone} />
        </div>
      </div>
    {:else if page == 2}
      <div class="w-full flex flex-col gap-6">
        <ToggleGroup.Root variant="outline" type="single" class="w-full grid grid-cols-2" bind:value={values.occupation}>
          <ToggleGroup.Item value="student" class="h-20 data-[state=on]:bg-orange-500 data-[state=on]:text-white">
            Student
          </ToggleGroup.Item>
          <ToggleGroup.Item  value="teacher" class="h-20 data-[state=on]:bg-orange-500 data-[state=on]:text-white">
            Staff
          </ToggleGroup.Item>
        </ToggleGroup.Root>
        {#if values.occupation == 'student'}
        <div class="grid grid-cols-2 gap-6">
          <div class="flex-1">
            <Label>Department or Institute or Program</Label>
            <Input type="text" bind:value={values.department} />
          </div>
          <div class="flex-1">
            <Label>Year</Label>
            <Input type="text" bind:value={values.year} />
          </div>
        </div>
        {/if}
      </div>
    {/if}

  </Card.Content>
  <Card.Footer class="flex justify-end gap-2">

    {#if page == 0}
      <Button 
        class="flex items-center gap-2 w-full md:w-auto" 
        disabled={!values.language} 
        on:click={() => page = 1}
      >
        Next <ArrowRight size="16" />
      </Button>
    {:else if page == 1}
      <Button class="flex items-center gap-2" on:click={() => page = 0}>
        <ArrowLeft size="16" /> Back
      </Button>
      <Button 
        class="flex items-center gap-2 w-full md:w-auto" 
        disabled={!(values.name && values.username && isPhoneValid && values.email)} 
        on:click={() => page = 2}
      >
        Next <ArrowRight size="16" />
      </Button>
    {:else if page == 2}
      <Button class="flex items-center gap-2" on:click={() => page = 1}>
        <ArrowLeft size="16" /> Back
      </Button>
      <form action="" method="post" on:submit={() => {
        isLoading = true
        toast.loading("Updating profile...")
      }}>
        <input type="hidden" value={values.language} name="language" />
        <input type="hidden" value={values.phone} name="phone" />
        <input type="hidden" value={values.occupation} name="occupation" />
        <input type="hidden" value={values.department} name="department" />
        <input type="hidden" value={values.year} name="year" />
        <Button 
          type="submit"
          class="flex items-center gap-2 w-full md:w-auto" 
          disabled={isLoading || !(values.occupation && (values.occupation == 'student' ? values.department && values.year : true))}
        >
          Finish <ArrowRight size="16" />
        </Button>
      </form>
      
    {/if}

  </Card.Footer>
</Card.Root>