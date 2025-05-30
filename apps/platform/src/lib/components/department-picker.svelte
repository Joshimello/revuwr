<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { pb } from '$lib/pocketbase/client';
	import { cn } from '$lib/utils.js';
	import { onMount, tick } from 'svelte';
	import CaretSort from 'svelte-radix/CaretSort.svelte';
	import Check from 'svelte-radix/Check.svelte';
	import { toast } from 'svelte-sonner';

	let open = false;
	export let value: string = '';
export let lang: 'en' | 'zh' = 'en';
export let onDepartmentChange: ((value: string) => void) | undefined = undefined;

// Internal ID tracking to maintain selection state
let selectedId: string = '';

	let departments: { code: string; name_en: string; name_zh: string }[] = [];

	const getColleges = async () => {
		try {
			const collegesData = await pb.collection('colleges').getFullList();
			return collegesData.map((college) => ({
				code: college.id,
				name_en: college.en,
				name_zh: college.zh
			}));
		} catch (err) {
			toast.error('Error fetching colleges');
		}
	};

	onMount(async () => {
		departments = (await getColleges()) || [];
	});

	$: {
		// Initialize or update selectedId when departments load or value changes
		const matchingDept = departments.find((f) => f.name_zh === value);
		if (matchingDept) {
			selectedId = matchingDept.code;
		} else if (departments.length > 0 && !selectedId && value) {
			// Try to find a department by ID for backward compatibility
			const deptById = departments.find((f) => f.code === value);
			if (deptById) {
				selectedId = deptById.code;
				// Update the exported value to be name_zh
				value = deptById.name_zh;
			}
		}
	}

	$: selectedValue =
		departments.find((f) => f.code === selectedId)?.[`name_${lang}`] ?? 'Select a college...';

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
			<Command.Input placeholder="Search college..." class="h-9" />
			<Command.Empty>No colleges found.</Command.Empty>
			<Command.Group>
				<ScrollArea class="h-48">
					{#each departments as department}
						<Command.Item
							value={`${department.code} ${department.name_en} ${department.name_zh}`}
							onSelect={() => {
								selectedId = department.code;
								value = department.name_zh;
								closeAndFocusTrigger(ids.trigger);
							}}
						>
						<Check
							class={cn('mr-2 h-4 w-4 shrink-0', selectedId !== department.code && 'text-transparent')}
						/>
							{department[`name_${lang}`]}
						</Command.Item>
					{/each}
				</ScrollArea>
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
