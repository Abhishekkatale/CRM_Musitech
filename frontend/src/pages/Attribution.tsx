import { useEffect } from "react";
import AttributionAnalytics from "@/components/AttributionAnalytics";

const Attribution = () => {
  useEffect(() => {
    document.title = "Attribution & UTM Analytics";
    // Meta description & canonical for basic SEO
    const desc = "Track UTM sources, campaign hierarchy, first/last-touch and conversions.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);

    const linkRel = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const canonical = linkRel ?? Object.assign(document.createElement("link"), { rel: "canonical" });
    canonical.href = window.location.href;
    if (!linkRel) document.head.appendChild(canonical);
  }, []);

  return (
    <section aria-labelledby="attribution-title" className="space-y-6">
      <header>
        <h1 id="attribution-title" className="text-2xl font-semibold">Attribution & UTM Analytics</h1>
        <p className="text-muted-foreground">Understand sources, touches, and conversions to optimize budget & ROI.</p>
      </header>
      <AttributionAnalytics />
    </section>
  );
};

export default Attribution;
