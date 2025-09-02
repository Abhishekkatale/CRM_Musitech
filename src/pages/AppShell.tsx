import NavBar from "@/components/NavBar";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import Leads from "./Leads";
import Campaigns from "./Campaigns";
import Reports from "./Reports";
import Integrations from "./Integrations";
import Attribution from "./Attribution";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

const AppShell = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background flex w-full">
        <AppSidebar />
        <div className="flex-1">
          <NavBar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/attribution" element={<Attribution />} />
              <Route path="/integrations" element={<Integrations />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppShell;
