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
	export let onCollegeChange: ((value: string) => void) | undefined = undefined;

	// Internal ID tracking to maintain selection state
	let selectedId: string = '';

	let colleges: { code: string; name_en: string; name_zh: string }[] = [];

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
		colleges = (await getColleges()) || [];
	});

	$: {
		// Initialize or update selectedId when colleges load or value changes
		const matchingCollege = colleges.find((f) => f.name_zh === value);
		if (matchingCollege) {
			selectedId = matchingCollege.code;
		} else if (colleges.length > 0 && !selectedId && value) {
			// Try to find a college by ID for backward compatibility
			const collegeById = colleges.find((f) => f.code === value);
			if (collegeById) {
				selectedId = collegeById.code;
				// Update the exported value to be name_zh
				value = collegeById.name_zh;
			}
		}
	}

	$: selectedValue =
		colleges.find((f) => f.code === selectedId)?.[`name_${lang}`] ?? 'Select a college...';

	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
		if (onCollegeChange) {
			onCollegeChange(value);
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
					{#each colleges as college}
						<Command.Item
							value={`${college.code} ${college.name_en} ${college.name_zh}`}
							onSelect={() => {
								selectedId = college.code;
								value = college.name_zh;
								closeAndFocusTrigger(ids.trigger);
							}}
						>
							<Check
								class={cn(
									'mr-2 h-4 w-4 shrink-0',
									selectedId !== college.code && 'text-transparent'
								)}
							/>
							{college[`name_${lang}`]}
						</Command.Item>
					{/each}
				</ScrollArea>
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
