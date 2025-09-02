import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchMockCampaigns, type Campaign } from "@/mocks/api";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    const data = await fetchMockCampaigns();
    setCampaigns(data);
    setLoading(false);
  };

  return (
    <section aria-labelledby="campaigns-title" className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 id="campaigns-title" className="text-2xl font-semibold">Campaigns</h1>
        <Button variant="hero" onClick={handleFetch} disabled={loading}>{loading ? "Loading…" : "Fetch Mock Data"}</Button>
      </header>

      <div className="rounded-lg border bg-card p-2 shadow-elevated">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Spend</TableHead>
              <TableHead>Impressions</TableHead>
              <TableHead>Clicks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.channel}</TableCell>
                <TableCell>${c.spend.toLocaleString()}</TableCell>
                <TableCell>{c.impressions.toLocaleString()}</TableCell>
                <TableCell>{c.clicks.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default Campaigns;
