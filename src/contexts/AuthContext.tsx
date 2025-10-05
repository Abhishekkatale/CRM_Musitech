import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

// Define the profile type to match the database schema
type UserProfile = {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'client' | 'subuser';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  last_login: string;
  created_by: string;
  [key: string]: any; // Allow additional properties
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
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<{ error: AuthError | null }>;
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

  const fetchUserProfile = useCallback(async (userId: string): Promise<{ error: AuthError | null } | void> => {
    console.log('fetchUserProfile: Starting for user ID:', userId);
    
    if (!userId) {
      console.error('No user ID provided to fetchUserProfile');
      return { error: new AuthError('No user ID provided') };
    }

    // Prevent multiple simultaneous profile fetches
    if (loading) {
      console.log('Profile fetch already in progress, skipping duplicate request');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Fetching user profile from database...');
      
      // 1. First, get the user's role from auth.users
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('Error fetching user data:', userError);
        setError(new Error(userError?.message || 'Failed to fetch user data'));
        return { error: new AuthError('Failed to fetch user data') };
      }
      
      // 2. Get the user's role from the JWT claims to avoid RLS recursion
      const userRole = user.user_metadata?.role || user.app_metadata?.role;
      
      if (!userRole) {
        console.error('No role found in user metadata');
        setError(new Error('User role not found'));
        return { error: new AuthError('User role not found') };
      }
      
      console.log(`User role from JWT: ${userRole}`);
      
      // 3. Create a minimal profile object from the auth user data
      const minimalProfile: UserProfile = {
        id: user.id,
        auth_user_id: user.id,
        email: user.email || '',
        full_name: [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ') || 'Admin User',
        role: userRole as 'admin' | 'client' | 'subuser',
        status: 'active',
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
        created_by: user.id,
        // Add any additional properties that might be expected
        avatar_url: user.user_metadata?.avatar_url || null,
        phone: user.phone || null,
        email_verified: !!user.email_confirmed_at,
        phone_verified: !!user.phone_confirmed_at,
      };
      
      // 4. Set the minimal profile first to prevent UI flicker
      setProfile(minimalProfile);
      
      // 5. Now try to fetch the full profile data in the background
      // but don't let it block the login flow
      const fetchFullProfile = async () => {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', userId)
            .single()
            .returns<UserProfile>();
            
          if (profileError) throw profileError;
          if (profileData) {
            console.log('Fetched full profile data:', { 
              id: profileData.id, 
              role: profileData.role,
              email: profileData.email
            });
            
            // Update the profile with the full data
            setProfile(profileData);
            
            try {
              // Fetch role-specific data
              if (profileData.role === 'client') {
                const { data: clientData } = await supabase
                  .from('clients')
                  .select('*')
                  .eq('profile_id', profileData.id)
                  .maybeSingle();
                setClient(clientData || null);
                setSubuser(null);
              } else if (profileData.role === 'subuser') {
                const { data: subuserData } = await supabase
                  .from('subusers')
                  .select('*')
                  .eq('profile_id', profileData.id)
                  .maybeSingle();
                setSubuser(subuserData || null);
                setClient(null);
              } else {
                setClient(null);
                setSubuser(null);
              }
            } catch (roleDataError) {
              console.error('Error fetching role-specific data:', roleDataError);
              // Continue with just the profile data if role data fails
            }
          }
        } catch (error) {
          console.error('Error fetching full profile (non-critical):', error);
          // Continue with the minimal profile if there's an error
        }
      };
      
      // Don't await this, let it happen in the background
      fetchFullProfile().catch(err => {
        console.error('Background profile fetch failed:', err);
      });
      
      // Return success since we have the minimal profile
      return { error: null };
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      const authError = new AuthError(
        error instanceof Error ? error.message : 'An unknown error occurred',
        error instanceof AuthError ? error.status : 500
      );
      setError(authError);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Starting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      // 1. Validate input
      if (!email || !password) {
        const error = new AuthError('Email and password are required', 400);
        setError(error);
        return { error };
      }

      // 2. Sign in with email and password
      console.log('Initiating sign in...');
      console.log('Supabase URL:', process.env.VITE_SUPABASE_URL);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      
      console.log('Sign in response:', { data, error: signInError });

      if (signInError) {
        console.error('Authentication error:', signInError);
        const authError = new AuthError(
          signInError.message || 'Invalid email or password',
          signInError.status || 401
        );
        setError(authError);
        return { error: authError };
      }

      console.log('Authentication successful, user ID:', data.user?.id);
      
      if (!data.user) {
        const error = new AuthError('No user data returned from authentication', 500);
        setError(error);
        return { error };
      }

      // 3. Update user state immediately
      setUser(data.user);

      // 4. Get the session
      console.log('Retrieving session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        const error = new AuthError(
          sessionError?.message || 'No active session found',
          sessionError?.status || 401
        );
        setError(error);
        return { error };
      }

      // 5. Update session state
      setSession(session);
      console.log('Session updated');

      // 6. Update user metadata with role if not present
      if (!data.user.user_metadata?.role) {
        try {
          await supabase.auth.updateUser({
            data: { 
              role: 'admin',
              first_name: 'Admin',
              last_name: 'User'
            }
          });
          console.log('User metadata updated with role');
        } catch (metadataError) {
          console.warn('Could not update user metadata:', metadataError);
        }
      }

      // 7. Fetch user profile
      console.log('Fetching user profile...');
      const profileResult = await fetchUserProfile(data.user.id);
      
      // Check if profileResult is defined and has an error property
      if (profileResult && 'error' in profileResult && profileResult.error) {
        console.error('Profile fetch error:', profileResult.error);
        const error = new AuthError(
          'Authentication successful, but we encountered an issue loading your profile. Please try again or contact support.',
          profileResult.error.status || 500
        );
        setError(error);
        return { error };
      }
      
      console.log('Sign in completed successfully');
      return { error: null };
      
    } catch (error) {
      console.error('Unexpected error during sign in:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during sign in';
      const authError = new AuthError(errorMessage, 500);
      setError(authError);
      return { error: authError };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('Initiating sign out...');
      
      // 1. Clear any pending requests or timeouts
      // This is a good place to add cleanup for any pending requests
      
      // 2. Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
        // Even if there's an error, we should still clear the local state
      }
      
      // 3. Clear all local state
      setUser(null);
      setSession(null);
      setProfile(null);
      setClient(null);
      setSubuser(null);
      setError(null);
      
      // 4. Clear any local storage items if needed
      // localStorage.removeItem('some_key');
      
      console.log('Sign out completed successfully');
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      // Even if there's an error, we should still clear the local state
      setUser(null);
      setSession(null);
      setProfile(null);
      setClient(null);
      setSubuser(null);
      setError(new AuthError('An error occurred during sign out', 500));
    }
  };

  // Update the return type to include the error property
  const refreshSession = async (): Promise<{ error: AuthError | null }> => {
    console.log('Refreshing session...');
    setLoading(true);
    
    try {
      // 1. Refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        // If refresh fails, sign out the user
        await signOut();
        return { error: new AuthError('Your session has expired. Please sign in again.', 401) };
      }
      
      if (!data?.session?.user) {
        console.error('No user data after session refresh');
        await signOut();
        return { error: new AuthError('Session refresh failed. Please sign in again.', 401) };
      }
      
      console.log('Session refreshed for user:', data.session.user.id);
      
      // 2. Update the session and user state
      setSession(data.session);
      setUser(data.session.user);
      
      // 3. Refresh the user profile
      console.log('Refreshing user profile...');
      const profileResult = await fetchUserProfile(data.session.user.id);
      
      if (profileResult?.error) {
        console.error('Error refreshing profile:', profileResult.error);
        // Don't sign out here as the session is still valid
        // Just return the error and let the caller handle it
        return { error: new AuthError('Failed to refresh user profile', 500) };
      }
      
      console.log('Session and profile refreshed successfully');
      return { error: null };
    } catch (error) {
      console.error('Unexpected error during session refresh:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { error: new AuthError(`Session refresh failed: ${errorMessage}`, 500) };
    } finally {
      setLoading(false);
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