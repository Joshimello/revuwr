<script lang="ts">
	import Status from '$lib/components/status.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as m from '$lib/paraglide/messages.js';
	import { pbImage } from '$lib/pocketbase/client';
	import { Eye, FileIcon } from 'lucide-svelte';

	type Review = {
		reviewId: string;
		reviewer: string;
		status: string | undefined;
		comment: string | undefined;
	};

	export let reviews: Review[];

	let open = false;
</script>

<div class="flex gap-2">
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
