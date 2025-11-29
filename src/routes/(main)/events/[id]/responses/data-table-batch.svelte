<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH, PUBLIC_PLATFORM_URL } from '$env/static/public';
	import { default as Status, statuses } from '$lib/components/status.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as m from '$lib/paraglide/messages.js';
	import { pb } from '$lib/pocketbase/client';
	import {
		type AnswersResponse,
		type ApplicationsResponse,
		type UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import {
		Download,
		FileCheck,
		FileOutput,
		FileSpreadsheet,
		FileText,
		FileX,
		Mails,
		SquarePen,
		UserRoundSearch
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { fly } from 'svelte/transition';
	import { event as eventStore } from '../overview/stores';

	export let applications: ExpandedApplication[];
	export let selectedRecords: Record<string, boolean>;

	type ExpandedApplication = ApplicationsResponse<{
		responder: UsersResponse;
		response: AnswersResponse[];
	}>;

	const handleUpdateStatus = async (status: string) => {
		const indexes = Object.keys(selectedRecords || {});
		const ids = indexes.map((index) => applications[parseInt(index)].id);
		const promises = ids.map((id) =>
			pb.collection('applications').update(id, {
				status: status
			})
		);
		try {
			const updatedApplications = await Promise.all(promises);
			toast.success('Status updated');
			for (const updatedApplication of updatedApplications) {
				const index = applications.findIndex(
					(application) => application.id === updatedApplication.id
				);
				applications[index].status = updatedApplication.status;
			}
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	$: selectedIds = Object.keys(selectedRecords || {}).map(
		(index) => applications[parseInt(index)].id
	);
	$: selectedEmails = Object.keys(selectedRecords || {}).map(
		(index) => applications[parseInt(index)].expand?.responder.email
	);
	// Dialog states
	let batchApproveOpen = false;
	let batchRequestEditOpen = false;
	let batchRejectOpen = false;
	let isMailResponder = false;
	let mailContent = '';

	const handleBatchApprove = () => {
		batchApproveOpen = true;
	};

	const handleBatchRequestEdit = () => {
		batchRequestEditOpen = true;
	};

	const handleBatchReject = () => {
		batchRejectOpen = true;
	};

	const executeBatchApprove = async () => {
		const indexes = Object.keys(selectedRecords || {});
		const selectedApplications = indexes.map((index) => applications[parseInt(index)]);

		try {
			// Update each application
			for (const app of selectedApplications) {
				const updatedEvent = await pb.collection('events').update($eventStore!.id, {
					'approvedCount+': 1
				});

				const application = await pb.collection('applications').update(app.id, {
					status: 'approved',
					serial: updatedEvent.approvedCount
				});

				await pb.collection('notifications').create({
					application: application.id,
					target: application.responder,
					message: `${updatedEvent.responsePrefix}${application.serial.toString().padStart(3, '0')} has been approved.`
				});

				// If email notification is enabled
				if (isMailResponder && app.expand?.responder.email) {
					// Here you would send the email
					// This could be done through a server endpoint or direct email API
				}
			}

			// Update the local store
			for (const app of selectedApplications) {
				let recordRef = applications.find((a) => a.id === app.id);
				if (recordRef) {
					recordRef.status = 'approved';
				}
			}

			toast.success('Applications approved');
			batchApproveOpen = false;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	const executeBatchRequestEdit = async () => {
		const indexes = Object.keys(selectedRecords || {});
		const selectedApplications = indexes.map((index) => applications[parseInt(index)]);

		try {
			// Update each application
			for (const app of selectedApplications) {
				const application = await pb.collection('applications').update(app.id, {
					status: 'editsRequested'
				});

				await pb.collection('notifications').create({
					application: application.id,
					target: application.responder,
					message: `Application for ${$eventStore!.name} has been returned for edits.`,
					link: `${PUBLIC_PLATFORM_URL}/application/${application.id}`
				});

				// If email notification is enabled
				if (isMailResponder && app.expand?.responder.email) {
					// Email logic would go here
				}
			}

			// Update the local store
			for (const app of selectedApplications) {
				let recordRef = applications.find((a) => a.id === app.id);
				if (recordRef) {
					recordRef.status = 'editsRequested';
				}
			}

			toast.success('Edits requested for selected applications');
			batchRequestEditOpen = false;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	const executeBatchReject = async () => {
		const indexes = Object.keys(selectedRecords || {});
		const selectedApplications = indexes.map((index) => applications[parseInt(index)]);

		try {
			// Update each application
			for (const app of selectedApplications) {
				const application = await pb.collection('applications').update(app.id, {
					status: 'rejected'
				});

				await pb.collection('notifications').create({
					application: application.id,
					target: application.responder,
					message: `Application for ${$eventStore!.name} has been rejected.`
				});

				// If email notification is enabled
				if (isMailResponder && app.expand?.responder.email) {
					// Email logic would go here
				}
			}

			// Update the local store
			for (const app of selectedApplications) {
				let recordRef = applications.find((a) => a.id === app.id);
				if (recordRef) {
					recordRef.status = 'rejected';
				}
			}

			toast.success('Applications rejected');
			batchRejectOpen = false;
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};
</script>

{#if Object.keys(selectedRecords || {}).length > 0}
	<div transition:fly={{ duration: 200, y: -10 }} class="fixed bottom-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>
					{m.batch_actions()}
				</Card.Title>
				<Card.Description
					>{Object.keys(selectedRecords || {}).length}
					{m.of()}
					{applications.length}
					{m.rows()}
					{m.selected()}</Card.Description
				>
			</Card.Header>
			<Card.Content class="grid grid-cols-2 gap-2 md:flex">
				<Button
					class="flex items-center gap-2 bg-green-500 text-white"
					on:click={() => handleBatchApprove()}
				>
					<FileCheck size="16" strokeWidth="3" />
					{m.approve()}
				</Button>

				<Button
					class="flex items-center gap-2 bg-amber-500 text-white"
					on:click={() => handleBatchRequestEdit()}
				>
					<FileOutput size="16" strokeWidth="3" />
					{m.return_for_edits()}
				</Button>

				<Button
					class="flex items-center gap-2 bg-red-500 text-white"
					on:click={() => handleBatchReject()}
				>
					<FileX size="16" strokeWidth="3" />
					{m.reject()}
				</Button>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button class="flex items-center gap-2" builders={[builder]}>
							<SquarePen size="16" />
							{m.edit_status()}
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Group>
							{#each Object.entries(statuses) as [key, value]}
								<DropdownMenu.Item
									on:click={() => {
										handleUpdateStatus(key);
									}}
								>
									<Status type={key} />
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button class="flex items-center gap-2" builders={[builder]}>
							<Download size="16" />
							{m.download()}
						</Button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content>
						<DropdownMenu.Group>
							<DropdownMenu.Item
								class="flex items-center gap-2"
								target="_blank"
								href={`${PUBLIC_BASE_PATH}/export/csv?ids=${selectedIds.join(',')}`}
							>
								<FileSpreadsheet size="16" />
								{m.export_as()} CSV
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class="flex items-center gap-2"
								target="_blank"
								href={`${PUBLIC_BASE_PATH}/export/pdfs?ids=${selectedIds.join(',')}`}
							>
								<FileText size="16" />
								{m.export_as()} as PDF
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>

				<Button
					class="flex items-center gap-2"
					href={`mailto:?bcc=${selectedEmails.join(',')}`}
					target="_blank"
				>
					<Mails size="16" />
					{m.send_mail()}
				</Button>

				<Button
					class="flex items-center gap-2"
					href={`${PUBLIC_BASE_PATH}/events/${$page.params.id}/reviews/new?ids=${selectedIds.join(',')}`}
				>
					<UserRoundSearch size="16" />
					{m.send_for_review()}
				</Button>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
<Dialog.Root bind:open={batchApproveOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{m.approving_application()}
			</Dialog.Title>
			<Dialog.Description>
				{m.batch_approve_desc()}
			</Dialog.Description>
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
				<Textarea class="h-32" bind:value={mailContent} placeholder={m.extra_mail_content()} />
			{/if}
		</div>
		<Dialog.Footer>
			<Button class="bg-green-500 text-white" variant="outline" on:click={executeBatchApprove}>
				{m.approve()} ({Object.keys(selectedRecords || {}).length})
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Batch Request Edits Dialog -->
<Dialog.Root bind:open={batchRequestEditOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{m.requesting_edits_for_application()}
			</Dialog.Title>
			<Dialog.Description>
				{m.batch_edits_desc()}
			</Dialog.Description>
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
				<Textarea class="h-32" bind:value={mailContent} placeholder={m.extra_mail_content()} />
			{/if}
		</div>
		<Dialog.Footer>
			<Button class="bg-amber-500 text-white" variant="outline" on:click={executeBatchRequestEdit}>
				{m.return_for_edits()} ({Object.keys(selectedRecords || {}).length})
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Batch Reject Dialog -->
<Dialog.Root bind:open={batchRejectOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>
				{m.rejecting_application()}
			</Dialog.Title>
			<Dialog.Description>
				{m.batch_reject_desc()}
			</Dialog.Description>
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
				<Textarea class="h-32" bind:value={mailContent} placeholder={m.extra_mail_content()} />
			{/if}
		</div>
		<Dialog.Footer>
			<Button class="bg-red-500 text-white" variant="outline" on:click={executeBatchReject}>
				{m.reject()} ({Object.keys(selectedRecords || {}).length})
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
