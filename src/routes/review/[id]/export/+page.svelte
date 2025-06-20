<script lang="ts">
	import { page } from '$app/stores';
	import ActivityTable from '$lib/components/activity-table.svelte';
	import BudgetRenderer from '$lib/components/budget-renderer.svelte';
	import MemberTable from '$lib/components/member-table.svelte';
	import ResponseRenderer from '$lib/components/response-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import { Printer } from 'lucide-svelte';
	import { onMount } from 'svelte';

	export let data;
	const { reviewRequest } = data;

	let applications = reviewRequest?.expand?.applications || [];

	onMount(() => {
		document.title = `Review Export - ${$page.params.id}`;
	});
</script>

{#if applications.length > 0}
	<div class="p-8">
		<div class="screen-only mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-bold">
				Review Export - {applications.length} Applications
			</h1>

			<div class="flex items-center gap-2">
				<Button variant="outline" on:click={() => window.print()}>
					<Printer size={16} class="mr-2" />
					Print
				</Button>
			</div>
		</div>

		{#each applications as application, index}
			<div class="application-container page-break-after mb-4">
				<div class="mb-4 border-b border-gray-200 pb-4 print:border-none">
					<div class="flex items-center justify-between">
						<h2 class="text-xl font-bold">
							Application {index + 1} of {applications.length}
						</h2>

						<span class="font-mono font-medium">
							{#if application?.serial}
								{application?.expand?.event.responsePrefix}{application.serial
									.toString()
									.padStart(3, '0')}
							{:else}
								{application?.id}
							{/if}
						</span>
					</div>

					{#if reviewRequest?.shareResponder}
						<div class="mt-4 rounded border p-4 shadow print:border-gray-300 print:shadow-none">
							<h2 class="mb-2 text-lg font-semibold">Applicant Information</h2>
							<div class="grid grid-cols-2 gap-2">
								<div>
									<span class="font-medium">Name:</span>
									<span>{application?.expand?.responder?.name}</span>
								</div>
								<div>
									<span class="font-medium">Email:</span>
									<span>{application?.expand?.responder?.email}</span>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<Table.Root class="mb-4">
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-1/3">Question</Table.Head>
							<Table.Head>Response</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each application?.expand?.response || [] as response}
							{#if ['member'].includes(response.expand?.question.type)}
								<Table.Row>
									<Table.Cell class="font-medium"
										>{@html response.expand?.question.title}</Table.Cell
									>
									<Table.Cell>
										<div class="py-2">
											<MemberTable value={response.response} />
										</div>
									</Table.Cell>
								</Table.Row>
							{:else if ['activity'].includes(response.expand?.question.type)}
								<Table.Row>
									<Table.Cell class="font-medium"
										>{@html response.expand?.question.title}</Table.Cell
									>
									<Table.Cell>
										<div class="py-2">
											<ActivityTable value={response.response} />
										</div>
									</Table.Cell>
								</Table.Row>
							{:else if ['budget'].includes(response.expand?.question.type)}
								<Table.Row>
									<Table.Cell class="font-medium"
										>{@html response.expand?.question.title}</Table.Cell
									>
									<Table.Cell>
										<div class="border py-2">
											<BudgetRenderer data={response.response} />
										</div>
									</Table.Cell>
								</Table.Row>
							{:else}
								<Table.Row>
									<Table.Cell class="font-medium"
										>{@html response.expand?.question.title}</Table.Cell
									>
									<Table.Cell>
										<ResponseRenderer data={response} />
									</Table.Cell>
								</Table.Row>
							{/if}
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/each}
	</div>
{:else}
	<div class="flex flex-col items-center justify-center p-8">
		<h1 class="text-2xl font-bold">No applications found</h1>
		<p class="text-gray-500">There are no applications to review.</p>
	</div>
{/if}

<style>
	/* A4 is approximately 210mm x 297mm */
	.application-container {
		width: 100%;
		height: auto;
		max-width: 100%;
	}

	@media print {
		.screen-only {
			display: none !important;
		}

		.application-container {
			/* Page break after each application */
			page-break-after: always;
			break-after: page;

			/* A4 size adjustments */
			width: 210mm;
			min-height: 297mm;
			padding: 10mm;
			margin: 0;
			box-sizing: border-box;
		}

		button {
			display: none !important;
		}

		/* Ensure tables don't break across pages */
		table {
			page-break-inside: avoid;
		}

		/* Set print margins */
		@page {
			size: A4;
			margin: 15mm;
		}
	}

	.page-break-after {
		page-break-after: always;
		break-after: page;
	}
</style>
