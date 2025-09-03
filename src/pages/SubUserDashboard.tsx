import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

interface SubUserData {
  clients: {
    company_name: string;
  };
}

export default function SubUserDashboard() {
  const [userData, setUserData] = useState<SubUserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('subusers')
          .select(`
            clients (
              company_name
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error("Error fetching sub-user data:", error);
        } else {
          setUserData(data);
        }
      }
      setLoading(false);
    };

    fetchSubUserData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <div>Could not load user data.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sub-user Dashboard</h1>
      <p className="text-lg">Welcome!</p>
      <p>You are a member of the following workspace:</p>
      <p className="text-xl font-semibold">{userData.clients.company_name}</p>
    </div>
  );
}
