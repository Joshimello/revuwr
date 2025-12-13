<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { setBreadcrumbs } from '$lib/breadcrumbs.js';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as m from '$lib/paraglide/messages.js';
	import { ChevronLeft, CirclePlus } from 'lucide-svelte';
	import type { PageData } from './$types';
	import AddQuestion from './add-question.svelte';
	import { createNewPage } from './methods';
	import Question from './question.svelte';

	export let data: PageData;

	let editingId: string | null = null;
	let currentPage = '1';

	$: setBreadcrumbs([
		{
			text: m.events(),
			href: `${PUBLIC_BASE_PATH}/events`
		},
		{
			text: data.event.name,
			href: `${PUBLIC_BASE_PATH}/events/${data.event.id}`
		},
		{
			text: m.questions(),
			href: `${PUBLIC_BASE_PATH}/events/${data.event.id}/questions`
		}
	]);
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
			{#each [...new Set(data.questions.map((i) => i.page))] as page}
				<Tabs.Trigger value={page.toString()}>{m.page()} {page}</Tabs.Trigger>
			{/each}
		</Tabs.List>
		<Button
			variant="outline"
			size="sm"
			class="flex h-7 gap-2"
			on:click={async () => {
				const question = await createNewPage(data.event.id);
				editingId = question.id;
				currentPage = question.page.toString();
			}}
		>
			<CirclePlus size="16" />
			<span>{m.new_page()}</span>
		</Button>
	</div>
	{#each [...new Set(data.questions.map((i) => i.page))] as page}
		<Tabs.Content value={page.toString()}>
			<div class="flex flex-col">
				{#each data.questions.filter((i) => i.page == page) as question, index (question.id)}
					<Question
						{question}
						bind:editingId
						{index}
						eventId={data.event.id}
						questions={data.questions}
					/>
					<AddQuestion bind:currentPage bind:editingId {index} eventId={data.event.id} long />
				{/each}
			</div>
		</Tabs.Content>
	{/each}
	{#if data.questions.length <= 0}
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
				<AddQuestion bind:currentPage bind:editingId eventId={data.event.id} />
			</div>
		</div>
	{/if}
</Tabs.Root>
