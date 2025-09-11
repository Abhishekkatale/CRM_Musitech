export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          auth_user_id: string
          email: string
          full_name: string | null
          role: 'admin' | 'client' | 'subuser'
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
          last_login: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          auth_user_id: string
          email: string
          full_name?: string | null
          role: 'admin' | 'client' | 'subuser'
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
          last_login?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'client' | 'subuser'
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
          last_login?: string | null
          created_by?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          profile_id: string
          company_name: string
          company_domain: string | null
          contact_phone: string | null
          address: string | null
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          company_name: string
          company_domain?: string | null
          contact_phone?: string | null
          address?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          company_name?: string
          company_domain?: string | null
          contact_phone?: string | null
          address?: string | null
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      subusers: {
        Row: {
          id: string
          client_id: string
          profile_id: string
          role_name: string
          permissions: any
          status: 'active' | 'inactive' | 'suspended'
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          client_id: string
          profile_id: string
          role_name: string
          permissions?: any
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          profile_id?: string
          role_name?: string
          permissions?: any
          status?: 'active' | 'inactive' | 'suspended'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          actor_profile_id: string | null
          action: string
          target_profile_id: string | null
          target_client_id: string | null
          details: any
          ip_address: string | null
          user_agent: string | null
          timestamp: string
        }
        Insert: {
          id?: string
          actor_profile_id?: string | null
          action: string
          target_profile_id?: string | null
          target_client_id?: string | null
          details?: any
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
        Update: {
          id?: string
          actor_profile_id?: string | null
          action?: string
          target_profile_id?: string | null
          target_client_id?: string | null
          details?: any
          ip_address?: string | null
          user_agent?: string | null
          timestamp?: string
        }
      }
      user_sessions: {
        Row: {
          id: string
          profile_id: string
          refresh_token_hash: string
          expires_at: string
          created_at: string
          last_used: string
          ip_address: string | null
          user_agent: string | null
          is_revoked: boolean
        }
        Insert: {
          id?: string
          profile_id: string
          refresh_token_hash: string
          expires_at: string
          created_at?: string
          last_used?: string
          ip_address?: string | null
          user_agent?: string | null
          is_revoked?: boolean
        }
        Update: {
          id?: string
          profile_id?: string
          refresh_token_hash?: string
          expires_at?: string
          created_at?: string
          last_used?: string
          ip_address?: string | null
          user_agent?: string | null
          is_revoked?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_client: {
        Args: {
          client_email: string
          client_password: string
          client_full_name: string
          company_name: string
          company_domain?: string
          contact_phone?: string
          address?: string
        }
        Returns: string
      }
      create_subuser: {
        Args: {
          subuser_email: string
          subuser_password: string
          subuser_full_name: string
          role_name: string
          permissions?: any
        }
        Returns: string
      }
      log_user_action: {
        Args: {
          action_type: string
          target_profile_id?: string
          target_client_id?: string
          action_details?: any
          client_ip?: string
          user_agent_text?: string
        }
        Returns: string
      }
      update_last_login: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'admin' | 'client' | 'subuser'
      user_status: 'active' | 'inactive' | 'suspended'
      permission_module: 'dashboard' | 'leads' | 'campaigns' | 'reports' | 'integrations' | 'attribution' | 'analytics' | 'user_management'
      permission_action: 'read' | 'write' | 'delete' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
        Row: infer R
      }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
          Row: infer R
        }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
      ? I
      : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
        ? I
        : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
      ? U
      : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
        ? U
        : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
