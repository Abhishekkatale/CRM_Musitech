import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children?: ReactNode;
  requiredRole?: "admin" | "client" | "subuser";
  requiredPermission?: {
    module: string;
    action: string;
  };
  fallbackPath?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallbackPath = "/auth" 
}: ProtectedRouteProps) {
  const { user, profile, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && profile.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const roleDashboard = {
      admin: "/admin",
      client: "/client",
      subuser: "/dashboard"
    };
    
    return <Navigate to={roleDashboard[profile.role] || "/dashboard"} replace />;
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission.module, requiredPermission.action)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this resource.
          </p>
          <p className="text-sm text-gray-500">
            Required: {requiredPermission.module} - {requiredPermission.action}
          </p>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
