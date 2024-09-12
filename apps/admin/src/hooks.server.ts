import { PUBLIC_BASE_PATH, PUBLIC_PB_URL } from "$env/static/public"
import Pocketbase from "pocketbase"
import { type TypedPocketBase } from "$lib/pocketbase/pocketbase-types"
import { error } from "@sveltejs/kit"

export const handle = async ({ event, resolve }) => {
  const pb = new Pocketbase(PUBLIC_PB_URL) as TypedPocketBase
  pb.authStore.loadFromCookie(event.request.headers.get('cookie') || '')

  if (event.url.pathname.startsWith(`/auth`)) {
    return await resolve(event)
  }

  if (pb.authStore.isValid && pb.authStore.isAdmin) {
    const response = await resolve(event)
    try {
      await pb.admins.authRefresh()
      response.headers.append(
        'set-cookie', 
        pb.authStore.exportToCookie({ 
          secure: false, 
          httpOnly: false 
        })
      )
    }
    catch (err) {
      return error(401, 'Unauthorized')
    }
    return response
  }

  return error(401, 'Unauthorized')
}