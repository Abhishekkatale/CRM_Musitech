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

    // 2. Get provider from request query
    const url = new URL(req.url)
    const provider = url.searchParams.get('provider')
    if (!provider) throw new Error('Provider query parameter is required')

    // 3. Retrieve the credentials from the database
    const { data: credentials, error: credsError } = await supabase
      .from('user_credentials')
      .select('access_token, refresh_token, provider_specific_id')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single()

    if (credsError || !credentials) {
      throw new Error(`Could not find credentials for provider: ${provider}`)
    }

    // 4. Fetch data from the provider's API
    let metrics = {};
    if (provider === 'facebook') {
      const adAccountId = credentials.provider_specific_id;
      if (!adAccountId) {
        throw new Error('Facebook Ad Account ID is not configured for this user.');
      }
      const fields = 'spend,impressions,ctr,conversions';
      const datePreset = 'last_30d';

      const apiUrl = `https://graph.facebook.com/v18.0/${adAccountId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${credentials.access_token}`;

      const apiRes = await fetch(apiUrl);
      if (!apiRes.ok) {
        const errorData = await apiRes.json();
        throw new Error(`Facebook API error: ${errorData.error.message}`);
      }
      const apiData = await apiRes.json();

      const summary = apiData.data.reduce((acc, item) => {
        acc.spend = (acc.spend || 0) + parseFloat(item.spend || 0);
        acc.impressions = (acc.impressions || 0) + parseInt(item.impressions || 0, 10);
        return acc;
      }, {});

      metrics = summary;
    } else if (provider === 'google') {
      const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_ID')
      const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_SECRET')
      const GOOGLE_DEVELOPER_TOKEN = Deno.env.get('GOOGLE_DEVELOPER_TOKEN')

      if (!credentials.refresh_token) throw new Error('Missing Google refresh token.');
      if (!credentials.provider_specific_id) throw new Error('Missing Google Ads Customer ID.');

      // 1. Use refresh token to get a new access token
      const tokenUrl = 'https://oauth2.googleapis.com/token';
      const tokenParams = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: credentials.refresh_token,
        grant_type: 'refresh_token',
      });
      const tokenRes = await fetch(tokenUrl, { method: 'POST', body: tokenParams });
      if (!tokenRes.ok) throw new Error('Failed to refresh Google access token');
      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // 2. Make a request to the Google Ads API
      const customerId = credentials.provider_specific_id.replace(/-/g, ''); // Remove dashes for the API
      const apiUrl = `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:searchStream`;
      const gaqlQuery = "SELECT metrics.cost_micros, metrics.impressions FROM campaign WHERE segments.date DURING LAST_30_DAYS";

      const apiRes = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': GOOGLE_DEVELOPER_TOKEN,
          'login-customer-id': customerId
        },
        body: JSON.stringify({ query: gaqlQuery }),
      });

      if (!apiRes.ok) {
        const errorText = await apiRes.text();
        console.error("Google Ads API Error:", errorText);
        throw new Error('Failed to fetch data from Google Ads API.');
      }

      const apiData = await apiRes.json();

      // The response is an array of results, each containing a "results" array.
      // We need to aggregate the metrics from all of them.
      const summary = apiData.reduce((acc, result) => {
        result.results.forEach(item => {
          acc.spend = (acc.spend || 0) + (parseInt(item.metrics.costMicros, 10) / 1000000);
          acc.impressions = (acc.impressions || 0) + parseInt(item.metrics.impressions, 10);
        });
        return acc;
      }, { spend: 0, impressions: 0 });

      metrics = summary;
    }

    return new Response(JSON.stringify({ data: metrics }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
