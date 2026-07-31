import { PUBLIC_PB_URL } from '$env/static/public';
import type { ApplicationExportRequest } from '$lib/export/types';
import PocketBase from 'pocketbase';
import type { EventsResponse, TypedPocketBase } from '$lib/pocketbase/pocketbase-types';
import {
	normalizeApplicationExport,
	type ExportApplication,
	type ExportQuestion
} from './normalize';

export class ExportRequestError extends Error {
	constructor(
		message: string,
		public status = 400
	) {
		super(message);
	}
}

type ExpandedEvent = EventsResponse<
	unknown,
	{
		questions: ExportQuestion[];
	}
>;

export async function getAuthenticatedAdmin(request: Request): Promise<TypedPocketBase> {
	const pb = new PocketBase(PUBLIC_PB_URL) as TypedPocketBase;
	pb.authStore.loadFromCookie(request.headers.get('cookie') || '');

	if (!pb.authStore.isValid || !pb.authStore.isSuperuser) {
		throw new ExportRequestError('Unauthorized', 401);
	}

	try {
		await pb.collection('_superusers').authRefresh();
	} catch {
		pb.authStore.clear();
		throw new ExportRequestError('Your admin session has expired', 401);
	}

	if (!pb.authStore.isSuperuser) {
		throw new ExportRequestError('Unauthorized', 401);
	}

	return pb;
}

function chunks<T>(items: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let index = 0; index < items.length; index += size) {
		result.push(items.slice(index, index + size));
	}
	return result;
}

async function getSelectedApplications(
	pb: TypedPocketBase,
	applicationIds: string[]
): Promise<ExportApplication[]> {
	const records: ExportApplication[] = [];

	for (const idChunk of chunks(applicationIds, 40)) {
		const parameters = Object.fromEntries(idChunk.map((id, index) => [`id${index}`, id]));
		const filter = idChunk.map((_, index) => `id = {:id${index}}`).join(' || ');
		const chunkRecords = await pb.collection('applications').getFullList<ExportApplication>({
			filter: pb.filter(filter, parameters),
			expand: 'event,responder,response,response.question'
		});
		records.push(...chunkRecords);
	}

	const byId = new Map(records.map((record) => [record.id, record]));
	return applicationIds
		.map((id) => byId.get(id))
		.filter((record): record is ExportApplication => Boolean(record));
}

export async function loadApplicationExport(
	pb: TypedPocketBase,
	request: ApplicationExportRequest
) {
	const event = await pb.collection('events').getOne<ExpandedEvent>(request.eventId, {
		expand: 'questions'
	});
	const questions = [...(event.expand?.questions || [])].sort(
		(first, second) => first.page - second.page || first.count - second.count
	);
	const exportableQuestionIds = new Set(
		questions.filter((question) => question.type !== 'info').map((question) => question.id)
	);
	const invalidQuestionIds = request.fields.questionIds.filter(
		(questionId) => !exportableQuestionIds.has(questionId)
	);

	if (invalidQuestionIds.length > 0) {
		throw new ExportRequestError('One or more selected questions do not belong to this event');
	}

	const applications = await getSelectedApplications(pb, request.applicationIds);
	if (applications.length !== request.applicationIds.length) {
		throw new ExportRequestError('One or more selected applications could not be found', 404);
	}

	if (applications.some((application) => application.event !== request.eventId)) {
		throw new ExportRequestError('All selected applications must belong to the same event');
	}

	return normalizeApplicationExport(request, event, questions, applications);
}
