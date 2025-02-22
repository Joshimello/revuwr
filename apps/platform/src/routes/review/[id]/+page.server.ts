import { fail, isRedirect, redirect } from '@sveltejs/kit';
import { PUBLIC_PB_URL } from '$env/static/public';
import type { Actions, PageServerLoad } from './$types';
import Pocketbase from 'pocketbase';
import type {
	FilesResponse,
	ReviewsResponse,
	TypedPocketBase
} from '$lib/pocketbase/pocketbase-types';
import type { ExpandedReviewsResponse } from '../../(main)/application/[id]/types';

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const review = await locals.apb.collection('reviews').getOne(params.id);

		if (review.status != 'draft') {
			throw redirect(303, `/review/completed`);
		}

		if (new Date(new Date(review.endDate).getTime() + 86400000) < new Date()) {
			throw redirect(303, `/review/completed`);
		}

		try {
			await locals.apb.collection('reviewers').create({
				email: review.reviewerEmail,
				password: review.reviewerEmail,
				passwordConfirm: review.reviewerEmail
			});
		} catch (err) {
			null;
		}

		const reviewerpb = new Pocketbase(PUBLIC_PB_URL) as TypedPocketBase;
		await reviewerpb
			.collection('reviewers')
			.authWithPassword(review.reviewerEmail, review.reviewerEmail);

		const reviewRequest = await reviewerpb
			.collection('reviews')
			.getOne<ExpandedReviewsResponse>(params.id, {
				expand:
					'applications,applications.event,applications.response,applications.response.question,applications.responder'
			});

		return { reviewRequest };
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

export const actions: Actions = {
	submit: async ({ params, locals }) => {
		try {
			locals.apb.collection('reviews').update(params.id, {
				status: 'submitted'
			});
			return {};
		} catch (error) {
			return fail(500, { message: 'An error occurred while submitting the review' });
		}
	},
	review: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const applicationId = formData.get('applicationId') as string;
		const action = formData.get('action') as string;
		const comment = formData.get('comment') as string;
		const files = formData.getAll('files') as File[];

		if (!['approved', 'rejected', 'editsRequested'].includes(action)) {
			return fail(400, { message: 'Invalid action' });
		}

		let filesRecord: FilesResponse | null = null;
		if (files[0].size > 0) {
			try {
				filesRecord = await locals.apb.collection('files').create({
					file: files
				});
			} catch (error) {
				return fail(500, { message: 'An error occurred while uploading files' });
			}
		}

		let reviewRecord: ReviewsResponse | null = null;
		try {
			reviewRecord = await locals.apb.collection('reviews').update(params.id, {
				review: {
					[applicationId]: {
						status: action,
						comment,
						files:
							filesRecord?.file.map((file) => ({
								collectionId: filesRecord.collectionId,
								recordId: filesRecord.id,
								file: file
							})) || []
					}
				}
			});
		} catch (error) {
			return fail(500, { message: 'An error occurred while updating the review' });
		}

		return {
			record: reviewRecord
		};
	}
};
