import { supabase } from "@/lib/supabaseClient";

export const logAction = async (action: string, target_user_id?: string) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("No user found to log action for.");
    return;
  }

  const { error } = await supabase
    .from('audit_logs')
    .insert([
      {
        actor_user_id: user.id,
        action,
        target_user_id
      }
    ]);

  if (error) {
    console.error('Error logging action:', error);
  }
};
