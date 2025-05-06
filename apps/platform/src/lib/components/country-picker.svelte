<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { cn } from '$lib/utils.js';
	import { onMount, tick } from 'svelte';
	import CaretSort from 'svelte-radix/CaretSort.svelte';
	import Check from 'svelte-radix/Check.svelte';
	import countries from 'world-countries';

	let open = false;
	export let value: string = '';
	export let lang: 'en' | 'zh' = 'zh';
	export let onCountryChange: ((value: string) => void) | undefined = undefined;
	export let showFlag: boolean = true;

	// Format the countries data for our component
	let formattedCountries: { code: string; name: string; flag: string }[] = [];

	onMount(() => {
		formattedCountries = countries.map((country) => ({
			code: country.cca2,
			name:
				lang === 'en'
					? country.name.common
					: country.translations.zho?.common || country.name.common,
			flag: country.flag
		}));

		// Sort countries alphabetically by name
		formattedCountries.sort((a, b) => a.name.localeCompare(b.name));
	});

	// Update country names when language changes
	$: {
		if (formattedCountries.length > 0) {
			formattedCountries = formattedCountries.map((country) => {
				const countryData = countries.find((c) => c.cca2 === country.code);
				return {
					...country,
					name:
						lang === 'en'
							? countryData?.name.common
							: countryData?.translations.zho?.common || countryData?.name.common
				};
			});
			formattedCountries.sort((a, b) => a.name.localeCompare(b.name));
		}
	}

	$: selectedCountry = formattedCountries.find((country) => country.code === value);
	$: selectedValue = selectedCountry
		? showFlag
			? `${selectedCountry.flag} ${selectedCountry.name}`
			: selectedCountry.name
		: 'Select a country...';

	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			document.getElementById(triggerId)?.focus();
		});
		if (onCountryChange) {
			onCountryChange(value);
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
	<Popover.Content class="w-[300px] p-0">
		<Command.Root>
			<Command.Input placeholder="Search country..." class="h-9" />
			<Command.Empty>No countries found.</Command.Empty>
			<Command.Group>
				<ScrollArea class="h-72">
					{#each formattedCountries as country}
						<Command.Item
							value={country.name}
							onSelect={() => {
								value = country.code;
								closeAndFocusTrigger(ids.trigger);
							}}
						>
							<Check
								class={cn('mr-2 h-4 w-4 shrink-0', value !== country.code && 'text-transparent')}
							/>
							{#if showFlag}
								<span class="mr-2">{country.flag}</span>
							{/if}
							{country.name}
						</Command.Item>
					{/each}
				</ScrollArea>
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
