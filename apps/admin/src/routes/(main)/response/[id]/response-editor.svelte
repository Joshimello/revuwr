<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import type { AnswersResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { PenBox } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import Budget from './budget.svelte';

	type ExpandedAnswer = AnswersResponse<
		unknown,
		{ question: QuestionsResponse<Record<string, unknown>, Record<string, unknown>> }
	>;

	export let response: ExpandedAnswer[];
	export let answer: ExpandedAnswer;
	export let onSaved: () => void = () => undefined;

	let open = false;
	let saving = false;
	let draft = '';
	let budgetValue: never[] = [];

	function prepareEditor() {
		draft = JSON.stringify(answer.response, null, 2);
		budgetValue = Array.isArray(answer.response)
			? (structuredClone(answer.response) as never[])
			: (Object.values((answer.response as Record<string, unknown>) ?? {}).map((item) =>
					structuredClone(item)
				) as never[]);
	}

	async function handleEditSave() {
		const isBudget = answer.expand?.question.type === 'budget';
		let nextResponse: unknown;

		try {
			nextResponse = isBudget ? budgetValue : JSON.parse(draft);
		} catch {
			toast.error(m.invalid_json());
			return;
		}

		saving = true;
		try {
			const updated = await pb.collection('answers').update(answer.id, {
				response: nextResponse
			});
			const index = response.findIndex((item) => item.id === answer.id);
			if (index !== -1) response[index].response = updated.response;
			answer.response = updated.response;
			response = [...response];
			onSaved();
			toast.success('Response saved');
			open = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'An error occurred');
		} finally {
			saving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			size="sm"
			variant="ghost"
			class="h-8 gap-1.5"
			on:click={prepareEditor}
		>
			<PenBox size="14" />
			{m.edit_response()}
		</Button>
	</Dialog.Trigger>
	<Dialog.Content class="max-h-[90vh] max-w-6xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{m.edit_response()}</Dialog.Title>
			<Dialog.Description>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html answer.expand?.question.title ?? ''}
			</Dialog.Description>
		</Dialog.Header>

		{#if answer.expand?.question.type === 'budget'}
			<Budget question={answer.expand.question} value={budgetValue} bind:outValue={budgetValue} />
		{:else}
			<Textarea class="min-h-80 resize-y font-mono text-sm" bind:value={draft} spellcheck="false" />
		{/if}

		<Dialog.Footer>
			<Button variant="outline" disabled={saving} on:click={() => (open = false)}>
				{m.cancel()}
			</Button>
			<Button disabled={saving} on:click={handleEditSave}>
				{saving ? m.saving() : m.save()}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
