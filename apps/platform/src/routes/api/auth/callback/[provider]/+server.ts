import { NTHU_OAUTH_CLIENT_ID, NTHU_OAUTH_CLIENT_SECRET } from '$env/static/private'
import { error, json } from '@sveltejs/kit'

export const GET = async ({ url }) => {
  let code = url.searchParams.get('code')

  if (!code) {
    return error(400, 'Missing code')
  }

  let tokenBase = 'https://oauth.ccxp.nthu.edu.tw/v1.1/token.php'
  let client_id = NTHU_OAUTH_CLIENT_ID
  let client_secret = NTHU_OAUTH_CLIENT_SECRET
  let grant_type = 'authorization_code'
  let redirect_uri = 'https://fsga.et.nthu.edu.tw/api/auth/callback/nthu'

  let tokenResponse = await fetch(tokenBase, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id,
      client_secret,
      grant_type,
      redirect_uri,
      code
    })
  })
  
  let tokenData = await tokenResponse.json()

  return json(tokenData)

}