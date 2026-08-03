import { PUBLIC_PB_URL } from '$env/static/public';
import type {
	NormalizedApplicationExport,
	NormalizedExportAnswer,
	NormalizedExportApplication,
	NormalizedExportQuestion,
	ApplicationExportRequest
} from '$lib/export/types';
import type {
	AnswersResponse,
	ApplicationsResponse,
	EventsResponse,
	QuestionsResponse,
	UsersResponse
} from '$lib/pocketbase/pocketbase-types';
import { getAnswerDisplayState, stripHtml, type ExpandedAnswer } from '$lib/response-display';
import { getResponseRepresentation } from '$lib/response-repr';
import { getExportLabels } from './labels';

export type ExportQuestion = QuestionsResponse<Record<string, unknown>, Record<string, unknown>>;
export type ExportAnswer = AnswersResponse<
	unknown,
	{
		question: ExportQuestion;
	}
>;
export type ExportApplication = ApplicationsResponse<{
	event: EventsResponse;
	responder: UsersResponse;
	response: ExportAnswer[];
}>;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string {
	if (value === null || value === undefined) return '';
	return String(value);
}

function formatObjectRows(value: unknown): string {
	if (!Array.isArray(value)) return '';

	return value
		.map((row, index) => {
			if (!isRecord(row)) return `${index + 1}. ${asString(row)}`;
			const values = Object.entries(row)
				.filter(([, item]) => item !== '' && item !== null && item !== undefined)
				.map(([key, item]) => `${humanizeKey(key)}: ${asString(item)}`);
			return `${index + 1}. ${values.join(' | ')}`;
		})
		.join('\n');
}

function getTableRows(value: unknown, keys: string[]): Record<string, string>[] {
	if (!Array.isArray(value)) return [];

	return value
		.filter(isRecord)
		.map((row) => Object.fromEntries(keys.map((key) => [key, asString(row[key])])));
}

function humanizeKey(value: string): string {
	return value
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replaceAll('_', ' ')
		.replace(/^./, (character) => character.toUpperCase());
}

function formatBudget(answer: ExportAnswer, totalLabel: string): { detail: string; total: string } {
	const rows = Array.isArray(answer.response)
		? answer.response
		: isRecord(answer.response)
			? Object.values(answer.response)
			: [];

	const detail = rows
		.map((row, index) => {
			if (!isRecord(row)) return `${index + 1}. ${asString(row)}`;
			const name = asString(row.name) || `${index + 1}`;
			const price = Number(row.defaultPrice || 0);
			const quantity = Number(row.defaultQuantity || 0);
			const explanation = asString(row.explaination || row.explanation);
			return `${index + 1}. ${name} | ${price} x ${quantity}${explanation ? ` | ${explanation}` : ''}`;
		})
		.join('\n');

	const total = getResponseRepresentation(answer);
	return {
		detail: [detail, `${totalLabel}: ${total}`].filter(Boolean).join('\n'),
		total
	};
}

function getFileLinks(response: unknown): { name: string; url: string }[] {
	if (!Array.isArray(response)) return [];

	return response.flatMap((record) => {
		if (!isRecord(record) || !Array.isArray(record.files)) return [];
		const collectionId = asString(record.collectionId);
		const recordId = asString(record.recordId);
		return record.files.map((file) => {
			const name = asString(file);
			return {
				name,
				url: `${PUBLIC_PB_URL}/api/files/${encodeURIComponent(collectionId)}/${encodeURIComponent(recordId)}/${encodeURIComponent(name)}`
			};
		});
	});
}

function formatAnswer(
	answer: ExportAnswer,
	allAnswers: ExportAnswer[],
	locale: ApplicationExportRequest['locale']
): NormalizedExportAnswer {
	const labels = getExportLabels(locale);
	const state = getAnswerDisplayState(answer as ExpandedAnswer, allAnswers as ExpandedAnswer[]);

	if (state === 'not-applicable') return { value: labels.notApplicable, files: [] };
	if (state === 'missing-required') return { value: labels.missingRequired, files: [] };
	if (state === 'unanswered-optional') return { value: labels.notAnswered, files: [] };

	const question = answer.expand?.question;
	if (!question) return { value: '', files: [] };

	if (question.type === 'file') {
		const files = getFileLinks(answer.response);
		return { value: files.map((file) => file.name).join('\n'), files };
	}

	if (question.type === 'member' || question.type === 'activity') {
		const keys =
			question.type === 'member'
				? ['name', 'username', 'email', 'phone', 'department', 'country']
				: ['date', 'startTime', 'endTime', 'topic', 'form', 'location', 'note'];
		return {
			value: formatObjectRows(answer.response),
			files: [],
			tableRows: getTableRows(answer.response, keys)
		};
	}

	if (question.type === 'budget') {
		const budget = formatBudget(answer, labels.total);
		return { value: budget.detail, compactValue: budget.total, files: [] };
	}

	return { value: getResponseRepresentation(answer), files: [] };
}

function toDate(value: string | undefined): Date | null {
	if (!value) return null;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
}

export function sanitizeFilename(value: string, fallback = 'export'): string {
	const sanitized = value
		.normalize('NFKC')
		.replace(/[<>:"/\\|?*]/g, '-')
		.split('')
		.map((character) => (character.charCodeAt(0) <= 31 ? '-' : character))
		.join('')
		.replace(/\s+/g, ' ')
		.replace(/[.\s]+$/g, '')
		.trim()
		.slice(0, 120);
	return sanitized || fallback;
}

export function normalizeApplicationExport(
	request: ApplicationExportRequest,
	event: EventsResponse,
	questions: ExportQuestion[],
	applications: ExportApplication[]
): NormalizedApplicationExport {
	const labels = getExportLabels(request.locale);
	const selectedQuestionIds = new Set(request.fields.questionIds);
	const normalizedQuestions: NormalizedExportQuestion[] = questions
		.filter((question) => selectedQuestionIds.has(question.id) && question.type !== 'info')
		.sort((first, second) => first.page - second.page || first.count - second.count)
		.map((question, index) => ({
			id: question.id,
			label: `${labels.question} ${index + 1} - ${stripHtml(question.title) || question.id}`,
			title: stripHtml(question.title) || question.id,
			type: question.type,
			page: question.page || 1,
			count: question.count || index + 1,
			required: question.required
		}));

	const normalizedApplications: NormalizedExportApplication[] = applications.map((application) => {
		const responder = application.expand?.responder;
		const answers = application.expand?.response || [];
		const answerByQuestion = new Map(answers.map((answer) => [answer.question, answer]));
		const serial = application.serial
			? `${event.responsePrefix}${application.serial.toString().padStart(3, '0')}`
			: '';
		const applicantName = responder?.name || responder?.nameEn || responder?.username || '';

		const normalizedAnswers = Object.fromEntries(
			normalizedQuestions.map((question) => {
				const sourceQuestion = questions.find((item) => item.id === question.id)!;
				const answer =
					answerByQuestion.get(question.id) ||
					({
						application: application.id,
						comment: '',
						created: '',
						expand: { question: sourceQuestion },
						id: '',
						question: question.id,
						response: null,
						status: '',
						updated: '',
						valid: false
					} as ExportAnswer);
				if (!answer.expand?.question) {
					answer.expand = { question: sourceQuestion };
				}
				return [question.id, formatAnswer(answer, answers, request.locale)];
			})
		);

		return {
			id: application.id,
			filenameBase: sanitizeFilename(
				[serial || application.id, applicantName].filter(Boolean).join(' - '),
				application.id
			),
			application: {
				eventName: event.name,
				serial: serial || application.id,
				status: labels.statuses[application.status] || application.status,
				created: toDate(application.created),
				submissionTime: toDate(application.submissionTime),
				updated: toDate(application.updated),
				internalId: application.id,
				adminNote: application.adminNote
			},
			applicant: {
				username: responder?.username || '',
				name: responder?.name || '',
				nameEn: responder?.nameEn || '',
				email: responder?.email || '',
				phone: responder?.phone || '',
				occupation: responder?.occupation || '',
				college: responder?.department || '',
				department: responder?.dept || '',
				year: responder?.year || '',
				country: responder?.country || '',
				birthday: toDate(responder?.birthday),
				internalId: responder?.id || ''
			},
			answers: normalizedAnswers
		};
	});

	return {
		eventId: event.id,
		eventName: event.name,
		locale: request.locale,
		questions: normalizedQuestions,
		applications: normalizedApplications
	};
}
