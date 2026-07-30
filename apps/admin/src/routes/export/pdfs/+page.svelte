<script lang="ts">
	import ResponseRenderer from '$lib/components/response-renderer.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as m from '$lib/paraglide/messages.js';
	import { getAnswerDisplayState, type ExpandedAnswer } from '$lib/response-display';
	import { Printer } from 'lucide-svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	const { applications } = data;

	function responseSections(value: unknown) {
		const allAnswers = (Array.isArray(value) ? value : []) as ExpandedAnswer[];
		const answers = [...allAnswers]
			.filter((answer) => answer.expand?.question.type !== 'info')
			.sort((first, second) => {
				const firstQuestion = first.expand?.question;
				const secondQuestion = second.expand?.question;
				return (
					(firstQuestion?.page ?? 0) - (secondQuestion?.page ?? 0) ||
					(firstQuestion?.count ?? 0) - (secondQuestion?.count ?? 0)
				);
			})
			.map((answer, index) => ({ answer, number: index + 1 }));

		return Array.from(new Set(answers.map((item) => item.answer.expand?.question.page ?? 1))).map(
			(pageNumber) => ({
				pageNumber,
				allAnswers,
				answers: answers.filter((item) => (item.answer.expand?.question.page ?? 1) === pageNumber)
			})
		);
	}
</script>

{#if applications && applications.length > 0}
	<div class="p-8">
		<div class="screen-only mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-bold">
				Admin Export - {applications.length} Applications
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
				</div>

				<div class="mt-4 rounded border p-4 shadow print:border-gray-300 print:shadow-none">
					<h2 class="mb-2 text-lg font-semibold">Applicant Information</h2>
					<div class="grid grid-cols-2 gap-2">
						<div>
							<span class="font-medium">Name:</span>
							<span>{application?.expand?.responder?.name}</span>
						</div>
						<div>
							<span class="font-medium">ID:</span>
							<span>{application?.expand?.responder?.username}</span>
						</div>
						<div>
							<span class="font-medium">Email:</span>
							<span>{application?.expand?.responder?.email}</span>
						</div>
						<div>
							<span class="font-medium">Phone:</span>
							<span>{application?.expand?.responder?.phone}</span>
						</div>
					</div>
				</div>

				<div class="mb-4 mt-4 rounded border p-4 shadow print:border-gray-300 print:shadow-none">
					<h2 class="mb-2 text-lg font-semibold">Application Information</h2>
					<div class="grid grid-cols-1 gap-2">
						<div>
							<span class="font-medium">Status:</span>
							<span>{application?.status}</span>
						</div>
						<div>
							<span class="font-medium">Submitted At:</span>
							<span>{application?.created}</span>
						</div>
						<div>
							<span class="font-medium">Updated At:</span>
							<span>{application?.updated}</span>
						</div>
					</div>
				</div>

				<Table.Root class="mb-4">
					<Table.Header>
						<Table.Row>
							<Table.Head class="w-1/3">Question</Table.Head>
							<Table.Head>Response</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each responseSections(application?.expand?.response) as section}
							<Table.Row class="bg-muted/60">
								<Table.Cell colspan={2} class="font-semibold">
									{m.section_number({ number: section.pageNumber })}
								</Table.Cell>
							</Table.Row>
							{#each section.answers as item}
								{@const response = item.answer}
								{@const state = getAnswerDisplayState(response, section.allAnswers)}
								{#if response.expand?.question}
									<Table.Row>
										<Table.Cell class="align-top font-medium">
											<div class="mb-1 text-xs text-muted-foreground">
												{m.question_number({ number: item.number })}
												· {response.expand.question.required ? m.required() : m.optional()}
											</div>
											<!-- eslint-disable-next-line -->
											{@html response.expand.question.title}
										</Table.Cell>
										<Table.Cell class="align-top">
											<ResponseRenderer
												data={response}
												variant="print"
												{state}
												allAnswers={section.allAnswers}
											/>
										</Table.Cell>
									</Table.Row>
								{/if}
							{/each}
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
