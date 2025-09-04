import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from 'https://deno.land/x/djwt@v2.4/mod.ts'

const FACEBOOK_APP_ID = Deno.env.get('FACEBOOK_APP_ID')
const FACEBOOK_APP_SECRET = Deno.env.get('FACEBOOK_APP_SECRET')
const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')
// The redirect URI must be registered in the Facebook App settings.
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/facebook-oauth`

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  // 1. If no code, redirect to Facebook's OAuth dialog
  if (!code) {
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    authUrl.searchParams.set('client_id', FACEBOOK_APP_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', 'ads_read,read_insights')
    authUrl.searchParams.set('response_type', 'code')

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
      },
    })
  }

  // 2. If code is present, exchange it for an access token
  try {
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', FACEBOOK_APP_ID)
    tokenUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET)
    tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    tokenUrl.searchParams.set('code', code)

    const tokenRes = await fetch(tokenUrl)
    if (!tokenRes.ok) throw new Error('Failed to fetch access token')
    const tokenData = await tokenRes.json()

    // 3. Get user_id from the JWT in the request headers
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    const jwt = authHeader.replace('Bearer ', '')
    const payload = decode(jwt)
    const userId = payload[1].sub

    // 4. Store the credentials in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })

    const { error } = await supabase.from('user_credentials').upsert({
      user_id: userId,
      provider: 'facebook',
      access_token: tokenData.access_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    })

    if (error) throw error

    // 5. Redirect user to the integrations page
    const redirectUrl = new URL('/integrations', url.origin)
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl.toString(),
      },
    })
  } catch (error) {
    console.error('OAuth Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
