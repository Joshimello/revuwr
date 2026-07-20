<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages.js';
	import {
		parseActivityTime,
		serializeActivityTime,
		type ActivityTimePeriod
	} from './activity-time';

	export let value = '';
	export let label: string;
	export let disabled = false;

	const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
	const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
	const periods: ActivityTimePeriod[] = ['AM', 'PM'];

	let hour = '';
	let minute = '';
	let period: ActivityTimePeriod | '' = '';
	let lastSyncedValue: string | undefined;

	$: if (value !== lastSyncedValue) {
		const parts = parseActivityTime(value);
		hour = parts?.hour ?? '';
		minute = parts?.minute ?? '';
		period = parts?.period ?? '';
		lastSyncedValue = value;
	}

	const updateValue = () => {
		if (!hour || !minute || !period) {
			if (value !== '') {
				lastSyncedValue = '';
				value = '';
			}
			return;
		}

		const nextValue = serializeActivityTime(hour, minute, period);
		if (nextValue && nextValue !== value) {
			lastSyncedValue = nextValue;
			value = nextValue;
		}
	};

	const updateHour = (selected: { value: string } | undefined) => {
		hour = selected?.value ?? '';
		updateValue();
	};

	const updateMinute = (selected: { value: string } | undefined) => {
		minute = selected?.value ?? '';
		updateValue();
	};

	const updatePeriod = (selected: { value: ActivityTimePeriod } | undefined) => {
		period = selected?.value ?? '';
		updateValue();
	};
</script>

<div
	role="group"
	aria-label={label}
	class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1.25fr)] items-center gap-1.5"
>
	<Select.Root
		{disabled}
		selected={hour ? { value: hour, label: hour } : undefined}
		onSelectedChange={updateHour}
	>
		<Select.Trigger aria-label={`${label}: ${m.activity_time_hour()}`}>
			<Select.Value placeholder="HH" />
		</Select.Trigger>
		<Select.Content>
			{#each hours as option}
				<Select.Item value={option}>{option}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<span aria-hidden="true">:</span>

	<Select.Root
		{disabled}
		selected={minute ? { value: minute, label: minute } : undefined}
		onSelectedChange={updateMinute}
	>
		<Select.Trigger aria-label={`${label}: ${m.activity_time_minute()}`}>
			<Select.Value placeholder="MM" />
		</Select.Trigger>
		<Select.Content class="max-h-64 overflow-y-auto">
			{#each minutes as option}
				<Select.Item value={option}>{option}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>

	<Select.Root
		{disabled}
		selected={period ? { value: period, label: period } : undefined}
		onSelectedChange={updatePeriod}
	>
		<Select.Trigger aria-label={`${label}: ${m.activity_time_period()}`}>
			<Select.Value placeholder="AM/PM" />
		</Select.Trigger>
		<Select.Content>
			{#each periods as option}
				<Select.Item value={option}>{option}</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
