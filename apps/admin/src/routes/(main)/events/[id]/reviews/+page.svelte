<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { pb } from '$lib/pocketbase/client';
  import { toast } from 'svelte-sonner';
  import { Button } from '$lib/components/ui/button';
	import { ChevronLeft } from 'lucide-svelte';
	import DataTable from './data-table.svelte';
  import * as m from '$lib/paraglide/messages.js'
	import { PUBLIC_BASE_PATH } from '$env/static/public';
  import { reviewRequests } from './stores';

  onMount(async () => {
    try {
      $reviewRequests = await pb.collection('reviews').getFullList({
        filter: `applications.event?~"${$page.params.id}"`,
        sort: '-created',
      });
    }
    catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
      else {
        toast.error('An error occurred');
      }
    }
  })

</script>

<div class="flex items-center gap-4">
  <Button variant="outline" size="icon" class="h-7 w-7" href={`${PUBLIC_BASE_PATH}/events/${$page.params.id}`}>
    <ChevronLeft class="h-4 w-4" />
    <span class="sr-only">Back</span>
  </Button>
  <h1 class="text-lg font-semibold md:text-2xl">
    {m.review_requests()}
  </h1>
</div>

{#if $reviewRequests.length > 0}
  <div class="flex">
    <div class="flex-1 overflow-auto w-0">
      <DataTable data={reviewRequests} />
    </div>
  </div>
{:else}
  {m.no_review_requests_yet()}
{/if}
