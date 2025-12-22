<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { m } from '$lib/paraglide/messages.js';
	import { Info } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { shouldShowConditionalQuestion } from './conditional-utils';
	import { updateConditionalAnswers } from './methods';
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

	// Create a more robust reactive validation system
	let validationResult: [boolean, string] = [false, ''];

	// Update validation whenever value or checkValid changes
	$: {
		if (checkValid && value !== undefined) {
			try {
				validationResult = checkValid();
			} catch {
				validationResult = [false, 'Validation error'];
			}
		} else {
			validationResult = [false, ''];
		}
	}

	// Computed validation for current answer
	$: isCurrentAnswerValid = validationResult[0];

	// Track current question ID to detect navigation
	let currentQuestionId = content.id;

	// Reset value only when navigating to a different question
	$: if (content.id !== currentQuestionId) {
		currentQuestionId = content.id;
		value = content.response;
	}

	onMount(() => {
		// Component mounted - validation system is ready
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

	let isUpdating = false;

	async function handleContinue() {
		isUpdating = true;

		// Submit the update form
		const form = document.getElementById('updateAnswerForm') as HTMLFormElement;
		if (form) {
			const formData = new FormData(form);

			try {
				const response = await fetch(form.action, {
					method: 'POST',
					body: formData
				});

				if (response.ok) {
					// Invalidate all data to refresh stores with latest server data
					await invalidateAll();

					// Update conditional answers after this answer changes
					if ($application?.expand?.response) {
						await updateConditionalAnswers($application.expand.response);
					}

					// Navigate to next sequential question that should be shown
					let nextIndex = $currentIndex + 1;
					while (nextIndex < $answers.length) {
						const nextAnswer = $answers[nextIndex];
						const nextQuestion = nextAnswer?.expand?.question;
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

					// If no more questions to show, go to the last question
					if (nextIndex >= $answers.length) {
						$currentIndex = $answers.length - 1;
					}
				} else {
					toast.error('Failed to update answer');
				}
			} catch (error) {
				toast.error('Failed to update answer');
			}
		}

		isUpdating = false;
	}

	async function handleSubmit() {
		isUpdating = true;

		// First update the answer
		const updateForm = document.getElementById('updateAnswerForm') as HTMLFormElement;
		if (updateForm) {
			const formData = new FormData(updateForm);

			try {
				const response = await fetch(updateForm.action, {
					method: 'POST',
					body: formData
				});

				if (response.ok) {
					// Invalidate all data to refresh stores with latest server data
					await invalidateAll();

					// Update conditional answers before submitting
					if ($application?.expand?.response) {
						await updateConditionalAnswers($application.expand.response);
					}

					isLoading = true;
					toast.loading(m.toast_submitting_application(), {
						duration: Number.POSITIVE_INFINITY
					});

					// Submit the application
					const submitForm = document.getElementById('submitForm') as HTMLFormElement;
					if (submitForm) {
						submitForm.submit();
					}
				} else {
					toast.error('Failed to update answer');
				}
			} catch (error) {
				toast.error('Failed to update answer');
			}
		}

		isUpdating = false;
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
					<Button
						on:click={handleContinue}
						disabled={!isCurrentAnswerValid || $isReadOnly || isUpdating}
						class="flex-1 md:flex-none"
					>
						{isUpdating ? 'Saving...' : m.button_continue()}
					</Button>
				{:else}
					<Button
						on:click={handleSubmit}
						disabled={!isCurrentAnswerValid || isLoading || $isReadOnly || isUpdating}
						class="flex-1 md:flex-none"
					>
						{isUpdating ? 'Saving...' : isLoading ? 'Submitting...' : m.button_submit_application()}
					</Button>
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

	<!-- Hidden form for updating answers -->
	<form id="updateAnswerForm" method="post" action="?/updateAnswer" style="display: none;">
		<input type="hidden" name="answerId" value={content.id} />
		<input type="hidden" name="answer" value={JSON.stringify(value)} />
	</form>

	<!-- Hidden form for submitting application -->
	<form id="submitForm" method="post" action="?/submit" style="display: none;"></form>
{:else}
	{m.invalid_question()}
{/if}
