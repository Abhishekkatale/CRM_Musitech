import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { logLogin } from "@/utils/audit";
import { FcGoogle } from "react-icons/fc";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signIn, profile } = useAuth();

  // Redirect if already authenticated
  if (profile) {
    const roleDashboard = {
      admin: "/admin",
      client: "/client", 
      subuser: "/dashboard"
    };
    const redirectTo = roleDashboard[profile.role] || "/dashboard";
    console.log("Redirecting to:", redirectTo);
    navigate(redirectTo, { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setError(signInError.message);
    } else {
      await logLogin(email);
      // Navigation will be handled by the AuthProvider
    }
    
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError("");
    
    // Note: Google OAuth would need to be configured in Supabase
    // For now, we'll show an error message
    setError("Google authentication is not configured yet. Please use email/password login.");
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CRM Musitech</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleLogin}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@musitech.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Contact your administrator for account access
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
