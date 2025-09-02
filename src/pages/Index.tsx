import AppShell from "./AppShell";
import { Routes, Route, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="hero-spotlight border-b">
        <div className="container mx-auto flex flex-col items-center gap-6 px-4 py-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">MusiTech Ad Performance Dashboard</h1>
          <p className="max-w-2xl text-muted-foreground">Centralize insights across Facebook & Google Ads. Real-time and historical trends. Export reports with one click.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="hero" size="xl" className="animate-floaty">
              <Link to="/">Open Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <a href="#features">Learn more</a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12" id="features">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border p-6 shadow-elevated">
            <h2 className="text-lg font-semibold">Central metrics</h2>
            <p className="mt-1 text-sm text-muted-foreground">KPIs from all channels in one place.</p>
          </div>
          <div className="rounded-lg border p-6 shadow-elevated">
            <h2 className="text-lg font-semibold">Trends & charts</h2>
            <p className="mt-1 text-sm text-muted-foreground">Real-time and historical performance views.</p>
          </div>
          <div className="rounded-lg border p-6 shadow-elevated">
            <h2 className="text-lg font-semibold">Exports</h2>
            <p className="mt-1 text-sm text-muted-foreground">Generate CSV reports in one click.</p>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} MusiTech</footer>
    </div>
  );
};

const Index = () => {
  return (
    <Routes>
      <Route path="/*" element={<AppShell />} />
      <Route path="/landing" element={<Landing />} />
    </Routes>
  );
};

export default Index;

