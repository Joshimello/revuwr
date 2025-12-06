<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { setBreadcrumbs } from '$lib/breadcrumbs.js';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as m from '$lib/paraglide/messages.js';
	import type { EventsResponse } from '$lib/pocketbase/pocketbase-types';
	import { ChevronLeft, CirclePlus } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import AddQuestion from './add-question.svelte';
	import { createNewPage, refreshQuestions } from './methods';
	import Question from './question.svelte';
	import { questions } from './stores';

	let editingId: string | null = null;
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
				text: m.questions(),
				href: `${PUBLIC_BASE_PATH}/events/${event.id}/questions`
			}
		]);
	}

	const handleNewPage = async () => {
		const promise = createNewPage();

		promise
			.then((question) => {
				editingId = question.id;
				currentPage = question.page.toString();
			})
			.catch(() => {
				// Error handling is already done in the method
			});
	};

	onMount(async () => {
		refreshQuestions();

		// Fetch event data for breadcrumbs
		try {
			const { pb } = await import('$lib/pocketbase/client');
			event = await pb.collection('events').getOne($page.params.id, {
				fields: 'id,name'
			});
		} catch (err) {
			console.error('Failed to fetch event for breadcrumbs:', err);
		}
	});

	let currentPage = '1';
</script>

<div class="flex items-center gap-4">
	<Button
		variant="outline"
		size="icon"
		class="h-7 w-7"
		href="{PUBLIC_BASE_PATH}/events/{$page.params.id}"
	>
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">Back</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.editing_event_questions()}
	</h1>
</div>

<Tabs.Root bind:value={currentPage}>
	<div class="flex items-center gap-2">
		<Tabs.List>
			{#each [...new Set($questions.map((i) => i.page))] as page}
				<Tabs.Trigger value={page.toString()}>{m.page()} {page}</Tabs.Trigger>
			{/each}
		</Tabs.List>
		<Button variant="outline" size="sm" class="flex h-7 gap-2" on:click={handleNewPage}>
			<CirclePlus size="16" />
			<span>{m.new_page()}</span>
		</Button>
	</div>
	{#each [...new Set($questions.map((i) => i.page))] as page}
		<Tabs.Content value={page.toString()}>
			<div class="flex flex-col">
				{#each $questions.filter((i) => i.page == page) as question, index (question.id)}
					<Question {question} bind:editingId {index} />
					<AddQuestion bind:currentPage bind:editingId {index} long />
				{/each}
			</div>
		</Tabs.Content>
	{/each}
	{#if $questions.length <= 0}
		<div
			class="mt-2 flex flex-1 items-center justify-center rounded-lg border border-dashed py-16 shadow-sm"
		>
			<div class="flex flex-col items-center gap-1 text-center">
				<h3 class="text-2xl font-bold tracking-tight">
					{m.no_questions()}
				</h3>
				<p class="mb-4 text-sm text-muted-foreground">
					{m.no_questions_desc()}
				</p>
				<AddQuestion bind:currentPage bind:editingId />
			</div>
		</div>
	{/if}
</Tabs.Root>

<!-- <div class="flex lg:flex-row flex-col-reverse gap-x-8 gap-y-4">
  <div class="flex-1 flex flex-col lg:gap-8 gap-4">

  </div>
  <div class="lg:w-64 flex-shrink-0">

  </div>
</div> -->
