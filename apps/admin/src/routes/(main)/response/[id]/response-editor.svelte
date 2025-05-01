<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Popover from '$lib/components/ui/popover';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import type { AnswersResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { PenBox } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import Budget from './budget.svelte';

	export let response: AnswersResponse<any, { question: QuestionsResponse<Record<string, any>> }>[];
	export let answer: AnswersResponse<any, { question: QuestionsResponse<Record<string, any>> }>;

	const editTextareas: Record<string, HTMLTextAreaElement> = {};
	const handleEditSave = async (answerId: string) => {
		if (answer.expand?.question.type == 'budget') {
			console.log(changeValue);
			try {
				await pb.collection('answers').update(answerId, {
					response: changeValue
				});
				toast.success('Response saved');
			} catch (error) {
				if (error instanceof Error) {
					toast.error(error.message);
				} else {
					toast.error('An error occurred');
				}
			}

			return;
		}

		try {
			const index = response.findIndex((i) => i.id == answerId);
			if (!editTextareas[answerId]) return;
			if (index == -1) return;
			await pb.collection('answers').update(answerId, {
				response: JSON.parse(editTextareas[answerId].value)
			});
			response[index].response = JSON.parse(editTextareas[answerId].value);
			toast.success('Response saved');
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	let changeValue: any;
</script>

<Popover.Root>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			size="icon"
			variant="secondary"
			class="h-7 w-7 hover:bg-sky-500 hover:text-white"
		>
			<PenBox size="16" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="flex h-96 max-h-96 w-[calc(100%-4rem)] flex-col gap-2 overflow-auto">
		{#if answer.expand?.question.type == 'budget'}
			<Budget
				question={answer.expand.question}
				value={Object.values(answer.response)}
				bind:outValue={changeValue}
			/>
		{:else}
			<textarea
				class="w-full flex-1 bg-transparent font-mono text-sm"
				value={JSON.stringify(answer.response, null, 1)}
				bind:this={editTextareas[answer.id]}
			/>
		{/if}

		<Button
			size="sm"
			variant="secondary"
			on:click={() => {
				handleEditSave(answer.id);
			}}
		>
			{m.edit_response()}
		</Button>
	</Popover.Content>
</Popover.Root>
