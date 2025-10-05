import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/MetricCard";
import { AreaTrendChart } from "@/components/AreaTrendChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

// Types
interface SeriesPoint { name: string; value: number }
interface PlatformMetrics {
  kpis: { label: string; value: string; hint?: string }[];
  reachSeries: SeriesPoint[];
  engagementSeries: SeriesPoint[];
}

// Mock data factory
function buildWeeks(count: number) {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    const week = `${d.getMonth() + 1}/${d.getDate()}`;
    weeks.push(week);
  }
  return weeks;
}

function platformData(seed = 1): PlatformMetrics {
  const weeks = buildWeeks(8);
  let base = 1000 * seed;
  const reachSeries = weeks.map((w) => {
    base += Math.round((Math.sin(base) + 1) * 50 + 40);
    return { name: w, value: base };
  });
  const engagementSeries = weeks.map((w, i) => ({ name: w, value: Math.round(2 + ((i * seed) % 5) + (i % 3)) }));

  const lastReach = reachSeries[reachSeries.length - 1].value;
  return {
    kpis: [
      { label: "Followers", value: (5000 * seed).toLocaleString() },
      { label: "Engagement rate", value: `${(2.4 + seed * 0.3).toFixed(1)}%`, hint: "Last 30 days" },
      { label: "CTR", value: `${(1.2 + seed * 0.2).toFixed(1)}%` },
      { label: "Posts", value: `${20 + seed * 3}` },
    ],
    reachSeries,
    engagementSeries,
  };
}

const stroke = "hsl(var(--primary))";
const fill = "hsla(var(--primary) / 0.15)";

export const SocialAnalytics = () => {
  const dataByPlatform = useMemo(
    () => ({
      facebook: platformData(1),
      twitter: platformData(2),
      instagram: platformData(3),
      linkedin: platformData(4),
    }),
    []
  );

  const renderEngagementChart = (points: SeriesPoint[]) => (
    <div className="h-72 w-full rounded-lg border bg-card p-4 shadow-elevated">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
          <Bar dataKey="value" fill={stroke} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderCTRChart = (points: SeriesPoint[]) => (
    <div className="h-72 w-full rounded-lg border bg-card p-4 shadow-elevated">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
          <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const PlatformBlock = ({ title, data }: { title: string; data: PlatformMetrics }) => (
    <section className="space-y-4" aria-labelledby={`${title}-title`}>
      <header>
        <h2 id={`${title}-title`} className="text-xl font-semibold">{title}</h2>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.kpis.map((kpi) => (
          <MetricCard key={kpi.label} title={kpi.label} value={kpi.value} hint={kpi.hint} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Reach over time</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaTrendChart data={data.reachSeries} />
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Engagement per week</CardTitle>
          </CardHeader>
          <CardContent>{renderEngagementChart(data.engagementSeries)}</CardContent>
        </Card>
      </div>
    </section>
  );

  return (
    <article className="space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Social Media Analytics</h2>
        <p className="text-sm text-muted-foreground">Overview of followers, engagement, reach and CTR across platforms.</p>
      </header>

      <Tabs defaultValue="facebook" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="twitter">Twitter/X</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
        </TabsList>
        <TabsContent value="facebook"><PlatformBlock title="Facebook" data={dataByPlatform.facebook} /></TabsContent>
        <TabsContent value="twitter"><PlatformBlock title="Twitter/X" data={dataByPlatform.twitter} /></TabsContent>
        <TabsContent value="instagram"><PlatformBlock title="Instagram" data={dataByPlatform.instagram} /></TabsContent>
        <TabsContent value="linkedin"><PlatformBlock title="LinkedIn" data={dataByPlatform.linkedin} /></TabsContent>
      </Tabs>
    </article>
  );
};

export default SocialAnalytics;
