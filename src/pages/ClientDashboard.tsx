import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createSubuser, getClientSubusers, getAuditLogs, updateSubuserStatus, updateSubuserPermissions, logSubuserCreation, logStatusChange, logPermissionChange, getRolePermissions } from "@/utils/auth";
import { Tables } from "@/integrations/supabase/types";
import { Plus, Users, Activity, Settings, Eye, EyeOff, UserCheck, UserX } from "lucide-react";

type Subuser = Tables<'subusers'> & {
  profiles: Tables<'profiles'>;
};

type AuditLog = Tables<'audit_logs'> & {
  actor: Tables<'profiles'> | null;
  target: Tables<'profiles'> | null;
};

const PERMISSION_MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'leads', label: 'Leads' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'reports', label: 'Reports' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'attribution', label: 'Attribution' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'user_management', label: 'User Management' }
];

const PERMISSION_ACTIONS = [
  { id: 'read', label: 'Read' },
  { id: 'write', label: 'Write' },
  { id: 'delete', label: 'Delete' },
  { id: 'admin', label: 'Admin' }
];

const ROLE_TEMPLATES = [
  'Social Media Manager',
  'Analytics Viewer',
  'Campaign Manager',
  'Lead Manager',
  'Full Access'
];

export default function ClientDashboard() {
  const { profile, client } = useAuth();
  const [subusers, setSubusers] = useState<Subuser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Subuser creation form state
  const [createSubuserOpen, setCreateSubuserOpen] = useState(false);
  const [subuserForm, setSubuserForm] = useState({
    email: "",
    password: "",
    fullName: "",
    roleName: "",
    permissions: {} as any
  });

  // Permission editing state
  const [editPermissionsOpen, setEditPermissionsOpen] = useState(false);
  const [editingSubuser, setEditingSubuser] = useState<Subuser | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<any>({});

  useEffect(() => {
    if (client) {
      fetchSubusers();
      fetchAuditLogs();
    }
  }, [client]);

  const fetchSubusers = async () => {
    if (!client) return;
    
    const { data, error } = await getClientSubusers(client.id);
    if (error) {
      console.error("Error fetching subusers:", error);
      setError("Failed to fetch subusers");
    } else {
      setSubusers(data || []);
    }
  };

  const fetchAuditLogs = async () => {
    if (!client) return;
    
    const { data, error } = await getAuditLogs(50, 0, client.id);
    if (error) {
      console.error("Error fetching audit logs:", error);
      setError("Failed to fetch audit logs");
    } else {
      setAuditLogs(data || []);
    }
  };

  const handleCreateSubuser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { data, error } = await createSubuser(
      subuserForm.email,
      subuserForm.password,
      subuserForm.fullName,
      subuserForm.roleName,
      subuserForm.permissions
    );

    if (error) {
      setError(error.message || "Failed to create subuser");
    } else {
      setSuccess("Subuser created successfully!");
      setSubuserForm({
        email: "",
        password: "",
        fullName: "",
        roleName: "",
        permissions: {}
      });
      setCreateSubuserOpen(false);
      await logSubuserCreation(subuserForm.email, subuserForm.roleName);
      fetchSubusers();
    }

    setLoading(false);
  };

  const toggleSubuserStatus = async (subuser: Subuser) => {
    const newStatus = subuser.status === 'active' ? 'inactive' : 'active';
    
    const { error } = await updateSubuserStatus(subuser.id, newStatus);

    if (error) {
      setError(error.message || "Failed to update subuser status");
    } else {
      setSuccess(`Subuser ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      await logStatusChange(subuser.profiles.id, newStatus, 'subuser');
      fetchSubusers();
    }
  };

  const handleRoleTemplateChange = (roleName: string) => {
    const permissions = getRolePermissions(roleName);
    setSubuserForm({ ...subuserForm, roleName, permissions });
  };

  const openEditPermissions = (subuser: Subuser) => {
    setEditingSubuser(subuser);
    setEditingPermissions(subuser.permissions || {});
    setEditPermissionsOpen(true);
  };

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    setEditingPermissions(prev => {
      const newPermissions = { ...prev };
      if (!newPermissions[module]) {
        newPermissions[module] = [];
      }
      
      if (checked) {
        if (!newPermissions[module].includes(action)) {
          newPermissions[module].push(action);
        }
      } else {
        newPermissions[module] = newPermissions[module].filter((a: string) => a !== action);
      }
      
      return newPermissions;
    });
  };

  const savePermissions = async () => {
    if (!editingSubuser) return;

    const { error } = await updateSubuserPermissions(editingSubuser.id, editingPermissions);

    if (error) {
      setError(error.message || "Failed to update permissions");
    } else {
      setSuccess("Permissions updated successfully!");
      await logPermissionChange(editingSubuser.profiles.id, editingPermissions);
      setEditPermissionsOpen(false);
      fetchSubusers();
    }
  };

  if (!profile || profile.role !== 'client' || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only clients can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {client.company_name}</p>
        </div>
        <Dialog open={createSubuserOpen} onOpenChange={setCreateSubuserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Subuser
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Subuser</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubuser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    required
                    value={subuserForm.fullName}
                    onChange={(e) => setSubuserForm({...subuserForm, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={subuserForm.email}
                    onChange={(e) => setSubuserForm({...subuserForm, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={subuserForm.password}
                  onChange={(e) => setSubuserForm({...subuserForm, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Template</Label>
                <Select value={subuserForm.roleName} onValueChange={handleRoleTemplateChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role template" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_TEMPLATES.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateSubuserOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Subuser"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Subusers</p>
                <p className="text-2xl font-bold">{subusers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Subusers</p>
                <p className="text-2xl font-bold">
                  {subusers.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Actions</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="subusers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subusers">Subusers</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="subusers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subuser Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subusers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No subusers found. Create your first subuser to get started.</p>
                  </div>
                ) : (
                  subusers.map((subuser) => (
                    <div key={subuser.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">{subuser.profiles.full_name}</h3>
                          <Badge variant={subuser.status === 'active' ? 'default' : 'secondary'}>
                            {subuser.status}
                          </Badge>
                          <Badge variant="outline">{subuser.role_name}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{subuser.profiles.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(subuser.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditPermissions(subuser)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Permissions
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSubuserStatus(subuser)}
                        >
                          {subuser.status === 'active' ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Timestamp</th>
                      <th className="text-left p-3 font-medium">Actor</th>
                      <th className="text-left p-3 font-medium">Action</th>
                      <th className="text-left p-3 font-medium">Target</th>
                      <th className="text-left p-3 font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3 text-sm">
                          {log.actor?.email || 'System'}
                        </td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline">{log.action}</Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {log.target?.email || '-'}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Permissions Dialog */}
      <Dialog open={editPermissionsOpen} onOpenChange={setEditPermissionsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Permissions - {editingSubuser?.profiles.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {PERMISSION_MODULES.map(module => (
              <div key={module.id} className="space-y-3">
                <h4 className="font-medium text-lg">{module.label}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {PERMISSION_ACTIONS.map(action => (
                    <div key={action.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${module.id}-${action.id}`}
                        checked={editingPermissions[module.id]?.includes(action.id) || false}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(module.id, action.id, checked as boolean)
                        }
                      />
                      <Label htmlFor={`${module.id}-${action.id}`} className="text-sm">
                        {action.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditPermissionsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={savePermissions}>
                Save Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}