<script lang="ts">
	import Status, { statuses } from '$lib/components/status.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as m from '$lib/paraglide/messages.js';
	import { ChevronDown } from 'lucide-svelte';

	export let selectedStatuses: string[] = Object.keys(statuses);

	const statusKeys = Object.keys(statuses);

	$: selectedStatusSet = new Set(selectedStatuses);
	$: allSelected = selectedStatuses.length === statusKeys.length;

	const toggleStatus = (status: string, checked: boolean) => {
		if (checked) {
			selectedStatuses = [...new Set([...selectedStatuses, status])];
		} else {
			selectedStatuses = selectedStatuses.filter((selectedStatus) => selectedStatus !== status);
		}
	};

	const toggleAll = () => {
		selectedStatuses = allSelected ? [] : [...statusKeys];
	};
</script>

<Popover.Root>
	<Popover.Trigger asChild let:builder>
		<Button variant="outline" class="w-[180px] justify-between" builders={[builder]}>
			<span>{m.status()} ({selectedStatuses.length}/{statusKeys.length})</span>
			<ChevronDown class="ml-2 h-4 w-4" />
		</Button>
	</Popover.Trigger>
	<Popover.Content align="start" class="w-64 p-2">
		<div class="flex items-center justify-between border-b pb-2">
			<div class="text-sm font-medium">{m.status()}</div>
			<Button variant="ghost" size="sm" on:click={toggleAll}>
				{allSelected ? m.deselect_all() : m.select_all()}
			</Button>
		</div>
		<ScrollArea class="mt-2 h-72">
			<div class="space-y-1">
				{#each statusKeys as status}
					<Label class="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-1.5 hover:bg-accent">
						<Checkbox
							checked={selectedStatusSet.has(status)}
							onCheckedChange={(checked) => toggleStatus(status, checked === true)}
						/>
						<Status type={status} />
					</Label>
				{/each}
			</div>
		</ScrollArea>
	</Popover.Content>
</Popover.Root>
