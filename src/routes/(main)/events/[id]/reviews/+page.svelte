<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { setBreadcrumbs } from '$lib/breadcrumbs.js';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import type { EventsResponse } from '$lib/pocketbase/pocketbase-types';
	import { ChevronLeft } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import DataTable from './data-table.svelte';
	import { reviewRequests } from './stores';

	let event: EventsResponse | null = null;

	// Set breadcrumbs reactively based on event data
	$: if (event) {
		setBreadcrumbs([
			{
				text: m.events(),
				href: `${PUBLIC_BASE_PATH}/events`
			},
			{
				text: event.name,
				href: `${PUBLIC_BASE_PATH}/events/${event.id}`
			},
			{
				text: m.reviews(),
				href: `${PUBLIC_BASE_PATH}/events/${event.id}/reviews`
			}
		]);
	}

	onMount(async () => {
		try {
			$reviewRequests = await pb.collection('reviews').getFullList({
				filter: `applications.event?~"${$page.params.id}"`,
				sort: '-created'
			});

			// Fetch event data for breadcrumbs
			event = await pb.collection('events').getOne($page.params.id, {
				fields: 'id,name'
			});
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	});
</script>

<div class="flex items-center gap-4">
	<Button
		variant="outline"
		size="icon"
		class="h-7 w-7"
		href={`${PUBLIC_BASE_PATH}/events/${$page.params.id}`}
	>
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">Back</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.review_requests()}
	</h1>
</div>

{#if $reviewRequests.length > 0}
	<div class="flex">
		<div class="w-0 flex-1 overflow-auto">
			<DataTable data={reviewRequests} />
		</div>
	</div>
{:else}
	{m.no_review_requests_yet()}
{/if}
