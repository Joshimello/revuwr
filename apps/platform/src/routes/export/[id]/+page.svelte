<script lang="ts">
	import { pb, pbImage } from '$lib/pocketbase/client';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		ReviewsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/stores';
	import MemberTable from '../../review/[id]/member-table.svelte';
	import ActivityTable from '../../review/[id]/activity-table.svelte';

	type ExpandedReviews = ReviewsResponse<
		Record<string, { status: string; comment: string }>,
		{
			applications: ApplicationsResponse<{
				event: EventsResponse;
				response: AnswersResponse<
					any,
					{
						question: QuestionsResponse<any>;
					}
				>[];
			}>[];
		}
	>;

	type ExpandedApplication = ApplicationsResponse<{
		event: EventsResponse;
		response: AnswersResponse<
			any,
			{
				question: QuestionsResponse<any>;
			}
		>[];
	}>;

	let applications: ExpandedApplication[] = [];

	onMount(async () => {
		try {
			const reviewRequest = await pb
				.collection('reviews')
				.getOne<ExpandedReviews>($page.params.id, {
					expand:
						'applications,applications.event,applications.response,applications.response.question'
				});
			applications = reviewRequest.expand?.applications || [];
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	});
</script>

{#each applications as application}
	<div class="flex h-[297mm] w-[210mm] flex-col overflow-hidden border px-4 py-3">
		<div class="mb-6 flex justify-between">
			<div class="flex flex-col">
				<span class="text-2xl font-bold leading-none">
					APPLICATION
					{application.expand?.event.responsePrefix}{application.serial.toString().padStart(3, '0')}
				</span>
				<span class="text-lg leading-none text-muted-foreground"
					>{application.expand?.event.name}</span
				>
			</div>
			<div class="flex flex-col gap-1">
				<div class="flex gap-2 leading-none">
					<span class="text-muted-foreground">DATE</span>
					<span class=""
						>{new Date().toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}</span
					>
				</div>
				<span class="font-mono leading-none text-muted-foreground">
					{application.id}
				</span>
			</div>
		</div>

		<!-- <div class="flex gap-4 items-center text-xl leading-none">
      <span class="text-muted-foreground">RESPONDER</span>
      <span class="">{application.expand?.responder.name} ({application.expand?.responder.username})</span>
    </div>

    <div class="flex gap-4 items-center text-xl leading-none">
      <span class="text-muted-foreground">EMAIL</span>
      <span class="">{application.expand?.responder.email}</span>
    </div>

    <div class="flex gap-4 items-center text-xl leading-none">
      <span class="text-muted-foreground">PHONE</span>
      <span class="">{application.expand?.responder.phone}</span>
    </div>

    <div class="flex gap-4 items-center text-xl leading-none">
      <span class="text-muted-foreground">DEPARTMENT</span>
      <span class="">{application.expand?.responder.department}</span>
    </div>

    <div class="flex gap-4 items-center text-xl leading-none">
      <span class="text-muted-foreground">YEAR</span>
      <span class="">{application.expand?.responder.year}</span>
    </div> -->

		<div class="mt-6">
			{#each application.expand?.response ?? [] as answer}
				<div class="">
					<div class="text-xs leading-none">
						<span class="text-muted-foreground">{@html answer.expand?.question.title}</span>
						{#if !answer.response && !['file'].includes(answer.expand?.question.type ?? '')}
							<span>-</span>
						{:else if answer.expand?.question.type == 'radio'}
							{#if answer.response?.selected == answer.expand?.question.options?.choices.length}
								<span>{answer.response?.others}</span>
							{:else}
								<span
									>{answer.expand?.question.options?.choices[
										answer.response?.selected ?? '0'
									]}</span
								>
							{/if}
						{:else if answer.expand?.question.type == 'member'}
							<div style="zoom: 0.5">
								<MemberTable value={answer.response} />
							</div>
						{:else if answer.expand?.question.type == 'activity'}
							<div style="zoom: 0.5">
								<ActivityTable value={answer.response} />
							</div>
						{:else if answer.expand?.question.type == 'file'}
							<div class="flex flex-col">
								{#each answer.response as { collectionId, files, recordId }}
									{#each files as file}
										<a
											class="text-blue-500 underline"
											href={pbImage(collectionId, recordId, file)}
											target="_blank"
										>
											{file}
										</a>
									{/each}
								{/each}
							</div>
						{:else}
							<span>{answer.response}</span>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
{/each}
