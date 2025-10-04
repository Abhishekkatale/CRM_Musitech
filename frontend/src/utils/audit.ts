import { supabase } from "@/integrations/supabase/client";
import { logUserAction } from "./auth";

export const logAction = async (
  action: string, 
  targetProfileId?: string,
  targetClientId?: string,
  details?: any
) => {
  try {
    await logUserAction(action, targetProfileId, targetClientId, details);
  } catch (error) {
    console.error('Error logging action:', error);
  }
};

export const logLogin = async (email: string) => {
  await logAction('user_login', undefined, undefined, { email });
};

export const logLogout = async () => {
  await logAction('user_logout');
};

export const logClientCreation = async (clientEmail: string, companyName: string) => {
  await logAction('create_client', undefined, undefined, { 
    email: clientEmail, 
    company_name: companyName 
  });
};

export const logSubuserCreation = async (subuserEmail: string, roleName: string) => {
  await logAction('create_subuser', undefined, undefined, { 
    email: subuserEmail, 
    role_name: roleName 
  });
};

export const logStatusChange = async (targetProfileId: string, newStatus: string, targetType: string) => {
  await logAction('status_change', targetProfileId, undefined, { 
    new_status: newStatus,
    target_type: targetType
  });
};

export const logPermissionChange = async (targetProfileId: string, newPermissions: any) => {
  await logAction('permission_change', targetProfileId, undefined, { 
    new_permissions: newPermissions
  });
};
