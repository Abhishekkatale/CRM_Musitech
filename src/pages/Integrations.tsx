import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SocialAnalytics from "@/components/SocialAnalytics";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

const Integrations = () => {
  const queryClient = useQueryClient();

  // Fetch connection status
  const { data: connections, isLoading } = useQuery({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_credentials')
        .select('provider')
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);

      const connectedProviders = data.map(c => c.provider);
      return {
        facebook: connectedProviders.includes('facebook'),
        google: connectedProviders.includes('google'),
      };
    },
  });

  const handleConnect = (provider) => {
    // The user will be redirected to the Supabase Edge Function
    window.location.href = `/functions/v1/${provider}-oauth`;
  };

  const disconnectMutation = useMutation({
    mutationFn: async (provider) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('/functions/v1/disconnect-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ provider }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
  });

  useEffect(() => {
    document.title = "Social Media Integrations & Analytics";
  }, []);

  return (
    <section aria-labelledby="integrations-title" className="space-y-6">
      <header>
        <h1 id="integrations-title" className="text-2xl font-semibold">Integrations</h1>
        <p className="text-muted-foreground">Read-only connections for initial data import (Facebook Ads, Google Ads).</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Facebook Ads</CardTitle>
            <CardDescription>Account metrics and campaign performance (read-only).</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            {isLoading ? (
              <p>Loading...</p>
            ) : connections?.facebook ? (
              <>
                <Badge variant="secondary">Connected</Badge>
                <Button variant="destructive" size="sm" onClick={() => disconnectMutation.mutate('facebook')}>Disconnect</Button>
              </>
            ) : (
              <Button onClick={() => handleConnect('facebook')}>Connect</Button>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Google Ads</CardTitle>
            <CardDescription>Search & Display campaign stats (read-only).</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            {isLoading ? (
              <p>Loading...</p>
            ) : connections?.google ? (
              <>
                <Badge variant="secondary">Connected</Badge>
                <Button variant="destructive" size="sm" onClick={() => disconnectMutation.mutate('google')}>Disconnect</Button>
              </>
            ) : (
              <Button onClick={() => handleConnect('google')}>Connect</Button>
            )}
          </CardContent>
        </Card>
      </div>
      <SocialAnalytics />
    </section>
  );
};

export default Integrations;
