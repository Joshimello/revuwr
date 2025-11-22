<script lang="ts">
	import { page } from '$app/stores';
	import Status from '$lib/components/status.svelte';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Progress } from '$lib/components/ui/progress';
	import { m } from '$lib/paraglide/messages.js';
	import { Info } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { ChevronLeft } from 'svelte-radix';
	import { shouldShowConditionalQuestion } from './conditional-utils';
	import { getApplication, updateConditionalAnswers } from './methods';
	import Question from './question.svelte';
	import { answers, application, currentIndex, event, isReadOnly } from './stores';

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

			<div class="flex items-center justify-between">
				<Button
					size="sm"
					variant="outline"
					on:click={async () => {
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
					}}
					disabled={$currentIndex === 0}
				>
					{'<-'}&nbsp;{m.button_back()}
				</Button>
				<div class="flex gap-2">
					<Status type={$application.status} />
					<span class="text-sm text-muted-foreground">
						{m.question_of({ current: $currentIndex + 1, total: $answers.length })}
					</span>
					{#if $answers[$currentIndex].valid}
						<Badge variant="outline">{m.badge_valid()}</Badge>
					{:else}
						<Badge variant="default">{m.badge_invalid()}</Badge>
					{/if}
				</div>
				<Button
					size="sm"
					variant="outline"
					on:click={async () => {
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
					}}
					disabled={!$isReadOnly || $currentIndex === $answers.length - 1}
				>
					{m.button_next()}&nbsp;{'->'}
				</Button>
			</div>
			<Progress value={(($answers.filter((i) => i.valid).length || 0) / $answers.length) * 100} />
		</div>
	</div>
{:else}
	<div>{m.loading_or_not_found()}</div>
{/if}
