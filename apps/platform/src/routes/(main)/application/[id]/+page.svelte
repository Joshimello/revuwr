<script lang="ts">
	import { page } from '$app/stores';
	import Status from '$lib/components/status.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages.js';
	import { ChevronLeft as ChevronLeftIcon, ChevronRight, Info } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { ChevronLeft } from 'svelte-radix';
	import { shouldShowConditionalQuestion } from './conditional-utils';
	import { getApplication, updateConditionalAnswers } from './methods';
	import Question from './question.svelte';
	import { answers, application, currentIndex, event, isReadOnly } from './stores';

	function isQuestionAccessible(index: number): boolean {
		const question = $answers[index]?.expand?.question;
		if (!question) return false;

		// Check if conditional question should be shown
		if (question.conditional) {
			return shouldShowConditionalQuestion(question, $answers);
		}

		return true;
	}

	function isQuestionValid(index: number): boolean {
		const answer = $answers[index];
		const question = answer?.expand?.question;

		if (!question) return false;

		// If conditional and shouldn't be shown, mark as valid
		if (question.conditional && !shouldShowConditionalQuestion(question, $answers)) {
			return true;
		}

		return answer.valid;
	}

	function jumpToQuestion(index: number): void {
		if (isQuestionAccessible(index)) {
			$currentIndex = index;
		}
	}

	// Sliding window configuration
	const WINDOW_SIZE = 7; // Show 7 circles total (current + 3 before + 3 after)
	let windowStart = 0;

	$: {
		// Auto-adjust window when current question changes
		const halfWindow = Math.floor(WINDOW_SIZE / 2);
		windowStart = Math.max(0, Math.min($currentIndex - halfWindow, $answers.length - WINDOW_SIZE));
		if (windowStart < 0) windowStart = 0;
	}

	function navigateQuestion(direction: 'left' | 'right'): void {
		if (direction === 'left') {
			// Find previous valid question to show
			let prevIndex = $currentIndex - 1;
			while (prevIndex >= 0) {
				const prevQuestion = $answers[prevIndex]?.expand?.question;
				if (prevQuestion) {
					const shouldShow = prevQuestion.conditional
						? shouldShowConditionalQuestion(prevQuestion, $answers)
						: true;
					if (shouldShow) {
						$currentIndex = prevIndex;
						break;
					}
				}
				prevIndex--;
			}
			if (prevIndex < 0) {
				$currentIndex = 0;
			}
		} else {
			// Find next valid question to show
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
	}

	$: visibleQuestions = $answers.slice(windowStart, windowStart + WINDOW_SIZE);
	$: canSlideLeft = windowStart > 0;
	$: canSlideRight = windowStart + WINDOW_SIZE < $answers.length;

	onMount(async () => {
		$application = (await getApplication($page.params.id)) ?? null;

		// Process conditional questions after loading
		if ($application?.expand?.response) {
			await updateConditionalAnswers($application.expand.response);
		}

		// Find the first question that should be shown and is invalid
		const firstInvalidIndex = $answers.findIndex((answer) => {
			const question = answer.expand?.question;
			if (!question) return false;

			// If question is conditional, check if it should be shown
			if (question.conditional) {
				const shouldShow = shouldShowConditionalQuestion(question, $answers);
				return shouldShow && !answer.valid;
			}

			// For non-conditional questions, just check validity
			return !answer.valid;
		});

		$currentIndex = firstInvalidIndex === -1 ? $answers.length - 1 : firstInvalidIndex;
	});
</script>

<div class="flex items-center gap-4">
	<Button variant="outline" size="icon" class="h-7 w-7" href="/">
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">{m.button_back()}</span>
	</Button>
</div>

{#if $application && $event}
	<div class="mt-24 md:flex">
		{#if $answers[$currentIndex]?.expand?.question}
			{@const question = $answers[$currentIndex]?.expand?.question}
			{@const shouldShow = question?.conditional
				? shouldShowConditionalQuestion(question, $answers)
				: true}

			{#if shouldShow}
				{#if question?.type == 'budget'}
					<div class="flex w-full flex-col gap-4">
						{#key $currentIndex}
							<Question content={$answers[$currentIndex]} />
						{/key}
					</div>
				{:else}
					<div class="flex w-full flex-col gap-4 md:max-w-xl">
						{#key $currentIndex}
							<Question content={$answers[$currentIndex]} />
						{/key}
					</div>
				{/if}
			{:else}
				<div class="flex w-full flex-col gap-4 md:max-w-xl">
					<div class="p-8 text-center">
						<p class="text-muted-foreground">
							This question is hidden based on your previous answers.
						</p>
						<p class="mt-2 text-sm text-muted-foreground">
							Automatically marked as valid and skipped.
						</p>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<div class="fixed bottom-0 left-0 right-0 bg-muted">
		<div class="mx-auto flex max-w-4xl flex-col gap-2 px-2 py-2 md:py-3">
			{#if $isReadOnly}
				<Alert.Root>
					<Info class="h-4 w-4" />
					<Alert.Title class="font-bold">{m.app_readonly_title()}</Alert.Title>
					<Alert.Description>{@html m.app_readonly_description()}</Alert.Description>
				</Alert.Root>
			{/if}

			<!-- Mobile: Status and progress on top row -->
			<div class="flex items-center justify-center gap-4 sm:hidden">
				<Status type={$application.status} />
				{#if $answers.length > WINDOW_SIZE}
					<div class="text-xs text-muted-foreground">
						{windowStart + 1}-{Math.min(windowStart + WINDOW_SIZE, $answers.length)} of {$answers.length}
					</div>
				{/if}
			</div>

			<!-- Desktop: All in one row -->
			<div class="hidden items-center justify-center gap-3 sm:flex">
				<!-- Status moved to left -->
				<Status type={$application.status} />

				<!-- Previous question -->
				<Button
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
					on:click={() => navigateQuestion('left')}
					disabled={$currentIndex === 0}
				>
					<ChevronLeftIcon class="h-4 w-4" />
				</Button>

				<!-- Question circles -->
				<div class="flex gap-2">
					{#each visibleQuestions as answer, relativeIndex}
						{@const index = windowStart + relativeIndex}
						{@const accessible = isQuestionAccessible(index)}
						{@const valid = isQuestionValid(index)}
						{@const current = index === $currentIndex}

						<button
							class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-200
								{current
								? 'scale-110 border-primary bg-primary text-primary-foreground shadow-md'
								: accessible
									? valid
										? 'border-green-500 bg-green-500 text-white hover:scale-105'
										: 'border-muted-foreground bg-background hover:scale-105 hover:border-primary'
									: 'cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50'}"
							on:click={() => jumpToQuestion(index)}
							disabled={!accessible}
							title="Question {index + 1}{accessible
								? valid
									? ' - Valid'
									: ' - Invalid'
								: ' - Hidden'}"
						>
							{index + 1}
						</button>
					{/each}
				</div>

				<!-- Next question -->
				<Button
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
					on:click={() => navigateQuestion('right')}
					disabled={$currentIndex === $answers.length - 1}
				>
					<ChevronRight class="h-4 w-4" />
				</Button>

				<!-- Progress indicator -->
				{#if $answers.length > WINDOW_SIZE}
					<div class="ml-2 text-xs text-muted-foreground">
						{windowStart + 1}-{Math.min(windowStart + WINDOW_SIZE, $answers.length)} of {$answers.length}
					</div>
				{/if}
			</div>

			<!-- Mobile: Navigation circles row -->
			<div class="flex items-center justify-center gap-2 sm:hidden">
				<!-- Previous question -->
				<Button
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
					on:click={() => navigateQuestion('left')}
					disabled={$currentIndex === 0}
				>
					<ChevronLeftIcon class="h-4 w-4" />
				</Button>

				<!-- Question circles -->
				<div class="flex gap-2">
					{#each visibleQuestions as answer, relativeIndex}
						{@const index = windowStart + relativeIndex}
						{@const accessible = isQuestionAccessible(index)}
						{@const valid = isQuestionValid(index)}
						{@const current = index === $currentIndex}

						<button
							class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-200
								{current
								? 'scale-110 border-primary bg-primary text-primary-foreground shadow-md'
								: accessible
									? valid
										? 'border-green-500 bg-green-500 text-white hover:scale-105'
										: 'border-muted-foreground bg-background hover:scale-105 hover:border-primary'
									: 'cursor-not-allowed border-muted bg-muted text-muted-foreground opacity-50'}"
							on:click={() => jumpToQuestion(index)}
							disabled={!accessible}
							title="Question {index + 1}{accessible
								? valid
									? ' - Valid'
									: ' - Invalid'
								: ' - Hidden'}"
						>
							{index + 1}
						</button>
					{/each}
				</div>

				<!-- Next question -->
				<Button
					variant="ghost"
					size="sm"
					class="h-8 w-8 p-0"
					on:click={() => navigateQuestion('right')}
					disabled={$currentIndex === $answers.length - 1}
				>
					<ChevronRight class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
{:else}
	<div>{m.loading_or_not_found()}</div>
{/if}
