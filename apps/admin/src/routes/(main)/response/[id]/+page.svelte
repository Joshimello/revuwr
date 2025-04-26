<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH, PUBLIC_PLATFORM_URL } from '$env/static/public';
	import ResponseRenderer from '$lib/components/response-renderer.svelte';
	import Status, { statuses } from '$lib/components/status.svelte';
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
	import {
		ChevronLeft,
		Download,
		FileCheck,
		FileOutput,
		FileX,
		Mail,
		MessageCircleReply,
		PenBox
	} from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	type ExpandedApplication = ApplicationsResponse<{
		event: EventsResponse;
		responder: UsersResponse;
		response: AnswersResponse<
			Tresponse,
			{
				question: QuestionsResponse<Toptions>;
			}
		>[];
	}>;

	type QuestionType = 'radio' | 'member';
	type Tresponse = string | number | string[] | number[] | Record<string, any> | null;
	type Toptions = Record<string, any>;

	let record: ExpandedApplication | null = null;
	let event: EventsResponse | null = null;
	let responder: UsersResponse | null = null;
	let response: AnswersResponse<any, { question: QuestionsResponse<Toptions> }>[] = [];
	let prevNote: string | null = null;
	let prevSerial: number | null = null;

	onMount(async () => {
		try {
			record = await pb.collection('applications').getOne<ExpandedApplication>($page.params.id, {
				expand: 'event,responder,response,response.question'
			});
			if (!record.expand) throw new Error('Failed to load response');
			event = record.expand.event;
			responder = record.expand.responder;
			response = record.expand.response;
			prevNote = record.adminNote;
			prevSerial = record.serial;
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
			response[response.findIndex((i) => i.id == answerId)].status = value;
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

	const editTextareas: Record<string, HTMLTextAreaElement> = {};
	const handleEditSave = async (answerId: string) => {
		try {
			const index = response.findIndex((i) => i.id == answerId);
			if (!editTextareas[answerId]) return;
			if (index == -1) return;
			await pb.collection('answers').update(answerId, {
				response: JSON.parse(editTextareas[answerId].value)
			});
			response[index].response = JSON.parse(editTextareas[answerId].value);
			toast.success('Response saved');
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};
</script>

<div class="flex items-center gap-4">
	<Button
		variant="outline"
		size="icon"
		class="h-7 w-7"
		on:click={() => {
			window.history.back();
		}}
	>
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">Back</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">
		{#if record}
			{record.id}
		{/if}
	</h1>
</div>

{#if record && event && responder && response}
	<div class="flex flex-col-reverse gap-x-8 gap-y-4 pb-32 lg:flex-row">
		<div class="flex flex-1 flex-col gap-4 lg:gap-8">
			<Card.Root>
				<Card.Content class="flex flex-col gap-6 pt-6">
					{#each response.filter((i) => i.expand?.question.type != 'info') as answer}
						<div class="flex flex-col gap-1">
							<Label class="text-muted-foreground">
								{@html answer.expand?.question.title}
							</Label>

							<ResponseRenderer data={answer} />

							<div class="flex gap-1">
								<Popover.Root>
									<Popover.Trigger asChild let:builder>
										<Button
											builders={[builder]}
											size="icon"
											variant="secondary"
											class="h-7 w-7 hover:bg-sky-500 hover:text-white"
										>
											<PenBox size="16" />
										</Button>
									</Popover.Trigger>
									<Popover.Content class="flex h-96 flex-col gap-2">
										<textarea
											class="w-full flex-1 bg-transparent font-mono text-sm"
											value={JSON.stringify(answer.response, null, 1)}
											bind:this={editTextareas[answer.id]}
										/>
										<Button
											size="sm"
											variant="secondary"
											on:click={() => {
												handleEditSave(answer.id);
											}}
										>
											{m.edit_response()}
										</Button>
									</Popover.Content>
								</Popover.Root>

								{#if answer.status == 'edit'}
									<Button
										size="icon"
										variant="secondary"
										class="h-7 w-7 bg-amber-500 text-white hover:bg-amber-700"
										on:click={() => {
											handleToggleComment(answer.id, '');
										}}
									>
										<MessageCircleReply size="16" />
									</Button>
									<Input
										type="text"
										class="h-7"
										bind:value={answer.comment}
										on:blur={() => {
											handleSaveComment(answer.id);
										}}
									/>
								{:else}
									<Button
										size="icon"
										variant="secondary"
										class="h-7 w-7"
										on:click={() => {
											handleToggleComment(answer.id, 'edit');
										}}
									>
										<MessageCircleReply size="16" />
									</Button>
								{/if}
							</div>
						</div>
					{/each}
				</Card.Content>
			</Card.Root>
		</div>
		<div class="flex-shrink-0 lg:w-64">
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
									{#each Object.entries(statuses) as [key, value]}
										<DropdownMenu.Item on:click={() => handleStatusChange(key)}>
											<Status type={key} />
										</DropdownMenu.Item>
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
						<div class="grid grid-cols-2 gap-1">
							<Button
								variant="secondary"
								size="sm"
								class="h-7"
								href={`${PUBLIC_BASE_PATH}/export/pdf/${record.id}`}
								target="_blank"
							>
								<Download size="14" class="mr-1" />
								PDF
							</Button>
							<Button
								variant="secondary"
								size="sm"
								class="h-7"
								href={`${PUBLIC_BASE_PATH}/export/csv?ids=${record.id}`}
								target="_blank"
							>
								<Download size="14" class="mr-1" />
								CSV
							</Button>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
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

	<div class="pointer-events-none fixed bottom-0 left-0 right-0 md:bottom-6 md:left-6 md:right-6">
		<Card.Root class="pointer-events-auto mx-auto w-max bg-muted">
			<Card.Content class="flex items-center gap-1 p-2">
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
					{m.request_edits()}
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
