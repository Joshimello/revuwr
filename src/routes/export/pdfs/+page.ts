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
		any,
		{
			question: QuestionsResponse<any>;
		}
	>[];
}>;

export const load: PageLoad = async ({ url }) => {
	try {
		const applicationIds = url.searchParams.get('ids')?.split(',') || [];
		const allApplications = await pb.collection('applications').getFullList<ExpandedApplication>({
			expand: 'event,responder,response,response.question'
		});

		if (!allApplications[0].expand) return;
		const applications = allApplications.filter((a) => applicationIds.includes(a.id));
		console.log(applications);
		return {
			applications: applications || []
		};
	} catch (err) {
		if (isRedirect(err)) {
			throw err;
		}

		if (err instanceof Error) {
			return { message: err.message };
		} else {
			return { message: 'An unknown error occurred' };
		}
	}
};
