import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { decode } from 'https://deno.land/x/djwt@v2.4/mod.ts'

const SUPABASE_URL = Deno.env.get('VITE_SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY')
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_ID')
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_SECRET')
const GOOGLE_DEVELOPER_TOKEN = Deno.env.get('GOOGLE_DEVELOPER_TOKEN')

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

    // 2. Retrieve the user's Google refresh token
    const { data: credentials, error: credsError } = await supabase
      .from('user_credentials')
      .select('refresh_token')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single()

    if (credsError || !credentials) {
      throw new Error('Could not find Google credentials for this user.')
    }
    const refreshToken = credentials.refresh_token
    if (!refreshToken) throw new Error('Missing Google refresh token.')

    // 3. Get a new access token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenParams = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    const tokenRes = await fetch(tokenUrl, { method: 'POST', body: tokenParams });
    if (!tokenRes.ok) throw new Error('Failed to refresh Google access token');
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 4. Fetch accessible Google Ads accounts
    const accountsUrl = 'https://googleads.googleapis.com/v16/customers:listAccessibleCustomers'
    const accountsRes = await fetch(accountsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': GOOGLE_DEVELOPER_TOKEN,
      },
    })

    if (!accountsRes.ok) {
      const errorText = await accountsRes.text();
      console.error("Google Ads API Error:", errorText);
      throw new Error('Failed to list accessible customers from Google Ads API.');
    }

    const accountsData = await accountsRes.json();

    // 5. For each account, get its details (like descriptive name)
    const customerIds = accountsData.resourceNames.map(rn => rn.split('/')[1]);
    const customerDetailsPromises = customerIds.map(async (id) => {
      const detailUrl = `https://googleads.googleapis.com/v16/customers/${id}/googleAds:searchStream`;
      const query = `SELECT customer.descriptive_name, customer.id FROM customer`;
      const detailRes = await fetch(detailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': GOOGLE_DEVELOPER_TOKEN,
          'login-customer-id': id
        },
        body: JSON.stringify({ query }),
      });
      if (!detailRes.ok) return null;
      const detailData = await detailRes.json();
      // Assuming the first result is the customer's details
      return detailData[0]?.results[0]?.customer;
    });

    const customerDetails = (await Promise.all(customerDetailsPromises)).filter(Boolean);

    // 6. Return the list of ad accounts
    return new Response(JSON.stringify({ data: customerDetails }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
