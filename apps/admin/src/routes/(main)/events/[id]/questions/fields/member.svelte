<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
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
					<Table.Head>User</Table.Head>
					<Table.Head>Contact</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Tags</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row>
					<Table.Cell>
						<div class="font-medium">Name</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Student ID </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">Email</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Phone Number </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">College</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Year </div>
					</Table.Cell>
					<Table.Cell>
						<Badge variant="secondary">Foreign Student</Badge>
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		<div class="flex justify-center border-t p-1">
			<Button variant="ghost" class="w-full" disabled>
				<CirclePlus size="16" />
				Add Member
			</Button>
		</div>
	</div>

	<div class="mt-6">
		<div class="flex items-center gap-2">
			<Checkbox bind:checked={options.isControlCount} />
			<span>Control member count</span>
			{#if options.isControlCount}
				<Input type="number" bind:value={options.minCount} class="h-6 w-16" min="0" /> to
				<Input type="number" bind:value={options.maxCount} class="h-6 w-16" min="0" /> pax
			{/if}
		</div>
	</div>
{/if}

{#if options && !isEditing}
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>User</Table.Head>
					<Table.Head>Contact</Table.Head>
					<Table.Head>Status</Table.Head>
					<Table.Head>Tags</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row>
					<Table.Cell>
						<div class="font-medium">Name</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Student ID </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">Email</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Phone Number </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">College</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> Year </div>
					</Table.Cell>
					<Table.Cell>
						<Badge variant="secondary">Foreign Student</Badge>
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		<div class="flex justify-center border-t p-1">
			<Button variant="ghost" class="w-full" disabled>
				<CirclePlus size="16" />
				Add Member
			</Button>
		</div>
	</div>

	<span class="text-xs text-muted-foreground">
		{#if required}
			<span class="text-destructive">Required</span>
		{:else}
			<span>Optional</span>
		{/if}
		{#if options.isControlCount}
			<span>| Member count quota: {options.minCount} - {options.maxCount}</span>
		{/if}
	</span>
{/if}
