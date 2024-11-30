<script lang="ts">
	import type { AnswersResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import * as Dialog from '$lib/components/ui/dialog';
	import { pbImage } from '$lib/pocketbase/client';
	import * as Table from '$lib/components/ui/table';
	import { Button } from '$lib/components/ui/button';
	import BudgetRenderer from './budget-renderer.svelte';

	type ExpandedAnswer = AnswersResponse<
		any,
		{
			question: QuestionsResponse<any>;
		}
	>;

	export let data: ExpandedAnswer | null | undefined;
	const response = data?.response;
	const question = data?.expand?.question;
</script>

{#if question}
	{#if response == null}
		<span> - </span>
	{:else if ['shortText', 'longText', 'email', 'phone'].includes(question.type)}
		<span>{response}</span>
	{:else if question.type == 'radio'}
		{#if response.selected == question.options.choices.length}
			<span>{response.others}</span>
		{:else}
			<span>{question.options.choices[response.selected]}</span>
		{/if}
	{:else if question.type == 'budget'}
		<Dialog.Root>
			<Dialog.Trigger let:builder asChild>
				<Button builders={[builder]} variant="outline">Open Table</Button>
			</Dialog.Trigger>
			<Dialog.Content class="max-w-screen">
				<BudgetRenderer data={response} />
			</Dialog.Content>
		</Dialog.Root>
	{:else if ['member', 'activity'].includes(question.type)}
		<Dialog.Root>
			<Dialog.Trigger let:builder asChild>
				<Button builders={[builder]} variant="outline">Open Table</Button>
			</Dialog.Trigger>
			<Dialog.Content class="max-w-screen">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							{#each Object.keys(response[0] ?? {}) as key}
								<Table.Head>{key}</Table.Head>
							{/each}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each response as row}
							<Table.Row>
								{#each Object.values(row ?? {}) as value}
									<Table.Cell>{value}</Table.Cell>
								{/each}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Dialog.Content>
		</Dialog.Root>
	{:else if question.type == 'file'}
		{#if response}
			<div class="flex flex-col">
				{#each response as files}
					{#each files.files as file}
						<a
							class="text-blue-500 underline"
							href={pbImage(files.collectionId, files.recordId, file)}
							target="_blank"
						>
							{file}
						</a>
					{/each}
				{/each}
			</div>
		{/if}
	{:else}
		<span>
			{JSON.stringify(response)}
		</span>
	{/if}
{/if}
