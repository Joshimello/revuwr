import type {
	EventsResponse,
	QuestionsResponse,
	TypedPocketBase
} from '$lib/pocketbase/pocketbase-types.js';
import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages.js';

type Tterms = {
	title: string;
	description: string;
}[];

export const load = async ({ locals, params }) => {
	try {
		const event = await locals.pb.collection('events').getOne<EventsResponse<Tterms>>(params.id);
		return {
			event: event
		};
	} catch (err) {
		if (err instanceof Error) {
			return error(500, err.message);
		} else {
			return error(500, m.error_generic());
		}
	}
};

type ExpandedEventsResponse = EventsResponse<
	Tterms,
	{
		questions: QuestionsResponse[];
	}
>;

export const actions = {
	async default({ params, request, locals }) {
		const createdRecords = {
			applicationId: null as string | null,
			answersIds: [] as string[]
		};
		try {
			const event = await locals.apb
				.collection('events')
				.getOne<ExpandedEventsResponse>(params.id, { expand: 'questions' });

			if (!locals.user) return fail(400, { message: m.error_user_not_logged_in() });

			if (!event.expand?.questions) return fail(400, { message: m.error_questions_not_fetched() });
			const questions = event.expand.questions;

			const notStarted = new Date(event.startDate) > new Date();
			const isEnded = new Date(+new Date(event.endDate) + 86400000) < new Date();
			const canApply =
				(notStarted && event.beforeStartDate == 'allow') ||
				(isEnded && event.afterStartDate == 'allow') ||
				(!notStarted && !isEnded);

			if (!canApply) {
				return fail(400, { message: m.error_event_not_open() });
			}

			const userResponses = await locals.apb.collection('applications').getFullList({
				filter: `responder = "${locals.user.id}" && event = "${event.id}"`
			});

			if (userResponses.length >= event.responseLimit) {
				return fail(400, { message: m.error_application_limit_reached() });
			}

			const application = await locals.apb.collection('applications').create({
				event: event.id,
				status: 'draft',
				responder: locals.user.id
			});

			createdRecords.applicationId = application.id;

			let answersIds: string[] = [];
			for (const question of questions) {
				const answer = await locals.apb.collection('answers').create({
					application: application.id,
					question: question.id,
					valid: question.type == 'info' ? true : false
				});
				answersIds = [...answersIds, answer.id];
			}

			createdRecords.answersIds = [...answersIds];

			await locals.apb.collection('applications').update(application.id, {
				response: answersIds
			});

			await locals.apb.collection('users').update(locals.user.id, {
				'applications+': application.id
			});

			return redirect(302, `/application/${application.id}`);
		} catch (err) {
			if (isRedirect(err)) {
				return redirect(err.status, err.location);
			}

			if (createdRecords.applicationId) {
				try {
					for (const answerId of createdRecords.answersIds) {
						await locals.apb.collection('answers').delete(answerId);
					}
					await locals.apb.collection('applications').delete(createdRecords.applicationId);
				} catch (rollbackErr) {
					console.error(rollbackErr);
					return fail(400, {
						message: m.error_rollback()
					});
				}
			}

			if (err instanceof Error) {
				return fail(400, {
					message: err.message
				});
			} else {
				return fail(400, {
					message: m.error_unknown()
				});
			}
		}
	}
};
