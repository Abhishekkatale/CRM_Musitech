import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from 'https://deno.land/x/djwt@v2.4/mod.ts'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')

serve(async (req) => {
  try {
    // 1. Get user and Supabase client
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')
    const jwt = authHeader.replace('Bearer ', '')
    const payload = decode(jwt)
    const userId = payload[1].sub
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    })

    // 2. Retrieve the user's Facebook access token
    const { data: credentials, error: credsError } = await supabase
      .from('user_credentials')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'facebook')
      .single()

    if (credsError || !credentials) {
      throw new Error('Could not find Facebook credentials for this user.')
    }
    const accessToken = credentials.access_token

    // 3. Fetch ad accounts from Facebook Graph API
    const adAccountsUrl = new URL('https://graph.facebook.com/v18.0/me/adaccounts')
    adAccountsUrl.searchParams.set('fields', 'name,account_id')
    adAccountsUrl.searchParams.set('access_token', accessToken)

    const adAccountsRes = await fetch(adAccountsUrl)
    if (!adAccountsRes.ok) {
      const errorData = await adAccountsRes.json()
      throw new Error(`Facebook API error: ${errorData.error.message}`)
    }
    const adAccountsData = await adAccountsRes.json()

    // 4. Return the list of ad accounts
    return new Response(JSON.stringify({ data: adAccountsData.data }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
