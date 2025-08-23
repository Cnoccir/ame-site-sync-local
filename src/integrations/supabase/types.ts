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
      admin_events: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      ame_audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Relationships: []
      }
      ame_customers: {
        Row: {
          access_hours: string | null
          badge_required: boolean | null
          bms_supervisor_ip: unknown | null
          building_access_details: string | null
          building_access_type: string | null
          building_type: string | null
          company_name: string
          contact_email: string
          contact_phone: string
          contract_status: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          drive_folder_id: string | null
          drive_folder_url: string | null
          emergency_contact: string | null
          emergency_email: string | null
          emergency_phone: string | null
          id: string
          last_service: string | null
          next_due: string | null
          platform_password: string | null
          platform_username: string | null
          ppe_required: boolean | null
          primary_contact: string
          remote_access: boolean | null
          remote_access_type: string | null
          safety_requirements: string | null
          security_contact: string | null
          security_phone: string | null
          service_tier: string
          site_address: string
          site_hazards: string | null
          site_name: string
          system_type: string
          technician_assigned: string | null
          training_required: boolean | null
          updated_at: string | null
          updated_by: string | null
          vpn_details: string | null
          vpn_required: boolean | null
          web_supervisor_url: string | null
          workbench_password: string | null
          workbench_username: string | null
        }
        Insert: {
          access_hours?: string | null
          badge_required?: boolean | null
          bms_supervisor_ip?: unknown | null
          building_access_details?: string | null
          building_access_type?: string | null
          building_type?: string | null
          company_name: string
          contact_email: string
          contact_phone: string
          contract_status?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          emergency_contact?: string | null
          emergency_email?: string | null
          emergency_phone?: string | null
          id?: string
          last_service?: string | null
          next_due?: string | null
          platform_password?: string | null
          platform_username?: string | null
          ppe_required?: boolean | null
          primary_contact: string
          remote_access?: boolean | null
          remote_access_type?: string | null
          safety_requirements?: string | null
          security_contact?: string | null
          security_phone?: string | null
          service_tier: string
          site_address: string
          site_hazards?: string | null
          site_name: string
          system_type: string
          technician_assigned?: string | null
          training_required?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          vpn_details?: string | null
          vpn_required?: boolean | null
          web_supervisor_url?: string | null
          workbench_password?: string | null
          workbench_username?: string | null
        }
        Update: {
          access_hours?: string | null
          badge_required?: boolean | null
          bms_supervisor_ip?: unknown | null
          building_access_details?: string | null
          building_access_type?: string | null
          building_type?: string | null
          company_name?: string
          contact_email?: string
          contact_phone?: string
          contract_status?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          emergency_contact?: string | null
          emergency_email?: string | null
          emergency_phone?: string | null
          id?: string
          last_service?: string | null
          next_due?: string | null
          platform_password?: string | null
          platform_username?: string | null
          ppe_required?: boolean | null
          primary_contact?: string
          remote_access?: boolean | null
          remote_access_type?: string | null
          safety_requirements?: string | null
          security_contact?: string | null
          security_phone?: string | null
          service_tier?: string
          site_address?: string
          site_hazards?: string | null
          site_name?: string
          system_type?: string
          technician_assigned?: string | null
          training_required?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          vpn_details?: string | null
          vpn_required?: boolean | null
          web_supervisor_url?: string | null
          workbench_password?: string | null
          workbench_username?: string | null
        }
        Relationships: []
      }
      ame_reports: {
        Row: {
          customer_id: string | null
          file_size: number | null
          file_url: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metadata: Json | null
          report_id: string
          report_type: string | null
          visit_id: string | null
        }
        Insert: {
          customer_id?: string | null
          file_size?: number | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_id: string
          report_type?: string | null
          visit_id?: string | null
        }
        Update: {
          customer_id?: string | null
          file_size?: number | null
          file_url?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          report_id?: string
          report_type?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ame_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ame_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ame_reports_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "ame_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      ame_sops: {
        Row: {
          category: string | null
          description: string | null
          estimated_duration: number | null
          id: string
          last_updated: string | null
          procedure_steps: Json | null
          safety_requirements: string[] | null
          sop_id: string
          sop_name: string
          system_type: string | null
          tools_required: string[] | null
          version: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          last_updated?: string | null
          procedure_steps?: Json | null
          safety_requirements?: string[] | null
          sop_id: string
          sop_name: string
          system_type?: string | null
          tools_required?: string[] | null
          version?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          estimated_duration?: number | null
          id?: string
          last_updated?: string | null
          procedure_steps?: Json | null
          safety_requirements?: string[] | null
          sop_id?: string
          sop_name?: string
          system_type?: string | null
          tools_required?: string[] | null
          version?: string | null
        }
        Relationships: []
      }
      ame_tasks: {
        Row: {
          category: string
          duration: number | null
          id: string
          last_updated: string | null
          navigation_path: string | null
          prerequisites: string | null
          quality_checks: string | null
          safety_notes: string | null
          service_tiers: string[] | null
          skills_required: string | null
          sop_steps: string | null
          task_id: string
          task_name: string
          tools_required: string[] | null
          version: string | null
        }
        Insert: {
          category: string
          duration?: number | null
          id?: string
          last_updated?: string | null
          navigation_path?: string | null
          prerequisites?: string | null
          quality_checks?: string | null
          safety_notes?: string | null
          service_tiers?: string[] | null
          skills_required?: string | null
          sop_steps?: string | null
          task_id: string
          task_name: string
          tools_required?: string[] | null
          version?: string | null
        }
        Update: {
          category?: string
          duration?: number | null
          id?: string
          last_updated?: string | null
          navigation_path?: string | null
          prerequisites?: string | null
          quality_checks?: string | null
          safety_notes?: string | null
          service_tiers?: string[] | null
          skills_required?: string | null
          sop_steps?: string | null
          task_id?: string
          task_name?: string
          tools_required?: string[] | null
          version?: string | null
        }
        Relationships: []
      }
      ame_tools: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_consumable: boolean | null
          notes: string | null
          reorder_point: number | null
          safety_category: string | null
          supplier: string | null
          tool_id: string
          tool_name: string
          typical_quantity: number | null
          unit_of_measure: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_consumable?: boolean | null
          notes?: string | null
          reorder_point?: number | null
          safety_category?: string | null
          supplier?: string | null
          tool_id: string
          tool_name: string
          typical_quantity?: number | null
          unit_of_measure?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_consumable?: boolean | null
          notes?: string | null
          reorder_point?: number | null
          safety_category?: string | null
          supplier?: string | null
          tool_id?: string
          tool_name?: string
          typical_quantity?: number | null
          unit_of_measure?: string | null
        }
        Relationships: []
      }
      ame_visit_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          issues_found: string | null
          resolution: string | null
          started_at: string | null
          status: string | null
          task_id: string | null
          technician_notes: string | null
          time_spent: number | null
          visit_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          issues_found?: string | null
          resolution?: string | null
          started_at?: string | null
          status?: string | null
          task_id?: string | null
          technician_notes?: string | null
          time_spent?: number | null
          visit_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          issues_found?: string | null
          resolution?: string | null
          started_at?: string | null
          status?: string | null
          task_id?: string | null
          technician_notes?: string | null
          time_spent?: number | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ame_visit_tasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ame_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ame_visit_tasks_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "ame_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      ame_visits: {
        Row: {
          completion_date: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          notes: string | null
          phase_1_completed_at: string | null
          phase_1_status: string | null
          phase_2_completed_at: string | null
          phase_2_status: string | null
          phase_3_completed_at: string | null
          phase_3_status: string | null
          phase_4_completed_at: string | null
          phase_4_status: string | null
          technician_id: string | null
          updated_at: string | null
          visit_date: string
          visit_id: string
          visit_status: string | null
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          phase_1_completed_at?: string | null
          phase_1_status?: string | null
          phase_2_completed_at?: string | null
          phase_2_status?: string | null
          phase_3_completed_at?: string | null
          phase_3_status?: string | null
          phase_4_completed_at?: string | null
          phase_4_status?: string | null
          technician_id?: string | null
          updated_at?: string | null
          visit_date: string
          visit_id: string
          visit_status?: string | null
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          notes?: string | null
          phase_1_completed_at?: string | null
          phase_1_status?: string | null
          phase_2_completed_at?: string | null
          phase_2_status?: string | null
          phase_3_completed_at?: string | null
          phase_3_status?: string | null
          phase_4_completed_at?: string | null
          phase_4_status?: string | null
          technician_id?: string | null
          updated_at?: string | null
          visit_date?: string
          visit_id?: string
          visit_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ame_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ame_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      document_metadata: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          schema: string | null
          title: string | null
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          schema?: string | null
          title?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          schema?: string | null
          title?: string | null
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: []
      }
      document_rows: {
        Row: {
          dataset_id: string | null
          id: number
          row_data: Json | null
        }
        Insert: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Update: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_rows_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          doc_id: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          doc_id?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          doc_id?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_doc_id_fkey"
            columns: ["doc_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          chat_message_id: number | null
          created_at: string | null
          feedback_text: string | null
          id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          chat_message_id?: number | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          rating?: number | null
          user_id: string
        }
        Update: {
          chat_message_id?: number | null
          created_at?: string | null
          feedback_text?: string | null
          id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_chat_message_id_fkey"
            columns: ["chat_message_id"]
            isOneToOne: false
            referencedRelation: "n8n_chat_histories"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          created_at: string
          id: number
          is_deleted: boolean | null
          message: Json
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_deleted?: boolean | null
          message: Json
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_deleted?: boolean | null
          message?: Json
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_suspended: boolean | null
          last_query_date: string | null
          monthly_query_limit: number | null
          remaining_queries: number | null
          role: string | null
          suspension_reason: string | null
          total_queries: number | null
          usage_history: Json | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_suspended?: boolean | null
          last_query_date?: string | null
          monthly_query_limit?: number | null
          remaining_queries?: number | null
          role?: string | null
          suspension_reason?: string | null
          total_queries?: number | null
          usage_history?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          last_query_date?: string | null
          monthly_query_limit?: number | null
          remaining_queries?: number | null
          role?: string | null
          suspension_reason?: string | null
          total_queries?: number | null
          usage_history?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_chat_sessions: {
        Args: { user_id_param: string }
        Returns: {
          created_at: string
          id: string
          last_activity: string
          message_count: number
          title: string
          user_id: string
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
