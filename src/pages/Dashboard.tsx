import { useState, useMemo } from "react";
import { MetricCard } from "@/components/MetricCard";
import { AreaTrendChart } from "@/components/AreaTrendChart";
import { MetricDetailModal } from "@/components/MetricDetailModal";
import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Skeleton } from "@/components/ui/skeleton";

const data = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 460 },
  { name: "Mar", value: 520 },
  { name: "Apr", value: 680 },
  { name: "May", value: 740 },
  { name: "Jun", value: 820 },
];

const fetchMetrics = async (provider, session) => {
  if (!session) return null;
  const response = await fetch(`/functions/v1/get-ad-metrics?provider=${provider}`, {
    headers: { 'Authorization': `Bearer ${session.access_token}` },
  });
  if (!response.ok) {
    // Gracefully handle missing credentials vs. other errors
    if (response.status === 500) {
      const errorData = await response.json();
      if (errorData.error.includes("Could not find credentials")) {
        console.warn(`No credentials for ${provider}, skipping.`);
        return { spend: 0, impressions: 0 }; // Return zeroed data
      }
    }
    throw new Error(`Failed to fetch ${provider} metrics`);
  }
  const result = await response.json();
  return result.data;
};

const Dashboard = () => {
  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    value: string | number;
    type: 'spend' | 'impressions' | 'ctr' | 'conversions';
  } | null>(null);

  const results = useQueries({
    queries: ['facebook', 'google'].map((provider) => ({
      queryKey: ['metrics', provider],
      queryFn: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return fetchMetrics(provider, session);
      },
    })),
  });

  const isLoading = results.some(q => q.isLoading);

  const combinedMetrics = useMemo(() => {
    if (isLoading || results.some(q => q.isError)) {
      return { spend: 0, impressions: 0 };
    }
    return results.reduce((acc, queryResult) => {
      if (queryResult.data) {
        acc.spend += queryResult.data.spend || 0;
        acc.impressions += queryResult.data.impressions || 0;
      }
      return acc;
    }, { spend: 0, impressions: 0 });
  }, [results, isLoading]);

  const handleMetricClick = (metric: { title: string; value: string | number; type: 'spend' | 'impressions' | 'ctr' | 'conversions' }) => {
    setSelectedMetric(metric);
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

  return (
    <div>
    <section aria-labelledby="dashboard-title" className="space-y-8">
      <header className="hero-spotlight rounded-xl border p-8 shadow-elevated">
        <h1 id="dashboard-title" className="text-3xl font-bold tracking-tight">MusiTech Multi-Channel Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Central dashboard for key metrics across Facebook & Google Ads. Real-time and historical trends.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Spend"
              value={formatCurrency(combinedMetrics.spend)}
              hint="Last 30 days (All Channels)"
              onClick={() => handleMetricClick({ title: "Total Spend", value: formatCurrency(combinedMetrics.spend), type: "spend" })}
            />
            <MetricCard
              title="Total Impressions"
              value={formatNumber(combinedMetrics.impressions)}
              hint="Last 30 days (All Channels)"
              onClick={() => handleMetricClick({ title: "Total Impressions", value: formatNumber(combinedMetrics.impressions), type: "impressions" })}
            />
            <MetricCard
              title="CTR"
              value="N/A"
              hint="Weighted"
              onClick={() => handleMetricClick({ title: "CTR", value: "N/A", type: "ctr" })}
            />
            <MetricCard
              title="Conversions"
              value="N/A"
              hint="Last 30 days"
              onClick={() => handleMetricClick({ title: "Conversions", value: "N/A", type: "conversions" })}
            />
          </>
        )}
      </div>

      <article>
        <h2 className="sr-only">Traffic trend</h2>
        <AreaTrendChart data={data} />
      </article>

      {selectedMetric && (
        <MetricDetailModal
          isOpen={!!selectedMetric}
          onClose={() => setSelectedMetric(null)}
          metric={selectedMetric}
        />
      )}
    </section>
    </div>
  );
};

export default Dashboard;
