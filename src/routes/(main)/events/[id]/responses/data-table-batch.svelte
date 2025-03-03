<script lang="ts">
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Card from '$lib/components/ui/card';
	import { pb } from '$lib/pocketbase/client';
	import {
		type AnswersResponse,
		type ApplicationsResponse,
		type UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import {
		FileSpreadsheet,
		FileText,
		Mails,
		UserRoundSearch,
		SquarePen,
		Download
	} from 'lucide-svelte';
	import { statuses, default as Status } from '$lib/components/status.svelte';
	import { Button } from '$lib/components/ui/button';
	import { fly } from 'svelte/transition';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/stores';
	import * as m from '$lib/paraglide/messages.js'
	import { PUBLIC_BASE_PATH } from '$env/static/public';

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
</script>

{#if Object.keys(selectedRecords || {}).length > 0}
	<div transition:fly={{ duration: 200, y: -10 }} class="fixed bottom-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>
					{m.batch_actions()}
				</Card.Title>
				<Card.Description
					>{Object.keys(selectedRecords || {}).length} {m.of()} {applications.length} {m.rows()} {m.selected()}</Card.Description
				>
			</Card.Header>
			<Card.Content class="grid grid-cols-2 gap-2 md:flex">
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

				<Button class="flex items-center gap-2" href={`${PUBLIC_BASE_PATH}/events/${$page.params.id}/reviews/new?ids=${selectedIds.join(',')}`}>
					<UserRoundSearch size="16" />
					{m.send_for_review()}
				</Button>
			</Card.Content>
		</Card.Root>
	</div>
{/if}
