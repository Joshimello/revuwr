<script lang="ts">
	import { applyAction, deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { m } from '$lib/paraglide/messages.js';
	import { Info } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { isAnswerEffectivelyValid, validateAnswer } from './answer-validation';
	import { getNextQuestionIndex } from './navigation';
	import questionTypes from './question-types';
	import { answers, application, currentIndex, event, isReadOnly } from './stores';
	import { canSubmitApplication } from './submission-state';
	import type { ExpandedResponse } from './types';

	export let content: ExpandedResponse;
	const question = content.expand?.question;

	let value: unknown = content.response;

	let isLoading = false;
	let isUpdating = false;

	// Check if all other questions are valid (including conditional logic).
	// The current answer uses live field validation and is persisted immediately before submission.
	$: allOtherAnswersValid = $answers.every((answer, index) => {
		if (index === $currentIndex) return true;

		return isAnswerEffectivelyValid(answer, $answers);
	});

	$: validationResult = validateAnswer(question, value);

	// Computed validation for current answer
	$: isCurrentAnswerValid = validationResult.valid;

	$: canSubmit = canSubmitApplication({
		applicationStatus: $application?.status,
		eventStatus: $event?.status,
		currentIndex: $currentIndex,
		answerCount: $answers.length,
		currentAnswerValid: isCurrentAnswerValid,
		allOtherAnswersValid,
		isReadOnly: $isReadOnly,
		isLoading,
		isUpdating
	});

	// Track current question ID to detect navigation
	let currentQuestionId = content.id;

	// Reset value only when navigating to a different question
	$: if (content.id !== currentQuestionId) {
		currentQuestionId = content.id;
		value = content.response;
	}

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
				if (!validationResult.valid) {
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
				} else if (canSubmit) {
					// Submit application only if all questions are valid
					handleSubmit();
				}
			}
		}
	}

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

					$currentIndex = getNextQuestionIndex(
						$answers,
						$currentIndex,
						$application?.status
					);
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

		try {
			// The final question is read-only during an edit request, so only persist it for drafts.
			const updateForm = document.getElementById('updateAnswerForm') as HTMLFormElement;
			if (updateForm && !$isReadOnly) {
				const formData = new FormData(updateForm);
				const response = await fetch(updateForm.action, {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					toast.error('Failed to update answer');
					return;
				}

				await invalidateAll();
			}

			isLoading = true;
			toast.loading(m.toast_submitting_application(), {
				duration: Number.POSITIVE_INFINITY
			});

			const submitForm = document.getElementById('submitForm') as HTMLFormElement;
			if (!submitForm) return;

			const submitResponse = await fetch(submitForm.action, {
				method: 'POST',
				body: new FormData(submitForm),
				headers: {
					'x-sveltekit-action': 'true'
				}
			});
			const result = deserialize(await submitResponse.text());

			if (result.type === 'failure') {
				const resultData = result.data as {
					message?: string;
					invalidAnswers?: { answerId: string }[];
				};
				const firstInvalidAnswerId = resultData.invalidAnswers?.[0]?.answerId;
				const firstInvalidIndex = firstInvalidAnswerId
					? $answers.findIndex((answer) => answer.id === firstInvalidAnswerId)
					: -1;

				if (firstInvalidIndex >= 0) {
					$currentIndex = firstInvalidIndex;
				}
				toast.dismiss();
				toast.error(resultData.message ?? 'Application could not be submitted');
				isLoading = false;
			} else {
				await applyAction(result);
			}
		} catch {
			toast.dismiss();
			toast.error('Application could not be submitted');
			isLoading = false;
		} finally {
			isUpdating = false;
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

			{#if !validationResult.valid}
				<span class="text-sm text-destructive">
					{validationResult.message}
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
			<div class="mb-20 mt-6 flex items-center gap-2">
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
						disabled={!canSubmit}
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
