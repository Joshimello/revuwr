<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { pb } from '$lib/pocketbase/client';
	import { onMount } from 'svelte';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { toast } from 'svelte-sonner';
	import DataTable from './data-table.svelte';
	import DataTableBatch from './data-table-batch.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { applications } from './stores';

	type ExpandedApplication = ApplicationsResponse<{
		responder: UsersResponse;
		response: AnswersResponse<
			any,
			{
				question: QuestionsResponse;
			}
		>[];
	}>;

	type ExpandedEvents = EventsResponse<
		any,
		{
			questions: QuestionsResponse[];
		}
	>;

	let event: ExpandedEvents | null = null;

	onMount(async () => {
		try {
			$applications = await pb.collection('applications').getFullList<ExpandedApplication>({
				filter: `event="${$page.params.id}"`,
				sort: '-created',
				expand: 'responder,response,response.question'
			});
			event = await pb.collection('events').getOne($page.params.id, {
				expand: 'questions'
			});
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	});

	let selectedRecords: Record<string, boolean>;
</script>

<div class="flex items-center gap-4">
	<Button
		variant="outline"
		size="icon"
		class="h-7 w-7"
		href={`${PUBLIC_BASE_PATH}/events/${$page.params.id}`}
	>
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">
			{m.back()}
		</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.event_responses()}
	</h1>
</div>

{#if event && $applications.length > 0}
	<div class="flex">
		<div class="w-0 flex-1 overflow-auto">
			<DataTable data={applications} {event} bind:selectedRecords />
		</div>
	</div>
{:else}
	{m.no_responses_yet()}
{/if}

<DataTableBatch bind:applications={$applications} {selectedRecords} />
