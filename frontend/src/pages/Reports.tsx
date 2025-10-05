import { Button } from "@/components/ui/button";
import { exportToCSV } from "@/utils/export";

const Reports = () => {
  const exportKPIs = () => {
    const rows = [
      { metric: "Spend", value: 3300 },
      { metric: "Impressions", value: 208000 },
      { metric: "CTR", value: "2.4%" },
      { metric: "Conversions", value: 1280 },
    ];
    exportToCSV("musitech-kpis.csv", rows);
  };

  const exportCampaigns = () => {
    const rows = [
      { name: "Brand Awareness", channel: "Facebook", spend: 1200, impressions: 120000, clicks: 2400 },
      { name: "Search - Music Lessons", channel: "Google Ads", spend: 2100, impressions: 88000, clicks: 4100 },
    ];
    exportToCSV("musitech-campaigns.csv", rows);
  };

  return (
    <section aria-labelledby="reports-title" className="space-y-6">
      <header>
        <h1 id="reports-title" className="text-2xl font-semibold">Reports Export</h1>
        <p className="text-muted-foreground">Download CSV snapshots of KPIs or campaigns.</p>
      </header>
      <div className="flex flex-wrap gap-3">
        <Button variant="hero" onClick={exportKPIs}>Export KPIs CSV</Button>
        <Button variant="secondary" onClick={exportCampaigns}>Export Campaigns CSV</Button>
      </div>
    </section>
  );
};

export default Reports;
