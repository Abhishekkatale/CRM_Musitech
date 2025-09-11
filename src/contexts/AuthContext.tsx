import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

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
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [subuser, setSubuser] = useState<Subuser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
        // Update last login
        await supabase.rpc('update_last_login');
      } else {
        setProfile(null);
        setClient(null);
        setSubuser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch profile with related data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          clients (*),
          subusers (*)
        `)
        .eq('auth_user_id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Set client or subuser data based on role
      if (profileData.role === 'client' && profileData.clients) {
        setClient(Array.isArray(profileData.clients) ? profileData.clients[0] : profileData.clients);
        setSubuser(null);
      } else if (profileData.role === 'subuser' && profileData.subusers) {
        setSubuser(Array.isArray(profileData.subusers) ? profileData.subusers[0] : profileData.subusers);
        setClient(null);
      } else {
        setClient(null);
        setSubuser(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshSession = async () => {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
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
      const permissions = subuser.permissions as any;
      if (permissions && permissions[module]) {
        return permissions[module].includes(action) || permissions[module].includes('admin');
      }
    }

    return false;
  };

  const isAdmin = (): boolean => {
    return profile?.role === 'admin';
  };

  const isClient = (): boolean => {
    return profile?.role === 'client';
  };

  const isSubuser = (): boolean => {
    return profile?.role === 'subuser';
  };

  const value: UserContext = {
    profile,
    client,
    subuser,
    user,
    session,
    loading,
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
