<script lang="ts">
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { getResponseRepresentation } from '$lib/response-repr';
	import { CheckCircle, Download, XCircle } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	type ExpandedApplication = ApplicationsResponse<{
		event: EventsResponse;
		responder: UsersResponse;
		response: AnswersResponse<
			unknown,
			{
				question: QuestionsResponse<unknown>;
			}
		>[];
	}>;

	export let data: {
		applications: ExpandedApplication[];
		filename: string;
		eventName: string;
		message?: string;
	};
	const { applications, filename, eventName } = data;

	let downloadStatus: 'downloading' | 'success' | 'error' = 'downloading';

	// Helper function to strip HTML tags from question titles
	const stripHtml = (html: string): string => {
		if (!html) return '';
		return html.replace(/<[^>]*>/g, '').trim();
	};

	// Helper function to escape CSV values
	const escapeCsvValue = (value: string): string => {
		if (!value) return '';

		// If the value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
		if (
			value.includes('"') ||
			value.includes(',') ||
			value.includes('\n') ||
			value.includes('\r')
		) {
			return `"${value.replace(/"/g, '""')}"`;
		}
		return value;
	};

	const exportToCsv = async () => {
		if (!applications || applications.length === 0) {
			downloadStatus = 'error';
			toast.error('No applications to export');
			return;
		}

		try {
			downloadStatus = 'downloading';
			// Collect all unique headers
			const headers = new Set<string>();

			// Add responder fields
			const responderFields = [
				'Event Internal ID',
				'Event Name',
				'Application Internal ID',
				'Application Serial',
				'Status',
				'Responder Internal ID',
				'Responder ID',
				'Responder Name',
				'Responder Email',
				'Responder Phone',
				'Responder Occupation',
				'Responder College',
				'Responder Department',
				'Responder Year'
			];

			responderFields.forEach((field) => headers.add(field));

			// Collect all unique questions with their pages
			const questionsMap = new Map<string, { title: string; page: number; type: string }>();

			applications.forEach((app: ExpandedApplication) => {
				app.expand?.response?.forEach((resp) => {
					if (resp.expand?.question?.title) {
						const cleanTitle = stripHtml(resp.expand.question.title);
						const questionType = resp.expand.question.type || 'unknown';
						const questionPage = resp.expand.question.page || 0;

						if (cleanTitle) {
							questionsMap.set(cleanTitle, {
								title: cleanTitle,
								page: questionPage,
								type: questionType
							});
						}
					}
				});
			});

			// Sort questions by page and create headers with empty columns between pages
			const sortedQuestions = Array.from(questionsMap.values()).sort((a, b) => a.page - b.page);

			let currentPage = -1;
			sortedQuestions.forEach((question) => {
				if (currentPage !== -1 && question.page !== currentPage) {
					// Add empty column between pages
					headers.add('');
				}
				headers.add(question.title);
				currentPage = question.page;
			});

			const headerArray = Array.from(headers);

			// Generate CSV rows
			const rows = applications.map((app: ExpandedApplication) => {
				const row: Record<string, string> = {};

				// Initialize all headers with empty values
				headerArray.forEach((header) => {
					row[header] = '';
				});

				// Fill responder data
				row['Event Internal ID'] = app.expand?.event?.id || '';
				row['Event Name'] = app.expand?.event?.name || '';
				row['Application Internal ID'] = app.id;
				row['Application Serial'] =
					app.expand?.event?.responsePrefix && app.serial
						? `${app.expand.event.responsePrefix}${app.serial.toString().padStart(3, '0')}`
						: '';
				row['Status'] = app.status || '';
				row['Responder Internal ID'] = app.expand?.responder?.id || '';
				row['Responder ID'] = app.expand?.responder?.username || '';
				row['Responder Name'] = app.expand?.responder?.name || '';
				row['Responder Email'] = app.expand?.responder?.email || '';
				row['Responder Phone'] = app.expand?.responder?.phone || '';
				row['Responder Occupation'] = app.expand?.responder?.occupation || '';
				row['Responder College'] = app.expand?.responder?.department || '';
				row['Responder Department'] =
					app.expand?.responder?.department || app.expand?.responder?.dept || '';
				row['Responder Year'] = app.expand?.responder?.year || '';

				// Fill response data using response-repr utility
				app.expand?.response?.forEach((resp) => {
					if (resp.expand?.question?.title) {
						const cleanTitle = stripHtml(resp.expand.question.title);
						if (cleanTitle) {
							const representation = getResponseRepresentation(resp);
							row[cleanTitle] = representation;
						}
					}
				});

				// Leave empty separator columns empty (they have empty string as header)
				headerArray.forEach((header) => {
					if (header === '') {
						row[header] = '';
					}
				});

				return row;
			});

			// Generate CSV content
			const csvHeaders = headerArray.map(escapeCsvValue).join(',');
			const csvRows = rows
				.map((row: Record<string, string>) =>
					headerArray.map((header) => escapeCsvValue(row[header] || '')).join(',')
				)
				.join('\n');

			// Add UTF-8 BOM for proper Chinese character display in Excel
			const BOM = '\uFEFF';
			const csvContent = `${BOM}${csvHeaders}\n${csvRows}`;

			// Create and download file
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const link = document.createElement('a');
			const url = URL.createObjectURL(blob);

			link.setAttribute('href', url);
			link.setAttribute('download', filename);
			link.style.visibility = 'hidden';

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			downloadStatus = 'success';
			toast.success(`Successfully exported ${applications.length} applications to CSV`);
		} catch (error) {
			console.error('Export error:', error);
			downloadStatus = 'error';
			toast.error('Failed to export CSV. Please try again.');
		}
	};

	onMount(() => {
		if (applications && applications.length > 0) {
			exportToCsv();
		} else {
			downloadStatus = 'error';
		}
	});
</script>

<div class="container mx-auto flex min-h-screen items-center justify-center p-8">
	<div class="text-center">
		{#if downloadStatus === 'downloading'}
			<div class="mb-4 flex justify-center">
				<Download size={64} class="animate-bounce text-blue-500" />
			</div>
			<h1 class="mb-2 text-2xl font-bold">Downloading CSV...</h1>
			<p class="text-muted-foreground">{filename}</p>
			<p class="mt-2 text-sm text-muted-foreground">
				{applications.length} applications from {eventName}
			</p>
		{:else if downloadStatus === 'success'}
			<div class="mb-4 flex justify-center">
				<CheckCircle size={64} class="text-green-500" />
			</div>
			<h1 class="mb-2 text-2xl font-bold">Download Complete!</h1>
			<p class="text-muted-foreground">{filename}</p>
			<p class="mt-2 text-sm text-muted-foreground">
				Successfully exported {applications.length} applications
			</p>
		{:else}
			<div class="mb-4 flex justify-center">
				<XCircle size={64} class="text-red-500" />
			</div>
			<h1 class="mb-2 text-2xl font-bold">Download Failed</h1>
			{#if data.message}
				<p class="text-destructive">{data.message}</p>
			{:else}
				<p class="text-muted-foreground">Unable to export applications</p>
			{/if}
		{/if}
	</div>
</div>
