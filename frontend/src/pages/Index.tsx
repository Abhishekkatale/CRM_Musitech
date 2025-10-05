import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { logLogout } from "@/utils/audit";

const Index = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const handleSignOut = async () => {
    await logLogout();
    await signOut();
    navigate("/auth");
  };

  // Redirect to appropriate dashboard based on role
  if (profile) {
    const roleDashboard = {
      admin: "/admin",
      client: "/client",
      subuser: "/subuser"
    };
    return <Navigate to={roleDashboard[profile.role] || "/dashboard"} replace />;
  }

  // If no profile, redirect to auth
  return <Navigate to="/auth" replace />;
};

export default Index;