<script lang="ts">
	import Status from '$lib/components/status.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages.js';
	import { ChevronLeft as ChevronLeftIcon, ChevronRight, Info } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { ChevronLeft } from 'svelte-radix';
	import { shouldShowConditionalQuestion } from './conditional-utils';
	import { updateConditionalAnswers } from './methods';
	import questionTypes from './question-types';
	import Question from './question.svelte';
	import { answers, application, currentIndex, event, isReadOnly } from './stores';
	import type { ExpandedApplication, ExpandedResponse } from './types';

	interface PageData {
		application: ExpandedApplication;
	}

	export let data: PageData;

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
		// Since we're only showing accessible questions in the navigation,
		// we can jump directly to any question that's displayed
		$currentIndex = index;
	}

	// Sliding window configuration
	const WINDOW_SIZE = 7; // Show 7 circles total (current + 3 before + 3 after)
	let windowStart = 0;

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

	// Debug $answers store updates
	$: {
		console.log('DEBUG: $answers store changed', {
			answersLength: $answers?.length || 0,
			hasAnswers: !!$answers,
			application: !!$application,
			applicationResponses: $application?.expand?.response?.length || 0
		});
	}

	// First filter out conditional questions that shouldn't be shown
	$: accessibleAnswers = (() => {
		// Defensive checks to prevent empty states
		if (!$answers || $answers.length === 0) {
			console.log('DEBUG: No answers available', { answers: $answers });
			return [];
		}

		try {
			console.log('DEBUG: Starting to filter answers', {
				totalAnswers: $answers.length,
				answers: $answers.map((a, i) => ({
					index: i,
					hasQuestion: !!a.expand?.question,
					questionType: a.expand?.question?.type,
					conditional: a.expand?.question?.conditional
				}))
			});

			const filtered = $answers
				.map((answer, index) => ({ answer, index }))
				.filter(({ answer, index }) => {
					const question = answer.expand?.question;
					if (!question) {
						console.log(`DEBUG: Question ${index} has no question data`);
						return false;
					}

					// For conditional questions, check if they should be shown
					if (question.conditional) {
						try {
							const shouldShow = shouldShowConditionalQuestion(question, $answers);
							console.log(
								`DEBUG: Conditional question ${index} (${question.type}): shouldShow = ${shouldShow}`
							);
							return shouldShow;
						} catch (error) {
							console.log(`DEBUG: Error checking conditional question ${index}:`, error);
							return false;
						}
					}

					console.log(`DEBUG: Non-conditional question ${index} (${question.type}): showing`);
					return true;
				});

			console.log('DEBUG: Filtered results', {
				originalCount: $answers.length,
				filteredCount: filtered.length,
				filteredIndices: filtered.map((f) => f.index)
			});

			return filtered;
		} catch (error) {
			console.error('Error filtering accessible answers:', error);
			return [];
		}
	})();

	// Calculate window position with proper defensive checks
	$: {
		if (accessibleAnswers && accessibleAnswers.length > 0 && $currentIndex >= 0) {
			const halfWindow = Math.floor(WINDOW_SIZE / 2);
			const currentPositionInFiltered = accessibleAnswers.findIndex(
				({ index }) => index === $currentIndex
			);

			if (currentPositionInFiltered >= 0) {
				const calculatedStart = Math.max(
					0,
					Math.min(currentPositionInFiltered - halfWindow, accessibleAnswers.length - WINDOW_SIZE)
				);
				windowStart = Math.max(0, calculatedStart);
			} else {
				windowStart = 0;
			}
		} else {
			windowStart = 0;
		}
	}

	// Apply windowing to filtered questions with defensive checks
	$: visibleQuestions =
		accessibleAnswers && accessibleAnswers.length > 0
			? accessibleAnswers.slice(windowStart, windowStart + WINDOW_SIZE)
			: [];

	// Group visible questions by page
	$: questionGroups =
		visibleQuestions && visibleQuestions.length > 0
			? visibleQuestions.reduce(
					(groups, { answer, index }) => {
						const question = answer.expand?.question;
						const page = question?.page ?? 0;

						if (!groups[page]) {
							groups[page] = [];
						}
						groups[page].push({ answer, index });
						return groups;
					},
					{} as Record<number, Array<{ answer: ExpandedResponse; index: number }>>
				)
			: {};

	// Reactive statement to update stores when data changes
	$: if (data.application) {
		console.log('DEBUG: Setting application store', {
			hasApplication: !!data.application,
			hasResponses: !!data.application.expand?.response,
			responseCount: data.application.expand?.response?.length || 0
		});
		$application = data.application;
	}

	onMount(() => {
		// Set initial question index
		setInitialQuestionIndex();
	});

	// Process conditional questions separately after data is loaded
	$: if ($application?.expand?.response && $answers.length > 0) {
		// Process conditional questions asynchronously without blocking UI
		updateConditionalAnswers($application.expand.response).catch(console.error);
	}

	// Reactive statement to handle question navigation when data updates
	$: if ($application && $answers.length > 0) {
		// Only set initial index if currentIndex is invalid or unset
		if ($currentIndex < 0 || $currentIndex >= $answers.length) {
			setInitialQuestionIndex();
		}
	}

	function setInitialQuestionIndex() {
		if (!$application || $answers.length === 0) return;

		// If application status is editsRequested, find first question with status 'edit'
		if ($application?.status === 'editsRequested') {
			const firstEditIndex = $answers.findIndex((answer) => {
				const question = answer.expand?.question;
				if (!question) return false;

				// Check if question should be shown and has edit status
				const shouldShow = question.conditional
					? shouldShowConditionalQuestion(question, $answers)
					: true;

				return shouldShow && answer.status === 'edit';
			});

			$currentIndex = firstEditIndex === -1 ? $answers.length - 1 : firstEditIndex;
		} else {
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
		}
	}
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
					<Alert.Description>
						<!-- eslint-disable-next-line -->
						{@html m.app_readonly_description()}
					</Alert.Description>
				</Alert.Root>
			{/if}

			<!-- Mobile: Status and progress on top row -->
			<div class="flex items-center justify-center gap-4 sm:hidden">
				<Status type={$application.status} />
				{#if accessibleAnswers && accessibleAnswers.length > WINDOW_SIZE}
					<div class="text-xs text-muted-foreground">
						{windowStart + 1}-{Math.min(windowStart + WINDOW_SIZE, accessibleAnswers.length)} of {accessibleAnswers.length}
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

				<!-- Question circles grouped by page -->
				<div class="flex gap-3">
					{#if Object.keys(questionGroups).length > 0}
						{#each Object.entries(questionGroups) as [page, questions]}
							<div class="flex flex-col items-center gap-1">
								<div class="text-xs text-muted-foreground">Page {page}</div>
								<div class="flex gap-1 rounded border border-muted-foreground/20 bg-muted/20 p-1">
									{#each questions as { answer, index }}
										{@const valid = isQuestionValid(index)}
										{@const current = index === $currentIndex}
										{@const status = answer.status}
										{@const question = answer.expand?.question}
										{@const questionType = question ? questionTypes[question.type] : null}
										{@const IconComponent = questionType?.icon}

										<button
											class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-200
											{current
												? 'scale-110 border-primary bg-primary text-primary-foreground shadow-md'
												: valid
													? status === 'edit'
														? 'border-orange-500 bg-orange-500 text-white hover:scale-105'
														: 'border-green-500 bg-green-500 text-white hover:scale-105'
													: 'border-muted-foreground bg-background hover:scale-105 hover:border-primary'}"
											on:click={() => jumpToQuestion(index)}
											title="{questionType?.label || 'Question'} {index + 1} (Page {page}){valid
												? ' - Valid'
												: ' - Invalid'}"
										>
											{#if IconComponent}
												<svelte:component this={IconComponent} class="h-4 w-4" />
											{:else}
												{index + 1}
											{/if}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					{:else if accessibleAnswers.length === 0 && $answers && $answers.length > 0}
						<!-- Loading state - show placeholder circles -->
						<div class="flex gap-1">
							<div class="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
							<div class="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
							<div class="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
						</div>
					{/if}
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
				{#if accessibleAnswers && accessibleAnswers.length > WINDOW_SIZE}
					<div class="ml-2 text-xs text-muted-foreground">
						{windowStart + 1}-{Math.min(windowStart + WINDOW_SIZE, accessibleAnswers.length)} of {accessibleAnswers.length}
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

				<!-- Question circles grouped by page -->
				<div class="flex gap-2">
					{#if Object.keys(questionGroups).length > 0}
						{#each Object.entries(questionGroups) as [page, questions]}
							<div class="flex flex-col items-center gap-1">
								<div class="text-xs text-muted-foreground">Page {page}</div>
								<div class="flex gap-1 rounded border border-muted-foreground/20 bg-muted/20 p-1">
									{#each questions as { answer, index }}
										{@const valid = isQuestionValid(index)}
										{@const current = index === $currentIndex}
										{@const status = answer.status}
										{@const question = answer.expand?.question}
										{@const questionType = question ? questionTypes[question.type] : null}
										{@const IconComponent = questionType?.icon}

										<button
											class="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-200
											{current
												? 'scale-110 border-primary bg-primary text-primary-foreground shadow-md'
												: valid
													? status === 'edit'
														? 'border-orange-500 bg-orange-500 text-white hover:scale-105'
														: 'border-green-500 bg-green-500 text-white hover:scale-105'
													: 'border-muted-foreground bg-background hover:scale-105 hover:border-primary'}"
											on:click={() => jumpToQuestion(index)}
											title="{questionType?.label || 'Question'} {index + 1} (Page {page}){valid
												? ' - Valid'
												: ' - Invalid'}"
										>
											{#if IconComponent}
												<svelte:component this={IconComponent} class="h-4 w-4" />
											{:else}
												{index + 1}
											{/if}
										</button>
									{/each}
								</div>
							</div>
						{/each}
					{:else if accessibleAnswers.length === 0 && $answers && $answers.length > 0}
						<!-- Loading state - show placeholder circles -->
						<div class="flex gap-1">
							<div class="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
							<div class="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
							<div class="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
						</div>
					{/if}
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
	<div class="mt-24 flex items-center justify-center">
		<div class="text-center">
			<h3 class="text-2xl font-bold tracking-tight">Not Found</h3>
		</div>
	</div>
{/if}
