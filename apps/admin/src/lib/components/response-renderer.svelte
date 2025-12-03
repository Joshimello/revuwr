<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import { pbImage } from '$lib/pocketbase/client';
	import type { AnswersResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { getResponseRepresentation } from '$lib/response-repr';
	import BudgetRenderer from './budget-renderer.svelte';

	type ExpandedAnswer = AnswersResponse<
		unknown,
		{
			question: QuestionsResponse<unknown>;
		}
	>;

	export let data: ExpandedAnswer | null | undefined;
	export let headless: boolean = false;
	export let repr: string = '';

	const response = data?.response;
	const question = data?.expand?.question;

	// Generate string representation for headless mode using utility function
	$: if (headless) {
		repr = getResponseRepresentation(data);
	}
</script>

{#if !headless}
	{#if question}
		{#if response == null}
			<span> - </span>
		{:else if question.type == 'budget'}
			<BudgetRenderer data={response} headless={false} bind:repr />
		{:else if ['member', 'activity'].includes(question.type)}
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
			<span>{getResponseRepresentation(data) || 'No data'}</span>
		{/if}
	{/if}
{/if}
