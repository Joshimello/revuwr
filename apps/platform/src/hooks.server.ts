import Pocketbase, { cookieParse } from 'pocketbase';
import { PUBLIC_PB_URL } from '$env/static/public';
import { PB_EMAIL, PB_PASSWORD } from '$env/static/private';
import type { UsersResponse } from '$lib/pocketbase/pocketbase-types';

export const handle = async ({ event, resolve }) => {
  event.locals.pb = new Pocketbase(PUBLIC_PB_URL);
  event.locals.pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '');

  try {
    event.locals.pb.authStore.isValid && await event.locals.pb.collection('users').authRefresh();
    event.locals.user = event.locals.pb.authStore.model as UsersResponse;
  }
  catch (err) {
    event.locals.pb.authStore.clear();
    event.locals.user = null;
  }

  event.locals.apb = new Pocketbase(PUBLIC_PB_URL);
  await event.locals.apb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);

  const response = await resolve(event);
  response.headers.set('set-cookie', event.locals.pb.authStore.exportToCookie({
    secure: false,
    httpOnly: false
  }));
  return response;
}