import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from 'https://deno.land/x/djwt@v2.4/mod.ts'

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_SECRET')
const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-oauth`

serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')

  // 1. If no code, redirect to Google's OAuth dialog
  if (!code) {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/adwords')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'offline') // To get a refresh token
    authUrl.searchParams.set('prompt', 'consent')

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl.toString(),
      },
    })
  }

  // 2. If code is present, exchange it for tokens
  try {
    const tokenUrl = 'https://oauth2.googleapis.com/token'
    const tokenParams = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: code,
      grant_type: 'authorization_code',
    })

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    })

    if (!tokenRes.ok) throw new Error('Failed to fetch access token')
    const tokenData = await tokenRes.json()

    // 3. Get user_id from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    const jwt = authHeader.replace('Bearer ', '')
    const payload = decode(jwt)
    const userId = payload[1].sub

    // 4. Store credentials in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })

    const { error } = await supabase.from('user_credentials').upsert({
      user_id: userId,
      provider: 'google',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
    })

    if (error) throw error

    // 5. Redirect to google setup page
    const redirectUrl = new URL('/integrations/google/setup', url.origin)
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
