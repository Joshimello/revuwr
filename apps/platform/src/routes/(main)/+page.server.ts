import { redirect, fail } from '@sveltejs/kit';
import type {
	ApplicationsResponse,
	AnswersResponse,
	EventsResponse
} from '$lib/pocketbase/pocketbase-types';

type ExpandedApplications = ApplicationsResponse<{
	response: AnswersResponse[];
	event: EventsResponse;
}>;

export const load = async ({ locals }) => {
	if (locals.user && !locals.user.init) {
		return redirect(302, '/onboard');
	}

	let applications: ExpandedApplications[] = [];

	if (locals.user) {
		try {
			applications = await locals.pb.collection('applications').getFullList<ExpandedApplications>({
				expand: 'response,event'
			});
		} catch (err) {
			console.error('Failed to fetch applications:', err);
			applications = [];
		}
	}

	return {
		user: locals.user,
		applications
	};
};

export const actions = {
	withdraw: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { message: 'User not logged in' });
		}

		const data = await request.formData();
		const applicationId = data.get('applicationId') as string;

		if (!applicationId) {
			return fail(400, { message: 'Application ID is required' });
		}

		try {
			const application = await locals.apb.collection('applications').getOne(applicationId, {
				expand: 'response'
			});

			console.log(application);

			if (application.responder !== locals.user.id) {
				return fail(403, { message: 'Unauthorized' });
			}

			// Check if the status allows deletion/withdrawal
			if (!['draft', 'submitted', 'resubmitted'].includes(application.status)) {
				return fail(400, { message: 'Application cannot be deleted or withdrawn' });
			}

			if (application.status === 'draft') {
				// Delete draft: remove answers first, then application
				const answerIds = application.response;

				// Batch delete answers
				const batch = locals.apb.createBatch();
				for (const answerId of answerIds) {
					batch.collection('answers').delete(answerId);
				}
				await batch.send();

				// Delete the application
				await locals.apb.collection('applications').delete(applicationId);
			} else if (['submitted', 'resubmitted'].includes(application.status)) {
				// Withdraw application: just change status
				await locals.apb.collection('applications').update(applicationId, {
					status: 'withdrawn'
				});
			}

			return { success: true };
		} catch (err) {
			console.error('Failed to delete/withdraw application:', err);
			return fail(500, { message: 'Failed to process request' });
		}
	}
};
