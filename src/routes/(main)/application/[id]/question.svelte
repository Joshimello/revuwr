<script lang="ts">
	import type { ExpandedResponse } from './types';
	import questionTypes from './question-types';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { updateAnswer } from './methods';
	import { answers, currentIndex, isReadOnly } from './stores';
	import { toast } from 'svelte-sonner';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Info } from 'lucide-svelte';

	export let content: ExpandedResponse;
	const question = content.expand?.question;

	let checkValid: () => [boolean, string];
	let value: any = content.response;

	let isLoading = false;
</script>

{#if question && question.type in questionTypes}
	{#key value}
		<div class="flex gap-2">
			{#if question.required}
				<Badge variant="outline">Required</Badge>
			{:else}
				<Badge variant="secondary">Optional</Badge>
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

	{#if !$isReadOnly}
		{#key value}
			<div class="sticky bottom-20 mt-24 flex items-center gap-2 md:bottom-24">
				{#if $currentIndex < $answers.length - 1}
					<Button
						size="lg"
						on:click={async () => {
							const [status, res] = await updateAnswer(content.id, value);
							if (status) {
								$currentIndex = $currentIndex + 1;
							} else {
								toast.error('Failed to update answer');
							}
						}}
						disabled={checkValid && !checkValid()[0]}
					>
						Continue
					</Button>
				{:else}
					<form
						method="post"
						action="?/submit"
						class="flex-1 md:flex-none"
						on:submit={async (event) => {
							const [status, res] = await updateAnswer(content.id, value);
							if (status) {
								isLoading = true;
								toast.loading('Submitting application...', {
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
							disabled={isLoading || (checkValid && !checkValid()[0])}
							type="submit"
						>
							Submit Application
						</Button>
					</form>
				{/if}

				<Tooltip.Root openDelay={0}>
					<Tooltip.Trigger asChild let:builder>
						<Button builders={[builder]} variant="outline" size="icon" class="h-7 w-7">
							<Info size="14" />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Question will be saved once you click continue</Tooltip.Content>
				</Tooltip.Root>
			</div>
		{/key}
	{/if}

	<div class="h-96"></div>
{:else}
	Invalid question
{/if}
