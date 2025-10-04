import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

// Backend API User types
interface BackendUser {
  id: string;
  email: string;
  role: 'admin' | 'client' | 'subuser';
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  phone: string | null;
  client_settings: Record<string, any> | null;
  permissions: Record<string, any> | null;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: BackendUser;
}

interface UserContext {
  profile: BackendUser | null;
  user: BackendUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  isAdmin: () => boolean;
  isClient: () => boolean;
  isSubuser: () => boolean;
}

const AuthContext = createContext<UserContext | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<BackendUser | null>(null);
  const [profile, setProfile] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get backend URL from environment
  const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

  const fetchUserProfile = useCallback(async (token: string) => {
    console.log('fetchUserProfile: Starting with token');
    
    if (!token) {
      console.error('No token provided to fetchUserProfile');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch profile' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      const userData: BackendUser = await response.json();
      console.log('Fetched profile data:', userData);
      
      setProfile(userData);
      setUser(userData);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setError(error instanceof Error ? error : new Error('Failed to fetch profile'));
      // Clear stored token on profile fetch error
      localStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  }, [backendUrl]);

  const signIn = async (email: string, password: string) => {
    console.log('Starting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Authentication failed' }));
        const error = new Error(errorData.detail || 'Invalid email or password');
        setError(error);
        return { error };
      }

      const loginData: LoginResponse = await response.json();
      console.log('Authentication successful for user:', loginData.user.email);
      
      // Store token in localStorage
      localStorage.setItem('auth_token', loginData.access_token);
      
      // Update state
      setUser(loginData.user);
      setProfile(loginData.user);
      
      console.log('Sign in completed successfully');
      return { error: null };
      
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during sign in';
      setError(new Error(errorMessage));
      return { error: new Error(errorMessage) };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('auth_token');
      setUser(null);
      setProfile(null);
      setError(null);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data?.session?.user) {
        await fetchUserProfile(data.session.user.id);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!profile) return false;

    // Admins have all permissions
    if (profile.role === 'admin') return true;

    // Clients have all permissions in their workspace
    if (profile.role === 'client') return true;

    // Subusers have permissions based on their assigned permissions
    if (profile.role === 'subuser' && subuser) {
      const permissions = subuser.permissions as Record<string, string[]>;
      return permissions[module]?.includes(action) || false;
    }

    return false;
  };

  const isAdmin = () => profile?.role === 'admin';
  const isClient = () => profile?.role === 'client';
  const isSubuser = () => profile?.role === 'subuser';

  useEffect(() => {
    // Get initial session
    console.log('AuthProvider: Getting initial session...');
    
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthProvider: Initial session retrieved:', session ? 'valid session' : 'no session');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthProvider: Fetching user profile for user:', session.user.id);
          await fetchUserProfile(session.user.id);
        } else {
          console.log('AuthProvider: No user session, setting loading to false');
          setLoading(false);
        }
      } catch (error) {
        console.error('AuthProvider: Error getting initial session:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    console.log('AuthProvider: Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed. Event:', event, 'Has session:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        console.log('User authenticated, fetching profile for:', session.user.id);
        try {
          await fetchUserProfile(session.user.id);
          // Update last login
          await supabase.rpc('update_last_login');
          console.log('Last login updated');
        } catch (error) {
          console.error('Error in auth state change handler:', error);
        }
      } else {
        console.log('No user session, clearing profile data');
        setProfile(null);
        setClient(null);
        setSubuser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const value: UserContext = {
    profile,
    client,
    subuser,
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
    refreshSession,
    hasPermission,
    isAdmin,
    isClient,
    isSubuser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
