<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
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
					<Table.Head>{m.user()}</Table.Head>
					<Table.Head>{m.contact()}</Table.Head>
					<Table.Head>{m.status()}</Table.Head>
					<Table.Head>{m.tags()}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row>
					<Table.Cell>
						<div class="font-medium">{m.name()}</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> {m.student_id()} </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">{m.email()}</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> {m.phone()} </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">{m.college()}</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> {m.year()} </div>
					</Table.Cell>
					<Table.Cell>
						<Badge variant="secondary">{m.foreign_student()}</Badge>
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		<div class="flex justify-center border-t p-1">
			<Button variant="ghost" class="w-full" disabled>
				<CirclePlus size="16" />
				{m.add_member()}
			</Button>
		</div>
	</div>

	<div class="mt-6">
		<div class="flex items-center gap-2">
			<Checkbox bind:checked={options.isControlCount} />
			<span>{m.control_member_count()}</span>
			{#if options.isControlCount}
				<Input type="number" bind:value={options.minCount} class="h-6 w-16" min="0" /> to
				<Input type="number" bind:value={options.maxCount} class="h-6 w-16" min="0" />
				{m.pax()}
			{/if}
		</div>
	</div>
{/if}

{#if options && !isEditing}
	<div class="rounded-md border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>{m.user()}</Table.Head>
					<Table.Head>{m.contact()}</Table.Head>
					<Table.Head>{m.status()}</Table.Head>
					<Table.Head>{m.tags()}</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				<Table.Row>
					<Table.Cell>
						<div class="font-medium">{m.name()}</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> {m.student_id()} </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">{m.email()}</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> {m.phone()} </div>
					</Table.Cell>
					<Table.Cell>
						<div class="font-medium">{m.college()}</div>
						<div class="hidden text-sm text-muted-foreground md:inline"> {m.year()} </div>
					</Table.Cell>
					<Table.Cell>
						<Badge variant="secondary">{m.foreign_student()}</Badge>
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		<div class="flex justify-center border-t p-1">
			<Button variant="ghost" class="w-full" disabled>
				<CirclePlus size="16" />
				{m.add_member()}
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
			<span>| {m.member_count_quota()}: {options.minCount} - {options.maxCount}</span>
		{/if}
	</span>
{/if}
