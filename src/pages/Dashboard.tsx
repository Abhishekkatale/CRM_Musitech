import { useState, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { MetricCard } from "@/components/MetricCard";
import { AreaTrendChart } from "@/components/AreaTrendChart";
import { MetricDetailModal } from "@/components/MetricDetailModal";
import { supabase } from "@/integrations/supabase/client";

// Sample data for charts
const sampleChartData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 460 },
  { name: "Mar", value: 520 },
  { name: "Apr", value: 680 },
  { name: "May", value: 740 },
  { name: "Jun", value: 820 },
];

const fetchMetrics = async (provider: string, session: any) => {
  if (!session) return { spend: 0, impressions: 0 };
  
  try {
    const response = await fetch(`/functions/v1/get-ad-metrics?provider=${provider}`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    
    if (!response.ok) {
      if (response.status === 500) {
        const errorData = await response.json();
        if (errorData.error?.includes("Could not find credentials")) {
          console.warn(`No credentials for ${provider}, using zero values.`);
          return { spend: 0, impressions: 0 };
        }
      }
      throw new Error(`Failed to fetch ${provider} metrics`);
    }
    
    const result = await response.json();
    return result.data || { spend: 0, impressions: 0 };
  } catch (error) {
    console.error(`Error fetching ${provider} metrics:`, error);
    return { spend: 0, impressions: 0 };
  }
};

const Dashboard = () => {
  const { session, profile, loading: authLoading } = useAuth();
  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    value: string | number;
    type: 'spend' | 'impressions' | 'ctr' | 'conversions';
  } | null>(null);
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  // Handle metric card clicks
  const handleMetricClick = (metric: {
    title: string;
    value: string | number;
    type: 'spend' | 'impressions' | 'ctr' | 'conversions';
  }) => {
    setSelectedMetric(metric);
  };

  // Fetch metrics for each provider
  const results = useQueries({
    queries: ['facebook', 'google'].map((provider) => ({
      queryKey: ['metrics', provider],
      queryFn: () => fetchMetrics(provider, session),
      enabled: !!session, // Only run query if we have a session
    })),
  });

  const isLoading = authLoading || results.some(q => q.isLoading);

  // Combine metrics from all providers
  const combinedMetrics = useMemo(() => {
    return results.reduce((acc, queryResult) => {
      if (queryResult.data) {
        acc.spend += queryResult.data.spend || 0;
        acc.impressions += queryResult.data.impressions || 0;
      }
      return acc;
    }, { spend: 0, impressions: 0 });
  }, [results]);

  // Format large numbers with commas
  const formatNumber = (value: number) => 
    new Intl.NumberFormat('en-US').format(value);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-muted-foreground mb-6">Please sign in to access the dashboard</p>
        <Button onClick={() => window.location.href = '/auth'}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4">
      {/* Header with welcome message */}
      <header className="bg-white dark:bg-gray-800 rounded-xl border p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {profile?.role === 'admin' ? 'Admin' : 'My'} Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back, {profile?.full_name || 'User'}! Here's your performance overview.
        </p>
      </header>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Spend"
          value={formatCurrency(combinedMetrics.spend)}
          hint="Last 30 days (All Channels)"
          onClick={() => handleMetricClick({ 
            title: "Total Spend", 
            value: formatCurrency(combinedMetrics.spend), 
            type: "spend" 
          })}
        />
        <MetricCard
          title="Total Impressions"
          value={formatNumber(combinedMetrics.impressions)}
          hint="Last 30 days (All Channels)"
          onClick={() => handleMetricClick({ 
            title: "Total Impressions", 
            value: formatNumber(combinedMetrics.impressions), 
            type: "impressions" 
          })}
        />
        <MetricCard
          title="CTR"
          value="N/A"
          hint="Click-Through Rate"
          onClick={() => handleMetricClick({ 
            title: "CTR", 
            value: "Not available", 
            type: "ctr" 
          })}
        />
        <MetricCard
          title="Conversions"
          value="N/A"
          hint="Last 30 days"
          onClick={() => handleMetricClick({ 
            title: "Conversions", 
            value: "Not available", 
            type: "conversions" 
          })}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Spend Trend</h2>
          <AreaTrendChart data={sampleChartData} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Impressions Trend</h2>
          <AreaTrendChart data={sampleChartData} />
        </div>
      </div>

      {/* Metric Detail Modal */}
      {selectedMetric && (
        <MetricDetailModal
          isOpen={!!selectedMetric}
          onClose={() => setSelectedMetric(null)}
          metric={selectedMetric}
        />
      )}
    </div>
  );
};

export default Dashboard;
