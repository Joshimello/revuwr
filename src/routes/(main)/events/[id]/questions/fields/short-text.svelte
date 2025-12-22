<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import * as m from '$lib/paraglide/messages.js';

	export let options: {
		placeholder: string;
		isMaxLength: boolean;
		maxLength: number;
	};

	export let isEditing: boolean;
	export let required: boolean;
</script>

{#if options && isEditing}
	<Input bind:value={options.placeholder} placeholder={m.placeholder()} />

	<div class="mt-6">
		<div class="flex items-center gap-2">
			<Checkbox bind:checked={options.isMaxLength} />
			<span>{m.limit_characters()}</span>
			{#if options.isMaxLength}
				<Input type="number" bind:value={options.maxLength} class="h-6 w-32" min="0" />
			{/if}
		</div>
	</div>
{/if}

{#if options && !isEditing}
	<Input value={options.placeholder} placeholder={m.placeholder()} disabled />
	<span class="text-xs text-muted-foreground">
		{#if required}
			<span class="text-destructive">{m.required()}</span>
		{:else}
			<span>{m.optional()}</span>
		{/if}
		{#if options.isMaxLength}
			<span>| {m.character_limit()}: {options.maxLength}</span>
		{/if}
	</span>
{/if}
