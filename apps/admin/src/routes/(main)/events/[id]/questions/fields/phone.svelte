<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import * as m from '$lib/paraglide/messages.js';

	export let options: Record<string, unknown>;

	export let isEditing: boolean;
	export let required: boolean;
</script>

{#if options && isEditing}
	<Input placeholder={m.phone_placeholder()} />

	<div class="mt-6"></div>
{/if}

{#if options && !isEditing}
	<Input placeholder={m.phone_placeholder()} disabled />
	<span class="text-xs text-muted-foreground">
		{#if required}
			<span class="text-destructive">{m.required()}</span>
		{:else}
			<span>{m.optional()}</span>
		{/if}
	</span>
{/if}
