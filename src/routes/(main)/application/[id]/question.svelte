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

	// Check if all questions are valid (including conditional logic)
	$: allQuestionsValid = $answers.every((answer) => {
		const answerQuestion = answer.expand?.question;
		if (!answerQuestion) return false;

		// If conditional and shouldn't be shown, consider it valid
		if (answerQuestion.conditional && !shouldShowConditionalQuestion(answerQuestion, $answers)) {
			return true;
		}

		return answer.valid;
	});

	onMount(() => {
		console.log($application);
		console.log(question);
		console.log(content);
	});

	function handleKeydown(event: KeyboardEvent) {
		if (
			event.key === 'Enter' &&
			!event.shiftKey &&
			!event.ctrlKey &&
			!event.altKey &&
			!event.metaKey
		) {
			// Check if we're not in a textarea or other multiline input
			const target = event.target as HTMLElement;
			if (target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
				event.preventDefault();

				// Check if validation passes
				if (checkValid && !checkValid()[0]) {
					return;
				}

				// If read-only, don't submit
				if (
					$isReadOnly &&
					!($currentIndex === $answers.length - 1 && $application?.status === 'editsRequested')
				) {
					return;
				}

				// Trigger the appropriate button click
				if ($currentIndex < $answers.length - 1) {
					// Continue to next question
					handleContinue();
				} else if (allQuestionsValid) {
					// Submit application only if all questions are valid
					handleSubmit();
				}
			}
		}
	}

	async function handleContinue() {
		const [status] = await updateAnswer(content.id, value);
		if (status) {
			// Update conditional answers after this answer changes
			if ($application?.expand?.response) {
				await updateConditionalAnswers($application.expand.response);
			}

			// If application status is editsRequested, find next question with status 'edit'
			if ($application?.status === 'editsRequested') {
				let nextIndex = $currentIndex + 1;
				while (nextIndex < $answers.length) {
					const nextAnswer = $answers[nextIndex];
					const nextQuestion = nextAnswer?.expand?.question;
					if (nextQuestion) {
						const shouldShow = nextQuestion.conditional
							? shouldShowConditionalQuestion(nextQuestion, $answers)
							: true;
						if (shouldShow && nextAnswer.status === 'edit') {
							$currentIndex = nextIndex;
							return;
						}
					}
					nextIndex++;
				}
				// No more edit questions found, jump to end
				$currentIndex = $answers.length - 1;
			} else {
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
			}
		} else {
			toast.error(m.error_update_answer());
		}
	}

	async function handleSubmit() {
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

			// Submit the form
			const form = document.querySelector('form[action="?/submit"]') as HTMLFormElement;
			if (form) {
				form.submit();
			}
		} else {
			toast.error('Failed to update answer');
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />
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
			<!-- eslint-disable-next-line -->
			{@html question.title}
		</span>
		<span class="text-justify text-sm text-muted-foreground">
			<!-- eslint-disable-next-line -->
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
			<div class="mt-24 flex items-center gap-2 md:bottom-24">
				{#if $currentIndex < $answers.length - 1}
					<Button size="lg" on:click={handleContinue} disabled={checkValid && !checkValid()[0]}>
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
								!allQuestionsValid ||
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
