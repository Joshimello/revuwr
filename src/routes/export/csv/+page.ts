import { isRedirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type {
	AnswersResponse,
	ApplicationsResponse,
	EventsResponse,
	QuestionsResponse,
	UsersResponse
} from '$lib/pocketbase/pocketbase-types';
import { pb } from '$lib/pocketbase/client';

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

export const load: PageLoad = async ({ url }) => {
	try {
		const applicationIds = url.searchParams.get('ids')?.split(',') || [];
		const allApplications = await pb.collection('applications').getFullList<ExpandedApplication>({
			expand: 'event,responder,response,response.question'
		});

		if (!allApplications[0]?.expand) {
			return {
				applications: [],
				filename: 'no_applications.csv',
				eventName: 'No Event',
				message: 'No applications found or missing data'
			};
		}

		const applications = allApplications.filter((a) => applicationIds.includes(a.id));
		const eventName = applications[0]?.expand?.event?.name || 'Multiple Events';
		const filename = `applications_export_${applications.length}_items_${new Date().toISOString().split('T')[0]}.csv`;

		return {
			applications: applications || [],
			filename,
			eventName,
			message: undefined
		};
	} catch (err) {
		if (isRedirect(err)) {
			throw err;
		}

		if (err instanceof Error) {
			return {
				applications: [],
				filename: 'export_error.csv',
				eventName: 'Error',
				message: err.message
			};
		} else {
			return {
				applications: [],
				filename: 'export_error.csv',
				eventName: 'Error',
				message: 'An unknown error occurred'
			};
		}
	}
};
