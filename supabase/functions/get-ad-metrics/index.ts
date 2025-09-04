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
      .select('access_token, provider_specific_id')
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

      // The FB API returns an array of data points. We'll aggregate them.
      const summary = apiData.data.reduce((acc, item) => {
        acc.spend += parseFloat(item.spend || 0);
        acc.impressions += parseInt(item.impressions || 0, 10);
        // Note: CTR and Conversions might need more complex aggregation
        return acc;
      }, { spend: 0, impressions: 0 });

      metrics = summary;
    } else if (provider === 'google') {
      // In a real application, you would use the Google Ads API client library
      // and the refresh_token to get a new access_token if the old one is expired.
      // Then you would construct a GAQL query to fetch the metrics.
      // For this example, we will return hardcoded data to simulate the API call.
      metrics = {
        spend: 5500.75,
        impressions: 350000,
        // Google Ads API provides clicks and cost_micros, so CTR and conversions
        // would need to be calculated.
      };
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
