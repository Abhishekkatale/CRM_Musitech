import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { logAction } from "@/utils/audit";

// Define the type for a sub-user
interface SubUser {
  id: string;
  role: string;
  permissions: any; // jsonb
  user: {
    id: string;
    email: string;
    active: boolean;
  };
}

// Define the type for the current client
interface CurrentClient {
  id: string;
  company_name: string;
}

export default function ClientDashboard() {
  const [client, setClient] = useState<CurrentClient | null>(null);
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClientAndSubUsers();
  }, []);

  const fetchClientAndSubUsers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Fetch the client id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, company_name')
        .eq('user_id', user.id)
        .single();

      if (clientError) {
        console.error("Error fetching client data:", clientError);
        return;
      }
      setClient(clientData);

      // 2. Fetch sub-users for the client
      const { data: subUsersData, error: subUsersError } = await supabase
        .from('subusers')
        .select(`
          id,
          role,
          permissions,
          users (
            id,
            email,
            active
          )
        `)
        .eq('client_id', clientData.id);

      if (subUsersError) {
        console.error("Error fetching sub-users:", subUsersError);
      } else {
        const formattedSubUsers = subUsersData.map(subUser => ({
          id: subUser.id,
          role: subUser.role,
          permissions: subUser.permissions,
          user: Array.isArray(subUser.users) ? subUser.users[0] : subUser.users,
        }));
        setSubUsers(formattedSubUsers);
      }
    }
  };

  const handleCreateSubUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!client) return;

    setLoading(true);

    // In a real app, this should be an edge function for security
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
      await supabase.from('users').update({ role: 'subuser' }).eq('id', authData.user.id);

      const { error: subUserError } = await supabase
        .from("subusers")
        .insert([{
          user_id: authData.user.id,
          client_id: client.id,
          role,
          permissions: {}, // Default empty permissions
        }]);

      if (subUserError) {
        alert(subUserError.message);
      } else {
        await logAction('create_subuser', authData.user.id);
        alert("Sub-user created successfully!");
        fetchClientAndSubUsers();
      }
    }

    setLoading(false);
  };

  const toggleSubUserStatus = async (subUser: SubUser) => {
    const newStatus = !subUser.user.active;
    const { error } = await supabase
      .from('users')
      .update({ active: newStatus })
      .eq('id', subUser.user.id);

    if (error) {
      alert(error.message);
    } else {
      await logAction(newStatus ? 'activate_subuser' : 'deactivate_subuser', subUser.user.id);
      alert(`Sub-user ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchClientAndSubUsers();
    }
  };

  if (!client) {
    return <div>Loading client data...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Client Dashboard</h1>
      <p className="text-lg mb-4">Welcome, {client.company_name}</p>

      <Card>
        <CardHeader>
          <CardTitle>Create Sub-user</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSubUser}>
            <div className="grid gap-4">
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
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Sub-user"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mt-8 mb-4">Sub-users</h2>
      <div className="space-y-4">
        {subUsers.map((subUser) => (
          <Card key={subUser.id}>
            <CardContent className="flex justify-between items-center p-4">
              <div>
                <p className="font-semibold">{subUser.user?.email}</p>
                <p className="text-sm text-gray-500">Role: {subUser.role}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${subUser.user?.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {subUser.user?.active ? "Active" : "Inactive"}
                </span>
                <Button variant="outline" onClick={() => toggleSubUserStatus(subUser)}>
                  {subUser.user?.active ? "Deactivate" : "Reactivate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
