<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import * as m from '$lib/paraglide/messages.js';
	import { addNewQuestion } from './methods';
	import questionTypes from './question-types';

	export let currentPage: string;
	export let editingId: string | null;
	export let long: boolean = false;
	export let index: number | null = null;

	const addQuestion = async (type: string) => {
		open = false;

		const promise = addNewQuestion(type, currentPage, index);

		promise
			.then((question) => {
				editingId = question.id;
			})
			.catch(() => {
				// Error handling is already done in the method
			});
	};

	let open = false;
</script>

<Popover.Root bind:open>
	<Popover.Trigger asChild let:builder>
		{#if long}
			<Button
				builders={[builder]}
				class="h-2 w-full text-xs text-muted-foreground opacity-0 transition-opacity duration-75 hover:opacity-100"
				variant="ghost"
			>
				{m.add_a_new_question()}
			</Button>
		{:else}
			<Button builders={[builder]}>
				{m.add_a_new_question()}
			</Button>
		{/if}
	</Popover.Trigger>
	<Popover.Content>
		{#each Object.entries(questionTypes) as [type, { label, icon }]}
			<Button
				class="flex w-full justify-start gap-2"
				variant="outline"
				size="sm"
				on:click={() => addQuestion(type)}
			>
				<svelte:component this={icon} size="16" class="shrink-0" />
				<span>{label}</span>
			</Button>
		{/each}
	</Popover.Content>
</Popover.Root>
