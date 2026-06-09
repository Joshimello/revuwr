import { error } from '@sveltejs/kit';
import type { ServerLoad } from './$types';
import { generateApplicationSummaryEmail } from '$lib/emails/application-summary';
import type { ExpandedApplication } from '../../(main)/application/[id]/types';

export const load: ServerLoad = async ({ params, locals }) => {
	throw error(404, 'Not Found');

	if (!params.id) {
		throw error(400, 'Invalid application ID');
	}

	// For testing purposes, we don't require authentication
	// In production, you might want to add authentication or admin checks

	try {
		const application = (await locals.pb.collection('applications').getOne(params.id, {
			expand: 'event,responder,response,response.question'
		})) as ExpandedApplication;

		// Generate the email HTML
		const emailHtml = generateApplicationSummaryEmail(application);

		return {
			emailHtml,
			application: {
				id: application.id,
				serial: application.serial,
				eventName: application.expand?.event?.name,
				responderName: application.expand?.responder?.name,
				responderEmail: application.expand?.responder?.email
			}
		};
	} catch (err) {
		if (err instanceof Error) {
			throw error(500, `Failed to load application: ${err.message}`);
		}
		throw error(500, 'Failed to load application');
	}
};
