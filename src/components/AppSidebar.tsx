import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, BarChart3, LineChart, Share2, Layers } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
const items = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Leads",
  url: "/leads",
  icon: Users
}, {
  title: "Campaigns",
  url: "/campaigns",
  icon: Layers
}, {
  title: "Reports",
  url: "/reports",
  icon: BarChart3
}, {
  title: "Attribution",
  url: "/attribution",
  icon: LineChart
}, {
  title: "Integrations",
  url: "/integrations",
  icon: Share2
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  // group expansion controlled by default state
  const getNavCls = ({
    isActive
  }: {
    isActive: boolean;
  }) => isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";
  return <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-center p-2">
            <img src="/lovable-uploads/2b8d1e25-bdb4-46ee-a671-608f2eca4eab.png" alt="MusiTech Logo" className={collapsed ? "h-8 w-8" : "h-10 w-10"} />
            {!collapsed}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls} aria-label={item.title}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}