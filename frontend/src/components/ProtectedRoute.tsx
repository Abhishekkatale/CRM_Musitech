import { Navigate, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children?: ReactNode;
  requiredRole?: "admin" | "client" | "subuser";
  requiredPermission?: {
    module: string;
    action: string;
  };
  fallbackPath?: string;
}

const roleDashboard = {
  admin: "/admin",
  client: "/client",
  subuser: "/dashboard"
};

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallbackPath = "/auth" 
}: ProtectedRouteProps) {
  const { user, profile, loading, hasPermission, error } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle redirection after successful authentication
  useEffect(() => {
    if (!loading && user && profile) {
      // If the user is authenticated but doesn't have the required role
      if (requiredRole && profile.role !== requiredRole) {
        const redirectTo = roleDashboard[profile.role] || "/dashboard";
        console.log(`Redirecting ${profile.role} to ${redirectTo}`);
        navigate(redirectTo, { replace: true });
      }
    }
  }, [user, profile, loading, requiredRole, navigate]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !profile) {
    // Store the attempted URL for redirecting after login
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <p className="text-sm text-gray-600 font-medium">Required Permission:</p>
            <p className="text-sm text-gray-500">
              {requiredPermission.module} - {requiredPermission.action}
            </p>
          </div>
          <Button 
            onClick={() => navigate(-1)}
            className="w-full"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
