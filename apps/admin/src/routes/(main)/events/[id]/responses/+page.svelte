<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { statuses } from '$lib/components/status.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { ChevronLeft } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { event as eventStore, reviewRequests } from '../overview/stores';
	import DataTableBatch from './data-table-batch.svelte';
	import DataTable from './data-table.svelte';
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
			$eventStore = event;

			// Fetch review requests
			const records = await pb.collection('reviews').getFullList({
				filter: `applications.event?~"${$page.params.id}"`,
				sort: '-created',
				expand: 'applications,questions,applications.responder'
			});
			$reviewRequests = records;
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
		{m.event_responses()} ({$applications.length})
	</h1>
</div>

<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
	{#each Object.entries(statuses) as [key, status]}
		{#if ['draft', 'submitted', 'editsRequested', 'approved', 'rejected'].includes(key)}
			<div class="flex flex-col items-center justify-center rounded-md border p-4">
				<div class={`h-4 w-4 rounded-full ${status.classes}`}></div>
				<div class="mt-2 text-nowrap text-sm font-medium">{status.label}</div>
				<div class="text-xs text-muted-foreground">
					{$applications.filter((app) => app.status === key).length}
				</div>
			</div>
		{/if}
	{/each}
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
