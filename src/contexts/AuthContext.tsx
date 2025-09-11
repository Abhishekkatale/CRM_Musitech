import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Define the profile type with email and role
interface UserProfile extends Tables<'profiles'> {
  email: string;
  role: 'admin' | 'client' | 'subuser';
}

type Profile = Tables<'profiles'>;
type Client = Tables<'clients'>;
type Subuser = Tables<'subusers'>;

interface UserContext {
  profile: Profile | null;
  client: Client | null;
  subuser: Subuser | null;
  user: User | null;
  session: Session | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [subuser, setSubuser] = useState<Subuser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserProfile = useCallback(async (userId: string) => {
    console.log('fetchUserProfile: Starting for user ID:', userId);
    
    if (!userId) {
      console.error('No user ID provided to fetchUserProfile');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Fetch the user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .single();

      if (profileError || !profileData) {
        const error = profileError || new Error('No profile data found');
        console.error('Error fetching profile:', error);
        setError(new Error(profileError?.message || 'User profile not found'));
        await supabase.auth.signOut(); // Sign out if profile not found
        return;
      }

      console.log('Fetched profile data:', { 
        id: profileData.id, 
        role: (profileData as any).role,
        email: (profileData as any).email
      });
      
      // 2. Update profile state
      setProfile(profileData);

      // 3. Fetch role-specific data
      if (profileData.role === 'client') {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('profile_id', profileData.id)
          .maybeSingle();
        
        if (clientError) {
          console.error('Error fetching client data:', clientError);
          // Don't fail the login if client data fetch fails
        }
        
        setClient(clientData || null);
        setSubuser(null);
        
      } else if (profileData.role === 'subuser') {
        const { data: subuserData, error: subuserError } = await supabase
          .from('subusers')
          .select('*')
          .eq('profile_id', profileData.id)
          .maybeSingle();
        
        if (subuserError) {
          console.error('Error fetching subuser data:', subuserError);
          // Don't fail the login if subuser data fetch fails
        }
        
        setSubuser(subuserData || null);
        setClient(null);
      } else {
        // For admin or other roles
        setClient(null);
        setSubuser(null);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Starting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      // 1. Sign in with email and password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (signInError) {
        console.error('Authentication error:', signInError);
        setError(new Error(signInError.message));
        return { error: signInError };
      }

      console.log('Authentication successful, user ID:', data.user?.id);
      
      if (!data.user) {
        const error = new Error('No user data returned from authentication');
        setError(error);
        return { error };
      }

      // 2. Get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        const error = new Error(sessionError?.message || 'No active session found');
        setError(error);
        return { error };
      }

      // 3. Update session and user state
      setSession(session);
      setUser(data.user);

      // 4. Fetch user profile
      console.log('Fetching user profile...');
      await fetchUserProfile(data.user.id);
      
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
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setClient(null);
      setSubuser(null);
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
