// services/user.ts
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

// ---- Types ----
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ClientRow = Database['public']['Tables']['clients']['Row'];
type SubuserRow = Database['public']['Tables']['subusers']['Row'];

export interface UserWithProfile {
  profile: ProfileRow & { clients?: ClientRow[]; subusers?: SubuserRow[] };
  client?: ClientRow;
  subuser?: SubuserRow;
}

// ---- Auth & Profile ----
export const getCurrentUser = async (): Promise<{ data?: UserWithProfile | null; error?: any }> => {
  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) return { data: null, error: userErr };

    const user = userData?.user ?? null;
    if (!user) return { data: null };

    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select(`
        *,
        clients (*),
        subusers (*)
      `)
      .eq('auth_user_id', user.id)
      .single();

    if (profileErr) return { data: null, error: profileErr };

    const result: UserWithProfile = {
      profile: profileData as UserWithProfile['profile'],
    };

    if ((profileData as any).role === 'client' && (profileData as any).clients) {
      const clients = Array.isArray((profileData as any).clients)
        ? (profileData as any).clients
        : [(profileData as any).clients];
      result.client = clients[0] as ClientRow;
    } else if ((profileData as any).role === 'subuser' && (profileData as any).subusers) {
      const subs = Array.isArray((profileData as any).subusers)
        ? (profileData as any).subusers
        : [(profileData as any).subusers];
      result.subuser = subs[0] as SubuserRow;
    }

    return { data: result };
  } catch (error) {
    return { data: null, error };
  }
};

// ---- Client & Subuser Creation ----
export const createClient = async (
  email: string,
  password: string,
  fullName: string,
  companyName: string,
  companyDomain?: string,
  contactPhone?: string,
  address?: string
) => {
  try {
    const { data, error } = await supabase.rpc('create_client', {
      client_email: email,
      client_password: password,
      client_full_name: fullName,
      company_name: companyName,
      company_domain: companyDomain ?? null,
      contact_phone: contactPhone ?? null,
      address: address ?? null,
    });
    return { data, error };
  } catch (error) {
    return { error };
  }
};

export const createSubuser = async (
  email: string,
  password: string,
  fullName: string,
  roleName: string,
  permissions?: any
) => {
  try {
    const { data, error } = await supabase.rpc('create_subuser', {
      subuser_email: email,
      subuser_password: password,
      subuser_full_name: fullName,
      role_name: roleName,
      permissions: permissions ?? {},
    });
    return { data, error };
  } catch (error) {
    return { error };
  }
};

// ---- User Actions / Logging ----
export const logUserAction = async (
  action: string,
  targetProfileId?: string | null,
  targetClientId?: string | null,
  details?: any,
  clientIp?: string | null
) => {
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    const { data, error } = await supabase.rpc('log_user_action', {
      action_type: action,
      target_profile_id: targetProfileId ?? null,
      target_client_id: targetClientId ?? null,
      action_details: details ?? {},
      client_ip: clientIp ?? null,
      user_agent_text: userAgent,
    });

    return { data, error };
  } catch (error) {
    return { error };
  }
};

// ---- Profile & Subuser Updates ----
export const updateUserStatus = async (profileId: string, status: 'active' | 'inactive' | 'suspended') => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', profileId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { error };
  }
};

export const updateSubuserStatus = async (subuserId: string, status: 'active' | 'inactive' | 'suspended') => {
  try {
    const { data, error } = await supabase
      .from('subusers')
      .update({ status })
      .eq('id', subuserId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { error };
  }
};

export const updateSubuserPermissions = async (subuserId: string, permissions: any) => {
  try {
    const { data, error } = await supabase
      .from('subusers')
      .update({ permissions })
      .eq('id', subuserId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { error };
  }
};

// ---- Auth Helpers ----
export const resetUserPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  } catch (error) {
    return { error };
  }
};

export const changePassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  } catch (error) {
    return { error };
  }
};

// ---- Data Fetchers ----
export const getClientSubusers = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('subusers')
      .select(`*, profiles (*)`)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { error };
  }
};

export const getAllClients = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`*, profiles (*)`)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { error };
  }
};

export const getAuditLogs = async (limit: number = 100, offset: number = 0, clientId?: string) => {
  try {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        actor:profiles!actor_profile_id(*),
        target:profiles!target_profile_id(*)
      `)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (clientId) {
      query = query.eq('target_client_id', clientId);
    }

    const { data, error } = await query;
    return { data, error };
  } catch (error) {
    return { error };
  }
};

// ---- Permission Helpers ----
export const checkPermission = (userRole: string, userPermissions: any, module: string, action: string): boolean => {
  if (userRole === 'admin' || userRole === 'client') return true;
  if (userRole === 'subuser' && userPermissions) {
    const modulePerms = userPermissions[module];
    if (!modulePerms) return false;
    return Array.isArray(modulePerms) && (modulePerms.includes(action) || modulePerms.includes('admin'));
  }
  return false;
};

export const getDefaultPermissions = (): any => ({
  dashboard: ['read'],
  leads: ['read'],
  campaigns: ['read'],
  reports: ['read'],
  integrations: ['read'],
  attribution: ['read'],
  analytics: ['read'],
  user_management: [],
});

export const getRolePermissions = (roleName: string): any => {
  const rolePermissions: { [key: string]: any } = {
    'Social Media Manager': {
      dashboard: ['read'],
      leads: ['read', 'write'],
      campaigns: ['read', 'write'],
      reports: ['read'],
      integrations: ['read'],
      attribution: ['read'],
      analytics: ['read'],
      user_management: [],
    },
    'Analytics Viewer': {
      dashboard: ['read'],
      leads: ['read'],
      campaigns: ['read'],
      reports: ['read'],
      integrations: ['read'],
      attribution: ['read'],
      analytics: ['read'],
      user_management: [],
    },
    'Campaign Manager': {
      dashboard: ['read'],
      leads: ['read', 'write'],
      campaigns: ['read', 'write', 'delete'],
      reports: ['read'],
      integrations: ['read', 'write'],
      attribution: ['read'],
      analytics: ['read'],
      user_management: [],
    },
    'Lead Manager': {
      dashboard: ['read'],
      leads: ['read', 'write', 'delete'],
      campaigns: ['read'],
      reports: ['read'],
      integrations: ['read'],
      attribution: ['read'],
      analytics: ['read'],
      user_management: [],
    },
    'Full Access': {
      dashboard: ['read'],
      leads: ['read', 'write', 'delete'],
      campaigns: ['read', 'write', 'delete'],
      reports: ['read'],
      integrations: ['read', 'write'],
      attribution: ['read'],
      analytics: ['read'],
      user_management: [],
    },
  };
  return rolePermissions[roleName] ?? getDefaultPermissions();
};

// ---- Audit Exports (safe re-export to avoid TDZ issues) ----
export {
  logClientCreation,
  logStatusChange,
  logSubuserCreation,
  logPermissionChange,
} from './audit';
