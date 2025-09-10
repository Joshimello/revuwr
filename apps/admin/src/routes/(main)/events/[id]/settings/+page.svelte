<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import DatePicker from '$lib/components/date-picker.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as m from '$lib/paraglide/messages.js';
	import { pb, pbImage } from '$lib/pocketbase/client';
	import { fromDate } from '@internationalized/date';
	import { ChevronLeft } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import EndEarlyButton from './end-early-button.svelte';

	let collectionId = '';

	let settings: {
		status: string;
		name: string;
		description: string;
		image: string;
		moreInfo: string;
		targetAudience: string;
		startDate: Date | null;
		endDate: Date | null;
		beforeStartDate: string;
		afterStartDate: string;
		responseLimit: number;
		responsePrefix: string;
	} = {
		status: 'active',
		name: '',
		description: '',
		image: '',
		moreInfo: '',
		targetAudience: 'all',
		startDate: null,
		endDate: null,
		beforeStartDate: 'disallow',
		afterStartDate: 'disallow',
		responseLimit: 1,
		responsePrefix: ''
	};

	let prevSettings = JSON.stringify(settings);
	let deleteConfirmation = '';

	const handleNumberInput = (event: InputEvent) => {
		const target = event.target as HTMLInputElement;
		const value = Number(target.value);
		settings.responseLimit = value;
	};

	const handleFileInput = async (event: InputEvent) => {
		const target = event.target as HTMLInputElement;
		if (!target.files || target.files.length <= 0) return;
		const file = target.files[0];
		try {
			const event = await pb.collection('events').update($page.params.id, { image: file });
			toast.success('Image uploaded successfully');
			settings.image = event.image;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
	};

	const handleImageRemove = async () => {
		settings.image = '';
		handleChange();
	};

	const handleDeleteEvent = async () => {
		try {
			await pb.collection('events').delete($page.params.id);
			toast.success('Event deleted successfully');
			goto(`${PUBLIC_BASE_PATH}/events`);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
	};

	const handleChange = () => {
		if (prevSettings == JSON.stringify(settings)) {
			return;
		}
		toast.promise(pb.collection('events').update($page.params.id, settings), {
			loading: 'Saving changes...',
			success: () => {
				prevSettings = JSON.stringify(settings);
				return 'Saved successfully';
			},
			error: (err) => {
				if (err instanceof Error) {
					return err.message;
				} else {
					console.error(err);
					return 'An error occurred';
				}
			}
		});
	};

	onMount(async () => {
		try {
			const event = await pb.collection('events').getOne($page.params.id);
			collectionId = event.collectionId;
			settings = {
				status: event.status,
				name: event.name,
				description: event.description,
				image: event.image,
				moreInfo: event.moreInfo,
				targetAudience: event.targetAudience,
				startDate: event.startDate ? new Date(event.startDate) : null,
				endDate: event.endDate ? new Date(event.endDate) : null,
				beforeStartDate: event.beforeStartDate,
				afterStartDate: event.afterStartDate,
				responseLimit: event.responseLimit,
				responsePrefix: event.responsePrefix
			};
			prevSettings = JSON.stringify(settings);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
				console.error(err);
			}
		}
	});

	const handleEventEnded = async () => {
		// Refresh the event data after ending it early
		try {
			const event = await pb.collection('events').getOne($page.params.id);
			settings.endDate = event.endDate ? new Date(event.endDate) : null;
			prevSettings = JSON.stringify(settings);
		} catch (err) {
			console.error('Error refreshing event data:', err);
		}
	};
</script>

<div class="flex items-center gap-4">
	<Button
		variant="outline"
		size="icon"
		class="h-7 w-7"
		href="{PUBLIC_BASE_PATH}/events/{$page.params.id}"
	>
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">
			{m.back()}
		</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.editing_event_settings()}
	</h1>
</div>

<span class="text-sm text-gray-400">
	{m.changes_will_be_autosaved()}
</span>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.event_details()}
		</Card.Title>
		<Card.Description></Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-6">
			<div class="grid gap-3">
				<Label for="name">
					{m.name()}
				</Label>
				<Input
					id="name"
					type="text"
					class="w-full"
					bind:value={settings.name}
					on:blur={handleChange}
				/>
			</div>
			<div class="grid gap-3">
				<Label for="description">
					{m.description()}
				</Label>
				<Textarea
					id="description"
					class="h-64 min-h-16"
					bind:value={settings.description}
					on:blur={handleChange}
				/>
			</div>
			<div class="grid gap-3">
				<Label for="targetAudience">
					{m.target_audience()}
				</Label>
				<Select.Root
					selected={[
						{ label: m.all(), value: 'all' },
						{ label: m.students(), value: 'students' },
						{ label: m.faculty(), value: 'teachers' }
					].find((v) => v.value === settings.targetAudience) || { label: m.all(), value: 'all' }}
					onSelectedChange={(v) => {
						settings.targetAudience = v?.value || 'all';
						handleChange();
					}}
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
			<div class="grid gap-3">
				<Label for="posterImage">
					{m.poster_image()}
				</Label>
				<div class="flex gap-4">
					{#if settings.image && collectionId}
						<img
							src={pbImage(collectionId, $page.params.id, settings.image)}
							class="border-1 h-32 w-32 rounded-md border object-cover md:h-72 md:w-72"
							alt=""
						/>
					{:else}
						<div class="h-32 w-32 rounded-md bg-gray-100 md:h-72 md:w-72"></div>
					{/if}
					<div class="flex max-w-72 flex-col gap-2">
						<Input type="file" on:input={handleFileInput} />
						<Button variant="outline" on:click={handleImageRemove}>
							{m.remove_image()}
						</Button>
					</div>
				</div>
			</div>
			<div class="grid gap-3">
				<Label for="moreInfoUrl">
					{m.more_info_url()}
				</Label>
				<Input id="moreInfoUrl" type="url" bind:value={settings.moreInfo} on:blur={handleChange} />
			</div>
		</div>
	</Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.event_visibility()}
		</Card.Title>
		<Card.Description></Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-6">
			<div class="grid gap-3">
				<Label for="name">
					{m.start_date()}
				</Label>
				<DatePicker
					value={settings.startDate ? fromDate(settings.startDate, 'Asia/Singapore') : undefined}
					onValueChange={(v) => {
						settings.startDate = v?.toDate('Asia/Singapore') || null;
						handleChange();
					}}
				/>
			</div>
			<div class="grid gap-3">
				<Label for="name">
					{m.end_date()}
				</Label>
				<DatePicker
					value={settings.endDate ? fromDate(settings.endDate, 'Asia/Singapore') : undefined}
					onValueChange={(v) => {
						settings.endDate = v?.toDate('Asia/Singapore') || null;
						handleChange();
					}}
				/>
			</div>
			<div class="flex items-center space-x-2">
				<Checkbox
					checked={settings.beforeStartDate === 'allow'}
					onCheckedChange={(checked) => {
						settings.beforeStartDate = checked ? 'allow' : 'disallow';
						handleChange();
					}}
				/>
				<Label
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					{m.allow_early_applications()}
				</Label>
			</div>
			<div class="flex items-center space-x-2">
				<Checkbox
					checked={settings.afterStartDate === 'allow'}
					onCheckedChange={(checked) => {
						settings.afterStartDate = checked ? 'allow' : 'disallow';
						handleChange();
					}}
				/>
				<Label
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				>
					{m.allow_applications_after_dateline()}
				</Label>
			</div>
			<EndEarlyButton eventId={$page.params.id} onEventEnded={handleEventEnded} />
		</div>
	</Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.new_event_responses()}
		</Card.Title>
		<Card.Description></Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-6">
			<div class="grid gap-3">
				<Label for="name">
					{m.response_limit_per_user()}
				</Label>
				<Input
					id="name"
					type="number"
					class="w-72"
					min="1"
					on:input={handleNumberInput}
					value={settings.responseLimit}
					on:blur={handleChange}
				/>
			</div>
			<div class="grid gap-3">
				<Label for="name">
					{m.response_serial_id_prefix()} （ex: 1132LE001-999）
				</Label>
				<Input
					id="name"
					type="text"
					class="w-72"
					bind:value={settings.responsePrefix}
					on:blur={handleChange}
				/>
			</div>
		</div>
	</Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl border-destructive">
	<Card.Header>
		<Card.Title>
			{m.danger_zone()}
		</Card.Title>
		<Card.Description></Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid gap-6">
			<div class="grid gap-3">
				<Label for="name">
					{m.change_event_status()}
				</Label>
				<Select.Root
					selected={[
						{ label: m.active(), value: 'active' },
						{ label: m.archived(), value: 'archived' }
					].find((v) => v.value === settings.status) || { label: m.active(), value: 'active' }}
					onSelectedChange={(v) => {
						settings.status = v?.value || 'active';
						handleChange();
					}}
				>
					<Select.Trigger class="w-72">
						<Select.Value />
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="active">
							{m.active()}
						</Select.Item>
						<Select.Item value="archived">
							{m.archived()}
						</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
			<div class="grid gap-3">
				<Label for="name">
					{m.delete_this_event_forever()}
				</Label>

				<Dialog.Root>
					<Dialog.Trigger asChild let:builder>
						<Button builders={[builder]} class="w-72" variant="destructive">
							{m.delete_event()}
						</Button>
					</Dialog.Trigger>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>
								{m.delete_event_title()}
							</Dialog.Title>
							<Dialog.Description>
								{m.delete_event_desc()}
							</Dialog.Description>
						</Dialog.Header>
						<div class="py-4">
							<p class="mb-2 text-sm text-destructive">
								{m.this_action_cannot_be_undone()}
							</p>
							<p class="mb-4 text-sm">
								{m.type_confirm_delete_to_confirm()}
							</p>
							<Input type="text" placeholder="CONFIRM DELETE" bind:value={deleteConfirmation} />
						</div>
						<Dialog.Footer>
							<Dialog.Close>
								<Button variant="outline">{m.cancel()}</Button>
							</Dialog.Close>
							<Button
								on:click={handleDeleteEvent}
								variant="destructive"
								disabled={deleteConfirmation !== 'CONFIRM DELETE'}
							>
								{m.delete_event()}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Root>
			</div>
		</div>
	</Card.Content>
</Card.Root>
