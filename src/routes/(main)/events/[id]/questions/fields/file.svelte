<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as m from '$lib/paraglide/messages.js';
	import type { Selected } from 'bits-ui';

	export let options: {
		isMaxFiles: boolean;
		maxFiles: number;
		isSpecificTypes: boolean;
		specificTypes: Selected<string>[];
	};

	export let isEditing: boolean;
	export let required: boolean;
</script>

{#if options && isEditing}
	<Input type="file" disabled />

	<div class="mt-6">
		<div class="flex items-center gap-2">
			<Checkbox bind:checked={options.isMaxFiles} />
			<span>{m.limit_file_count()}</span>
			{#if options.isMaxFiles}
				<Input type="number" bind:value={options.maxFiles} class="h-6 w-32" min="0" />
			{/if}
		</div>
		<div class="flex items-center gap-2">
			<Checkbox bind:checked={options.isSpecificTypes} />
			<span>{m.limit_file_type()}</span>
			{#if options.isSpecificTypes}
				<Select.Root multiple bind:selected={options.specificTypes}>
					<Select.Trigger class="h-6 w-32">
						<Select.Value placeholder={m.select_type()} />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="pdf">{m.pdf()}</Select.Item>
						<Select.Item value="image">{m.image()}</Select.Item>
						<Select.Item value="audio">{m.audio()}</Select.Item>
						<Select.Item value="video">{m.video()}</Select.Item>
						<Select.Item value="document">{m.document()}</Select.Item>
						<Select.Item value="spreadsheet">{m.spreadsheet()}</Select.Item>
						<Select.Item value="presentation">{m.presentation()}</Select.Item>
					</Select.Content>
				</Select.Root>
			{/if}
		</div>
	</div>
{/if}

{#if options && !isEditing}
	<Input type="file" disabled />
	<span class="text-xs text-muted-foreground">
		{#if required}
			<span class="text-destructive">{m.required()}</span>
		{:else}
			<span>{m.optional()}</span>
		{/if}
		{#if options.isMaxFiles}
			<span>| {m.file_count_limit()}: {options.maxFiles}</span>
		{/if}
		{#if options.isSpecificTypes}
			<span
				>| {m.file_type_limit()}: {options.specificTypes.map((type) => type.value).join(', ')}</span
			>
		{/if}
	</span>
{/if}
