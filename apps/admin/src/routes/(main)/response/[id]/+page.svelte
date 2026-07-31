<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH, PUBLIC_PLATFORM_URL } from '$env/static/public';
	import { setBreadcrumbs } from '$lib/breadcrumbs.js';
	import ApplicationExportDialog from '$lib/components/application-export-dialog.svelte';
	import Status, { statuses } from '$lib/components/status.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input, type FormInputEvent } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { getAnswerDisplayState, stripHtml, type ExpandedAnswer } from '$lib/response-display';
	import { getResponseRepresentation } from '$lib/response-repr';
	import {
		ChevronLeft,
		Download,
		FileCheck,
		FileOutput,
		FileX,
		Mail,
		PenBox,
		Search
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import AnswerReviewCard from './answer-review-card.svelte';

	type QuestionOptions = Record<string, unknown>;
	type ReviewAnswer = AnswersResponse<
		unknown,
		{
			question: QuestionsResponse<Record<string, unknown>, QuestionOptions>;
		}
	>;

	type ExpandedApplication = ApplicationsResponse<{
		event: EventsResponse;
		responder: UsersResponse;
		response: ReviewAnswer[];
	}>;

	let record: ExpandedApplication | null = null;
	let event: EventsResponse | null = null;
	let responder: UsersResponse | null = null;
	let response: ReviewAnswer[] = [];
	let prevNote: string | null = null;
	let prevSerial: number | null = null;
	let searchQuery = '';
	let exportOpen = false;
	let responseFilter: 'all' | 'answered' | 'unanswered' | 'missing-required' | 'requested-edits' =
		'all';

	// Set special breadcrumbs for response detail page
	// "Responses" should link back to the event's responses page
	$: if (record && event) {
		setBreadcrumbs([
			{
				text: m.event_responses(),
				href: `${PUBLIC_BASE_PATH}/events/${event.id}/responses`
			},
			{
				text: record.serial
					? `${event.responsePrefix}${record.serial.toString().padStart(3, '0')}`
					: record.id,
				href: `${PUBLIC_BASE_PATH}/response/${record.id}`
			}
		]);
	}

	onMount(async () => {
		try {
			record = await pb
				.collection('applications')
				.getOne<ExpandedApplication>($page.params.id ?? '', {
					expand: 'event,responder,response,response.question'
				});
			if (!record.expand) throw new Error('Failed to load response');
			event = record.expand.event;
			responder = record.expand.responder;
			response = record.expand.response;
			prevNote = record.adminNote;
			prevSerial = record.serial;
			prevComments = Object.fromEntries(
				response.map((answer) => [answer.id, answer.comment ?? ''])
			);
			toast.success('Response loaded');
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	});

	let addNotesOpen = false;

	const handleSaveNotes = async () => {
		if (!record) return;
		if (prevNote === record.adminNote) return;
		try {
			await pb.collection('applications').update(record.id, {
				adminNote: record.adminNote
			});
			toast.success('Notes saved');
			prevNote = record.adminNote;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	const handleSerialChange = (e: FormInputEvent<Event>) => {
		if (!record) return;
		record.serial = parseInt((e.target as HTMLInputElement).value);
	};

	const handleSaveSerial = async () => {
		if (!record) return;
		if (prevSerial === record.serial) return;
		try {
			await pb.collection('applications').update(record.id, {
				serial: record.serial
			});
			toast.success('Serial updated');
			prevSerial = record.serial;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	const handleStatusChange = async (status: string) => {
		if (!record) return;
		try {
			await pb.collection('applications').update(record.id, {
				status: status
			});
			toast.success('Status updated');
			record.status = status;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	const handleToggleComment = async (answerId: string, value: string) => {
		try {
			await pb.collection('answers').update(answerId, {
				status: value
			});
			const index = response.findIndex((item) => item.id === answerId);
			if (index !== -1) response[index].status = value;
			response = [...response];
			toast.success(value === 'edit' ? 'Edit requested for this answer' : 'Edit request removed');
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	let prevComments: Record<string, string> = {};
	const handleSaveComment = async (answerId: string) => {
		const index = response.findIndex((i) => i.id == answerId);
		if (index === -1) return;
		if (prevComments[answerId] === response[index].comment) return;
		try {
			await pb.collection('answers').update(answerId, {
				comment: response[index].comment
			});
			toast.success('Comment saved');
			prevComments[answerId] = response[index].comment;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	$: orderedAnswers = response
		.filter((answer) => answer.expand?.question.type !== 'info')
		.sort((a, b) => {
			const first = a.expand?.question;
			const second = b.expand?.question;
			return (first?.page ?? 0) - (second?.page ?? 0) || (first?.count ?? 0) - (second?.count ?? 0);
		});
	$: answerItems = orderedAnswers.map((answer, index) => ({
		answer,
		number: index + 1,
		state: getAnswerDisplayState(answer as ExpandedAnswer, response as ExpandedAnswer[])
	}));
	$: answeredCount = answerItems.filter((item) => item.state === 'answered').length;
	$: optionalEmptyCount = answerItems.filter((item) => item.state === 'unanswered-optional').length;
	$: missingRequiredCount = answerItems.filter((item) => item.state === 'missing-required').length;
	$: requestedEditCount = answerItems.filter((item) => item.answer.status === 'edit').length;
	$: applicableCount = answerItems.filter((item) => item.state !== 'not-applicable').length;
	$: allAnswers = response as ExpandedAnswer[];
	$: normalizedSearch = searchQuery.trim().toLowerCase();
	$: filteredAnswerItems = answerItems.filter((item) => {
		const matchesFilter =
			responseFilter === 'all' ||
			(responseFilter === 'answered' && item.state === 'answered') ||
			(responseFilter === 'unanswered' &&
				['unanswered-optional', 'missing-required'].includes(item.state)) ||
			(responseFilter === 'missing-required' && item.state === 'missing-required') ||
			(responseFilter === 'requested-edits' && item.answer.status === 'edit');
		if (!matchesFilter) return false;
		if (!normalizedSearch) return true;
		const questionText = stripHtml(item.answer.expand?.question.title);
		const answerText = getResponseRepresentation(item.answer);
		return `${questionText} ${answerText}`.toLowerCase().includes(normalizedSearch);
	});
	$: responseSections = Array.from(
		new Set(filteredAnswerItems.map((item) => item.answer.expand?.question.page ?? 1))
	).map((pageNumber) => ({
		pageNumber,
		items: filteredAnswerItems.filter(
			(item) => (item.answer.expand?.question.page ?? 1) === pageNumber
		)
	}));

	let approveOpen = false;
	let requestEditOpen = false;
	let rejectOpen = false;
	let isMailResponder = true;

	const handleApprove = async () => {
		if (!record || !event) return;
		try {
			const updatedEvent = await pb.collection('events').update(event.id, {
				'approvedCount+': 1
			});
			const application = await pb.collection('applications').update(record.id, {
				status: 'approved',
				serial: updatedEvent.approvedCount
			});
			await pb.collection('notifications').create({
				application: application.id,
				target: application.responder,
				message: `${updatedEvent.responsePrefix}${application.serial.toString().padStart(3, '0')} has been approved.`
			});
			toast.success('Application approved');
			record.status = 'approved';
			record.serial = updatedEvent.approvedCount;
			approveOpen = false;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	const handleRequestEdit = async () => {
		if (!record || !event) return;
		try {
			const application = await pb.collection('applications').update(record.id, {
				status: 'editsRequested'
			});
			await pb.collection('notifications').create({
				application: application.id,
				target: application.responder,
				message: `Application for ${event.name} has been returned for edits.`,
				link: `${PUBLIC_PLATFORM_URL}/application/${application.id}`
			});
			toast.success('Edits requested');
			record.status = 'editsRequested';
			requestEditOpen = false;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	const handleReject = async () => {
		if (!record || !event) return;
		try {
			const application = await pb.collection('applications').update(record.id, {
				status: 'rejected'
			});
			await pb.collection('notifications').create({
				application: application.id,
				target: application.responder,
				message: `Application for ${event.name} has been rejected.`
			});
			toast.success('Application rejected');
			record.status = 'rejected';
			rejectOpen = false;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-start gap-3">
		<Button
			variant="outline"
			size="icon"
			class="mt-1 h-8 w-8 shrink-0"
			on:click={() => {
				window.history.back();
			}}
		>
			<ChevronLeft class="h-4 w-4" />
			<span class="sr-only">Back</span>
		</Button>
		<div class="min-w-0 flex-1">
			<div class="flex flex-wrap items-center gap-2">
				<h1 class="text-xl font-semibold md:text-2xl">
					{#if record}
						{record.serial
							? `${event?.responsePrefix ?? ''}${record.serial.toString().padStart(3, '0')}`
							: record.id}
					{/if}
				</h1>
				{#if record}
					<Status type={record.status} />
				{/if}
			</div>
			{#if record && responder}
				<p class="mt-1 text-sm text-muted-foreground">
					{responder.name} · {responder.username}
					<span class="hidden sm:inline"> · {record.id}</span>
				</p>
			{/if}
		</div>
	</div>
</div>

{#if record && event && responder && response}
	<div class="flex flex-col gap-x-8 gap-y-6 pb-36 lg:flex-row">
		<div class="min-w-0 flex-1 space-y-6">
			<Card.Root>
				<Card.Content class="space-y-4 p-4 sm:p-6">
					<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
						<div>
							<h2 class="text-lg font-semibold">{m.submission_responses()}</h2>
							<p class="text-sm text-muted-foreground">
								{m.response_progress({ answered: answeredCount, total: applicableCount })}
							</p>
						</div>
						<div class="flex flex-wrap gap-2">
							<Badge variant="secondary">{m.answered()} {answeredCount}</Badge>
							{#if optionalEmptyCount}
								<Badge variant="outline">{m.unanswered()} {optionalEmptyCount}</Badge>
							{/if}
							{#if missingRequiredCount}
								<Badge variant="destructive">
									{m.missing_required()}
									{missingRequiredCount}
								</Badge>
							{/if}
							{#if requestedEditCount}
								<Badge class="border-transparent bg-amber-500 text-white">
									{m.edits_requested()}
									{requestedEditCount}
								</Badge>
							{/if}
						</div>
					</div>

					<div class="relative">
						<Search
							class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input class="pl-9" placeholder={m.search_responses()} bind:value={searchQuery} />
					</div>

					<div class="flex flex-wrap gap-2">
						<Button
							size="sm"
							variant={responseFilter === 'all' ? 'default' : 'outline'}
							on:click={() => (responseFilter = 'all')}
						>
							{m.all_responses()}
							{answerItems.length}
						</Button>
						<Button
							size="sm"
							variant={responseFilter === 'answered' ? 'default' : 'outline'}
							on:click={() => (responseFilter = 'answered')}
						>
							{m.answered()}
							{answeredCount}
						</Button>
						<Button
							size="sm"
							variant={responseFilter === 'unanswered' ? 'default' : 'outline'}
							on:click={() => (responseFilter = 'unanswered')}
						>
							{m.unanswered()}
							{optionalEmptyCount + missingRequiredCount}
						</Button>
						{#if missingRequiredCount}
							<Button
								size="sm"
								variant={responseFilter === 'missing-required' ? 'destructive' : 'outline'}
								on:click={() => (responseFilter = 'missing-required')}
							>
								{m.missing_required()}
								{missingRequiredCount}
							</Button>
						{/if}
						{#if requestedEditCount}
							<Button
								size="sm"
								variant={responseFilter === 'requested-edits' ? 'default' : 'outline'}
								on:click={() => (responseFilter = 'requested-edits')}
							>
								{m.requested_edits_filter()}
								{requestedEditCount}
							</Button>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			{#if filteredAnswerItems.length === 0}
				<Card.Root>
					<Card.Content class="p-10 text-center text-sm text-muted-foreground">
						{m.no_matching_responses()}
					</Card.Content>
				</Card.Root>
			{:else}
				{#each responseSections as section}
					<section class="space-y-3" aria-labelledby={`section-${section.pageNumber}`}>
						<div class="flex items-center gap-3">
							<h2
								id={`section-${section.pageNumber}`}
								class="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
							>
								{m.section_number({ number: section.pageNumber })}
							</h2>
							<div class="h-px flex-1 bg-border"></div>
							<span class="text-xs text-muted-foreground">{section.items.length}</span>
						</div>
						<div class="space-y-3">
							{#each section.items as item (item.answer.id)}
								<AnswerReviewCard
									answer={item.answer}
									{response}
									{allAnswers}
									number={item.number}
									state={item.state}
									toggleEditRequest={handleToggleComment}
									saveComment={handleSaveComment}
									refreshAnswers={() => (response = [...response])}
								/>
							{/each}
						</div>
					</section>
				{/each}
			{/if}
		</div>
		<div class="flex-shrink-0 lg:w-72">
			<div class="lg:sticky lg:top-6">
				<Card.Root>
					<Card.Content class="flex flex-col gap-3 pt-6">
						<div class="flex flex-col">
							<Label class="text-muted-foreground">
								{m.responder()}
							</Label>
							<span class="break-all text-sm leading-4">{responder.name}</span>
							<span class="break-all text-sm leading-4">{responder.username}</span>
						</div>

						<div class="flex items-center justify-between gap-2">
							<div class="flex flex-col">
								<Label class="text-muted-foreground">
									{m.contact()}
								</Label>
								<span class="break-all text-sm leading-4">{responder.email}</span>
								<span class="break-all text-sm leading-4">{responder.phone}</span>
							</div>
							<Button
								size="icon"
								variant="secondary"
								class="h-7 w-7 shrink-0"
								href={`mailto:${responder.email}`}
								target="_blank"
							>
								<Mail size="12" />
							</Button>
						</div>

						<div class="flex flex-col">
							<Label class="text-muted-foreground">
								{m.event()}
							</Label>
							<span class="text-sm leading-4">{event.name}</span>
						</div>

						<div class="grid grid-cols-2 gap-3 border-y py-3">
							<div class="flex flex-col">
								<Label class="text-muted-foreground">{m.submitted_at()}</Label>
								<span class="text-xs">{new Date(record.created).toLocaleString()}</span>
							</div>
							<div class="flex flex-col">
								<Label class="text-muted-foreground">{m.application_updated_at()}</Label>
								<span class="text-xs">{new Date(record.updated).toLocaleString()}</span>
							</div>
						</div>

						<div class="flex items-center justify-between gap-2">
							<div class="flex flex-col">
								<Label class="text-muted-foreground">
									{m.status()}
								</Label>
								<div><Status type={record.status} /></div>
							</div>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger asChild let:builder>
									<Button size="icon" variant="secondary" class="h-7 w-7" builders={[builder]}>
										<PenBox size="12" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content>
									<DropdownMenu.Group>
										{#each Object.keys(statuses) as key}
											{#if key !== 'trashed'}
												<DropdownMenu.Item on:click={() => handleStatusChange(key)}>
													<Status type={key} />
												</DropdownMenu.Item>
											{/if}
										{/each}
									</DropdownMenu.Group>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>

						<div class="flex flex-col">
							<Label class="text-muted-foreground">
								{m.internal_id()}
							</Label>
							<span class="font-mono text-sm">{record.id}</span>
						</div>

						<div class="flex items-center justify-between gap-2">
							<div class="flex flex-col">
								<Label class="text-muted-foreground">
									{m.serial_id()}
								</Label>
								{#if record.serial}
									<span class="font-mono text-sm"
										>{event.responsePrefix}{record.serial.toString().padStart(3, '0')}</span
									>
								{:else}
									<span class="font-mono text-sm">-</span>
								{/if}
							</div>
							<Popover.Root>
								<Popover.Trigger asChild let:builder>
									<Button size="icon" variant="secondary" class="h-7 w-7" builders={[builder]}>
										<PenBox size="12" />
									</Button>
								</Popover.Trigger>
								<Popover.Content>
									<div class="grid grid-cols-3 items-center gap-4">
										<Label>
											{m.serial()}
										</Label>
										<Input
											class="col-span-2"
											type="number"
											min="0"
											max="999"
											value={record.serial.toString()}
											on:change={handleSerialChange}
											on:blur={handleSaveSerial}
										/>
									</div>
								</Popover.Content>
							</Popover.Root>
						</div>

						<div class="flex items-center justify-between gap-2">
							<div class="flex flex-col">
								<Label class="text-muted-foreground">
									{m.admin_note()}
								</Label>
								<span class="break-all text-sm">{record.adminNote}</span>
							</div>
							<Button
								size="icon"
								variant="secondary"
								class="h-7 w-7"
								on:click={() => (addNotesOpen = true)}
							>
								<PenBox size="12" />
							</Button>
						</div>

						<div class="flex flex-col gap-1">
							<Label class="text-muted-foreground">
								{m.export_response()}
							</Label>
							<Button
								variant="secondary"
								size="sm"
								class="h-7"
								on:click={() => (exportOpen = true)}
							>
								<Download size="14" class="mr-1" />
								{m.export_applications()}
							</Button>
						</div>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>

	<Dialog.Root bind:open={addNotesOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title
					>{m.note_for()} <span class="font-mono font-normal">{record.id}</span></Dialog.Title
				>
				<Textarea class="h-64" bind:value={record.adminNote} on:blur={handleSaveNotes} />
			</Dialog.Header>
		</Dialog.Content>
	</Dialog.Root>

	<ApplicationExportDialog bind:open={exportOpen} eventId={event.id} applicationIds={[record.id]} />

	<div
		class="pointer-events-none fixed bottom-2 left-2 right-2 z-40 md:bottom-6 md:left-6 md:right-6"
	>
		<Card.Root class="pointer-events-auto mx-auto w-full max-w-fit bg-background shadow-xl">
			<Card.Content class="flex flex-wrap items-center justify-center gap-1 p-2">
				<Button
					class="flex items-center gap-1 bg-green-500 text-white"
					size="sm"
					variant="outline"
					on:click={() => (approveOpen = true)}
				>
					<FileCheck size="14" strokeWidth="3" />
					{m.approve()}
				</Button>
				<Button
					class="flex items-center gap-1 bg-amber-500 text-white"
					size="sm"
					variant="outline"
					disabled={!response.some((i) => i.status == 'edit')}
					on:click={() => (requestEditOpen = true)}
				>
					<FileOutput size="14" strokeWidth="3" />
					{m.request_edits()} ({requestedEditCount})
				</Button>
				<Button
					class="flex items-center gap-1 bg-red-500 text-white"
					size="sm"
					variant="outline"
					on:click={() => (rejectOpen = true)}
				>
					<FileX size="14" strokeWidth="3" />
					{m.reject()}
				</Button>
			</Card.Content>
		</Card.Root>
	</div>

	<Dialog.Root bind:open={approveOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>
					{m.approving_application()}
					<span class="font-mono font-normal">{record.id}</span>
				</Dialog.Title>
			</Dialog.Header>
			<div class="flex flex-col">
				<Label class="text-muted-foreground">
					{m.new_given_id_will_be()}
				</Label>
				<span>{event.responsePrefix}{(event.approvedCount + 1).toString().padStart(3, '0')}</span>
			</div>
			<div class="flex flex-col gap-2">
				<Label class="text-muted-foreground">
					{m.mail_the_responder()}
				</Label>
				<div class="flex items-center space-x-2">
					<Switch bind:checked={isMailResponder} /><Label>
						{m.mail_responder()}
					</Label>
				</div>
				{#if isMailResponder}
					<Textarea class="h-32" placeholder={m.extra_mail_content()} />
				{/if}
			</div>
			<Dialog.Footer>
				<Button class="bg-green-500 text-white" variant="outline" on:click={handleApprove}>
					{m.approve()}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={requestEditOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>
					{m.requesting_edits_for_application()}
					<span class="font-mono font-normal">{record.id}</span>
				</Dialog.Title>
				<Dialog.Description>
					{m.requesting_edits_desc()}
				</Dialog.Description>
			</Dialog.Header>
			<ScrollArea class="h-64">
				{#each response.filter((i) => i.status == 'edit') as answer}
					<div class="flex flex-col gap-1">
						<Label class="text-muted-foreground">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html answer.expand?.question.title}
						</Label>
						<span>{answer.comment}</span>
					</div>
				{/each}
			</ScrollArea>
			<div class="flex flex-col gap-2">
				<Label class="text-muted-foreground">
					{m.mail_the_responder()}
				</Label>
				<div class="flex items-center space-x-2">
					<Switch bind:checked={isMailResponder} /><Label>
						{m.mail_responder()}
					</Label>
				</div>
				{#if isMailResponder}
					<Textarea class="h-32" placeholder={m.extra_mail_content()} />
				{/if}
			</div>
			<Dialog.Footer>
				<Button class="bg-amber-500 text-white" variant="outline" on:click={handleRequestEdit}>
					{m.return_for_edits()}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={rejectOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>
					{m.rejecting_application()}
					<span class="font-mono font-normal">{record.id}</span>
				</Dialog.Title>
			</Dialog.Header>
			<div class="flex flex-col gap-2">
				<Label class="text-muted-foreground">
					{m.mail_the_responder()}
				</Label>
				<div class="flex items-center space-x-2">
					<Switch bind:checked={isMailResponder} /><Label>
						{m.mail_responder()}
					</Label>
				</div>
				{#if isMailResponder}
					<Textarea class="h-32" placeholder={m.extra_mail_content()} />
				{/if}
			</div>
			<Dialog.Footer>
				<Button class="bg-red-500 text-white" variant="outline" on:click={handleReject}>
					{m.reject()}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
