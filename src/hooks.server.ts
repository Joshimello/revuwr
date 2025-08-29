import { PUBLIC_PB_URL } from '$env/static/public';
import Pocketbase from 'pocketbase';
import { type TypedPocketBase } from '$lib/pocketbase/pocketbase-types';
import { error } from '@sveltejs/kit';

export const handle = async ({ event, resolve }) => {
	const pb = new Pocketbase(PUBLIC_PB_URL) as TypedPocketBase;
	pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	console.log(pb.authStore.isValid);

	if (event.url.pathname.startsWith(`/auth`)) {
		return await resolve(event);
	}

	if (pb.authStore.isValid && pb.authStore.isSuperuser) {
		return await resolve(event);
	}

	return error(401, 'Unauthorized');
};
