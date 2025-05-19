import { fail, isRedirect, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString();
		const password = data.get('password')?.toString();

		if (!username || !password) {
			return fail(400, {
				error: 'Username and password are required',
				username: username || ''
			});
		}

		try {
			await locals.pb.collection('users').authWithPassword(username, password);
			throw redirect(303, '/');
		} catch (err) {
			if (err instanceof Response || isRedirect(err)) {
				throw err; // Rethrow redirects
			}

			console.log(err);
			const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

			return fail(400, {
				error: errorMessage,
				username: username || ''
			});
		}
	}
};
