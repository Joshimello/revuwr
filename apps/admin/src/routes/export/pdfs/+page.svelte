<script lang="ts">
	import { page } from '$app/stores';
	import ResponseRenderer from '$lib/components/response-renderer.svelte';
	import { pb } from '$lib/pocketbase/client';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	type ExpandedApplication = ApplicationsResponse<{
		event: EventsResponse;
		responder: UsersResponse;
		response: AnswersResponse<
			any,
			{
				question: QuestionsResponse<any>;
			}
		>[];
	}>;

	let contentElement: HTMLElement;

	const applicationIds = $page.url.searchParams.get('ids')?.split(',') || [];
	let applications: ExpandedApplication[] = [];

	onMount(async () => {
		try {
			const allApplications = await pb.collection('applications').getFullList<ExpandedApplication>({
				expand: 'event,responder,response,response.question'
			});

			if (!allApplications[0].expand) return;
			applications = allApplications.filter((a) => applicationIds.includes(a.id));

			setTimeout(() => {
				window.print();
			}, 2000);
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
	<div
		class="flex h-[297mm] w-[210mm] flex-col overflow-hidden border px-4 py-3"
		bind:this={contentElement}
	>
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

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">RESPONDER</span>
			<span class=""
				>{application.expand?.responder.name} ({application.expand?.responder.username})</span
			>
		</div>

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">EMAIL</span>
			<span class="">{application.expand?.responder.email}</span>
		</div>

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">PHONE</span>
			<span class="">{application.expand?.responder.phone}</span>
		</div>

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">COLLEGE</span>
			<span class="">{application.expand?.responder.department}</span>
		</div>

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">YEAR</span>
			<span class="">{application.expand?.responder.year}</span>
		</div>

		<div class="mt-6">
			{#each application.expand?.response ?? [] as answer}
				<div class="">
					<div class="text-xs leading-none">
						<span class="text-muted-foreground">{@html answer.expand?.question.title}</span>

						<ResponseRenderer data={answer} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/each}
