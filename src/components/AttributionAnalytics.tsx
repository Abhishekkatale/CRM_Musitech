import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { useMemo } from "react";

interface Point { name: string; value: number }

export const AttributionAnalytics = () => {
  const stroke = "hsl(var(--primary))";
  const grid = "hsl(var(--muted-foreground) / 0.2)";

  // Mock datasets
  const { utmSource, campaignLevel, firstLast, conversionsOverTime, kpis } = useMemo(() => {
    const utmSource = [
      { name: "facebook", value: 420 },
      { name: "instagram", value: 360 },
      { name: "google", value: 510 },
      { name: "youtube", value: 190 },
      { name: "email", value: 140 },
      { name: "referral", value: 90 },
    ];

    const campaignLevel = [
      { name: "Brand Q3", spend: 3200, clicks: 8200, conversions: 230 },
      { name: "Search Music", spend: 5400, clicks: 11200, conversions: 410 },
      { name: "Remarketing", spend: 1800, clicks: 4200, conversions: 160 },
    ];

    const firstLast = [
      { name: "facebook", first: 260, last: 210 },
      { name: "instagram", first: 190, last: 170 },
      { name: "google", first: 280, last: 360 },
      { name: "email", first: 60, last: 120 },
    ];

    const conversionsOverTime: Point[] = Array.from({ length: 8 }).map((_, i) => ({
      name: `W${i + 1}`,
      value: 140 + Math.round(Math.sin(i) * 20 + i * 10),
    }));

    const totalConv = utmSource.reduce((a, b) => a + b.value, 0);
    const kpis = [
      { label: "Total conversions", value: totalConv.toLocaleString() },
      { label: "Top source", value: utmSource.slice().sort((a, b) => b.value - a.value)[0].name },
      { label: "Avg. CPA", value: "$12.40", hint: "Mocked" },
      { label: "First-touch %", value: `${Math.round((firstLast.reduce((a, b) => a + b.first, 0) / totalConv) * 100)}%` },
    ];

    return { utmSource, campaignLevel, firstLast, conversionsOverTime, kpis };
  }, []);

  const renderBar = (data: { name: string; value: number }[]) => (
    <div className="h-72 w-full rounded-lg border bg-card p-4 shadow-elevated">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
          <Bar dataKey="value" fill={stroke} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
      <article className="space-y-6">
        <section aria-labelledby="kpi-title">
          <h2 id="kpi-title" className="sr-only">Key metrics</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <Card key={k.label} className="shadow-elevated">
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground">{k.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold tracking-tight">{k.value}</div>
                  {"hint" in k && (k as any).hint && (
                    <p className="mt-1 text-xs text-muted-foreground">{(k as any).hint}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="utm-title" className="space-y-4">
          <header>
            <h2 id="utm-title" className="text-lg font-semibold">UTM Source Performance</h2>
            <p className="text-sm text-muted-foreground">Conversions by utm_source</p>
          </header>
          {renderBar(utmSource)}
        </section>

        <section aria-labelledby="campaign-title" className="space-y-4">
          <header>
            <h2 id="campaign-title" className="text-lg font-semibold">Campaign-Level Metrics</h2>
            <p className="text-sm text-muted-foreground">Spend, Clicks and Conversions</p>
          </header>
          <div className="h-72 w-full rounded-lg border bg-card p-4 shadow-elevated">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignLevel} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="spend" name="Spend ($)" fill={"hsl(var(--primary))"} />
                <Bar dataKey="clicks" name="Clicks" fill={"hsl(var(--secondary))"} />
                <Bar dataKey="conversions" name="Conversions" fill={"hsl(var(--accent))"} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section aria-labelledby="attribution-title" className="space-y-4">
          <header>
            <h2 id="attribution-title" className="text-lg font-semibold">First vs Last-touch Attribution</h2>
            <p className="text-sm text-muted-foreground">Split by source</p>
          </header>
          <div className="h-72 w-full rounded-lg border bg-card p-4 shadow-elevated">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={firstLast} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Bar dataKey="first" name="First-touch" fill={"hsl(var(--primary))"} />
                <Bar dataKey="last" name="Last-touch" fill={"hsl(var(--ring))"} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section aria-labelledby="conversions-title" className="space-y-4">
          <header>
            <h2 id="conversions-title" className="text-lg font-semibold">Conversion Events Over Time</h2>
            <p className="text-sm text-muted-foreground">Weekly conversions</p>
          </header>
          <div className="h-72 w-full rounded-lg border bg-card p-4 shadow-elevated">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionsOverTime} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </article>
  );
};

export default AttributionAnalytics;
