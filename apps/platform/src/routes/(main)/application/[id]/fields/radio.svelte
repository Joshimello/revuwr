<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { onMount } from 'svelte';

	export let question: QuestionsResponse;
	const options = question.options as {
		choices: string[];
		isMaxSelections: boolean;
		maxSelections: number;
		isOthers: boolean;
	};

	export let disabled = false;
	export let value: {
		selected: number | null;
		others: string | null;
	} | null;

	export const checkValid = () => {
		if (value == null || disabled) {
			return [false, ''];
		}
		if (value.selected == null && !question.required) {
			return [true, ''];
		}
		if (value.selected == options.choices.length && value.others == null) {
			return [false, 'Please fill in the others field'];
		}
		if (question.required && value.selected == null) {
			return [false, 'Please select an option'];
		}
		return [true, ''];
	};

	onMount(() => {
		if (!value) {
			value = {
				selected: null,
				others: null
			};
		}
	});
</script>

{#if value}
	{#key value.selected}
		<RadioGroup.Root
			{disabled}
			class="gap-0"
			value={value.selected?.toString()}
			onValueChange={(v) => {
				if (!value) return;
				value.selected = parseInt(v);
			}}
		>
			{#each options.choices || [] as choice, index}
				<div class="flex items-center gap-3">
					<RadioGroup.Item class="h-5 w-5" value={index.toString()} />
					<Label class="flex-1">
						<span class="w-full text-xl" class:text-muted-foreground={disabled}>{choice}</span>
					</Label>
				</div>
			{/each}
			{#if options.isOthers}
				<div class="flex items-center gap-3">
					<RadioGroup.Item class="h-5 w-5" value={options.choices.length.toString()} />
					<Label class="flex-1">
						<input
							class="w-full bg-transparent text-xl outline-none"
							placeholder="Others"
							bind:value={value.others}
						/>
					</Label>
				</div>
			{/if}
		</RadioGroup.Root>
	{/key}
{/if}

<div class="mt-4">
	<Button
		{disabled}
		variant="outline"
		on:click={() => {
			``;
			value = {
				selected: null,
				others: null
			};
		}}
	>
		Clear
	</Button>
</div>
