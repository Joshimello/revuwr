import { redirect } from '@sveltejs/kit';
import { PUBLIC_BASE_PATH } from '$env/static/public';

export const load = async () => {
	throw redirect(302, `${PUBLIC_BASE_PATH}/events`);
};
