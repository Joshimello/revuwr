<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as m from '$lib/paraglide/messages.js';
	import { Plus, Trash } from 'lucide-svelte';

	export let options: {
		choices: string[];
		isMaxSelections: boolean;
		maxSelections: number;
		isOthers: boolean;
	};

	export let isEditing: boolean;
	export let required: boolean;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
</script>

{#if options && isEditing}
	<!-- eslint-disable @typescript-eslint/no-unused-vars -->
	{#each options.choices || [] as _, index}
		<div class="flex items-center gap-3">
			<Checkbox disabled class="flex h-5 w-5 items-center justify-center" />
			<Label class="flex-1">
				<input
					class="w-full bg-transparent text-xl outline-none"
					placeholder={m.choice()}
					bind:value={options.choices[index]}
				/>
			</Label>
			<Button
				class="h-5 w-5"
				disabled={options.choices.length < 2}
				variant="ghost"
				size="icon"
				on:click={() => {
					options.choices.splice(index, 1);
					options.choices = [...options.choices];
				}}
			>
				<Trash size="16" />
			</Button>
		</div>
	{/each}
	{#if options.isOthers}
		<div class="flex items-center gap-3">
			<Checkbox disabled class="flex h-5 w-5 items-center justify-center" />
			<Label class="flex-1">
				<span class="w-full text-xl">{m.others()}</span>
			</Label>
		</div>
	{/if}
	<Button
		variant="ghost"
		size="sm"
		class="flex w-max items-center gap-1 px-1"
		on:click={() => [(options.choices = options.choices ? [...options.choices, ''] : [''])]}
	>
		<Plus size="16" />
		{m.add_choice()}
	</Button>

	<div class="mt-6">
		<div class="flex items-center gap-2">
			<Checkbox bind:checked={options.isOthers} />
			<span>{m.others_option()}</span>
		</div>
		<div class="flex items-center gap-2">
			<Checkbox bind:checked={options.isMaxSelections} />
			<span>{m.limit_selections()}</span>
			{#if options.isMaxSelections}
				<Input type="number" bind:value={options.maxSelections} class="h-6 w-32" min="0" />
			{/if}
		</div>
	</div>
{/if}

{#if options && !isEditing}
	{#each options.choices || [] as choice}
		<div class="flex items-center gap-3">
			<Checkbox disabled class="flex h-5 w-5 items-center justify-center" />
			<Label class="flex-1">
				<span class="w-full text-xl">{choice}</span>
			</Label>
		</div>
	{/each}
	{#if options.isOthers}
		<div class="flex items-center gap-3">
			<Checkbox disabled class="flex h-5 w-5 items-center justify-center" />
			<Label class="flex-1">
				<span class="w-full text-xl">{m.others()}</span>
			</Label>
		</div>
	{/if}

	<span class="text-xs text-muted-foreground">
		{#if required}
			<span class="text-destructive">{m.required()}</span>
		{:else}
			<span>{m.optional()}</span>
		{/if}
		{#if options.isMaxSelections}
			<span>| {m.selection_limit()}: {options.maxSelections}</span>
		{/if}
	</span>
{/if}
