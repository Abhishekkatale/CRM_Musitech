import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";
import { 
  BarChart3, 
  Users, 
  Target, 
  TrendingUp, 
  Settings, 
  FileText, 
  Link,
  Activity,
  Lock
} from "lucide-react";

type Subuser = Tables<'subusers'>;

interface ModuleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  module: string;
  action: string;
  hasAccess: boolean;
  onClick?: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ 
  title, 
  description, 
  icon, 
  module, 
  action, 
  hasAccess, 
  onClick 
}) => {
  if (!hasAccess) {
    return (
      <Card className="opacity-50 cursor-not-allowed">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-500">{title}</h3>
              <p className="text-sm text-gray-400">{description}</p>
              <div className="flex items-center mt-2">
                <Lock className="h-4 w-4 text-gray-400 mr-1" />
                <span className="text-xs text-gray-400">Access Restricted</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
            <Badge variant="outline" className="mt-2">
              {action} Access
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function SubuserDashboard() {
  const { profile, subuser, client, hasPermission } = useAuth();
  const [stats, setStats] = useState({
    totalLeads: 0,
    activeCampaigns: 0,
    totalReports: 0,
    integrations: 0
  });

  useEffect(() => {
    // In a real app, you would fetch actual stats based on permissions
    // For now, we'll show mock data
    setStats({
      totalLeads: 156,
      activeCampaigns: 8,
      totalReports: 24,
      integrations: 3
    });
  }, []);

  if (!profile || profile.role !== 'subuser' || !subuser || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only subusers can access this page.</p>
        </div>
      </div>
    );
  }

  const handleModuleClick = (module: string) => {
    // In a real app, this would navigate to the specific module
    console.log(`Navigating to ${module} module`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome, {profile.full_name} • {client.company_name}
          </p>
          <Badge variant="outline" className="mt-2">
            {subuser.role_name}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last login</p>
          <p className="text-sm font-medium">
            {profile.last_login ? new Date(profile.last_login).toLocaleString() : 'First time'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{stats.totalLeads}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                <p className="text-2xl font-bold">{stats.activeCampaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Reports</p>
                <p className="text-2xl font-bold">{stats.totalReports}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Link className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Integrations</p>
                <p className="text-2xl font-bold">{stats.integrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Access Information */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertDescription>
          You have access to {Object.keys(subuser.permissions || {}).length} modules based on your role: <strong>{subuser.role_name}</strong>
        </AlertDescription>
      </Alert>

      {/* Module Access Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Available Modules</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ModuleCard
            title="Dashboard"
            description="Overview of your workspace and key metrics"
            icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
            module="dashboard"
            action="read"
            hasAccess={hasPermission('dashboard', 'read')}
            onClick={() => handleModuleClick('dashboard')}
          />

          <ModuleCard
            title="Leads"
            description="Manage and track your leads and prospects"
            icon={<Users className="h-6 w-6 text-green-600" />}
            module="leads"
            action={hasPermission('leads', 'write') ? 'write' : 'read'}
            hasAccess={hasPermission('leads', 'read')}
            onClick={() => handleModuleClick('leads')}
          />

          <ModuleCard
            title="Campaigns"
            description="Create and manage marketing campaigns"
            icon={<Target className="h-6 w-6 text-purple-600" />}
            module="campaigns"
            action={hasPermission('campaigns', 'write') ? 'write' : 'read'}
            hasAccess={hasPermission('campaigns', 'read')}
            onClick={() => handleModuleClick('campaigns')}
          />

          <ModuleCard
            title="Reports"
            description="View analytics and performance reports"
            icon={<FileText className="h-6 w-6 text-orange-600" />}
            module="reports"
            action="read"
            hasAccess={hasPermission('reports', 'read')}
            onClick={() => handleModuleClick('reports')}
          />

          <ModuleCard
            title="Integrations"
            description="Connect and manage third-party services"
            icon={<Link className="h-6 w-6 text-indigo-600" />}
            module="integrations"
            action={hasPermission('integrations', 'write') ? 'write' : 'read'}
            hasAccess={hasPermission('integrations', 'read')}
            onClick={() => handleModuleClick('integrations')}
          />

          <ModuleCard
            title="Attribution"
            description="Track marketing attribution and ROI"
            icon={<TrendingUp className="h-6 w-6 text-red-600" />}
            module="attribution"
            action="read"
            hasAccess={hasPermission('attribution', 'read')}
            onClick={() => handleModuleClick('attribution')}
          />

          <ModuleCard
            title="Analytics"
            description="Advanced analytics and insights"
            icon={<BarChart3 className="h-6 w-6 text-teal-600" />}
            module="analytics"
            action="read"
            hasAccess={hasPermission('analytics', 'read')}
            onClick={() => handleModuleClick('analytics')}
          />

          <ModuleCard
            title="User Management"
            description="Manage user accounts and permissions"
            icon={<Settings className="h-6 w-6 text-gray-600" />}
            module="user_management"
            action="admin"
            hasAccess={hasPermission('user_management', 'admin')}
            onClick={() => handleModuleClick('user_management')}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">New lead added</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Campaign performance updated</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Monthly report generated</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
