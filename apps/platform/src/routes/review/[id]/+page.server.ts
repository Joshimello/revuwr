import { fail, isRedirect, redirect } from '@sveltejs/kit'
import Pocketbase from 'pocketbase'
import type { TypedPocketBase } from '$lib/pocketbase/pocketbase-types.js'
import { PUBLIC_PB_URL } from '$env/static/public'
import { PB_EMAIL, PB_PASSWORD } from '$env/static/private'

export const load = async ({ params }) => {
  
  const apb = new Pocketbase(PUBLIC_PB_URL) as TypedPocketBase
  
  try {
    await apb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD)
    const review = await apb.collection('reviews').getOne(params.id)

    if (review.status != 'draft') {
      redirect(303, `/review/completed`)
    }

    // check if endDate is due
    if (new Date(new Date(review.endDate).getTime() + 86400000) < new Date()) {
      redirect(303, `/review/completed`)
    }
  }
  catch (err) {
    if (isRedirect(err)) {
      return redirect(err.status, err.location)
    }

    if (err instanceof Error) {
      console.log(err)
      return fail(400, {
        message: err.message
      })
    }
    else {
      return fail(400, {
        message: "An unknown error occurred"
      })
    }
  }

}