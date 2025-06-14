<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import DateRangePicker from '$lib/components/date-range-picker.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import { toast } from 'svelte-sonner';

	let settings = {
		status: 'active',
		name: '',
		description: '',
		targetAudience: 'all',
		startDate: new Date(),
		endDate: new Date(),
		beforeStartDate: 'disallow',
		afterStartDate: 'disallow',
		responseLimit: 1,
		responsePrefix: ''
	};

	const handleNumberInput = (event: InputEvent) => {
		const target = event.target as HTMLInputElement;
		const value = Number(target.value);
		settings.responseLimit = value;
	};

	const handleCreateEvent = async () => {
		try {
			const response = await pb.collection('events').create(settings);
			toast.success('Event created');
			goto(`${PUBLIC_BASE_PATH}/events/${response.id}`);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
	};
</script>

<div class="flex items-center">
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.create_a_new_event()}
	</h1>
</div>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.event_details()}
		</Card.Title>
		<Card.Description>
			{m.event_details_desc()}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-6">
			<div class="grid gap-3">
				<Label for="name">
					{m.name()}
				</Label>
				<Input id="name" type="text" class="w-full" bind:value={settings.name} />
			</div>
			<div class="grid gap-3">
				<Label for="description">
					{m.description()}
				</Label>
				<Textarea id="description" class="h-64 min-h-16" bind:value={settings.description} />
			</div>
			<div class="grid gap-3">
				<Label for="description">
					{m.target_audience()}
				</Label>
				<Select.Root
					selected={{ label: m.all(), value: 'all' }}
					onSelectedChange={(v) => (settings.targetAudience = v?.value || 'all')}
				>
					<Select.Trigger class="w-72">
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="all">
							{m.all()}
						</Select.Item>
						<Select.Item value="students">
							{m.students()}
						</Select.Item>
						<Select.Item value="teachers">
							{m.faculty()}
						</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.event_visibility()}
		</Card.Title>
		<Card.Description>
			{m.event_visibility_desc()}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-6">
			<div class="grid gap-3">
				<Label for="name">
					{m.start_and_end_date()}
				</Label>
				<DateRangePicker bind:sValue={settings.startDate} bind:eValue={settings.endDate} />
			</div>
		</div>
	</Card.Content>
</Card.Root>

<span>
	{m.new_event_footnote()}
</span>

<Button class="max-w-3xl py-8" on:click={handleCreateEvent}>
	{m.create_event()}
</Button>
