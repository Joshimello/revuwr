import { error, isRedirect, redirect } from '@sveltejs/kit';

export let load = async ({ locals }) => {
  if (!locals.user || (locals.user && locals.user.init)) {
    return redirect(303, '/');
  }
}

export let actions = {
  async default({ locals, request }) {
    const body = Object.fromEntries(await request.formData()) as Record<string, string>;

    if (!locals.user) {
      return error(403, 'You are not logged in.');
    }

    try {
      await locals.apb.collection('users').update(locals.user.id, {
        language: body.language,
        phone: body.phone,
        occupation: body.occupation,
        department: body.department,
        year: body.year,
        init: true
      })
      return redirect(303, '/');
    }
    catch (err) {
      if (isRedirect(err)) {
        return redirect(err.status, err.location);
      }
      if (err instanceof Error) {
        return error(500, err.message);
      }
      else {
        return error(500, 'An unknown error occurred.');
      }
    }
  }
}