<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ResponseRenderer from '$lib/components/response-renderer.svelte';
	import Status from '$lib/components/status.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import * as Table from '$lib/components/ui/table';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { pb, pbImage } from '$lib/pocketbase/client';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import {
		Check,
		Download,
		FileCheck2,
		FileClock,
		FileIcon,
		FileSearch2,
		FileX2,
		MessageCircle,
		PencilLine,
		X
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { ExpandedReviewsResponse } from '../../(main)/application/[id]/types';

	type ExpandedApplication = ApplicationsResponse<{
		event: EventsResponse;
		response: AnswersResponse<
			any,
			{
				question: QuestionsResponse<any>;
			}
		>[];
		responder: UsersResponse;
	}>;

	let reviewRequest: ExpandedReviewsResponse | undefined = undefined;
	export let data;
	({ reviewRequest } = data);

	const handleSubmitReviews = async () => {
		if (!reviewRequest) return;
		try {
			await pb.collection('reviews').update(reviewRequest.id, {
				status: 'submitted'
			});
			toast.success('Reviews submitted successfully');
			pb.authStore.clear();
			goto('/review/completed');
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	};

	let openedStatus: null | string = null;
	let openedApplication: ExpandedApplication | null = null;

	let viewOpen = false;
	let submitOpen = false;
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Hi, {reviewRequest?.reviewerEmail}</Card.Title>
		<Card.Description>
			You have been requested to review the following applications. There are {reviewRequest
				?.applications.length} applications to review below. Please review each application and provide
			a status and a optional comment for each. You may return to this page URL at any time to update
			your review.
			{#if reviewRequest?.endDate}
				This review request will be closed on
				{new Date(reviewRequest?.endDate).toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})} or after submission.
			{/if}
			Thank you for your time and effort.
		</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="flex flex-col gap-1">
			Tips while reviewing:
			<div class="flex gap-2 text-sm text-muted-foreground">
				<Button class="h-5 w-5 bg-green-500" size="icon" disabled><Check size="16" /></Button>
				-> Approve application as it is
			</div>
			<div class="flex gap-2 text-sm text-muted-foreground">
				<Button class="h-5 w-5 bg-amber-500" size="icon" disabled><PencilLine size="16" /></Button>
				-> Approve application with suggested edits
			</div>
			<div class="flex gap-2 text-sm text-muted-foreground">
				<Button class="h-5 w-5 bg-red-500" size="icon" disabled><X size="16" /></Button>
				-> Reject application
			</div>
			<span class="flex items-center gap-2 pl-0.5 text-sm text-muted-foreground">
				<MessageCircle size="16" />
				You can also leave a comment for the applicant to see.
			</span>
			<span class="flex items-center gap-2 pl-0.5 text-sm text-muted-foreground">
				<Download size="16" />
				You can download all applications as a PDF below.
			</span>
		</div>

		<div class="mt-6 flex justify-end">
			<Button variant="outline" href={`/export/${$page.params.id}`} target="_blank">
				Download all as PDF
			</Button>
		</div>
	</Card.Content>
</Card.Root>

{#if reviewRequest?.review}
	<Card.Root class="mt-2">
		<Card.Header>
			<Card.Title>
				<div class="flex flex-wrap items-center gap-1">
					<Badge class="bg-lime-100 text-lime-600" variant="outline">
						{Object.values(reviewRequest.review).filter((i) => i.status === 'approved').length}
						<FileCheck2 class="ml-1" size="14" />
						<span class="ml-1 font-normal">Approved</span>
					</Badge>
					<Badge class="bg-orange-100 text-orange-600" variant="outline">
						{Object.values(reviewRequest.review).filter((i) => i.status === 'editsRequested')
							.length}
						<FileSearch2 class="ml-1" size="14" />
						<span class="ml-1 font-normal">Requested Edits</span>
					</Badge>
					<Badge class="bg-red-100 text-red-500" variant="outline">
						{Object.values(reviewRequest.review).filter((i) => i.status === 'rejected').length}
						<FileX2 class="ml-1" size="14" />
						<span class="ml-1 font-normal">Rejected</span>
					</Badge>
					<Badge class="bg-sky-100 text-sky-500" variant="outline">
						{reviewRequest.applications.filter(
							(i) => !Object.keys(reviewRequest?.review || {}).includes(i)
						).length}
						<FileClock class="ml-1" size="14" />
						<span class="ml-1 font-normal">Unreviewed</span>
					</Badge>
				</div>
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-44">Serial ID</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Comment</Table.Head>
						<Table.Head>Files</Table.Head>
						<Table.Head class="w-0">View</Table.Head>
						<Table.Head class="w-0 text-end">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each reviewRequest.expand?.applications || [] as application}
						<Table.Row>
							<!-- Serial ID -->

							<Table.Cell class="font-mono font-medium">
								{#if application.serial}
									{application.expand?.event.responsePrefix}{application.serial
										.toString()
										.padStart(3, '0')}
								{:else}
									{application.id}
								{/if}
							</Table.Cell>

							<!-- Status -->

							<Table.Cell>
								{#if reviewRequest.review?.[application.id]}
									<Status type={reviewRequest.review?.[application.id]?.status} />
								{:else}
									<Badge variant="outline">Unreviewed</Badge>
								{/if}
							</Table.Cell>

							<!-- Comment -->

							<Table.Cell class="line-clamp-4">
								{reviewRequest.review?.[application.id]?.comment ?? ''}
							</Table.Cell>

							<!-- Files -->

							<Table.Cell>
								{#each reviewRequest.review?.[application.id]?.files as file}
									<Button
										size="icon"
										variant="outline"
										href={pbImage(file.collectionId, file.recordId, file.file)}
										target="_blank"
									>
										<FileIcon />
									</Button>
								{/each}
							</Table.Cell>

							<!-- View -->

							<Table.Cell>
								<Button
									variant="outline"
									on:click={() => {
										viewOpen = true;
										openedApplication = application;
									}}
								>
									View Application
								</Button>
							</Table.Cell>

							<!-- Actions -->

							<Table.Cell>
								<div class="flex justify-end gap-1">
									<Tooltip.Root>
										<Tooltip.Trigger>
											<Button
												size="icon"
												class="bg-red-500 hover:bg-red-700"
												on:click={() => {
													openedStatus = 'rejected';
													openedApplication = application;
												}}
											>
												<X size="16" />
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content class="bg-black">
											<p>Reject application</p>
										</Tooltip.Content>
									</Tooltip.Root>

									<Tooltip.Root>
										<Tooltip.Trigger>
											<Button
												size="icon"
												class="bg-amber-500 hover:bg-amber-700"
												on:click={() => {
													openedStatus = 'editsRequested';
													openedApplication = application;
												}}
											>
												<PencilLine size="16" />
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content class="bg-black">
											<p>Request edits</p>
										</Tooltip.Content>
									</Tooltip.Root>

									<Tooltip.Root>
										<Tooltip.Trigger>
											<Button
												size="icon"
												class="bg-green-500 hover:bg-green-700"
												on:click={() => {
													openedStatus = 'approved';
													openedApplication = application;
												}}
											>
												<Check size="16" />
											</Button>
										</Tooltip.Trigger>
										<Tooltip.Content class="bg-black">
											<p>Approve application</p>
										</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
		<Card.Footer class="flex justify-end">
			<Button
				on:click={() => {
					submitOpen = true;
				}}
			>
				Submit Reviews
			</Button>
		</Card.Footer>
	</Card.Root>

	<Dialog.Root bind:open={openedStatus}>
		<Dialog.Content>
			<form
				method="POST"
				action="?/review"
				enctype="multipart/form-data"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success') {
							if (result.data?.record && reviewRequest && openedApplication && openedStatus) {
								reviewRequest = {
									...reviewRequest,
									review: {
										...reviewRequest.review,
										[openedApplication.id]: {
											status: openedStatus,
											comment: result.data.record.review[openedApplication.id]?.comment || '',
											files: result.data.record.review[openedApplication.id]?.files || []
										}
									}
								};
							}

							if (openedStatus === 'rejected') {
								toast.success('Application rejected successfully');
							} else if (openedStatus === 'editsRequested') {
								toast.success('Edits requested successfully');
							} else if (openedStatus === 'approved') {
								toast.success('Application approved successfully');
							}

							openedStatus = null;
							openedApplication = null;
						} else if (result.type === 'failure') {
							toast.error(result.data.message);
						} else {
							toast.error('An error occurred');
						}
					};
				}}
			>
				<Dialog.Header>
					<Dialog.Title
						class={`${
							openedStatus === 'rejected'
								? 'text-red-500'
								: openedStatus === 'editsRequested'
									? 'text-amber-500'
									: 'text-green-500'
						}`}
					>
						{#if openedStatus === 'rejected'}
							Rejecting
						{:else if openedStatus === 'editsRequested'}
							Requesting Edits
						{:else if openedStatus === 'approved'}
							Approving
						{/if}
						<span class="font-mono">
							{#if openedApplication?.serial}
								{openedApplication?.expand?.event.responsePrefix}{openedApplication.serial
									.toString()
									.padStart(3, '0')}
							{:else}
								{openedApplication?.id}
							{/if}
						</span>
					</Dialog.Title>
					<Dialog.Description>
						{#if openedStatus === 'rejected'}
							You are about to reject the application. If possible, please provide a reason for this
							rejection, helping the applicant understand why their application was rejected.
						{:else if openedStatus === 'editsRequested'}
							You are about to make suggestions for edits to the application, which the applicant
							can then make and resubmit for admins to review. Please provide comments explaining
							what edits are needed.
						{:else if openedStatus === 'approved'}
							You are about to approve the application. It is not necessary to provide a comment,
							but you may do so if you wish.
						{/if}
					</Dialog.Description>
				</Dialog.Header>
				<div class="pb-4">
					<input type="hidden" name="applicationId" value={openedApplication?.id} />
					<input type="hidden" name="action" value={openedStatus} />
					<Label>Comment</Label>
					<Textarea name="comment" />
					<div class="mt-2" />
					<Label>Attach File</Label>
					<Input type="file" multiple name="files" />
				</div>
				<Dialog.Footer>
					<Button
						type="button"
						variant="outline"
						on:click={() => {
							openedStatus = null;
							openedApplication = null;
						}}
					>
						Cancel
					</Button>

					<Button
						type="submit"
						class={`${
							openedStatus === 'rejected'
								? 'bg-red-500'
								: openedStatus === 'editsRequested'
									? 'bg-amber-500'
									: 'bg-green-500'
						}`}
					>
						{#if openedStatus === 'rejected'}
							Reject Application
						{:else if openedStatus === 'editsRequested'}
							Request Edits
						{:else if openedStatus === 'approved'}
							Approve Application
						{/if}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={viewOpen}>
		<Dialog.Content class="max-h-screen p-0">
			<Dialog.Header class="p-4 pb-0">
				<Dialog.Title>
					Application
					<span class="font-mono">
						{#if openedApplication?.serial}
							{openedApplication?.expand?.event.responsePrefix}{openedApplication.serial
								.toString()
								.padStart(3, '0')}
						{:else}
							{openedApplication?.id}
						{/if}
					</span>
				</Dialog.Title>
			</Dialog.Header>
			<ScrollArea class="flex max-h-[calc(100vh-6rem)] flex-col gap-2 p-4">
				{#if reviewRequest?.shareResponder}
					<div class="pb-6">
						<Label>Responder name</Label>
						<div class="text-sm text-muted-foreground">
							<span>{openedApplication?.expand?.responder?.name}</span>
						</div>
						<Label>Responder email</Label>
						<div class="text-sm text-muted-foreground">
							<span>{openedApplication?.expand?.responder?.email}</span>
						</div>
					</div>
				{/if}

				{#each openedApplication?.expand?.response || [] as answer}
					<div class="mb-2 text-sm leading-none">
						<span class="text-muted-foreground">{@html answer.expand?.question.title}</span>
						<ResponseRenderer data={answer} />
					</div>
				{/each}
			</ScrollArea>
		</Dialog.Content>
	</Dialog.Root>

	<Dialog.Root bind:open={submitOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Submitting Reviews</Dialog.Title>
				<Dialog.Description>
					You are about to submit your reviews for all applications. You will still be able to edit
					your reviews until the review request is closed. Once submitted, you will not be able to
					change your reviews.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button
					variant="outline"
					on:click={() => {
						submitOpen = false;
					}}
				>
					Cancel
				</Button>
				<form
					method="POST"
					action="?/submit"
					use:enhance={() => {
						return async ({ result }) => {
							if (result.type === 'success') {
								toast.success('Reviews submitted successfully');
								pb.authStore.clear();
								goto('/review/completed');
							} else if (result.type === 'failure') {
								toast.error(result.data.message);
							} else {
								toast.error('An error occurred');
							}
						};
					}}
				>
					<Button type="submit">Submit Reviews</Button>
				</form>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
