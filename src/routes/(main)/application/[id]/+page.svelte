<script lang="ts">
	import Status from '$lib/components/status.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages.js';
	import { ChevronDown, ChevronLeft as ChevronLeftIcon, ChevronRight, Info, List } from 'lucide-svelte';
	import * as Popover from '$lib/components/ui/popover';
	import * as Sheet from '$lib/components/ui/sheet';
	import { onMount } from 'svelte';
	import { shouldShowConditionalQuestion } from './conditional-utils';
	import { updateConditionalAnswers } from './methods';
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
		$currentIndex = index;
	}

	function navigateQuestion(direction: 'left' | 'right'): void {
		if (direction === 'left') {
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

	$: currentPage = $answers[$currentIndex]?.expand?.question?.page ?? null;

	// Dots for current section
	$: sectionDots = $answers
		.map((answer, index) => ({ answer, index }))
		.filter(({ answer }) => answer.expand?.question?.page === currentPage);

	$: sections = (() => {
		const seen = new Set<number>();
		const result: Array<{ page: number; firstIndex: number }> = [];
		for (let i = 0; i < $answers.length; i++) {
			const page = $answers[i]?.expand?.question?.page;
			if (page !== undefined && page !== null && !seen.has(page)) {
				seen.add(page);
				result.push({ page, firstIndex: i });
			}
		}
		return result.sort((a, b) => a.page - b.page);
	})();

	$: questionsBySection = sections.map(({ page, firstIndex }) => ({
		page,
		firstIndex,
		questions: $answers
			.map((answer, index) => ({ answer, index }))
			.filter(({ answer }) => answer.expand?.question?.page === page)
	}));

	$: isAtFirst = $currentIndex <= 0;
	$: isAtLast = $currentIndex >= $answers.length - 1;

	function dotClass(answer: ExpandedResponse, index: number, currentIdx: number): string {
		const isCurrent = index === currentIdx;
		const base = 'h-2 w-2 rounded-full transition-colors duration-150 cursor-pointer';
		if (isCurrent) return `${base} bg-primary outline outline-2 outline-offset-1 outline-primary`;
		if (answer.status === 'edit') return `${base} bg-orange-400 hover:bg-orange-500`;
		if (answer.valid) return `${base} bg-green-500 hover:bg-green-600`;
		const r = answer.response;
		const hasResponse =
			r !== null &&
			r !== undefined &&
			r !== '' &&
			!(typeof r === 'object' && Object.keys(r as Record<string, unknown>).length === 0);
		if (hasResponse) return `${base} bg-red-500 hover:bg-red-600`;
		return `${base} border border-muted-foreground/40 bg-background hover:border-muted-foreground`;
	}

	// Reactive statement to update stores when data changes
	$: if (data.application) {
		$application = data.application;
	}

	onMount(() => {
		setInitialQuestionIndex();
	});

	// Process conditional questions separately after data is loaded
	$: if ($application?.expand?.response && $answers.length > 0) {
		updateConditionalAnswers($application.expand.response).catch(console.error);
	}

	// Reactive statement to handle question navigation when data updates
	$: if ($application && $answers.length > 0) {
		if ($currentIndex < 0 || $currentIndex >= $answers.length) {
			setInitialQuestionIndex();
		}
	}

	function setInitialQuestionIndex() {
		if (!$application || $answers.length === 0) return;

		if ($application?.status === 'editsRequested') {
			const firstEditIndex = $answers.findIndex((answer) => {
				const question = answer.expand?.question;
				if (!question) return false;

				const shouldShow = question.conditional
					? shouldShowConditionalQuestion(question, $answers)
					: true;

				return shouldShow && answer.status === 'edit';
			});

			$currentIndex = firstEditIndex === -1 ? $answers.length - 1 : firstEditIndex;
		} else {
			const firstInvalidIndex = $answers.findIndex((answer) => {
				const question = answer.expand?.question;
				if (!question) return false;

				if (question.conditional) {
					const shouldShow = shouldShowConditionalQuestion(question, $answers);
					return shouldShow && !answer.valid;
				}

				return !answer.valid;
			});

			$currentIndex = firstInvalidIndex === -1 ? $answers.length - 1 : firstInvalidIndex;
		}
	}
</script>

<div class="flex items-center gap-4">
	<Button variant="outline" size="icon" class="h-7 w-7" href="/">
		<ChevronLeftIcon class="h-4 w-4" />
		<span class="sr-only">{m.button_back()}</span>
	</Button>
</div>

{#if $application && $event}
	<div class="mt-6 md:flex">
		{#if $answers[$currentIndex]?.expand?.question}
			{@const question = $answers[$currentIndex]?.expand?.question}
			{@const shouldShow = question?.conditional
				? shouldShowConditionalQuestion(question, $answers)
				: true}

			{#if shouldShow}
				<div class="flex w-full flex-col gap-4">
					{#key $currentIndex}
						<Question content={$answers[$currentIndex]} />
					{/key}
				</div>
			{:else}
				<div class="flex w-full flex-col gap-4">
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

	<!-- Bottom navigation bar -->
	<div class="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur">
		<div class="mx-auto max-w-4xl px-3 py-2">
			{#if $isReadOnly}
				<Alert.Root class="mb-2">
					<Info class="h-4 w-4" />
					<Alert.Title class="font-bold">{m.app_readonly_title()}</Alert.Title>
					<Alert.Description>
						<!-- eslint-disable-next-line -->
						{@html m.app_readonly_description()}
					</Alert.Description>
				</Alert.Root>
			{/if}

			<!-- Nav row -->
			<div class="flex items-center gap-2">
				<!-- Left: status -->
				<div class="flex flex-1 justify-start">
					<Status type={$application.status} />
				</div>

				<!-- Center: prev / counter / next -->
				<div class="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						class="h-8 w-8 p-0"
						on:click={() => navigateQuestion('left')}
						disabled={isAtFirst}
					>
						<ChevronLeftIcon class="h-4 w-4" />
					</Button>

					<div class="flex items-center text-sm tabular-nums text-muted-foreground">
						<span>Q {$currentIndex + 1} / {$answers.length}</span>
						{#if currentPage !== null}
							<span class="mx-1">·</span>
							{#if sections.length > 1}
								<Popover.Root>
									<Popover.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											variant="ghost"
											size="sm"
											class="h-6 gap-0.5 px-1 text-sm font-normal text-muted-foreground"
										>
											Section {currentPage}<ChevronDown class="h-3 w-3" />
										</Button>
									</Popover.Trigger>
									<Popover.Content class="w-36 p-1" align="center" side="top">
										{#each sections as { page, firstIndex }}
											<button
												class="flex w-full rounded px-2 py-1.5 text-sm transition-colors {page === currentPage
													? 'bg-accent font-medium'
													: 'hover:bg-accent'}"
												on:click={() => jumpToQuestion(firstIndex)}
											>
												Section {page}
											</button>
										{/each}
									</Popover.Content>
								</Popover.Root>
							{:else}
								<span>Section {currentPage}</span>
							{/if}
						{/if}
					</div>

					<Button
						variant="ghost"
						size="sm"
						class="h-8 w-8 p-0"
						on:click={() => navigateQuestion('right')}
						disabled={isAtLast}
					>
						<ChevronRight class="h-4 w-4" />
					</Button>
				</div>

				<!-- Right: all-questions sheet trigger -->
				<div class="flex flex-1 justify-end">
					<Sheet.Root>
						<Sheet.Trigger asChild let:builder>
							<Button builders={[builder]} variant="ghost" size="icon" class="h-8 w-8">
								<List class="h-4 w-4" />
								<span class="sr-only">All questions</span>
							</Button>
						</Sheet.Trigger>
						<Sheet.Content side="right" class="flex flex-col gap-0 p-0">
							<Sheet.Header class="border-b px-4 py-3">
								<Sheet.Title>All Questions</Sheet.Title>
							</Sheet.Header>
							<div class="flex-1 overflow-y-auto">
								{#each questionsBySection as { page, questions } (page)}
									<div class="border-b last:border-b-0">
										<div class="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
											Section {page}
										</div>
										{#each questions as { answer, index } (index)}
											<Sheet.Close asChild let:builder>
												<button
													use:builder.action
													{...builder}
													on:click={() => jumpToQuestion(index)}
													class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-accent {index === $currentIndex
														? 'bg-accent/60 font-medium'
														: ''}"
												>
													<span class="mt-0.5 shrink-0 {dotClass(answer, index, $currentIndex)}"></span>
													<span class="line-clamp-2 leading-snug">
														<!-- eslint-disable-next-line -->
														{@html answer.expand?.question?.title ?? `Question ${index + 1}`}
													</span>
												</button>
											</Sheet.Close>
										{/each}
									</div>
								{/each}
							</div>
						</Sheet.Content>
					</Sheet.Root>
				</div>
			</div>

			<!-- Section question dots -->
			{#if sectionDots.length > 0}
				<div class="mt-2 flex min-h-[1.25rem] flex-wrap items-center justify-center gap-1.5">
					{#each sectionDots as { answer, index } (index)}
						<button
							on:click={() => jumpToQuestion(index)}
							title={answer.expand?.question?.title ?? `Question ${index + 1}`}
							class={dotClass(answer, index, $currentIndex)}
						></button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="mt-6 flex items-center justify-center">
		<div class="text-center">
			<h3 class="text-2xl font-bold tracking-tight">Not Found</h3>
		</div>
	</div>
{/if}
