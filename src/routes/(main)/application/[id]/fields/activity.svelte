<script lang="ts">
	import DatePicker from '$lib/components/date-picker.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Table from '$lib/components/ui/table';
	import { m } from '$lib/paraglide/messages.js';
	import type { QuestionsResponse } from '$lib/pocketbase/pocketbase-types';
	import { CirclePlus, Edit, Trash } from 'lucide-svelte';
	import { onMount } from 'svelte';

	export let question: QuestionsResponse;
	const options = question.options as {
		isControlCount: boolean;
		minCount: number;
		maxCount: number;
	};

	export let disabled = false;
	export let value: {
		date: string;
		startTime: string;
		endTime: string;
		topic: string;
		form: string;
		location: string;
		note: string;
	}[];

	export const checkValid = () => {
		if (value == null || disabled) {
			return [false, ''];
		}
		if (
			options.isControlCount &&
			(value.length < options.minCount || value.length > options.maxCount)
		) {
			return [
				false,
				m.activity_sessions_required({ min: options.minCount, max: options.maxCount })
			];
		}
		if (question.required && value.length == 0) {
			return [false, m.activity_please_fill_field()];
		}
		return [true, ''];
	};

	onMount(() => {
		if (!value) {
			value = [];
		}
	});

	let newActivity = {
		date: '',
		startTime: '',
		endTime: '',
		topic: '',
		form: '',
		location: '',
		note: ''
	};

	let open = false;
	let editIndex = -1;

	// Time validation
	$: isTimeValid = () => {
		if (!newActivity.startTime || !newActivity.endTime) return true;
		const start = new Date(`2000-01-01T${newActivity.startTime}`);
		const end = new Date(`2000-01-01T${newActivity.endTime}`);
		return start < end;
	};

	const handleAdd = () => {
		open = false;
		if (editIndex >= 0) {
			// Editing existing activity
			value[editIndex] = { ...newActivity };
			value = [...value]; // Trigger reactivity
			editIndex = -1;
		} else {
			// Adding new activity
			value = [...value, newActivity];
		}
		newActivity = {
			date: '',
			startTime: '',
			endTime: '',
			topic: '',
			form: '',
			location: '',
			note: ''
		};
	};

	const handleEdit = (index: number) => {
		editIndex = index;
		newActivity = { ...value[index] };
		open = true;
	};
</script>

{#if value}
	<div class="rounded-md border">
		<div class="overflow-x-auto">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="whitespace-nowrap">{m.activity_field_when()}</Table.Head>
						<Table.Head class="whitespace-nowrap">{m.activity_field_topic()}</Table.Head>
						<Table.Head class="whitespace-nowrap">{m.activity_field_venue()}</Table.Head>
						<Table.Head class="whitespace-nowrap">{m.activity_field_note()}</Table.Head>
						<Table.Head></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each value as session, index}
						<Table.Row>
							<Table.Cell class="whitespace-nowrap">
								<div class="font-medium">
									{new Date(session.date).toLocaleDateString('en-US', {
										year: 'numeric',
										month: 'short',
										day: 'numeric'
									})}
								</div>
								<div class="hidden text-sm text-muted-foreground md:inline">
									{session.startTime} - {session.endTime}
								</div>
							</Table.Cell>
							<Table.Cell class="whitespace-nowrap">
								<div class="font-medium">
									{session.topic}
								</div>
							</Table.Cell>
							<Table.Cell class="whitespace-nowrap">
								<div class="font-medium">
									{session.form}
								</div>
								<div class="hidden text-sm text-muted-foreground md:inline">
									{session.location}
								</div>
							</Table.Cell>
							<Table.Cell class="whitespace-nowrap">
								{session.note}
							</Table.Cell>
							<Table.Cell class="text-end">
								<div class="flex items-center gap-1">
									<Button {disabled} size="icon" variant="ghost" on:click={() => handleEdit(index)}>
										<Edit size="16" />
									</Button>
									<Button
										{disabled}
										size="icon"
										variant="ghost"
										on:click={() => {
											value = value.filter((_, i) => i !== index);
										}}
									>
										<Trash size="16" />
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		<div class="flex justify-center border-t p-1">
			<Dialog.Root bind:open>
				<Dialog.Trigger asChild let:builder>
					<Button {disabled} variant="ghost" class="w-full" builders={[builder]}>
						<CirclePlus size="16" />
						{m.activity_add_session()}
					</Button>
				</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header>
						<Dialog.Title>
							{editIndex >= 0 ? m.activity_editing_session() : m.activity_adding_session()}
						</Dialog.Title>
						<Dialog.Description></Dialog.Description>
					</Dialog.Header>
					<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
						<div class="">
							<Label for="topic">{m.activity_learning_topic()}</Label>
							<Input bind:value={newActivity.topic} id="topic" />
						</div>
						<div class="">
							<Label for="date">{m.activity_date()}</Label>
							<DatePicker
								onValueChange={(v) => {
									newActivity.date = v?.toString() ?? '';
								}}
							/>
						</div>
						<div class="">
							<Label for="time">
								{m.activity_starting_time()}
								{#if newActivity.startTime && newActivity.endTime && !isTimeValid()}
									<span class="text-destructive">{m.activity_time_validation_error()}</span>
								{/if}
							</Label>
							<Input bind:value={newActivity.startTime} id="time" type="time" />
						</div>
						<div class="">
							<Label for="time">{m.activity_ending_time()}</Label>
							<Input bind:value={newActivity.endTime} id="time" type="time" />
						</div>
						<div class="mt-2.5">
							<RadioGroup.Root bind:value={newActivity.form}>
								<div class="flex items-center space-x-2">
									<RadioGroup.Item value="physical" />
									<Label>{m.activity_physical_session()}</Label>
								</div>
								<div class="flex items-center space-x-2">
									<RadioGroup.Item value="online" />
									<Label>{m.activity_online_session()}</Label>
								</div>
							</RadioGroup.Root>
						</div>
						<div class="">
							<Label for="location">{m.activity_location()}</Label>
							<Input bind:value={newActivity.location} id="location" />
						</div>
						<div class="md:col-span-2">
							<Label for="note">{m.activity_extra_info()}</Label>
							<Input bind:value={newActivity.note} id="note" />
						</div>
						<Button
							class="mt-6 md:col-span-2"
							on:click={handleAdd}
							disabled={[
								newActivity.date,
								newActivity.startTime,
								newActivity.endTime,
								newActivity.topic,
								newActivity.form,
								newActivity.location
							].some((i) => i === '') || !isTimeValid()}
						>
							{editIndex >= 0
								? m.activity_update_session_button()
								: m.activity_add_session_button()}
						</Button>
					</div>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</div>
{/if}
