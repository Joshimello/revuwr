<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { ChevronLeft } from "lucide-svelte";
	import type { ExpandedUsersResponse } from "../types";
	import { onMount } from "svelte";
	import { pb } from "$lib/pocketbase/client";
  import { page } from "$app/stores";
	import { toast } from "svelte-sonner";

  let record: ExpandedUsersResponse | null = null;

  onMount(async () => {
    try {
      record = await pb.collection('users').getOne<ExpandedUsersResponse>($page.params.id, {
        expand: 'applications'
      })
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
      else {
        toast.error('Unknown error');
        console.error(err);
      }
    }
  });
</script>

<div class="flex items-center gap-4">
	<Button
		variant="outline"
		size="icon"
		class="h-7 w-7"
		on:click={() => {
			window.history.back();
		}}
	>
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">Back</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">
		{#if record}
			{record.name} ({record.username})
		{/if}
	</h1>
</div>

TODO
<pre>{JSON.stringify(record, null, 2)}</pre>