import { redirect } from "@sveltejs/kit"

export const GET = async ({ locals }) => {
  locals.pb.authStore.clear()
  return redirect(303, '/')
}