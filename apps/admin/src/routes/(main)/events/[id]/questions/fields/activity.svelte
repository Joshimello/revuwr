<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
	import { CirclePlus } from 'lucide-svelte';

	export let options: {
		isControlCount: boolean;
		minCount: number;
		maxCount: number;
	};

	export let isEditing: boolean;
	export let required: boolean;
</script>

{#if options && isEditing}
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>When</Table.Head>
					<Table.Head>Topic</Table.Head>
					<Table.Head>Venue</Table.Head>
					<Table.Head>Note</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row>
					<Table.Cell>
						<div class="font-medium">Date</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Time </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">Topic</div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">Physical</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Location </div>
					</Table.Cell>
					<Table.Cell>Extra info</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		<div class="flex justify-center border-t p-1">
			<Button variant="ghost" class="w-full" disabled>
				<CirclePlus size="16" />
				Add session
			</Button>
		</div>
	</div>

	<div class="mt-6">
		<div class="flex items-center gap-2">
			<Checkbox bind:checked={options.isControlCount} />
			<span>{m.control_activity_count()}</span>
			{#if options.isControlCount}
				<Input type="number" bind:value={options.minCount} class="h-6 w-16" min="0" /> to
				<Input type="number" bind:value={options.maxCount} class="h-6 w-16" min="0" />
			{/if}
		</div>
	</div>
{/if}

{#if options && !isEditing}
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>When</Table.Head>
					<Table.Head>Topic</Table.Head>
					<Table.Head>Venue</Table.Head>
					<Table.Head>Note</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row>
					<Table.Cell>
						<div class="font-medium">Date</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Time </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">Topic</div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">Physical</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Location </div>
					</Table.Cell>
					<Table.Cell>Extra info</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		<div class="flex justify-center border-t p-1">
			<Button variant="ghost" class="w-full" disabled>
				<CirclePlus size="16" />
				Add session
			</Button>
		</div>
	</div>

	<span class="text-xs text-muted-foreground">
		{#if required}
			<span class="text-destructive">{m.required()}</span>
		{:else}
			<span>{m.optional()}</span>
		{/if}
		{#if options.isControlCount}
			<span>| {m.sessions_required()}: {options.minCount} - {options.maxCount}</span>
		{/if}
	</span>
{/if}
