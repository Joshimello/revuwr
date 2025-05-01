<script lang="ts">
	import { onMount } from 'svelte';
	import { getApplication } from './methods';
	import { page } from '$app/stores';
	import { application, event, answers, currentIndex, isReadOnly } from './stores';
	import { Progress } from '$lib/components/ui/progress';
	import { Button } from '$lib/components/ui/button';
	import Question from './question.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Info } from 'lucide-svelte';
	import Status from '$lib/components/status.svelte';
	import { ChevronLeft } from 'svelte-radix';
	import { m } from '$lib/paraglide/messages.js';

	onMount(async () => {
		$application = (await getApplication($page.params.id)) ?? null;
		const lastInvalidIndex = $answers.findIndex((i) => !i.valid);
		$currentIndex = lastInvalidIndex === -1 ? $answers.length - 1 : lastInvalidIndex;
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
		{#if $answers[$currentIndex].expand?.question.type == 'budget'}
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
					on:click={() => {
						$currentIndex--;
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
					on:click={() => {
						$currentIndex++;
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
