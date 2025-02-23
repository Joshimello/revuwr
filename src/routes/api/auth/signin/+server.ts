import { NTHU_OAUTH_CLIENT_ID } from "$env/static/private"
import { redirect } from "@sveltejs/kit"
import { dev } from "$app/environment"

export const GET = async () => {

  if (dev) {
    return redirect(302, '/api/auth/callback/uwu?code=uwu')
  }

  const base = 'https://oauth.ccxp.nthu.edu.tw/v1.1/authorize.php'
  const client_id = NTHU_OAUTH_CLIENT_ID
  const response_type = 'code'
  const redirect_uri = 'https://fsga.et.nthu.edu.tw/api/auth/callback/nthu'
  const scope = 'uuid inschool userid name email'
  const ui_locales = 'zh-TW'

  return redirect(302,
    base +
    '?client_id=' + client_id +
    '&response_type=' + response_type +
    '&redirect_uri=' + redirect_uri +
    '&scope=' + scope +
    '&ui_locales=' + ui_locales
  )
}