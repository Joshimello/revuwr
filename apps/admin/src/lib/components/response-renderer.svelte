<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
	import { pbImage } from '$lib/pocketbase/client';
	import type { AnswersResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import {
		getAnswerDisplayState,
		type AnswerDisplayState,
		type ExpandedAnswer
	} from '$lib/response-display';
	import { getResponseRepresentation } from '$lib/response-repr';
	import BudgetRenderer from './budget-renderer.svelte';

	type ResponseRendererVariant = 'detail' | 'table' | 'print';

	export let data:
		| AnswersResponse<
				unknown,
				{
					question: QuestionsResponse<unknown, unknown>;
				}
		  >
		| null
		| undefined;
	export let headless: boolean = false;
	export let repr: string = '';
	export let variant: ResponseRendererVariant = 'detail';
	export let allAnswers: ExpandedAnswer[] = data ? ([data] as ExpandedAnswer[]) : [];
	export let state: AnswerDisplayState | undefined = undefined;
	export let showStoredValue: boolean = false;

	$: response = data?.response;
	$: question = data?.expand?.question;
	$: resolvedState = state ?? getAnswerDisplayState(data as ExpandedAnswer, allAnswers);
	$: shouldRenderValue = resolvedState === 'answered' || showStoredValue;
	$: representation = getResponseRepresentation(data);
	$: budgetResponse = response as Record<number, never>;

	$: if (headless) {
		repr = representation;
	}

	function countFiles(value: unknown): number {
		if (!Array.isArray(value)) return 0;
		return value.flatMap((item) => {
			if (typeof item !== 'object' || item === null || !('files' in item)) return [];
			return Array.isArray(item.files) ? item.files : [];
		}).length;
	}

	function formatHeader(value: string): string {
		return value
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replaceAll('_', ' ')
			.replace(/^./, (character) => character.toUpperCase());
	}

	function compactSummary(): string {
		if (!question) return '';
		if (question.type === 'member') {
			return m.member_count({ count: Array.isArray(response) ? response.length : 0 });
		}
		if (question.type === 'activity') {
			return m.activity_count({ count: Array.isArray(response) ? response.length : 0 });
		}
		if (question.type === 'file') {
			return m.file_count({ count: countFiles(response) });
		}
		if (question.type === 'budget') {
			const number = Number(representation);
			const total = Number.isFinite(number)
				? new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(number)
				: representation;
			return m.budget_total({ total });
		}
		return representation;
	}

	function stateLabel(): string {
		switch (resolvedState) {
			case 'missing-required':
				return m.missing_required();
			case 'not-applicable':
				return m.not_applicable();
			case 'unanswered-optional':
				return m.not_answered_optional();
			default:
				return '';
		}
	}
</script>

{#if !headless && question}
	{#if !shouldRenderValue}
		<span
			class:text-destructive={resolvedState === 'missing-required'}
			class="text-sm italic text-muted-foreground"
		>
			{stateLabel()}
		</span>
	{:else if variant === 'table'}
		<span class="block max-w-72 truncate" title={compactSummary()}>{compactSummary()}</span>
	{:else if question.type === 'budget'}
		<div class="overflow-x-auto">
			<BudgetRenderer data={budgetResponse} headless={false} bind:repr />
		</div>
	{:else if ['member', 'activity'].includes(question.type) && Array.isArray(response)}
		<div class="overflow-x-auto rounded-md border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						{#each Object.keys(response[0] ?? {}) as key}
							<Table.Head>{formatHeader(key)}</Table.Head>
						{/each}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each response as row}
						<Table.Row>
							{#each Object.values(row ?? {}) as value}
								<Table.Cell>{value == null ? '' : String(value)}</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{:else if question.type === 'file' && Array.isArray(response)}
		<div class="flex flex-col gap-1">
			{#each response as files}
				{#if files && typeof files === 'object' && 'files' in files && Array.isArray(files.files)}
					{#each files.files as file}
						<a
							class="w-fit break-all font-medium text-blue-600 underline underline-offset-2"
							href={pbImage(String(files.collectionId), String(files.recordId), String(file))}
							target="_blank"
							rel="noreferrer"
						>
							{file}
						</a>
					{/each}
				{/if}
			{/each}
		</div>
	{:else}
		<span class:whitespace-pre-wrap={question.type === 'longText'} class="break-words">
			{representation}
		</span>
	{/if}
{/if}
