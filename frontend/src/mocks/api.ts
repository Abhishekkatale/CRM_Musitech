export type Campaign = {
  id: string;
  name: string;
  channel: "Facebook" | "Google Ads";
  spend: number;
  impressions: number;
  clicks: number;
};

export async function fetchMockCampaigns(): Promise<Campaign[]> {
  await new Promise((r) => setTimeout(r, 600));
  return [
    { id: "c1", name: "Brand Awareness", channel: "Facebook", spend: 1200, impressions: 120000, clicks: 2400 },
    { id: "c2", name: "Search - Music Lessons", channel: "Google Ads", spend: 2100, impressions: 88000, clicks: 4100 },
  ];
}
