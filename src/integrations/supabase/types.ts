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
      access_methods: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          method_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          method_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          method_name?: string
          updated_at?: string | null
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
      ame_customer_equipment: {
        Row: {
          commissioning_date: string | null
          created_at: string | null
          customer_id: string
          equipment_id: string
          id: string
          installation_date: string | null
          service_responsibility: string | null
          special_notes: string | null
          warranty_end: string | null
          warranty_start: string | null
        }
        Insert: {
          commissioning_date?: string | null
          created_at?: string | null
          customer_id: string
          equipment_id: string
          id?: string
          installation_date?: string | null
          service_responsibility?: string | null
          special_notes?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Update: {
          commissioning_date?: string | null
          created_at?: string | null
          customer_id?: string
          equipment_id?: string
          id?: string
          installation_date?: string | null
          service_responsibility?: string | null
          special_notes?: string | null
          warranty_end?: string | null
          warranty_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ame_customer_equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ame_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ame_customer_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "ame_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      ame_customers: {
        Row: {
          access_hours: string | null
          access_procedure: string | null
          account_manager: string | null
          account_manager_email: string | null
          account_manager_id: string | null
          account_manager_name: string | null
          account_manager_phone: string | null
          annual_contract_value: number | null
          badge_required: boolean | null
          billing_contact: string | null
          billing_email: string | null
          billing_phone: string | null
          bms_supervisor_ip: unknown | null
          building_access_details: string | null
          building_access_type: string | null
          building_type: string | null
          company_name: string
          contact_email: string
          contact_phone: string
          contract_end_date: string | null
          contract_start_date: string | null
          contract_status: string | null
          coordinates: unknown | null
          created_at: string | null
          created_by: string | null
          customer_id: string
          different_platform_station_creds: boolean | null
          district: string | null
          drive_folder_id: string | null
          drive_folder_url: string | null
          emergency_contact: string | null
          emergency_email: string | null
          emergency_phone: string | null
          equipment_access_notes: string | null
          equipment_list: Json | null
          escalation_contact: string | null
          escalation_phone: string | null
          id: string
          last_service: string | null
          next_due: string | null
          other_hazards_notes: string | null
          parking_instructions: string | null
          payment_terms: string | null
          pc_password: string | null
          pc_username: string | null
          platform_password: string | null
          platform_username: string | null
          ppe_required: boolean | null
          primary_bas_platform: string | null
          primary_contact: string
          primary_contact_role: string | null
          primary_technician_email: string | null
          primary_technician_id: string | null
          primary_technician_name: string | null
          primary_technician_phone: string | null
          region: string | null
          remote_access: boolean | null
          remote_access_type: string | null
          safety_notes: string | null
          safety_requirements: string | null
          secondary_contact_email: string | null
          secondary_contact_name: string | null
          secondary_contact_phone: string | null
          secondary_contact_role: string | null
          secondary_technician_email: string | null
          secondary_technician_id: string | null
          secondary_technician_name: string | null
          secondary_technician_phone: string | null
          security_contact: string | null
          security_phone: string | null
          service_address: string | null
          service_frequency: string | null
          service_tier: string
          site_address: string
          site_hazards: string | null
          site_name: string
          site_nickname: string | null
          site_timezone: string | null
          special_instructions: string | null
          system_architecture: string | null
          system_type: string
          technical_contact: string | null
          technical_email: string | null
          technical_phone: string | null
          technician_assigned: string | null
          territory: string | null
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
          access_procedure?: string | null
          account_manager?: string | null
          account_manager_email?: string | null
          account_manager_id?: string | null
          account_manager_name?: string | null
          account_manager_phone?: string | null
          annual_contract_value?: number | null
          badge_required?: boolean | null
          billing_contact?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          bms_supervisor_ip?: unknown | null
          building_access_details?: string | null
          building_access_type?: string | null
          building_type?: string | null
          company_name: string
          contact_email: string
          contact_phone: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_status?: string | null
          coordinates?: unknown | null
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          different_platform_station_creds?: boolean | null
          district?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          emergency_contact?: string | null
          emergency_email?: string | null
          emergency_phone?: string | null
          equipment_access_notes?: string | null
          equipment_list?: Json | null
          escalation_contact?: string | null
          escalation_phone?: string | null
          id?: string
          last_service?: string | null
          next_due?: string | null
          other_hazards_notes?: string | null
          parking_instructions?: string | null
          payment_terms?: string | null
          pc_password?: string | null
          pc_username?: string | null
          platform_password?: string | null
          platform_username?: string | null
          ppe_required?: boolean | null
          primary_bas_platform?: string | null
          primary_contact: string
          primary_contact_role?: string | null
          primary_technician_email?: string | null
          primary_technician_id?: string | null
          primary_technician_name?: string | null
          primary_technician_phone?: string | null
          region?: string | null
          remote_access?: boolean | null
          remote_access_type?: string | null
          safety_notes?: string | null
          safety_requirements?: string | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          secondary_contact_role?: string | null
          secondary_technician_email?: string | null
          secondary_technician_id?: string | null
          secondary_technician_name?: string | null
          secondary_technician_phone?: string | null
          security_contact?: string | null
          security_phone?: string | null
          service_address?: string | null
          service_frequency?: string | null
          service_tier: string
          site_address: string
          site_hazards?: string | null
          site_name: string
          site_nickname?: string | null
          site_timezone?: string | null
          special_instructions?: string | null
          system_architecture?: string | null
          system_type: string
          technical_contact?: string | null
          technical_email?: string | null
          technical_phone?: string | null
          technician_assigned?: string | null
          territory?: string | null
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
          access_procedure?: string | null
          account_manager?: string | null
          account_manager_email?: string | null
          account_manager_id?: string | null
          account_manager_name?: string | null
          account_manager_phone?: string | null
          annual_contract_value?: number | null
          badge_required?: boolean | null
          billing_contact?: string | null
          billing_email?: string | null
          billing_phone?: string | null
          bms_supervisor_ip?: unknown | null
          building_access_details?: string | null
          building_access_type?: string | null
          building_type?: string | null
          company_name?: string
          contact_email?: string
          contact_phone?: string
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_status?: string | null
          coordinates?: unknown | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          different_platform_station_creds?: boolean | null
          district?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          emergency_contact?: string | null
          emergency_email?: string | null
          emergency_phone?: string | null
          equipment_access_notes?: string | null
          equipment_list?: Json | null
          escalation_contact?: string | null
          escalation_phone?: string | null
          id?: string
          last_service?: string | null
          next_due?: string | null
          other_hazards_notes?: string | null
          parking_instructions?: string | null
          payment_terms?: string | null
          pc_password?: string | null
          pc_username?: string | null
          platform_password?: string | null
          platform_username?: string | null
          ppe_required?: boolean | null
          primary_bas_platform?: string | null
          primary_contact?: string
          primary_contact_role?: string | null
          primary_technician_email?: string | null
          primary_technician_id?: string | null
          primary_technician_name?: string | null
          primary_technician_phone?: string | null
          region?: string | null
          remote_access?: boolean | null
          remote_access_type?: string | null
          safety_notes?: string | null
          safety_requirements?: string | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          secondary_contact_role?: string | null
          secondary_technician_email?: string | null
          secondary_technician_id?: string | null
          secondary_technician_name?: string | null
          secondary_technician_phone?: string | null
          security_contact?: string | null
          security_phone?: string | null
          service_address?: string | null
          service_frequency?: string | null
          service_tier?: string
          site_address?: string
          site_hazards?: string | null
          site_name?: string
          site_nickname?: string | null
          site_timezone?: string | null
          special_instructions?: string | null
          system_architecture?: string | null
          system_type?: string
          technical_contact?: string | null
          technical_email?: string | null
          technical_phone?: string | null
          technician_assigned?: string | null
          territory?: string | null
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
      ame_employees: {
        Row: {
          certifications: string[] | null
          created_at: string | null
          department: string | null
          direct_line: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          employee_name: string | null
          employment_status: string | null
          extension: string | null
          first_name: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          is_technician: boolean | null
          last_name: string | null
          max_concurrent_visits: number | null
          mobile_phone: string | null
          phone: string | null
          role: string | null
          service_regions: string[] | null
          specializations: string[] | null
          technician_id: string | null
          travel_radius_miles: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_info: Json | null
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string | null
          department?: string | null
          direct_line?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          employee_name?: string | null
          employment_status?: string | null
          extension?: string | null
          first_name?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_technician?: boolean | null
          last_name?: string | null
          max_concurrent_visits?: number | null
          mobile_phone?: string | null
          phone?: string | null
          role?: string | null
          service_regions?: string[] | null
          specializations?: string[] | null
          technician_id?: string | null
          travel_radius_miles?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_info?: Json | null
        }
        Update: {
          certifications?: string[] | null
          created_at?: string | null
          department?: string | null
          direct_line?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          employee_name?: string | null
          employment_status?: string | null
          extension?: string | null
          first_name?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_technician?: boolean | null
          last_name?: string | null
          max_concurrent_visits?: number | null
          mobile_phone?: string | null
          phone?: string | null
          role?: string | null
          service_regions?: string[] | null
          specializations?: string[] | null
          technician_id?: string | null
          travel_radius_miles?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_info?: Json | null
        }
        Relationships: []
      }
      ame_equipment: {
        Row: {
          category: string | null
          created_at: string | null
          equipment_id: string
          equipment_name: string
          equipment_type: string
          id: string
          installation_date: string | null
          last_service_date: string | null
          location: string | null
          maintenance_history: Json | null
          manufacturer: string | null
          model: string | null
          next_service_due: string | null
          serial_number: string | null
          service_interval_months: number | null
          specifications: Json | null
          status: string | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          equipment_id: string
          equipment_name: string
          equipment_type: string
          id?: string
          installation_date?: string | null
          last_service_date?: string | null
          location?: string | null
          maintenance_history?: Json | null
          manufacturer?: string | null
          model?: string | null
          next_service_due?: string | null
          serial_number?: string | null
          service_interval_months?: number | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          equipment_id?: string
          equipment_name?: string
          equipment_type?: string
          id?: string
          installation_date?: string | null
          last_service_date?: string | null
          location?: string | null
          maintenance_history?: Json | null
          manufacturer?: string | null
          model?: string | null
          next_service_due?: string | null
          serial_number?: string | null
          service_interval_months?: number | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      ame_parts: {
        Row: {
          category: string
          created_at: string | null
          current_stock: number | null
          description: string | null
          hazmat_classification: string | null
          id: string
          is_consumable: boolean | null
          lead_time_days: number | null
          manufacturer: string | null
          maximum_stock: number | null
          minimum_stock: number | null
          part_id: string
          part_name: string
          part_number: string | null
          reorder_point: number | null
          shelf_life_months: number | null
          standard_cost: number | null
          storage_requirements: string | null
          subcategory: string | null
          supplier_info: Json | null
          unit_of_measure: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          hazmat_classification?: string | null
          id?: string
          is_consumable?: boolean | null
          lead_time_days?: number | null
          manufacturer?: string | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          part_id: string
          part_name: string
          part_number?: string | null
          reorder_point?: number | null
          shelf_life_months?: number | null
          standard_cost?: number | null
          storage_requirements?: string | null
          subcategory?: string | null
          supplier_info?: Json | null
          unit_of_measure?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          current_stock?: number | null
          description?: string | null
          hazmat_classification?: string | null
          id?: string
          is_consumable?: boolean | null
          lead_time_days?: number | null
          manufacturer?: string | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          part_id?: string
          part_name?: string
          part_number?: string | null
          reorder_point?: number | null
          shelf_life_months?: number | null
          standard_cost?: number | null
          storage_requirements?: string | null
          subcategory?: string | null
          supplier_info?: Json | null
          unit_of_measure?: string | null
          updated_at?: string | null
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
      ame_service_schedules: {
        Row: {
          created_at: string | null
          customer_id: string
          duration_estimate_hours: number | null
          frequency: string
          id: string
          is_active: boolean | null
          last_completed_date: string | null
          next_due_date: string
          schedule_name: string
          seasonal_adjustments: Json | null
          service_tier: string
          tasks: Json | null
          technician_requirements: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          duration_estimate_hours?: number | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_completed_date?: string | null
          next_due_date: string
          schedule_name: string
          seasonal_adjustments?: Json | null
          service_tier: string
          tasks?: Json | null
          technician_requirements?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          duration_estimate_hours?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_completed_date?: string | null
          next_due_date?: string
          schedule_name?: string
          seasonal_adjustments?: Json | null
          service_tier?: string
          tasks?: Json | null
          technician_requirements?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ame_service_schedules_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ame_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ame_sops: {
        Row: {
          approval_date: string | null
          approved_by: string | null
          category: string | null
          certification_level: string | null
          compliance_standard: string | null
          description: string | null
          document_path: string | null
          effective_date: string | null
          environmental_conditions: string | null
          estimated_duration: number | null
          frequency_of_use: string | null
          id: string
          last_updated: string | null
          prerequisites: string[] | null
          procedure_steps: Json | null
          quality_checkpoints: Json | null
          related_sops: string[] | null
          review_date: string | null
          revision_number: string | null
          risk_level: string | null
          safety_requirements: string[] | null
          sop_id: string
          sop_name: string
          system_type: string | null
          tools_required: string[] | null
          training_required: boolean | null
          version: string | null
          video_url: string | null
        }
        Insert: {
          approval_date?: string | null
          approved_by?: string | null
          category?: string | null
          certification_level?: string | null
          compliance_standard?: string | null
          description?: string | null
          document_path?: string | null
          effective_date?: string | null
          environmental_conditions?: string | null
          estimated_duration?: number | null
          frequency_of_use?: string | null
          id?: string
          last_updated?: string | null
          prerequisites?: string[] | null
          procedure_steps?: Json | null
          quality_checkpoints?: Json | null
          related_sops?: string[] | null
          review_date?: string | null
          revision_number?: string | null
          risk_level?: string | null
          safety_requirements?: string[] | null
          sop_id: string
          sop_name: string
          system_type?: string | null
          tools_required?: string[] | null
          training_required?: boolean | null
          version?: string | null
          video_url?: string | null
        }
        Update: {
          approval_date?: string | null
          approved_by?: string | null
          category?: string | null
          certification_level?: string | null
          compliance_standard?: string | null
          description?: string | null
          document_path?: string | null
          effective_date?: string | null
          environmental_conditions?: string | null
          estimated_duration?: number | null
          frequency_of_use?: string | null
          id?: string
          last_updated?: string | null
          prerequisites?: string[] | null
          procedure_steps?: Json | null
          quality_checkpoints?: Json | null
          related_sops?: string[] | null
          review_date?: string | null
          revision_number?: string | null
          risk_level?: string | null
          safety_requirements?: string[] | null
          sop_id?: string
          sop_name?: string
          system_type?: string | null
          tools_required?: string[] | null
          training_required?: boolean | null
          version?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      ame_tasks: {
        Row: {
          acceptable_ranges: Json | null
          category: string
          certification_required: string[] | null
          complexity_level: string | null
          documentation_required: boolean | null
          duration: number | null
          equipment_types: string[] | null
          estimated_time_minutes: number | null
          frequency: string | null
          id: string
          is_mandatory: boolean | null
          last_updated: string | null
          measurement_points: Json | null
          navigation_path: string | null
          parent_task_id: string | null
          phase: number | null
          photo_required: boolean | null
          prerequisites: string | null
          quality_checks: string | null
          quality_criteria: Json | null
          safety_notes: string | null
          service_tiers: string[] | null
          skills_required: string | null
          sop_steps: string | null
          task_id: string
          task_name: string
          task_order: number | null
          tools_required: string[] | null
          version: string | null
        }
        Insert: {
          acceptable_ranges?: Json | null
          category: string
          certification_required?: string[] | null
          complexity_level?: string | null
          documentation_required?: boolean | null
          duration?: number | null
          equipment_types?: string[] | null
          estimated_time_minutes?: number | null
          frequency?: string | null
          id?: string
          is_mandatory?: boolean | null
          last_updated?: string | null
          measurement_points?: Json | null
          navigation_path?: string | null
          parent_task_id?: string | null
          phase?: number | null
          photo_required?: boolean | null
          prerequisites?: string | null
          quality_checks?: string | null
          quality_criteria?: Json | null
          safety_notes?: string | null
          service_tiers?: string[] | null
          skills_required?: string | null
          sop_steps?: string | null
          task_id: string
          task_name: string
          task_order?: number | null
          tools_required?: string[] | null
          version?: string | null
        }
        Update: {
          acceptable_ranges?: Json | null
          category?: string
          certification_required?: string[] | null
          complexity_level?: string | null
          documentation_required?: boolean | null
          duration?: number | null
          equipment_types?: string[] | null
          estimated_time_minutes?: number | null
          frequency?: string | null
          id?: string
          is_mandatory?: boolean | null
          last_updated?: string | null
          measurement_points?: Json | null
          navigation_path?: string | null
          parent_task_id?: string | null
          phase?: number | null
          photo_required?: boolean | null
          prerequisites?: string | null
          quality_checks?: string | null
          quality_criteria?: Json | null
          safety_notes?: string | null
          service_tiers?: string[] | null
          skills_required?: string | null
          sop_steps?: string | null
          task_id?: string
          task_name?: string
          task_order?: number | null
          tools_required?: string[] | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ame_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "ame_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ame_tools: {
        Row: {
          calibration_frequency_months: number | null
          calibration_required: boolean | null
          category: string | null
          created_at: string | null
          current_stock: number | null
          id: string
          is_consumable: boolean | null
          last_calibration_date: string | null
          last_inventory_date: string | null
          maintenance_schedule: string | null
          manufacturer: string | null
          maximum_stock: number | null
          minimum_stock: number | null
          model_number: string | null
          next_calibration_date: string | null
          notes: string | null
          part_number: string | null
          reorder_point: number | null
          replacement_cost: number | null
          safety_category: string | null
          storage_location: string | null
          supplier: string | null
          tool_id: string
          tool_name: string
          tool_status: string | null
          typical_quantity: number | null
          unit_cost: number | null
          unit_of_measure: string | null
          warranty_expiry: string | null
        }
        Insert: {
          calibration_frequency_months?: number | null
          calibration_required?: boolean | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_consumable?: boolean | null
          last_calibration_date?: string | null
          last_inventory_date?: string | null
          maintenance_schedule?: string | null
          manufacturer?: string | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          model_number?: string | null
          next_calibration_date?: string | null
          notes?: string | null
          part_number?: string | null
          reorder_point?: number | null
          replacement_cost?: number | null
          safety_category?: string | null
          storage_location?: string | null
          supplier?: string | null
          tool_id: string
          tool_name: string
          tool_status?: string | null
          typical_quantity?: number | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          calibration_frequency_months?: number | null
          calibration_required?: boolean | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_consumable?: boolean | null
          last_calibration_date?: string | null
          last_inventory_date?: string | null
          maintenance_schedule?: string | null
          manufacturer?: string | null
          maximum_stock?: number | null
          minimum_stock?: number | null
          model_number?: string | null
          next_calibration_date?: string | null
          notes?: string | null
          part_number?: string | null
          reorder_point?: number | null
          replacement_cost?: number | null
          safety_category?: string | null
          storage_location?: string | null
          supplier?: string | null
          tool_id?: string
          tool_name?: string
          tool_status?: string | null
          typical_quantity?: number | null
          unit_cost?: number | null
          unit_of_measure?: string | null
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      ame_visit_progress: {
        Row: {
          completed_at: string | null
          completion_percentage: number | null
          created_at: string | null
          followup_notes: string | null
          id: string
          issues_found: string | null
          measurements: Json | null
          phase_number: number
          photos: Json | null
          quality_check_passed: boolean | null
          requires_followup: boolean | null
          resolution_notes: string | null
          started_at: string | null
          status: string | null
          task_id: string | null
          technician_notes: string | null
          time_spent_minutes: number | null
          updated_at: string | null
          visit_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          followup_notes?: string | null
          id?: string
          issues_found?: string | null
          measurements?: Json | null
          phase_number: number
          photos?: Json | null
          quality_check_passed?: boolean | null
          requires_followup?: boolean | null
          resolution_notes?: string | null
          started_at?: string | null
          status?: string | null
          task_id?: string | null
          technician_notes?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          visit_id: string
        }
        Update: {
          completed_at?: string | null
          completion_percentage?: number | null
          created_at?: string | null
          followup_notes?: string | null
          id?: string
          issues_found?: string | null
          measurements?: Json | null
          phase_number?: number
          photos?: Json | null
          quality_check_passed?: boolean | null
          requires_followup?: boolean | null
          resolution_notes?: string | null
          started_at?: string | null
          status?: string | null
          task_id?: string | null
          technician_notes?: string | null
          time_spent_minutes?: number | null
          updated_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ame_visit_progress_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ame_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ame_visit_progress_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "ame_visits"
            referencedColumns: ["id"]
          },
        ]
      }
      ame_visit_sessions: {
        Row: {
          auto_save_data: Json | null
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          last_activity: string
          session_token: string
          technician_id: string
          visit_id: string
        }
        Insert: {
          auto_save_data?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string
          session_token: string
          technician_id: string
          visit_id: string
        }
        Update: {
          auto_save_data?: Json | null
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_activity?: string
          session_token?: string
          technician_id?: string
          visit_id?: string
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
          auto_save_data: Json | null
          completion_date: string | null
          created_at: string | null
          current_phase: number | null
          customer_id: string | null
          customer_satisfaction: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          next_service_due: string | null
          notes: string | null
          phase_1_completed_at: string | null
          phase_1_status: string | null
          phase_2_completed_at: string | null
          phase_2_status: string | null
          phase_3_completed_at: string | null
          phase_3_status: string | null
          phase_4_completed_at: string | null
          phase_4_status: string | null
          started_at: string | null
          technician_id: string | null
          total_duration: number | null
          updated_at: string | null
          visit_date: string
          visit_id: string
          visit_status: string | null
        }
        Insert: {
          auto_save_data?: Json | null
          completion_date?: string | null
          created_at?: string | null
          current_phase?: number | null
          customer_id?: string | null
          customer_satisfaction?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          next_service_due?: string | null
          notes?: string | null
          phase_1_completed_at?: string | null
          phase_1_status?: string | null
          phase_2_completed_at?: string | null
          phase_2_status?: string | null
          phase_3_completed_at?: string | null
          phase_3_status?: string | null
          phase_4_completed_at?: string | null
          phase_4_status?: string | null
          started_at?: string | null
          technician_id?: string | null
          total_duration?: number | null
          updated_at?: string | null
          visit_date: string
          visit_id: string
          visit_status?: string | null
        }
        Update: {
          auto_save_data?: Json | null
          completion_date?: string | null
          created_at?: string | null
          current_phase?: number | null
          customer_id?: string | null
          customer_satisfaction?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          next_service_due?: string | null
          notes?: string | null
          phase_1_completed_at?: string | null
          phase_1_status?: string | null
          phase_2_completed_at?: string | null
          phase_2_status?: string | null
          phase_3_completed_at?: string | null
          phase_3_status?: string | null
          phase_4_completed_at?: string | null
          phase_4_status?: string | null
          started_at?: string | null
          technician_id?: string | null
          total_duration?: number | null
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
      bas_platforms: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          manufacturer: string | null
          platform_category: string | null
          platform_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          platform_category?: string | null
          platform_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          manufacturer?: string | null
          platform_category?: string | null
          platform_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      building_types: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          type_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          type_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          type_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          role_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          role_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          role_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_status_history: {
        Row: {
          change_reason: string | null
          changed_at: string | null
          changed_by: string | null
          contract_id: string | null
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
        }
        Insert: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          contract_id?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          change_reason?: string | null
          changed_at?: string | null
          changed_by?: string | null
          contract_id?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_status_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contract_search_view"
            referencedColumns: ["contract_id"]
          },
          {
            foreignKeyName: "contract_status_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "simpro_customer_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_contracts: {
        Row: {
          billing_frequency: string | null
          contract_email: string | null
          contract_name: string | null
          contract_notes: string | null
          contract_number: string | null
          contract_status: string | null
          contract_value: number | null
          created_at: string | null
          customer_id: string | null
          emergency_coverage: boolean | null
          end_date: string | null
          id: string
          service_hours_included: number | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          billing_frequency?: string | null
          contract_email?: string | null
          contract_name?: string | null
          contract_notes?: string | null
          contract_number?: string | null
          contract_status?: string | null
          contract_value?: number | null
          created_at?: string | null
          customer_id?: string | null
          emergency_coverage?: boolean | null
          end_date?: string | null
          id?: string
          service_hours_included?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_frequency?: string | null
          contract_email?: string | null
          contract_name?: string | null
          contract_notes?: string | null
          contract_number?: string | null
          contract_status?: string | null
          contract_value?: number | null
          created_at?: string | null
          customer_id?: string | null
          emergency_coverage?: boolean | null
          end_date?: string | null
          id?: string
          service_hours_included?: number | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_drive_folders: {
        Row: {
          created_at: string | null
          customer_id: string | null
          customer_type: string | null
          folder_id: string
          folder_name: string | null
          folder_url: string | null
          id: string
          is_active: boolean | null
          last_indexed: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          customer_type?: string | null
          folder_id: string
          folder_name?: string | null
          folder_url?: string | null
          id?: string
          is_active?: boolean | null
          last_indexed?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          customer_type?: string | null
          folder_id?: string
          folder_name?: string | null
          folder_url?: string | null
          id?: string
          is_active?: boolean | null
          last_indexed?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_folder_associations: {
        Row: {
          association_type: string
          confidence_score: number | null
          created_at: string | null
          customer_id: string | null
          customer_name: string
          existing_folder_id: string | null
          existing_folder_name: string | null
          existing_folder_url: string | null
          id: string
          new_project_folder_id: string | null
          new_project_folder_url: string | null
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          association_type: string
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          existing_folder_id?: string | null
          existing_folder_name?: string | null
          existing_folder_url?: string | null
          id?: string
          new_project_folder_id?: string | null
          new_project_folder_url?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          association_type?: string
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          existing_folder_id?: string | null
          existing_folder_name?: string | null
          existing_folder_url?: string | null
          id?: string
          new_project_folder_id?: string | null
          new_project_folder_url?: string | null
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_folder_associations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ame_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_folder_search_cache: {
        Row: {
          cached_at: string
          created_at: string
          customer_name: string
          expires_at: string
          id: string
          search_results: Json
          updated_at: string
        }
        Insert: {
          cached_at?: string
          created_at?: string
          customer_name: string
          expires_at: string
          id?: string
          search_results: Json
          updated_at?: string
        }
        Update: {
          cached_at?: string
          created_at?: string
          customer_name?: string
          expires_at?: string
          id?: string
          search_results?: Json
          updated_at?: string
        }
        Relationships: []
      }
      customer_name_variations: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          is_primary: boolean | null
          updated_at: string | null
          variation_name: string
          variation_type: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          variation_name: string
          variation_type?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          variation_name?: string
          variation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_name_variations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contract_search_view"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_name_variations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "simpro_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_system_credentials: {
        Row: {
          created_at: string | null
          credential_type: string
          credentials_data: Json
          customer_id: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          credential_type: string
          credentials_data: Json
          customer_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          credential_type?: string
          credentials_data?: Json
          customer_id?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_system_credentials_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ame_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          access_notes: string | null
          best_arrival_time: string | null
          company_name: string
          created_at: string | null
          created_by: string | null
          has_active_contracts: boolean | null
          id: string
          legacy_customer_id: number | null
          mailing_address: string | null
          mailing_city: string | null
          mailing_state: string | null
          mailing_zip: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          primary_technician_id: string | null
          secondary_contact_email: string | null
          secondary_contact_name: string | null
          secondary_contact_phone: string | null
          secondary_technician_id: string | null
          service_tier: string | null
          site_hazards: string | null
          site_nickname: string | null
          site_number: string | null
          special_instructions: string | null
          system_platform: string | null
          total_contract_value: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access_notes?: string | null
          best_arrival_time?: string | null
          company_name: string
          created_at?: string | null
          created_by?: string | null
          has_active_contracts?: boolean | null
          id?: string
          legacy_customer_id?: number | null
          mailing_address?: string | null
          mailing_city?: string | null
          mailing_state?: string | null
          mailing_zip?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_technician_id?: string | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          secondary_technician_id?: string | null
          service_tier?: string | null
          site_hazards?: string | null
          site_nickname?: string | null
          site_number?: string | null
          special_instructions?: string | null
          system_platform?: string | null
          total_contract_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access_notes?: string | null
          best_arrival_time?: string | null
          company_name?: string
          created_at?: string | null
          created_by?: string | null
          has_active_contracts?: boolean | null
          id?: string
          legacy_customer_id?: number | null
          mailing_address?: string | null
          mailing_city?: string | null
          mailing_state?: string | null
          mailing_zip?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          primary_technician_id?: string | null
          secondary_contact_email?: string | null
          secondary_contact_name?: string | null
          secondary_contact_phone?: string | null
          secondary_technician_id?: string | null
          service_tier?: string | null
          site_hazards?: string | null
          site_nickname?: string | null
          site_number?: string | null
          special_instructions?: string | null
          system_platform?: string | null
          total_contract_value?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      drive_file_index: {
        Row: {
          created_time: string | null
          description: string | null
          file_id: string
          file_size: number | null
          id: string
          indexed_at: string | null
          mime_type: string | null
          modified_time: string | null
          name: string
          parent_folders: string[] | null
          search_vector: unknown | null
          thumbnail_link: string | null
          web_view_link: string | null
        }
        Insert: {
          created_time?: string | null
          description?: string | null
          file_id: string
          file_size?: number | null
          id?: string
          indexed_at?: string | null
          mime_type?: string | null
          modified_time?: string | null
          name: string
          parent_folders?: string[] | null
          search_vector?: unknown | null
          thumbnail_link?: string | null
          web_view_link?: string | null
        }
        Update: {
          created_time?: string | null
          description?: string | null
          file_id?: string
          file_size?: number | null
          id?: string
          indexed_at?: string | null
          mime_type?: string | null
          modified_time?: string | null
          name?: string
          parent_folders?: string[] | null
          search_vector?: unknown | null
          thumbnail_link?: string | null
          web_view_link?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_frequencies: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          frequency_name: string
          id: string
          is_active: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          frequency_name: string
          id?: string
          is_active?: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          frequency_name?: string
          id?: string
          is_active?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      simpro_customer_contracts: {
        Row: {
          contract_email: string | null
          contract_name: string | null
          contract_notes: string | null
          contract_number: string | null
          contract_status: string | null
          contract_value: number | null
          created_at: string | null
          customer_id: string | null
          customer_name_in_contract: string | null
          end_date: string | null
          id: string
          matched_customer_id: string | null
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          contract_email?: string | null
          contract_name?: string | null
          contract_notes?: string | null
          contract_number?: string | null
          contract_status?: string | null
          contract_value?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name_in_contract?: string | null
          end_date?: string | null
          id?: string
          matched_customer_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_email?: string | null
          contract_name?: string | null
          contract_notes?: string | null
          contract_number?: string | null
          contract_status?: string | null
          contract_value?: number | null
          created_at?: string | null
          customer_id?: string | null
          customer_name_in_contract?: string | null
          end_date?: string | null
          id?: string
          matched_customer_id?: string | null
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simpro_customer_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "contract_search_view"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "simpro_customer_contracts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "simpro_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      simpro_customers: {
        Row: {
          active_contract_count: number | null
          company_name: string
          created_at: string | null
          drive_folder_id: string | null
          drive_folder_url: string | null
          email: string | null
          has_active_contracts: boolean | null
          id: string
          is_contract_customer: boolean | null
          labor_tax_code: string | null
          latest_contract_email: string | null
          mailing_address: string | null
          mailing_city: string | null
          mailing_state: string | null
          mailing_zip: string | null
          part_tax_code: string | null
          search_vector: unknown | null
          service_tier: string | null
          simpro_customer_id: string
          total_contract_value: number | null
          updated_at: string | null
        }
        Insert: {
          active_contract_count?: number | null
          company_name: string
          created_at?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          email?: string | null
          has_active_contracts?: boolean | null
          id?: string
          is_contract_customer?: boolean | null
          labor_tax_code?: string | null
          latest_contract_email?: string | null
          mailing_address?: string | null
          mailing_city?: string | null
          mailing_state?: string | null
          mailing_zip?: string | null
          part_tax_code?: string | null
          search_vector?: unknown | null
          service_tier?: string | null
          simpro_customer_id: string
          total_contract_value?: number | null
          updated_at?: string | null
        }
        Update: {
          active_contract_count?: number | null
          company_name?: string
          created_at?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          email?: string | null
          has_active_contracts?: boolean | null
          id?: string
          is_contract_customer?: boolean | null
          labor_tax_code?: string | null
          latest_contract_email?: string | null
          mailing_address?: string | null
          mailing_city?: string | null
          mailing_state?: string | null
          mailing_zip?: string | null
          part_tax_code?: string | null
          search_vector?: unknown | null
          service_tier?: string | null
          simpro_customer_id?: string
          total_contract_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_architectures: {
        Row: {
          architecture_name: string
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          updated_at: string | null
        }
        Insert: {
          architecture_name: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string | null
        }
        Update: {
          architecture_name?: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_encrypted: boolean | null
          setting_key: string
          setting_type: string | null
          setting_value: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          setting_key: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          setting_key?: string
          setting_type?: string | null
          setting_value?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      contract_search_view: {
        Row: {
          active_contract_count: number | null
          company_name: string | null
          contract_duration_days: number | null
          contract_email: string | null
          contract_id: string | null
          contract_name: string | null
          contract_notes: string | null
          contract_number: string | null
          contract_status: string | null
          contract_value: number | null
          customer_email: string | null
          customer_id: string | null
          customer_name_in_contract: string | null
          customer_total_value: number | null
          days_remaining: number | null
          end_date: string | null
          expiring_soon: boolean | null
          matched_customer_id: string | null
          name_variations: string | null
          service_tier: string | null
          simpro_customer_id: string | null
          start_date: string | null
        }
        Relationships: []
      }
      customer_overview: {
        Row: {
          access_notes: string | null
          active_contracts: number | null
          best_arrival_time: string | null
          calculated_contract_value: number | null
          company_name: string | null
          created_at: string | null
          created_by: string | null
          has_active_contracts: boolean | null
          id: string | null
          legacy_customer_id: number | null
          mailing_address: string | null
          mailing_city: string | null
          mailing_state: string | null
          mailing_zip: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          primary_technician_id: string | null
          secondary_contact_email: string | null
          secondary_contact_name: string | null
          secondary_contact_phone: string | null
          secondary_technician_id: string | null
          service_tier: string | null
          site_hazards: string | null
          site_nickname: string | null
          site_number: string | null
          special_instructions: string | null
          system_platform: string | null
          total_contract_value: number | null
          total_contracts: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      api_customer_autocomplete: {
        Args: { search_term: string }
        Returns: Json
      }
      api_customer_search: {
        Args: { search_term: string }
        Returns: Json
      }
      cleanup_expired_folder_cache: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_visits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_old_indexed_files: {
        Args: { days_old?: number }
        Returns: number
      }
      create_customer_full: {
        Args: { form: Json }
        Returns: string
      }
      extract_billing_frequency: {
        Args: { notes: string }
        Returns: string
      }
      find_or_create_customer: {
        Args: {
          p_customer_name_in_contract: string
          p_matched_customer_id: string
        }
        Returns: string
      }
      generate_customer_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_next_customer_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_visit_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_contract_quickfill_data: {
        Args: { customer_id_param: string }
        Returns: {
          contract_count: number
          most_recent_contract_email: string
          most_recent_notes: string
          service_tier: string
          typical_contract_value: number
        }[]
      }
      get_customer_folder_stats: {
        Args: { customer_uuid: string }
        Returns: {
          folder_count: number
          last_indexed: string
          total_files: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      import_contract_from_csv: {
        Args: {
          p_contract_email: string
          p_contract_name: string
          p_contract_notes: string
          p_contract_number: string
          p_contract_status: string
          p_contract_value: number
          p_customer_name_in_contract: string
          p_end_date: string
          p_matched_customer_id: string
          p_start_date: string
        }
        Returns: string
      }
      populate_customer_search_variations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_customers_by_name: {
        Args: { search_term: string }
        Returns: {
          company_name: string
          customer_id: string
          match_score: number
          match_type: string
          simpro_customer_id: string
        }[]
      }
      search_customers_enhanced: {
        Args: { search_term: string }
        Returns: {
          active_contract_count: number
          company_name: string
          customer_id: string
          has_active_contracts: boolean
          latest_contract_email: string
          latest_contract_name: string
          latest_contract_number: string
          latest_end_date: string
          latest_start_date: string
          match_score: number
          match_type: string
          match_value: string
          service_tier: string
          simpro_customer_id: string
          total_contract_value: number
        }[]
      }
      search_drive_files: {
        Args: {
          file_types?: string[]
          folder_ids?: string[]
          max_results?: number
          search_query: string
          year_filter?: number
        }
        Returns: {
          created_time: string
          description: string
          file_id: string
          file_size: number
          mime_type: string
          modified_time: string
          name: string
          parent_folders: string[]
          relevance_score: number
          thumbnail_link: string
          web_view_link: string
        }[]
      }
      search_simpro_customers: {
        Args: {
          has_contracts_filter?: boolean
          max_results?: number
          search_query: string
          service_tier_filter?: string
        }
        Returns: {
          active_contract_count: number
          company_name: string
          email: string
          has_active_contracts: boolean
          id: string
          mailing_address: string
          mailing_city: string
          mailing_state: string
          relevance_score: number
          service_tier: string
          simpro_customer_id: string
          total_contract_value: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      standardize_contract_status: {
        Args: { status_input: string }
        Returns: string
      }
      update_customer_summaries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_customer_form: {
        Args: { form: Json }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "technician" | "user"
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
    Enums: {
      app_role: ["admin", "technician", "user"],
    },
  },
} as const
