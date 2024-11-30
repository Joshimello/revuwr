<script lang="ts">
	import { onMount } from 'svelte';
	import { pb, pbImage } from '$lib/pocketbase/client';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import MemberTable from '../../../(main)/response/[id]/member-table.svelte';
	import ActivityTable from '../../../(main)/response/[id]/activity-table.svelte';
	import ResponseRenderer from '$lib/components/response-renderer.svelte';

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

	// const exportPDF = (contentElement: HTMLElement, name: string) => {
	//   const doc = new jsPDF("p", "pt", "a4");
	//   doc.html(contentElement, {
	//     callback: (doc) => {
	//       doc.save(`application-${name}.pdf`);
	//       toast.success('PDF exported successfully');
	//     }
	//   })
	// }

	let application: ExpandedApplication;
	let event: EventsResponse;
	let responder: UsersResponse;
	let response: AnswersResponse<
		any,
		{
			question: QuestionsResponse<any>;
		}
	>[];
	let contentElement: HTMLElement;

	onMount(async () => {
		try {
			application = await pb
				.collection('applications')
				.getOne<ExpandedApplication>($page.params.id, {
					expand: 'event,responder,response,response.question'
				});
			if (!application || !application.expand) {
				throw new Error('Application not found');
			}
			event = application.expand.event;
			responder = application.expand.responder;
			response = application.expand.response;

			setTimeout(() => {
				window.print();
			}, 2000);

			// setTimeout(() => {
			//   exportPDF(contentElement, application.id)
			// }, 1000);
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	});
</script>

{#if application && event}
	<div
		class="flex h-[297mm] w-[210mm] flex-col overflow-hidden border px-4 py-3"
		bind:this={contentElement}
	>
		<div class="mb-6 flex justify-between">
			<div class="flex flex-col">
				<span class="text-2xl font-bold leading-none">
					APPLICATION
					{event.responsePrefix}{application.serial.toString().padStart(3, '0')}
				</span>
				<span class="text-lg leading-none text-muted-foreground">
					{event.name}
				</span>
			</div>
			<div class="flex flex-col gap-1">
				<div class="flex gap-2 leading-none">
					<span class="text-muted-foreground">DATE</span>
					<span class="">
						{new Date().toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric'
						})}
					</span>
				</div>
				<span class="font-mono leading-none text-muted-foreground">
					{application.id}
				</span>
			</div>
		</div>

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">RESPONDER</span>
			<span class="">{responder.name} ({responder.username})</span>
		</div>

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">EMAIL</span>
			<span class="">{responder.email}</span>
		</div>

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">PHONE</span>
			<span class="">{responder.phone}</span>
		</div>

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">DEPARTMENT</span>
			<span class="">{responder.department}</span>
		</div>

		<div class="flex items-center gap-4 text-xl leading-none">
			<span class="text-muted-foreground">YEAR</span>
			<span class="">{responder.year}</span>
		</div>

		<div class="mt-6">
			{#each response as answer}
				<div class="">
					<div class="text-xs leading-none">
						<span class="text-muted-foreground">{@html answer.expand?.question.title}</span>

						<ResponseRenderer data={answer} />
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}
