import { redirect } from '@sveltejs/kit'

export const load = ({ locals }) => {
  if (locals.user && !locals.user.init) {
    return redirect(302, '/onboard')
  } 
}