import { error, fail, isRedirect, redirect } from '@sveltejs/kit';
import { m } from '$lib/paraglide/messages';
import type { Event } from './types';
import { Collections, type ApplicationsResponse } from '$lib/pocketbase/pocketbase-types';

export const load = async ({ locals, params }) => {
	try {
		const event = await locals.pb.collection(Collections.Events).getOne<Event>(params.id);

		let applications: ApplicationsResponse[] = [];
		if (locals.user) {
			applications = await locals.pb.collection(Collections.Applications).getFullList({
				filter: `responder = "${locals.user.id}" && event = "${event.id}"`
			});
		}

		return {
			event: event,
			applications: applications
		};
	} catch (err) {
		if (err instanceof Error) {
			return error(500, err.message);
		} else {
			return error(500, m.error_generic());
		}
	}
};

export const actions = {
	async default({ params, locals }) {
		const createdRecords = {
			applicationId: null as string | null,
			answersIds: [] as string[]
		};

		try {
			// user auth check
			if (!locals.user) return fail(400, { message: m.error_user_not_logged_in() });

			// fetch event
			const event = await locals.apb
				.collection('events')
				.getOne<Event>(params.id, { expand: 'questions' });

			if (!event.expand?.questions) return fail(400, { message: m.error_questions_not_fetched() });
			const questions = event.expand.questions;

			// date check
			const notStarted = new Date(event.startDate) > new Date();
			const isEnded = new Date(+new Date(event.endDate) + 86400000) < new Date();
			const canApply =
				(notStarted && event.beforeStartDate == 'allow') ||
				(isEnded && event.afterStartDate == 'allow') ||
				(!notStarted && !isEnded);

			if (!canApply) {
				return fail(400, { message: m.error_event_not_open() });
			}

			// user responses check
			const userResponses = await locals.apb.collection('applications').getFullList({
				filter: `responder = "${locals.user.id}" && event = "${event.id}"`
			});

			if (userResponses.length >= event.responseLimit) {
				return fail(400, { message: m.error_application_limit_reached() });
			}

			// create base application
			const application = await locals.apb.collection('applications').create({
				event: event.id,
				status: 'draft',
				responder: locals.user.id
			});

			createdRecords.applicationId = application.id;

			// create answers
			let answersIds: string[] = [];

			const batch = locals.apb.createBatch();
			for (const question of questions) {
				batch.collection('answers').create({
					application: application.id,
					question: question.id,
					valid: question.type == 'info' ? true : false
				});
			}
			const answers = await batch.send();
			answersIds = answers.map((answer) => answer.body.id);
			createdRecords.answersIds = [...answersIds];

			// update application with answers
			await locals.apb.collection('applications').update(application.id, {
				response: answersIds
			});

			// update user with application
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
