import Pocketbase from 'pocketbase';
import { PUBLIC_PB_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import type { UsersResponse } from '$lib/pocketbase/pocketbase-types';
import { Resend } from 'resend';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.pb = new Pocketbase(PUBLIC_PB_URL);
	event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

	try {
		event.locals.pb.authStore.isValid && (await event.locals.pb.collection('users').authRefresh());
		event.locals.user = event.locals.pb.authStore.model as UsersResponse;
	} catch (err) {
		event.locals.pb.authStore.clear();
		event.locals.user = null;
	}

	event.locals.apb = new Pocketbase(PUBLIC_PB_URL);
	await event.locals.apb.collection('_superusers').authWithPassword(env.PB_EMAIL, env.PB_PASSWORD);

	event.locals.rs = new Resend(env.RS_API_KEY);

	const response = await resolve(event);
	response.headers.set(
		'set-cookie',
		event.locals.pb.authStore.exportToCookie({
			secure: false,
			httpOnly: false
		})
	);
	return response;
};
