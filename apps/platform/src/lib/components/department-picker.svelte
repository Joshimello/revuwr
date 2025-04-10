<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { departments } from '$lib/consts/departments';
	import { cn } from '$lib/utils.js';
	import { tick } from 'svelte';
	import CaretSort from 'svelte-radix/CaretSort.svelte';
	import Check from 'svelte-radix/Check.svelte';

	let open = false;
	export let value: string = '';
	export let lang: 'en' | 'zh' = 'en';
	export let onDepartmentChange: ((value: string) => void) | undefined = undefined;

	$: selectedValue =
		departments.find((f) => f.code === value)?.[`name_${lang}`] ?? 'Select a department...';

	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
		if (onDepartmentChange) {
			onDepartmentChange(value);
		}
	}
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="outline"
			role="combobox"
			aria-expanded={open}
			class="flex w-full justify-between overflow-hidden"
		>
			{selectedValue}
			<CaretSort class="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<Command.Root>
			<Command.Input placeholder="Search department..." class="h-9" />
			<Command.Empty>No departments found.</Command.Empty>
			<Command.Group>
				<ScrollArea class="h-48">
					{#each departments as department}
						<Command.Item
							value={`${department.code} ${department.name_en} ${department.name_zh}`}
							onSelect={() => {
								value = department.code;
								closeAndFocusTrigger(ids.trigger);
							}}
						>
							<Check
								class={cn('mr-2 h-4 w-4 shrink-0', value !== department.code && 'text-transparent')}
							/>
							{department[`name_${lang}`]}
						</Command.Item>
					{/each}
				</ScrollArea>
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
