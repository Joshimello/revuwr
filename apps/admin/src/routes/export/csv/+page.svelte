<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { pb, pbImage } from '$lib/pocketbase/client';
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

	const seriadaw = () => {};

	const serialize = (value: any) => {
		if (value === null || value === undefined) {
			return '';
		}
		const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value?.toString();
		return serializedValue?.replace(/,/g, '|');
	};

	const applicationIds = $page.url.searchParams.get('ids')?.split(',') || [];
	let allApplications: ExpandedApplication[] = [];

	onMount(async () => {
		try {
			allApplications = await pb.collection('applications').getFullList({
				expand: 'event,responder,response,response.question'
			});

			const applications = allApplications.filter((a) => applicationIds.includes(a.id));

			const allKeys = new Set<string>();

			applications.forEach((a) => {
				const keys = [
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
					'Responder Department',
					'Responder Year',
					...(a.expand?.response.map((r) => r.expand?.question.title ?? r.question) ?? [])
				];
				keys.forEach((key) => allKeys.add(key));
			});

			const rows = applications.map((a) => {
				const row: Record<string, string> = {};

				allKeys.forEach((key) => {
					row[key] = '';
				});

				row['Event Internal ID'] = a.expand?.event.id ?? '';
				row['Event Name'] = a.expand?.event.name ?? '';
				row['Application Internal ID'] = a.id;
				row['Application Serial'] =
					`${a.expand?.event.responsePrefix}${a.serial.toString().padStart(3, '0')}`;
				row['Status'] = a.status;
				row['Responder Internal ID'] = a.expand?.responder.id ?? '';
				row['Responder ID'] = a.expand?.responder.username ?? '';
				row['Responder Name'] = a.expand?.responder.name ?? '';
				row['Responder Email'] = a.expand?.responder.email ?? '';
				row['Responder Phone'] = a.expand?.responder.phone ?? '';
				row['Responder Occupation'] = a.expand?.responder.occupation ?? '';
				row['Responder Department'] = a.expand?.responder.department ?? '';
				row['Responder Year'] = a.expand?.responder.year ?? '';

				a.expand?.response.forEach((r) => {
					const questionTitle = r.expand?.question.title ?? r.question;
					row[questionTitle] = serialize(r.response);
				});

				return row;
			});

			const csvHeaders = Array.from(allKeys).join(',');
			const csvRows = rows
				.map((row) =>
					Array.from(allKeys)
						.map((key) => `"${row[key] ?? ''}"`)
						.join(',')
				)
				.join('\n');
			const csvContent = `${csvHeaders}\n${csvRows}`;

			const csvFile = 'data:text/csv;charset=utf-8,' + csvContent;
			const encodedUri = encodeURI(csvFile);

			var link = document.createElement('a');
			link.setAttribute('href', encodedUri);
			link.setAttribute('download', `${applications.length}_applications.csv`);
			document.body.appendChild(link);
			link.click();
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('An error occurred');
			}
		}
	});
</script>
