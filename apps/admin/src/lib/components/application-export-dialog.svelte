<script lang="ts">
	import { PUBLIC_BASE_PATH } from '$env/static/public';
	import type {
		ApplicantExportField,
		ApplicationExportField,
		ApplicationExportRequest,
		ExportFormat,
		ExportPreferences
	} from '$lib/export/types';
	import { stripHtml } from '$lib/response-display';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Switch } from '$lib/components/ui/switch';
	import * as m from '$lib/paraglide/messages.js';
	import { languageTag } from '$lib/paraglide/runtime.js';
	import { pb } from '$lib/pocketbase/client';
	import type {
		AnswersResponse,
		ApplicationsResponse,
		EventsResponse,
		QuestionsResponse,
		UsersResponse
	} from '$lib/pocketbase/pocketbase-types';
	import { getResponseRepresentation } from '$lib/response-repr';
	import { Download, FileSpreadsheet, FileText, LoaderCircle } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	type ExpandedEvent = EventsResponse<
		unknown,
		{
			questions: QuestionsResponse[];
		}
	>;
	type PreviewAnswer = AnswersResponse<
		unknown,
		{
			question: QuestionsResponse<unknown, unknown>;
		}
	>;
	type PreviewApplication = ApplicationsResponse<{
		responder: UsersResponse;
		response: PreviewAnswer[];
	}>;

	export let open = false;
	export let eventId: string;
	export let applicationIds: string[];

	const defaultApplicationFields: ApplicationExportField[] = [
		'eventName',
		'serial',
		'status',
		'submissionTime',
		'updated'
	];
	const defaultApplicantFields: ApplicantExportField[] = ['username', 'name', 'email', 'phone'];

	const applicationFieldOptions: {
		key: ApplicationExportField;
		label: () => string;
	}[] = [
		{ key: 'eventName', label: () => m.event_name() },
		{ key: 'serial', label: () => m.application_serial() },
		{ key: 'status', label: () => m.status() },
		{ key: 'created', label: () => m.created_at() },
		{ key: 'submissionTime', label: () => m.submitted_at() },
		{ key: 'updated', label: () => m.updated() },
		{ key: 'internalId', label: () => m.application_internal_id() },
		{ key: 'adminNote', label: () => m.admin_note() }
	];
	const applicantFieldOptions: {
		key: ApplicantExportField;
		label: () => string;
	}[] = [
		{ key: 'username', label: () => m.applicant_id() },
		{ key: 'name', label: () => m.applicant_name() },
		{ key: 'nameEn', label: () => m.applicant_english_name() },
		{ key: 'email', label: () => m.applicant_email() },
		{ key: 'phone', label: () => m.applicant_phone() },
		{ key: 'occupation', label: () => m.occupation() },
		{ key: 'college', label: () => m.college() },
		{ key: 'department', label: () => m.department() },
		{ key: 'year', label: () => m.year() },
		{ key: 'country', label: () => m.country() },
		{ key: 'birthday', label: () => m.birthday() },
		{ key: 'internalId', label: () => m.applicant_internal_id() }
	];

	let eventName = '';
	let eventResponsePrefix = '';
	let questions: QuestionsResponse[] = [];
	let previewApplication: PreviewApplication | null = null;
	let format: ExportFormat = 'xlsx';
	let fullExcelRepresentation = false;
	let selectedApplicationFields: ApplicationExportField[] = [...defaultApplicationFields];
	let selectedApplicantFields: ApplicantExportField[] = [...defaultApplicantFields];
	let selectedQuestionIds: string[] = [];
	let loadedEventId = '';
	let loadedApplicationId = '';
	let isLoadingOptions = false;
	let isExporting = false;
	let errorMessage = '';

	$: selectedFieldCount =
		selectedApplicationFields.length + selectedApplicantFields.length + selectedQuestionIds.length;

	$: firstApplicationId = applicationIds[0] || '';

	$: if (
		open &&
		eventId &&
		firstApplicationId &&
		(loadedEventId !== eventId || loadedApplicationId !== firstApplicationId) &&
		!isLoadingOptions
	) {
		void loadOptions();
	}

	function preferenceKey(): string {
		return `revuwr:application-export:v1:${eventId}`;
	}

	function restorePreferences(exportableQuestions: QuestionsResponse[]): void {
		const stored = localStorage.getItem(preferenceKey());
		if (!stored) {
			format = 'xlsx';
			fullExcelRepresentation = false;
			selectedApplicationFields = [...defaultApplicationFields];
			selectedApplicantFields = [...defaultApplicantFields];
			selectedQuestionIds = exportableQuestions.map((question) => question.id);
			return;
		}

		try {
			const preferences = JSON.parse(stored) as ExportPreferences;
			if (preferences.version !== 1) throw new Error('Unsupported export preference version');
			const questionIds = new Set(exportableQuestions.map((question) => question.id));
			format = preferences.format === 'pdf' ? 'pdf' : 'xlsx';
			fullExcelRepresentation = preferences.xlsxRepresentation === 'full';
			selectedApplicationFields = preferences.applicationFields.filter((field) =>
				applicationFieldOptions.some((option) => option.key === field)
			);
			selectedApplicantFields = preferences.applicantFields.filter((field) =>
				applicantFieldOptions.some((option) => option.key === field)
			);
			selectedQuestionIds = preferences.questionIds.filter((id) => questionIds.has(id));
		} catch {
			localStorage.removeItem(preferenceKey());
			selectedApplicationFields = [...defaultApplicationFields];
			selectedApplicantFields = [...defaultApplicantFields];
			selectedQuestionIds = exportableQuestions.map((question) => question.id);
			fullExcelRepresentation = false;
		}
	}

	async function loadOptions(): Promise<void> {
		isLoadingOptions = true;
		errorMessage = '';
		loadedEventId = eventId;
		loadedApplicationId = firstApplicationId;
		previewApplication = null;

		try {
			const [event, application] = await Promise.all([
				pb.collection('events').getOne<ExpandedEvent>(eventId, {
					expand: 'questions'
				}),
				pb.collection('applications').getOne<PreviewApplication>(firstApplicationId, {
					expand: 'responder,response,response.question'
				})
			]);
			eventName = event.name;
			eventResponsePrefix = event.responsePrefix;
			previewApplication = application;
			questions = [...(event.expand?.questions || [])]
				.filter((question) => question.type !== 'info')
				.sort((first, second) => first.page - second.page || first.count - second.count);
			restorePreferences(questions);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : m.export_failed();
		} finally {
			isLoadingOptions = false;
		}
	}

	function formatPreviewDate(value: string, dateOnly = false): string {
		if (!value) return '';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;

		const locale = languageTag() === 'zh-tw' ? 'zh-TW' : 'en-US';
		if (dateOnly) {
			return new Intl.DateTimeFormat(locale, {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				timeZone: 'UTC'
			}).format(date);
		}

		return new Intl.DateTimeFormat(locale, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		}).format(date);
	}

	function statusPreview(status: string): string {
		const statusLabels: Record<string, () => string> = {
			draft: m.draft,
			submitted: m.submitted,
			approved: m.approved,
			resubmitted: m.resubmitted,
			editsRequested: m.edits_requested,
			followUpRequested: m.follow_up_requested,
			rejected: m.rejected,
			withdrawn: m.withdrawn,
			trashed: m.trashed
		};
		return statusLabels[status]?.() || status;
	}

	function applicationPreview(field: ApplicationExportField): string {
		if (!previewApplication) return '';

		switch (field) {
			case 'eventName':
				return eventName;
			case 'serial':
				return previewApplication.serial
					? `${eventResponsePrefix}${previewApplication.serial.toString().padStart(3, '0')}`
					: previewApplication.id;
			case 'status':
				return statusPreview(previewApplication.status);
			case 'created':
				return formatPreviewDate(previewApplication.created);
			case 'submissionTime':
				return formatPreviewDate(previewApplication.submissionTime);
			case 'updated':
				return formatPreviewDate(previewApplication.updated);
			case 'internalId':
				return previewApplication.id;
			case 'adminNote':
				return previewApplication.adminNote;
		}
	}

	function applicantPreview(field: ApplicantExportField): string {
		const responder = previewApplication?.expand?.responder;
		if (!responder) return '';

		switch (field) {
			case 'username':
				return responder.username;
			case 'name':
				return responder.name;
			case 'nameEn':
				return responder.nameEn;
			case 'email':
				return responder.email;
			case 'phone':
				return responder.phone;
			case 'occupation':
				return responder.occupation;
			case 'college':
				return responder.department;
			case 'department':
				return responder.dept;
			case 'year':
				return responder.year;
			case 'country':
				return responder.country;
			case 'birthday':
				return formatPreviewDate(responder.birthday, true);
			case 'internalId':
				return responder.id;
		}
	}

	function questionPreview(question: QuestionsResponse): string {
		if (!['shortText', 'longText', 'email', 'phone', 'radio', 'checkbox'].includes(question.type)) {
			return '';
		}

		const answer = previewApplication?.expand?.response?.find(
			(item) => item.question === question.id
		);
		if (!answer) return '';

		const answerWithQuestion = answer.expand?.question
			? answer
			: { ...answer, expand: { question } };
		return stripHtml(getResponseRepresentation(answerWithQuestion)).trim();
	}

	function toggleApplicationField(field: ApplicationExportField, checked: boolean): void {
		selectedApplicationFields = checked
			? [...new Set([...selectedApplicationFields, field])]
			: selectedApplicationFields.filter((item) => item !== field);
	}

	function toggleApplicantField(field: ApplicantExportField, checked: boolean): void {
		selectedApplicantFields = checked
			? [...new Set([...selectedApplicantFields, field])]
			: selectedApplicantFields.filter((item) => item !== field);
	}

	function toggleQuestion(questionId: string, checked: boolean): void {
		selectedQuestionIds = checked
			? [...new Set([...selectedQuestionIds, questionId])]
			: selectedQuestionIds.filter((item) => item !== questionId);
	}

	function savePreferences(): void {
		const preferences: ExportPreferences = {
			version: 1,
			format,
			xlsxRepresentation: fullExcelRepresentation ? 'full' : 'compact',
			applicationFields: selectedApplicationFields,
			applicantFields: selectedApplicantFields,
			questionIds: selectedQuestionIds
		};
		localStorage.setItem(preferenceKey(), JSON.stringify(preferences));
	}

	function responseFilename(response: Response): string {
		const disposition = response.headers.get('content-disposition') || '';
		const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
		if (encoded) return decodeURIComponent(encoded);
		const plain = disposition.match(/filename="([^"]+)"/i)?.[1];
		return plain || `applications-export.${format === 'xlsx' ? 'xlsx' : 'pdf'}`;
	}

	async function exportApplications(): Promise<void> {
		if (selectedFieldCount === 0) {
			errorMessage = m.no_fields_selected();
			return;
		}

		isExporting = true;
		errorMessage = '';
		savePreferences();

		const payload: ApplicationExportRequest = {
			eventId,
			applicationIds,
			format,
			xlsxRepresentation: fullExcelRepresentation ? 'full' : 'compact',
			locale: languageTag(),
			fields: {
				application: selectedApplicationFields,
				applicant: selectedApplicantFields,
				questionIds: selectedQuestionIds
			}
		};

		try {
			const response = await fetch(`${PUBLIC_BASE_PATH}/api/exports/applications`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const result = await response.json().catch(() => null);
				throw new Error(result?.message || m.export_failed());
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = responseFilename(response);
			document.body.appendChild(link);
			link.click();
			link.remove();
			window.setTimeout(() => URL.revokeObjectURL(url), 0);

			toast.success(m.download());
			open = false;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : m.export_failed();
			toast.error(errorMessage);
		} finally {
			isExporting = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-h-[90vh] max-w-3xl overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{m.export_applications()}</Dialog.Title>
			<Dialog.Description>
				{m.export_applications_desc()}
				{#if eventName}
					<span class="mt-1 block font-medium text-foreground">{eventName}</span>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		{#if isLoadingOptions}
			<div class="flex min-h-56 items-center justify-center">
				<LoaderCircle class="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		{:else}
			<div class="grid grid-cols-2 gap-3">
				<button
					type="button"
					class="flex items-center gap-3 rounded-md border p-4 text-left transition-colors {format ===
					'xlsx'
						? 'border-primary bg-muted'
						: 'hover:bg-muted/50'}"
					on:click={() => (format = 'xlsx')}
				>
					<FileSpreadsheet class="h-5 w-5" />
					<span class="font-medium">{m.excel_xlsx()}</span>
				</button>
				<button
					type="button"
					class="flex items-center gap-3 rounded-md border p-4 text-left transition-colors {format ===
					'pdf'
						? 'border-primary bg-muted'
						: 'hover:bg-muted/50'}"
					on:click={() => (format = 'pdf')}
				>
					<FileText class="h-5 w-5" />
					<span class="font-medium">{m.pdf_documents()}</span>
				</button>
			</div>

			{#if format === 'xlsx'}
				<div class="flex items-center justify-between gap-4 rounded-md border p-4">
					<div class="space-y-1">
						<p class="font-medium">{m.excel_representation()}</p>
						<p class="text-sm text-muted-foreground">
							{m.excel_full_representation_desc()}
						</p>
					</div>
					<div class="flex shrink-0 items-center gap-2 text-sm">
						<span class:text-muted-foreground={fullExcelRepresentation}>
							{m.excel_compact_representation()}
						</span>
						<Switch
							id="excel-full-representation"
							bind:checked={fullExcelRepresentation}
						/>
							<Label
								for="excel-full-representation"
								class={!fullExcelRepresentation ? 'text-muted-foreground' : ''}
							>
							{m.excel_full_representation()}
						</Label>
					</div>
				</div>
			{/if}

			<Separator />

			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<Label class="text-base font-semibold">{m.application_fields()}</Label>
					<div class="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							on:click={() =>
								(selectedApplicationFields = applicationFieldOptions.map((option) => option.key))}
						>
							{m.select_all()}
						</Button>
						<Button variant="ghost" size="sm" on:click={() => (selectedApplicationFields = [])}>
							{m.clear_all()}
						</Button>
					</div>
				</div>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each applicationFieldOptions as option}
						{@const preview = applicationPreview(option.key)}
						<label
							for={`export-application-${option.key}`}
							class="flex items-center gap-2 text-sm"
						>
							<Checkbox
								id={`export-application-${option.key}`}
								checked={selectedApplicationFields.includes(option.key)}
								onCheckedChange={(checked) => toggleApplicationField(option.key, checked === true)}
							/>
							{option.label()}
							{#if preview}
								<span
									class="inline-block max-w-48 truncate align-bottom text-muted-foreground"
									title={preview}
								>
									({m.export_example({ value: preview })})
								</span>
							{/if}
						</label>
					{/each}
				</div>
			</div>

			<Separator />

			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<Label class="text-base font-semibold">{m.applicant_fields()}</Label>
					<div class="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							on:click={() =>
								(selectedApplicantFields = applicantFieldOptions.map((option) => option.key))}
						>
							{m.select_all()}
						</Button>
						<Button variant="ghost" size="sm" on:click={() => (selectedApplicantFields = [])}>
							{m.clear_all()}
						</Button>
					</div>
				</div>
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each applicantFieldOptions as option}
						{@const preview = applicantPreview(option.key)}
						<label
							for={`export-applicant-${option.key}`}
							class="flex items-center gap-2 text-sm"
						>
							<Checkbox
								id={`export-applicant-${option.key}`}
								checked={selectedApplicantFields.includes(option.key)}
								onCheckedChange={(checked) => toggleApplicantField(option.key, checked === true)}
							/>
							{option.label()}
							{#if preview}
								<span
									class="inline-block max-w-48 truncate align-bottom text-muted-foreground"
									title={preview}
								>
									({m.export_example({ value: preview })})
								</span>
							{/if}
						</label>
					{/each}
				</div>
			</div>

			<Separator />

			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<Label class="text-base font-semibold">{m.response_fields()}</Label>
					<div class="flex gap-2">
						<Button
							variant="ghost"
							size="sm"
							on:click={() => (selectedQuestionIds = questions.map((question) => question.id))}
						>
							{m.select_all()}
						</Button>
						<Button variant="ghost" size="sm" on:click={() => (selectedQuestionIds = [])}>
							{m.clear_all()}
						</Button>
					</div>
				</div>
				<div class="grid max-h-64 grid-cols-1 gap-3 overflow-y-auto pr-2">
					{#each questions as question, index}
						{@const preview = questionPreview(question)}
						<label
							for={`export-question-${question.id}`}
							class="flex items-start gap-2 text-sm"
						>
							<Checkbox
								id={`export-question-${question.id}`}
								class="mt-0.5"
								checked={selectedQuestionIds.includes(question.id)}
								onCheckedChange={(checked) => toggleQuestion(question.id, checked === true)}
							/>
							<span>
								<span class="mr-1 text-muted-foreground">{index + 1}.</span>
								{stripHtml(question.title) || question.id}
								{#if preview}
									<span
										class="ml-1 inline-block max-w-72 truncate align-bottom text-muted-foreground"
										title={preview}
									>
										({m.export_example({ value: preview })})
									</span>
								{/if}
							</span>
						</label>
					{/each}
				</div>
			</div>
		{/if}

		{#if errorMessage}
			<p class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errorMessage}</p>
		{/if}

		<Dialog.Footer class="items-center sm:justify-between">
			<span class="text-sm text-muted-foreground">
				{m.selected_applications_count({ count: applicationIds.length })}
			</span>
			<Button
				on:click={exportApplications}
				disabled={isLoadingOptions || isExporting || selectedFieldCount === 0}
			>
				{#if isExporting}
					<LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
					{m.generating_export()}
				{:else}
					<Download class="mr-2 h-4 w-4" />
					{#if format === 'xlsx'}
						{m.download_excel()}
					{:else if applicationIds.length === 1}
						{m.download_pdf()}
					{:else}
						{m.download_pdf_zip({ count: applicationIds.length })}
					{/if}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
