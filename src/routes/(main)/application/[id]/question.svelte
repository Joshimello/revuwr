<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { m } from '$lib/paraglide/messages.js';
	import { Info } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { shouldShowConditionalQuestion } from './conditional-utils';
	import { updateAnswer, updateConditionalAnswers } from './methods';
	import questionTypes from './question-types';
	import { answers, application, currentIndex, isReadOnly } from './stores';
	import type { ExpandedResponse } from './types';

	export let content: ExpandedResponse;
	const question = content.expand?.question;

	let checkValid: () => [boolean, string];
	let value: unknown = content.response;

	let isLoading = false;

	onMount(() => {
		console.log(question);
	});
</script>

{#if question && question.type in questionTypes}
	{#key value}
		<div class="flex gap-2">
			{#if question.required}
				<Badge variant="outline">{m.required_badge()}</Badge>
			{:else}
				<Badge variant="secondary">{m.optional_badge()}</Badge>
			{/if}

			{#if checkValid && !checkValid()[0]}
				<span class="text-sm text-destructive">
					{checkValid()[1]}
				</span>
			{/if}
		</div>
	{/key}

	<div class="flex w-full flex-col gap-2 px-3">
		<span class="text-2xl font-bold">
			{@html question.title}
		</span>
		<span class="text-justify text-sm text-muted-foreground">
			{@html question.description}
		</span>

		<svelte:component
			this={questionTypes[question.type].component}
			{question}
			disabled={$isReadOnly}
			bind:value
			bind:checkValid
		/>
	</div>

	{#if $answers[$currentIndex].comment}
		<Alert.Root variant="destructive">
			<Alert.Title>{m.alert_comments_title()}</Alert.Title>
			<Alert.Description>
				{$answers[$currentIndex].comment}
			</Alert.Description>
		</Alert.Root>
	{/if}

	{#if !$isReadOnly || ($currentIndex === $answers.length - 1 && $application?.status === 'editsRequested')}
		{#key value}
			<div class="sticky bottom-20 mt-24 flex items-center gap-2 md:bottom-24">
				{#if $currentIndex < $answers.length - 1}
					<Button
						size="lg"
						on:click={async () => {
							const [status] = await updateAnswer(content.id, value);
							if (status) {
								// Update conditional answers after this answer changes
								if ($application?.expand?.response) {
									await updateConditionalAnswers($application.expand.response);
								}

								// Find the next question that should be shown
								let nextIndex = $currentIndex + 1;
								while (nextIndex < $answers.length) {
									const nextQuestion = $answers[nextIndex]?.expand?.question;
									if (nextQuestion) {
										const shouldShow = nextQuestion.conditional
											? shouldShowConditionalQuestion(nextQuestion, $answers)
											: true;
										if (shouldShow) {
											$currentIndex = nextIndex;
											break;
										}
									}
									nextIndex++;
								}
								if (nextIndex >= $answers.length) {
									$currentIndex = $answers.length - 1;
								}
							} else {
								toast.error(m.error_update_answer());
							}
						}}
						disabled={checkValid && !checkValid()[0]}
					>
						{m.button_continue()}
					</Button>
				{:else}
					<form
						method="post"
						action="?/submit"
						class="flex-1 md:flex-none"
						on:submit={async (event) => {
							const [status] = await updateAnswer(content.id, value);
							if (status) {
								// Update conditional answers before submitting
								if ($application?.expand?.response) {
									await updateConditionalAnswers($application.expand.response);
								}

								isLoading = true;
								toast.loading(m.toast_submitting_application(), {
									duration: Number.POSITIVE_INFINITY
								});
							} else {
								toast.error('Failed to update answer');
								event.preventDefault();
							}
						}}
					>
						<Button
							size="lg"
							disabled={isLoading ||
								(checkValid &&
									!checkValid()[0] &&
									!(
										$currentIndex === $answers.length - 1 &&
										$application?.status === 'editsRequested'
									))}
							type="submit"
						>
							{m.button_submit_application()}
						</Button>
					</form>
				{/if}

				<Tooltip.Root openDelay={0}>
					<Tooltip.Trigger asChild let:builder>
						<Button builders={[builder]} variant="outline" size="icon" class="h-7 w-7">
							<Info size="14" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>{m.tooltip_question_saved()}</Tooltip.Content>
				</Tooltip.Root>
			</div>
		{/key}
	{/if}

	<div class="h-96"></div>
{:else}
	{m.invalid_question()}
{/if}
