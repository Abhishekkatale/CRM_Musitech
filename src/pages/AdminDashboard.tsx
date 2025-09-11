import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createClient, getAllClients, getAuditLogs, updateUserStatus, logClientCreation, logStatusChange } from "@/utils/auth";
import { Tables } from "@/integrations/supabase/types";
import { Plus, Users, Activity, Building2, Eye, EyeOff, Download } from "lucide-react";

type Client = Tables<'clients'> & {
  profiles: Tables<'profiles'>;
};

type AuditLog = Tables<'audit_logs'> & {
  actor: Tables<'profiles'> | null;
  target: Tables<'profiles'> | null;
};

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Client creation form state
  const [createClientOpen, setCreateClientOpen] = useState(false);
  const [clientForm, setClientForm] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    companyDomain: "",
    contactPhone: "",
    address: ""
  });

  useEffect(() => {
    fetchClients();
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    const { data, error } = await getAuditLogs(50, 0);
    if (error) {
      console.error("Error fetching audit logs:", error);
      setError("Failed to fetch audit logs");
    } else {
      setAuditLogs(data || []);
    }
  };

  const fetchClients = async () => {
    const { data, error } = await getAllClients();
    if (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to fetch clients");
    } else {
      setClients(data || []);
    }
  };

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { data, error } = await createClient(
      clientForm.email,
      clientForm.password,
      clientForm.fullName,
      clientForm.companyName,
      clientForm.companyDomain,
      clientForm.contactPhone,
      clientForm.address
    );

    if (error) {
      setError(error.message || "Failed to create client");
    } else {
      setSuccess("Client created successfully!");
      setClientForm({
        email: "",
        password: "",
        fullName: "",
        companyName: "",
        companyDomain: "",
        contactPhone: "",
        address: ""
      });
      setCreateClientOpen(false);
      await logClientCreation(clientForm.email, clientForm.companyName);
      fetchClients();
    }

    setLoading(false);
  };

  const toggleClientStatus = async (client: Client) => {
    const newStatus = client.profiles.status === 'active' ? 'inactive' : 'active';
    
    const { error } = await updateUserStatus(client.profiles.id, newStatus);

    if (error) {
      setError(error.message || "Failed to update client status");
    } else {
      setSuccess(`Client ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      await logStatusChange(client.profiles.id, newStatus, 'client');
      fetchClients();
    }
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Timestamp', 'Actor', 'Action', 'Target', 'Details'].join(','),
      ...auditLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.actor?.email || 'System',
        log.action,
        log.target?.email || '',
        JSON.stringify(log.details)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage clients and monitor system activity</p>
        </div>
        <Dialog open={createClientOpen} onOpenChange={setCreateClientOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    required
                    value={clientForm.fullName}
                    onChange={(e) => setClientForm({...clientForm, fullName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={clientForm.email}
                    onChange={(e) => setClientForm({...clientForm, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={clientForm.password}
                  onChange={(e) => setClientForm({...clientForm, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  required
                  value={clientForm.companyName}
                  onChange={(e) => setClientForm({...clientForm, companyName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyDomain">Company Domain</Label>
                  <Input
                    id="companyDomain"
                    value={clientForm.companyDomain}
                    onChange={(e) => setClientForm({...clientForm, companyDomain: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={clientForm.contactPhone}
                    onChange={(e) => setClientForm({...clientForm, contactPhone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={clientForm.address}
                  onChange={(e) => setClientForm({...clientForm, address: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateClientOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Client"}
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
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold">
                  {clients.filter(c => c.profiles.status === 'active').length}
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
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No clients found. Create your first client to get started.</p>
                  </div>
                ) : (
                  clients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">{client.company_name}</h3>
                          <Badge variant={client.profiles.status === 'active' ? 'default' : 'secondary'}>
                            {client.profiles.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{client.profiles.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(client.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleClientStatus(client)}
                        >
                          {client.profiles.status === 'active' ? (
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
              <div className="flex justify-between items-center">
                <CardTitle>Audit Logs</CardTitle>
                <Button variant="outline" size="sm" onClick={exportAuditLogs}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
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
    </div>
  );
}
