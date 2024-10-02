<script lang="ts">
	import { PUBLIC_BASE_PATH } from "$env/static/public";
	import { Button } from "$lib/components/ui/button";
	import { ChevronLeft, CirclePlus, SaveAll, Trash } from "lucide-svelte";
  import { page } from "$app/stores";
  import * as m from '$lib/paraglide/messages.js';
  import * as Card from "$lib/components/ui/card"
	import Editor from "$lib/components/editor.svelte";
  import { pb } from "$lib/pocketbase/client"
	import { toast } from "svelte-sonner";
	import { onMount } from "svelte";

  type Terms = {
    title: string;
    description: string;
  }[]

  let terms: Terms = []

  const saveTerms = async () => {
    try {
      await pb.collection('events').update($page.params.id, {
        terms: terms
      })
      toast.success('Terms updated')
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error('Unknown error')
        console.error(err)
      }
    }
  }

  const getTerms = async () => {
    try {
      const event = await pb.collection('events').getOne<{ terms: Terms }>($page.params.id)
      return event.terms
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message)
      }
      else {
        toast.error('Unknown error')
        console.error(err)
      }
    }
  }

  onMount(async () => {
    terms = await getTerms() || []
  })

</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href="{PUBLIC_BASE_PATH}/events/{$page.params.id}">
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">
      {m.back()}
    </span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    Editing Event Terms & Conditions
  </h1>
</div>

<div class="flex gap-2">
  <Button class="flex items-center gap-2" on:click={() => {
    terms = [...terms, { title: '', description: '' }]
  }}>
    <CirclePlus class="h-4 w-4" />
    New Term or Condition
  </Button>
  <Button class="flex items-center gap-2" on:click={() => {
    saveTerms()
  }}>
    <SaveAll class="h-4 w-4" />
    Save Changes
  </Button>
</div>

{#each terms as term, index}
  <Card.Root>
    <Card.Header>
      <Card.Title>
        <Editor bind:value={terms[index].title} placeholder="Terms title" class="outline-none" />
      </Card.Title>
      <Card.Description>
        <Editor bind:value={terms[index].description} placeholder="description" class="outline-none" />
      </Card.Description>
    </Card.Header>
    <Card.Footer class="flex gap-2">
      <Button size="icon" variant="destructive" on:click={() => {
        terms = terms.filter((_, i) => i !== index)
      }}>
        <Trash size="16" />
      </Button>
    </Card.Footer>
  </Card.Root>
{/each}

<span>
  You can highlight text while editing to add formatting options.
</span>