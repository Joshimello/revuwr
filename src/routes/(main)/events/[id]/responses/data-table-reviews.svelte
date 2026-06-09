<script lang="ts">
	import Status from '$lib/components/status.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as m from '$lib/paraglide/messages.js';
	import { pbImage } from '$lib/pocketbase/client';
	import { Eye, FileIcon } from 'lucide-svelte';
	import { reviewRequests } from '../overview/stores';
	import type { ApplicationsResponse } from '$lib/pocketbase/pocketbase-types';

	export let record: ApplicationsResponse;

	// Get reviews for this application from the stored review requests
	$: reviews = (() => {
		let result = [];
		for (const rr of $reviewRequests) {
			if (rr.applications && rr.applications.includes(record.id)) {
				const reviewData = rr.review?.[record.id];
				result.push({
					reviewId: rr.id,
					reviewer: rr.reviewerEmail,
					status: reviewData?.status,
					comment: reviewData?.comment,
					files: reviewData?.files
				});
			}
		}
		return result;
	})();

	let open = false;
</script>

<div class="flex gap-2">
	{#if reviews && reviews.length > 0}
		<div>
			<div class="flex font-mono font-medium text-muted-foreground">
				<span class="text-green-500">{reviews.filter((i) => i.status == 'approved').length}</span> /
				<span class="text-yellow-500"
					>{reviews.filter((i) => i.status == 'editsRequested').length}</span
				>
				/
				<span class="text-red-500">{reviews.filter((i) => i.status == 'rejected').length}</span> /
				<span>{reviews.filter((i) => !i.status).length}</span>
			</div>
			<div class="text-xs text-muted-foreground">
				{reviews.length}
				{m.reviews()}
			</div>
		</div>
		<Button variant="ghost" size="icon" on:click={() => (open = true)}>
			<Eye size="20" class="text-muted-foreground" />
		</Button>
	{:else}
		<div class="text-xs text-muted-foreground">
			{m.no_reviews()}
		</div>
	{/if}
</div>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-screen overflow-auto">
		<Dialog.Header>
			<Dialog.Title>
				{m.comments_by_reviewers()}
			</Dialog.Title>
		</Dialog.Header>
		<div class="space-y-1">
			{#each reviews as review}
				<div class="flex flex-col rounded-md border p-2">
					<div class="flex items-center gap-2">
						<Status type={review.status ?? 'draft'} />
						<span class="text-xs">{review.reviewer}</span>
					</div>
					{#if review.comment}
						<div class="text-sm">{review.comment}</div>
					{/if}
					{#if review.files}
						{#each review.files as file}
							<Button
								size="icon"
								variant="outline"
								href={pbImage(file.collectionId, file.recordId, file.file)}
								target="_blank"
							>
								<FileIcon />
							</Button>
						{/each}
					{/if}
				</div>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>