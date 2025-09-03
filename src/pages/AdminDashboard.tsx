import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { logAction } from "@/utils/audit";

// Define the type for a client
interface Client {
  id: string;
  company_name: string;
  user: {
    id: string;
    email: string;
    active: boolean;
  };
}

// Define the type for an audit log
interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  actor: {
    email:string;
  } | null;
  target: {
    email: string;
  } | null;
}

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        timestamp,
        actor:users!actor_user_id (
          email
        ),
        target:users!target_user_id (
          email
        )
      `)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Error fetching audit logs:", error);
    } else {
      setAuditLogs(data);
    }
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select(`
        id,
        company_name,
        users (
          id,
          email,
          active
        )
      `);

    if (error) {
      console.error("Error fetching clients:", error);
    } else {
      const formattedClients = data.map(client => ({
        id: client.id,
        company_name: client.company_name,
        user: Array.isArray(client.users) ? client.users[0] : client.users,
      }));
      setClients(formattedClients);
    }
  };

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // This is not a secure way to create users.
    // In a real application, this should be handled by a Supabase Edge Function.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      await supabase.from('users').update({ role: 'client' }).eq('id', authData.user.id);
      const { error: clientError } = await supabase
        .from("clients")
        .insert([{ user_id: authData.user.id, company_name: companyName }]);

      if (clientError) {
        alert(clientError.message);
      } else {
        await logAction('create_client', authData.user.id);
        alert("Client created successfully!");
        fetchClients();
      }
    }

    setLoading(false);
  };

  const toggleClientStatus = async (client: Client) => {
    const newStatus = !client.user.active;
    const { error } = await supabase
      .from('users')
      .update({ active: newStatus })
      .eq('id', client.user.id);

    if (error) {
      alert(error.message);
    } else {
      await logAction(newStatus ? 'activate_client' : 'deactivate_client', client.user.id);
      alert(`Client ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchClients();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create Client</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateClient}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Client"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mt-8 mb-4">Clients</h2>
      <div className="space-y-4">
        {clients.map((client) => (
          <Card key={client.id}>
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <p className="font-semibold">{client.company_name}</p>
                <p className="text-sm text-gray-500">{client.user?.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${client.user?.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {client.user?.active ? "Active" : "Inactive"}
                </span>
                <Button variant="outline" onClick={() => toggleClientStatus(client)}>
                  {client.user?.active ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Audit Logs</h2>
      <Card>
        <CardContent className="p-4">
          <table className="w-full">
            <thead>
              <tr className="text-left">
                <th className="p-2">Actor</th>
                <th className="p-2">Action</th>
                <th className="p-2">Target</th>
                <th className="p-2">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-2">{log.actor?.email}</td>
                  <td className="p-2">{log.action}</td>
                  <td className="p-2">{log.target?.email}</td>
                  <td className="p-2">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
