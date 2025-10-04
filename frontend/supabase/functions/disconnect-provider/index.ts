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

    // 2. Get provider from request body
    const { provider } = await req.json()
    if (!provider) throw new Error('Provider is required in the request body')

    // 3. Delete the credentials from the database
    const { error } = await supabase
      .from('user_credentials')
      .delete()
      .eq('user_id', userId)
      .eq('provider', provider)

    if (error) throw error

    return new Response(JSON.stringify({ message: `${provider} disconnected successfully` }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
