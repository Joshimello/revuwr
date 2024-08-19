<script lang="ts">
  import { page } from "$app/stores"
  import { pb, pbImage } from "$lib/pocketbase/client";
  import { toast } from "svelte-sonner"
  import { goto } from "$app/navigation"
  import { onMount } from "svelte"
  import { user } from "$lib/stores"
	import type { EventsResponse } from "$lib/pocketbase/pocketbase-types";
	import { Button } from "$lib/components/ui/button";
	import { ChevronLeft } from "lucide-svelte";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import { Badge } from "$lib/components/ui/badge";
  import { fly } from "svelte/transition";
  import { cubicOut } from "svelte/easing";

  let event: EventsResponse | null = null
  let isLoading = false
  let isCreating = false
  export let form

  const handleSubmit = () => {
    isCreating = true
    toast.loading("Creating application...", {
      duration: Number.POSITIVE_INFINITY
    })
  }

  onMount(async () => {
    if (form) {
      toast.error(form.message)
    }

    try {
      isLoading = true
      await new Promise(resolve => setTimeout(resolve, 500))
      event = await pb.collection('events').getOne($page.params.id)
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error("An error occurred")
      }
    }
    finally {
      isLoading = false
    }
  })

</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href="/">
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Back</span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    {#if event}
      <span in:fly={{ easing: cubicOut }}>
        {event.name}
      </span>
    {:else if isLoading}
      <Skeleton class="w-64 h-8" />
    {:else}
      Event not found
    {/if}
  </h1>
</div>

{#if event && $user}
  <div class="flex flex-col gap-4 mt-4" in:fly={{ y: 20, easing: cubicOut }}>
    {#if event.image}
      <img src={pbImage(event.collectionId, event.id, event.image)} alt={event.name} class="w-full h-64 object-cover rounded-lg" />
    {/if}
    <p class="text-muted-foreground">
      {event.description}
    </p>

    <span class="flex items-center gap-2">
      Event Target: <Badge><span class="first-letter:capitalize">{event.targetAudience}</span></Badge>
    </span>
    <span class="flex items-center gap-2">
      Event Duration: <Badge>{new Date(event.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Badge> -> <Badge>{new Date(event.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Badge>
    </span>
    <span class="flex items-center gap-2">
      More Info: <a target="_blank" href={event.moreInfo} class="underline text-muted-foreground">{event.moreInfo}</a>
    </span>

    <form method="post" class="w-full flex flex-col" on:submit={handleSubmit}>
      <input type="hidden" name="userId" value={$user.model.id}/>
      <Button 
        class="mt-12" 
        size="lg" 
        type="submit"
        disabled={isCreating || new Date(event.startDate) > new Date() || new Date(+new Date(event.endDate) + 86400000) < new Date()}
      >
        {#if new Date(event.startDate) > new Date()}
          Event has not started yet
        {:else if new Date(+new Date(event.endDate) + 86400000) < new Date()}
          Event has ended
        {:else}
          Apply now!
        {/if}
      </Button>
    </form>

  </div>
{/if}