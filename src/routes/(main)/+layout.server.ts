import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	if (!locals.user && url.pathname !== '/' && !url.pathname.startsWith('/create')) {
		return redirect(302, '/');
	}

	return {
		user: locals.user
	};
};
