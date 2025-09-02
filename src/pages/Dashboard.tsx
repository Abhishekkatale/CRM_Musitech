import { useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { AreaTrendChart } from "@/components/AreaTrendChart";
import { MetricDetailModal } from "@/components/MetricDetailModal";


const data = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 460 },
  { name: "Mar", value: 520 },
  { name: "Apr", value: 680 },
  { name: "May", value: 740 },
  { name: "Jun", value: 820 },
];

const Dashboard = () => {
  const [selectedMetric, setSelectedMetric] = useState<{
    title: string;
    value: string | number;
    type: 'spend' | 'impressions' | 'ctr' | 'conversions';
  } | null>(null);

  const handleMetricClick = (metric: { title: string; value: string | number; type: 'spend' | 'impressions' | 'ctr' | 'conversions' }) => {
    setSelectedMetric(metric);
  };

  return (
    <div>
    <section aria-labelledby="dashboard-title" className="space-y-8">
      <header className="hero-spotlight rounded-xl border p-8 shadow-elevated">
        <h1 id="dashboard-title" className="text-3xl font-bold tracking-tight">MusiTech Multi-Channel Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Central dashboard for key metrics across Facebook & Google Ads. Real-time and historical trends.</p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Spend" 
          value="$3,300" 
          hint="Last 30 days" 
          onClick={() => handleMetricClick({ title: "Spend", value: "$3,300", type: "spend" })}
        />
        <MetricCard 
          title="Impressions" 
          value="208,000" 
          hint="Last 30 days" 
          onClick={() => handleMetricClick({ title: "Impressions", value: "208,000", type: "impressions" })}
        />
        <MetricCard 
          title="CTR" 
          value="2.4%" 
          hint="Weighted" 
          onClick={() => handleMetricClick({ title: "CTR", value: "2.4%", type: "ctr" })}
        />
        <MetricCard 
          title="Conversions" 
          value="1,280" 
          hint="Last 30 days" 
          onClick={() => handleMetricClick({ title: "Conversions", value: "1,280", type: "conversions" })}
        />
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
