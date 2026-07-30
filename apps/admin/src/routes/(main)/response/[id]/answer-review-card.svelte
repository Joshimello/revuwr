<script lang="ts">
	import ResponseRenderer from '$lib/components/response-renderer.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as m from '$lib/paraglide/messages.js';
	import type { AnswersResponse, QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import {
		hasStoredResponse,
		type AnswerDisplayState,
		type ExpandedAnswer
	} from '$lib/response-display';
	import { AlertTriangle, MessageCircleReply } from 'lucide-svelte';
	import ResponseEditor from './response-editor.svelte';

	type ReviewAnswer = AnswersResponse<
		unknown,
		{ question: QuestionsResponse<Record<string, unknown>, Record<string, unknown>> }
	>;

	export let answer: ReviewAnswer;
	export let response: ReviewAnswer[];
	export let allAnswers: ExpandedAnswer[];
	export let number: number;
	export let state: AnswerDisplayState;
	export let toggleEditRequest: (answerId: string, value: string) => Promise<void>;
	export let saveComment: (answerId: string) => Promise<void>;
	export let refreshAnswers: () => void;

	let showStoredValue = false;
	let savingComment = false;
	$: question = answer.expand?.question;
	$: requestedEdit = answer.status === 'edit';
	$: storedWhileHidden = state === 'not-applicable' && hasStoredResponse(answer as ExpandedAnswer);
	$: compact =
		!requestedEdit &&
		!storedWhileHidden &&
		(state === 'unanswered-optional' || state === 'not-applicable');

	function stateText() {
		if (state === 'answered') return m.answered();
		if (state === 'missing-required') return m.missing_required();
		if (state === 'not-applicable') return m.not_applicable();
		return m.not_answered_optional();
	}

	async function handleSaveComment() {
		savingComment = true;
		try {
			await saveComment(answer.id);
		} finally {
			savingComment = false;
		}
	}
</script>

{#if compact}
	<article
		class="group flex flex-col gap-3 rounded-lg border border-dashed bg-muted/20 px-3 py-3 sm:flex-row sm:items-center"
	>
		<div class="min-w-0 flex-1">
			<div class="mb-1 flex flex-wrap items-center gap-2">
				<span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					{m.question_number({ number })}
				</span>
				<Badge variant="outline">{question?.required ? m.required() : m.optional()}</Badge>
			</div>
			<h3 class="truncate text-sm font-medium text-muted-foreground">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html question?.title ?? ''}
			</h3>
		</div>
		<div class="flex shrink-0 items-center gap-1">
			<Badge variant="secondary" class="italic">{stateText()}</Badge>
			<div
				class="flex items-center opacity-100 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 md:opacity-0"
			>
				<ResponseEditor {response} {answer} onSaved={refreshAnswers} />
				{#if state !== 'not-applicable'}
					<Button
						size="sm"
						variant="ghost"
						class="h-8 gap-1.5"
						on:click={() => toggleEditRequest(answer.id, 'edit')}
					>
						<MessageCircleReply size="14" />
						{m.request_edit()}
					</Button>
				{/if}
			</div>
		</div>
	</article>
{:else}
	<article
		class={`group rounded-xl border bg-card shadow-sm transition-colors dark:bg-card dark:bg-opacity-100 ${
			state === 'missing-required' ? 'border-destructive/50 bg-destructive/5' : ''
		} ${requestedEdit ? 'border-amber-400 bg-amber-50' : ''}`}
	>
	<div class:pb-3={state !== 'answered'} class="flex flex-col gap-3 p-4 sm:p-5">
		<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
			<div class="min-w-0 space-y-2">
				<div class="flex flex-wrap items-center gap-2">
					<span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						{m.question_number({ number })}
					</span>
					<Badge variant={question?.required ? 'default' : 'outline'}>
						{question?.required ? m.required() : m.optional()}
					</Badge>
					{#if requestedEdit}
						<Badge class="border-transparent bg-amber-500 text-white">
							{m.edits_requested()}
						</Badge>
					{/if}
				</div>
				<h3 class="text-base font-semibold leading-6">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html question?.title ?? ''}
				</h3>
			</div>

			<Badge
				variant={state === 'missing-required' ? 'destructive' : 'secondary'}
				class={`shrink-0 ${state !== 'answered' ? 'italic' : ''}`}
			>
				{stateText()}
			</Badge>
		</div>

		{#if state === 'answered'}
			<div class="rounded-lg border bg-muted/30 p-4 text-sm leading-6 sm:text-base">
				<ResponseRenderer data={answer} variant="detail" {state} {allAnswers} />
			</div>
		{:else if storedWhileHidden}
			<div class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
				<div class="flex items-start gap-2">
					<AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
					<div class="flex-1">
						<p>{m.stored_hidden_answer()}</p>
						<Button
							variant="link"
							size="sm"
							class="h-auto px-0 py-1 text-amber-950"
							on:click={() => (showStoredValue = !showStoredValue)}
						>
							{showStoredValue ? m.hide_stored_answer() : m.show_stored_answer()}
						</Button>
					</div>
				</div>
				{#if showStoredValue}
					<div class="mt-2 rounded-md border border-amber-200 bg-white p-3 text-foreground">
						<ResponseRenderer data={answer} variant="detail" {state} {allAnswers} showStoredValue />
					</div>
				{/if}
			</div>
		{:else}
			<p
				class:text-destructive={state === 'missing-required'}
				class="text-sm italic text-muted-foreground"
			>
				{stateText()}
			</p>
		{/if}
	</div>

	<div class="border-t px-3 py-2 sm:px-4">
		<div
			class={`flex flex-wrap items-center gap-1 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 ${
				requestedEdit ? '' : 'md:opacity-0'
			}`}
		>
			<ResponseEditor {response} {answer} onSaved={refreshAnswers} />
			{#if state !== 'not-applicable'}
				<Button
					size="sm"
					variant={requestedEdit ? 'secondary' : 'ghost'}
					class="h-8 gap-1.5"
					on:click={() => toggleEditRequest(answer.id, requestedEdit ? '' : 'edit')}
				>
					<MessageCircleReply size="14" />
					{requestedEdit ? m.cancel_edit_request() : m.request_edit()}
				</Button>
			{/if}
		</div>

		{#if requestedEdit}
			<div class="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
				<label class="text-sm font-medium" for={`comment-${answer.id}`}>
					{m.instructions_for_applicant()}
				</label>
				<Textarea
					id={`comment-${answer.id}`}
					class="min-h-24 bg-white"
					placeholder={m.instructions_placeholder()}
					bind:value={answer.comment}
				/>
				<div class="flex justify-end">
					<Button size="sm" disabled={savingComment} on:click={handleSaveComment}>
						{savingComment ? m.saving() : m.save_comment()}
					</Button>
				</div>
			</div>
		{/if}
	</div>
	</article>
{/if}
