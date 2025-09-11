import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { ExpandedApplication } from './types.js';
import type { Actions } from '@sveltejs/kit';
import { render } from 'svelty-email';
import SubmissionEmail from '$lib/emails/submission.svelte';

// this code is haram

export const actions: Actions = {
	async submit({ params, locals }) {
		// if (!params.id) {
		// 	return fail(400, { message: 'Invalid application ID' });
		// }

		try {
			const application = await locals.pb
				.collection('applications')
				.getOne<ExpandedApplication>(params.id, {
					expand: 'event,response,response.question'
				});

			if (application.expand?.event.status != 'active') {
				return fail(400, { message: 'Event has been archived' });
			}

			if (!locals.user || application.responder !== locals.user.id) {
				return fail(400, { message: 'Invalid user' });
			}

			if (!application.expand?.response) {
				return fail(400, { message: 'Responses could not be fetched' });
			}

			if (!['draft', 'editsRequested'].includes(application.status)) {
				return fail(400, { message: 'Invalid application status' });
			}

			const responses = application.expand.response;

			if (responses.some((i) => i.valid === false)) {
				return fail(400, { message: 'Some responses are invalid' });
			}

			await locals.apb.collection('applications').update(params.id, {
				status: application.status == 'editsRequested' ? 'resubmitted' : 'submitted'
			});

			const submissionEmail = render({
				template: SubmissionEmail,
				props: {
					application: application
				}
			});

			await locals.rs.emails.send({
				from: 'Revuwr <revuwr@mail.nthumods.com>',
				to: [locals.user.email],
				subject: '[REVUWR] Application Submitted',
				html: submissionEmail
			});

			return redirect(303, `/application/${params.id}/complete`);
		} catch (err) {
			if (isRedirect(err)) {
				return redirect(err.status, err.location);
			}

			if (err instanceof Error) {
				return fail(400, {
					message: err.message
				});
			} else {
				return fail(400, {
					message: 'An unknown error occurred'
				});
			}
		}
	},
	async delete({ params, locals }) {
		try {
			const application = await locals.pb
				.collection('applications')
				.getOne<ExpandedApplication>(params.id, {
					expand: 'response,response.question'
				});

			if (!locals.user || application.responder !== locals.user.id) {
				return fail(400, { message: 'Invalid user' });
			}

			if (!application.expand?.response) {
				return fail(400, { message: 'Responses could not be fetched' });
			}

			if (!['draft'].includes(application.status)) {
				return fail(400, { message: 'Invalid application status' });
			}

			await locals.apb.collection('applications').delete(params.id);

			for (const response of application.expand.response) {
				await locals.apb.collection('answers').delete(response.id, {
					requestKey: response.id
				});
			}

			return redirect(303, `/`);
		} catch (err) {
			if (isRedirect(err)) {
				return redirect(err.status, err.location);
			}

			if (err instanceof Error) {
				return fail(400, {
					message: err.message
				});
			} else {
				return fail(400, {
					message: 'An unknown error occurred'
				});
			}
		}
	},
	async withdraw({ params, locals }) {
		try {
			const application = await locals.apb.collection('applications').getOne(params.id);

			if (!locals.user || application.responder !== locals.user.id) {
				return fail(400, { message: 'Invalid user' });
			}

			if (['draft', 'withdrawn'].includes(application.status)) {
				return fail(400, { message: 'Invalid application status' });
			}

			await locals.apb.collection('applications').update(params.id, {
				status: 'withdrawn'
			});

			return redirect(303, `/`);
		} catch (err) {
			if (isRedirect(err)) {
				return redirect(err.status, err.location);
			}

			if (err instanceof Error) {
				return fail(400, {
					message: err.message
				});
			} else {
				return fail(400, {
					message: 'An unknown error occurred'
				});
			}
		}
	}
};
