<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import { Button } from '$lib/components/ui/button';
	import * as m from '$lib/paraglide/messages.js';
	import { ChevronLeft } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import DataTable from './data-table.svelte';
	import { refreshReviewRequests } from './methods';
	import { event, reviewRequests } from './stores';
	import type { ExpandedApplication } from './types';

	$: reviewApplications = (() => {
		let arr: Record<
			string,
			{
				application: ExpandedApplication;
				reviews: {
					reviewId: string;
					reviewer: string;
					status: string | undefined;
					comment: string | undefined;
					files: { collectionId: string; recordId: string; file: string }[];
				}[];
			}
		> = {};
		$reviewRequests.forEach((rr) => {
			rr.expand?.applications.forEach((a) => {
				const reviewData = rr.review?.[a.id];
				if (arr[a.id]) {
					arr[a.id].reviews = [
						...arr[a.id].reviews,
						{
							reviewId: rr.id,
							reviewer: rr.reviewerEmail,
							status: reviewData?.status,
							comment: reviewData?.comment,
							files: reviewData?.files
						}
					];
				} else {
					arr[a.id] = {
						application: a,
						reviews: [
							{
								reviewId: rr.id,
								reviewer: rr.reviewerEmail,
								status: reviewData?.status,
								comment: reviewData?.comment,
								files: reviewData?.files
							}
						]
					};
				}
			});
		});
		return writable(Object.values(arr));
	})();

	onMount(() => {
		refreshReviewRequests();
	});
</script>

<div class="flex items-center gap-4">
	<Button
		variant="outline"
		size="icon"
		class="h-7 w-7"
		href={`${PUBLIC_BASE_PATH}/events/${$page.params.id}`}
	>
		<ChevronLeft class="h-4 w-4" />
		<span class="sr-only">Back</span>
	</Button>
	<h1 class="text-lg font-semibold md:text-2xl">
		{m.review_applications_overview()}
	</h1>
</div>

{#if $reviewApplications.length > 0 && $event}
	{#key reviewApplications}
		<div class="flex">
			<div class="w-0 flex-1 overflow-auto">
				<DataTable data={reviewApplications} event={$event} />
			</div>
		</div>
	{/key}
{:else}
	{m.no_review_requests_yet()}
{/if}
