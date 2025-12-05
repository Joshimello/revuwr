<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import DatePicker from '$lib/components/date-picker.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import type {
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { X } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	type ExpandedEvent = EventsResponse<
		Record<string, unknown>,
		{
			questions: QuestionsResponse[];
		}
	>;

	let applications: ApplicationsResponse[] = [];
	let event: ExpandedEvent | null = null;

	let shareResponder = false;
	let selectedApplications = $page.url.searchParams.get('ids')?.split(',') || [];
	let selectedQuestions: string[] = [];
	let reviewerRows: {
		email: string;
		endDate: Date | null;
		id: string;
	}[] = [{ email: '', endDate: null, id: crypto.randomUUID() }];

	// Function to validate email format
	const isValidEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	// Function to check if a row is complete and valid
	const isRowValid = (row: { email: string; endDate: Date | null }): boolean => {
		return row.email.trim() !== '' && row.endDate !== null && isValidEmail(row.email.trim());
	};

	// Function to get valid reviewers (filters out incomplete rows)
	const getValidReviewers = () => {
		return reviewerRows.filter(isRowValid).map((row) => ({
			email: row.email.trim(),
			endDate: row.endDate
		}));
	};

	// Function to handle input changes and manage rows
	const handleRowChange = (index: number) => {
		const currentRow = reviewerRows[index];
		const isLastRow = index === reviewerRows.length - 1;

		// If this is the last row and it becomes valid, add a new empty row
		if (isLastRow && isRowValid(currentRow)) {
			reviewerRows = [...reviewerRows, { email: '', endDate: null, id: crypto.randomUUID() }];
		}
	};

	// Function to update email for a specific row
	const updateRowEmail = (index: number, email: string) => {
		reviewerRows[index].email = email;
		reviewerRows = [...reviewerRows]; // Trigger reactivity
		handleRowChange(index);
	};

	// Function to update end date for a specific row
	const updateRowEndDate = (index: number, endDate: Date | null) => {
		reviewerRows[index].endDate = endDate;
		reviewerRows = [...reviewerRows]; // Trigger reactivity
		handleRowChange(index);
	};

	onMount(async () => {
		try {
			event = await pb.collection('events').getOne<ExpandedEvent>($page.params.id, {
				expand: `questions`
			});
			applications = await pb.collection('applications').getFullList({
				filter: `event="${$page.params.id}"`
			});
			selectedApplications = selectedApplications.filter((id) =>
				applications.find((app) => app.id === id)
			);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	});

	const handleCreateReviews = async () => {
		if (selectedApplications.length === 0) {
			toast.error('Please select at least one application');
			return;
		}

		if (selectedQuestions.length === 0) {
			toast.error('Please select at least one question');
			return;
		}

		const validReviewers = getValidReviewers();
		if (validReviewers.length === 0) {
			toast.error('Please add at least one reviewer');
			return;
		}

		const promises = validReviewers.map(async (reviewer) =>
			pb.collection('reviews').create(
				{
					applications: selectedApplications,
					questions: selectedQuestions,
					shareResponder: shareResponder,
					reviewerEmail: reviewer.email,
					endDate: reviewer.endDate,
					review: {},
					status: 'draft'
				},
				{
					requestKey: reviewer.email
				}
			)
		);
		try {
			await Promise.all(promises);
			toast.success('Review requests created');
			goto(`${PUBLIC_BASE_PATH}/events/${$page.params.id}/reviews`);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};
</script>

<div class="flex items-center">
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.new_review_request()}
	</h1>
</div>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.targeted_applications()}
		</Card.Title>
		<Card.Description>
			{m.targeted_applications_desc()}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="mb-2 flex flex-wrap gap-2">
			{#each selectedApplications as selectedApplication}
				{@const application = applications.find((i) => i.id == selectedApplication)}
				<Badge variant="secondary">
					<Button
						size="icon"
						class="h-5 w-5 text-black"
						variant="ghost"
						on:click={() => {
							selectedApplications = selectedApplications.filter((id) => id != application?.id);
						}}
					>
						<X size="12" />
					</Button>
					{#if application?.serial}
						{event?.responsePrefix}{application.serial.toString().padStart(3, '0')}
					{:else}
						{application?.id}
					{/if}
				</Badge>
			{/each}
		</div>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger let:builder asChild>
				<Button size="sm" builders={[builder]}>
					{m.add_application()}
				</Button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content>
				<DropdownMenu.Group>
					{#each applications.filter((i) => !selectedApplications.includes(i.id)) as application}
						<DropdownMenu.Item
							on:click={() => {
								selectedApplications = [...selectedApplications, application.id];
							}}
						>
							{#if application?.serial}
								{event?.responsePrefix}{application.serial.toString().padStart(3, '0')}
							{:else}
								{application?.id}
							{/if}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.reviewable_fields()}
		</Card.Title>
		<Card.Description>
			{m.reviewable_fields_desc()}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="mb-2 flex flex-wrap gap-2">
			{#each event?.expand?.questions || [] as question}
				<Button
					size="sm"
					class="h-max overflow-hidden px-1.5 py-0.5"
					variant={selectedQuestions.includes(question.id) ? 'default' : 'secondary'}
					on:click={() => {
						selectedQuestions = selectedQuestions.includes(question.id)
							? selectedQuestions.filter((i) => i != question.id)
							: [...selectedQuestions, question.id];
					}}
				>
					{@html question.title}
				</Button>
			{/each}
		</div>
		<div>
			<Button
				variant="outline"
				size="sm"
				class="mt-3"
				on:click={() => {
					selectedQuestions = event?.expand?.questions.map((i) => i.id) || [];
				}}
			>
				{m.select_all()}
			</Button>
			<Button
				variant="outline"
				size="sm"
				class="ml-2 mt-3"
				on:click={() => {
					selectedQuestions = [];
				}}
			>
				{m.deselect_all()}
			</Button>
		</div>
		<div class="mt-6 flex items-center gap-2">
			<Switch bind:checked={shareResponder} />
			<Label>
				{m.share_responder_details_with_reviewer()}
			</Label>
		</div>
	</Card.Content>
</Card.Root>

<Card.Root class="max-w-3xl">
	<Card.Header>
		<Card.Title>
			{m.reviewers()}
		</Card.Title>
		<Card.Description>
			{m.reviewers_desc()}
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<Table.Root class="border">
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-1/2">
						{m.reviewer_email()}
					</Table.Head>
					<Table.Head class="w-1/2">
						{m.end_date()}
					</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each reviewerRows as row, index (row.id)}
					<Table.Row>
						<Table.Cell class="p-2">
							<Input
								bind:value={row.email}
								on:input={() => updateRowEmail(index, row.email)}
								placeholder="reviewer@example.com"
								class="border-0 p-1 focus-visible:ring-0"
							/>
						</Table.Cell>
						<Table.Cell class="p-2">
							<div class="border-0">
								<DatePicker
									onValueChange={(v) => {
										const date = v?.toDate('Asia/Singapore') || null;
										updateRowEndDate(index, date);
									}}
								/>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Root>

<Button class="max-w-3xl py-8" on:click={handleCreateReviews}>
	{m.create_review_requests()}
</Button>
