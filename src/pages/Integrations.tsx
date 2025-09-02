import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SocialAnalytics from "@/components/SocialAnalytics";

const Integrations = () => {
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
            <Badge variant="secondary">Connected</Badge>
            <span className="text-sm text-muted-foreground">Read-only</span>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Google Ads</CardTitle>
            <CardDescription>Search & Display campaign stats (read-only).</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <Badge variant="secondary">Connected</Badge>
            <span className="text-sm text-muted-foreground">Read-only</span>
          </CardContent>
        </Card>
      </div>
      <SocialAnalytics />
    </section>
  );
};

export default Integrations;
