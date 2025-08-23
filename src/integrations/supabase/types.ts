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
          account_manager: string | null
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
          district: string | null
          drive_folder_id: string | null
          drive_folder_url: string | null
          emergency_contact: string | null
          emergency_email: string | null
          emergency_phone: string | null
          equipment_list: Json | null
          escalation_contact: string | null
          escalation_phone: string | null
          id: string
          last_service: string | null
          next_due: string | null
          payment_terms: string | null
          platform_password: string | null
          platform_username: string | null
          ppe_required: boolean | null
          primary_contact: string
          region: string | null
          remote_access: boolean | null
          remote_access_type: string | null
          safety_requirements: string | null
          security_contact: string | null
          security_phone: string | null
          service_frequency: string | null
          service_tier: string
          site_address: string
          site_hazards: string | null
          site_name: string
          site_timezone: string | null
          special_instructions: string | null
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
          account_manager?: string | null
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
          district?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          emergency_contact?: string | null
          emergency_email?: string | null
          emergency_phone?: string | null
          equipment_list?: Json | null
          escalation_contact?: string | null
          escalation_phone?: string | null
          id?: string
          last_service?: string | null
          next_due?: string | null
          payment_terms?: string | null
          platform_password?: string | null
          platform_username?: string | null
          ppe_required?: boolean | null
          primary_contact: string
          region?: string | null
          remote_access?: boolean | null
          remote_access_type?: string | null
          safety_requirements?: string | null
          security_contact?: string | null
          security_phone?: string | null
          service_frequency?: string | null
          service_tier: string
          site_address: string
          site_hazards?: string | null
          site_name: string
          site_timezone?: string | null
          special_instructions?: string | null
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
          account_manager?: string | null
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
          district?: string | null
          drive_folder_id?: string | null
          drive_folder_url?: string | null
          emergency_contact?: string | null
          emergency_email?: string | null
          emergency_phone?: string | null
          equipment_list?: Json | null
          escalation_contact?: string | null
          escalation_phone?: string | null
          id?: string
          last_service?: string | null
          next_due?: string | null
          payment_terms?: string | null
          platform_password?: string | null
          platform_username?: string | null
          ppe_required?: boolean | null
          primary_contact?: string
          region?: string | null
          remote_access?: boolean | null
          remote_access_type?: string | null
          safety_requirements?: string | null
          security_contact?: string | null
          security_phone?: string | null
          service_frequency?: string | null
          service_tier?: string
          site_address?: string
          site_hazards?: string | null
          site_name?: string
          site_timezone?: string | null
          special_instructions?: string | null
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
      ame_technicians: {
        Row: {
          certifications: string[] | null
          created_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string | null
          employment_status: string | null
          first_name: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          last_name: string
          max_concurrent_visits: number | null
          phone: string | null
          service_regions: string[] | null
          specializations: string[] | null
          technician_id: string
          travel_radius_miles: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_info: Json | null
        }
        Insert: {
          certifications?: string[] | null
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          employment_status?: string | null
          first_name: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          last_name: string
          max_concurrent_visits?: number | null
          phone?: string | null
          service_regions?: string[] | null
          specializations?: string[] | null
          technician_id: string
          travel_radius_miles?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_info?: Json | null
        }
        Update: {
          certifications?: string[] | null
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string | null
          employment_status?: string | null
          first_name?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          last_name?: string
          max_concurrent_visits?: number | null
          phone?: string | null
          service_regions?: string[] | null
          specializations?: string[] | null
          technician_id?: string
          travel_radius_miles?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_info?: Json | null
        }
        Relationships: []
      }
      ame_tool_categories: {
        Row: {
          category_name: string
          created_at: string | null
          description: string | null
          id: string
          is_essential: boolean | null
          updated_at: string | null
        }
        Insert: {
          category_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_essential?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_essential?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ame_tools: {
        Row: {
          calibration_frequency_months: number | null
          calibration_required: boolean | null
          category: string | null
          category_id: string | null
          created_at: string | null
          current_stock: number | null
          id: string
          is_consumable: boolean | null
          is_essential: boolean | null
          is_required: boolean | null
          is_safety: boolean | null
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
          category_id?: string | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_consumable?: boolean | null
          is_essential?: boolean | null
          is_required?: boolean | null
          is_safety?: boolean | null
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
          category_id?: string | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_consumable?: boolean | null
          is_essential?: boolean | null
          is_required?: boolean | null
          is_safety?: boolean | null
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
        Relationships: [
          {
            foreignKeyName: "ame_tools_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ame_tool_categories"
            referencedColumns: ["id"]
          },
        ]
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
      assessment_steps: {
        Row: {
          completion_time: string | null
          created_at: string | null
          form_data: Json | null
          id: string
          start_time: string | null
          status: string | null
          step_name: string
          step_number: number
          updated_at: string | null
          visit_id: string | null
        }
        Insert: {
          completion_time?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          start_time?: string | null
          status?: string | null
          step_name: string
          step_number: number
          updated_at?: string | null
          visit_id?: string | null
        }
        Update: {
          completion_time?: string | null
          created_at?: string | null
          form_data?: Json | null
          id?: string
          start_time?: string | null
          status?: string | null
          step_name?: string
          step_number?: number
          updated_at?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_steps_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "ame_visits"
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
      network_inventory: {
        Row: {
          analysis_completed_at: string | null
          analysis_data: Json | null
          created_at: string | null
          file_names: string[] | null
          id: string
          protocols_found: string[] | null
          total_stations: number | null
          visit_id: string | null
        }
        Insert: {
          analysis_completed_at?: string | null
          analysis_data?: Json | null
          created_at?: string | null
          file_names?: string[] | null
          id?: string
          protocols_found?: string[] | null
          total_stations?: number | null
          visit_id?: string | null
        }
        Update: {
          analysis_completed_at?: string | null
          analysis_data?: Json | null
          created_at?: string | null
          file_names?: string[] | null
          id?: string
          protocols_found?: string[] | null
          total_stations?: number | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_inventory_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "ame_visits"
            referencedColumns: ["id"]
          },
        ]
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
      system_connections: {
        Row: {
          connection_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          notes: string | null
          status: string | null
          test_time: string | null
          username: string | null
          visit_id: string | null
        }
        Insert: {
          connection_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          status?: string | null
          test_time?: string | null
          username?: string | null
          visit_id?: string | null
        }
        Update: {
          connection_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          notes?: string | null
          status?: string | null
          test_time?: string | null
          username?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_connections_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "ame_visits"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      cleanup_expired_visits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_visit_id: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
