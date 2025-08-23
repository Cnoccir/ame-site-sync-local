import { supabase } from '@/integrations/supabase/client';

/**
 * Service for importing sample/test data into database tables
 */
export class SampleDataImportService {
  /**
   * Import sample customers data
   */
  static async importSampleCustomers(): Promise<{ success: number; errors: string[] }> {
    const sampleCustomers = [
      {
        customer_id: 'CUST_001',
        company_name: 'Metro General Hospital',
        site_name: 'Main Campus',
        site_address: '123 Health St, Anytown, USA 12345',
        service_tier: 'GUARDIAN',
        system_type: 'Niagara N4',
        contract_status: 'Active',
        building_type: 'Hospital/Healthcare',
        primary_contact: 'John Smith',
        contact_phone: '555-111-2222',
        contact_email: 'facility@metrogeneral.com',
        emergency_contact: 'Dr. Sarah Johnson',
        emergency_phone: '555-111-9999',
        emergency_email: 'emergency@metrogeneral.com',
        ppe_required: true,
        badge_required: true,
        training_required: true,
        remote_access: false,
        vpn_required: false,
        region: 'Northeast',
        district: 'Metro',
        account_manager: 'Jane Wilson',
        service_frequency: 'Quarterly'
      },
      {
        customer_id: 'CUST_002',
        company_name: 'Springfield High School',
        site_name: 'Main Building',
        site_address: '456 Education Ave, Springfield, USA 12346',
        service_tier: 'ASSURE',
        system_type: 'Niagara AX',
        contract_status: 'Active',
        building_type: 'Educational',
        primary_contact: 'Mike Davis',
        contact_phone: '555-222-6666',
        contact_email: 'maintenance@springfield.edu',
        ppe_required: false,
        badge_required: false,
        training_required: false,
        remote_access: true,
        vpn_required: false,
        region: 'Midwest',
        district: 'Springfield',
        account_manager: 'Bob Thompson',
        service_frequency: 'Semi-Annual'
      },
      {
        customer_id: 'CUST_003',
        company_name: 'Downtown Office Complex',
        site_name: 'Tower A',
        site_address: '789 Business Blvd, Downtown, USA 12347',
        service_tier: 'CORE',
        system_type: 'Johnson Metasys',
        contract_status: 'Active',
        building_type: 'Office Building',
        primary_contact: 'Lisa Rodriguez',
        contact_phone: '555-777-4888',
        contact_email: 'property@downtownoffice.com',
        ppe_required: false,
        badge_required: false,
        training_required: false,
        remote_access: false,
        vpn_required: false,
        region: 'West',
        district: 'Downtown',
        account_manager: 'Sarah Johnson',
        service_frequency: 'Annual'
      }
    ];

    let success = 0;
    const errors: string[] = [];

    for (const customer of sampleCustomers) {
      try {
        const { error } = await supabase
          .from('ame_customers')
          .upsert(customer, { onConflict: 'customer_id' });
        
        if (error) {
          errors.push(`Customer ${customer.customer_id}: ${error.message}`);
        } else {
          success++;
        }
      } catch (error) {
        errors.push(`Customer processing error: ${error}`);
      }
    }

    return { success, errors };
  }

  /**
   * Import sample tasks data
   */
  static async importSampleTasks(): Promise<{ success: number; errors: string[] }> {
    const sampleTasks = [
      {
        task_id: 'T001',
        task_name: 'Platform & Station Backup',
        category: 'System Backup',
        service_tiers: ['CORE', 'ASSURE', 'GUARDIAN'],
        phase: 1,
        task_order: 1,
        is_mandatory: true,
        estimated_time_minutes: 45,
        complexity_level: 'standard',
        navigation_path: 'Platform → Platform Administration → Backup/Restore',
        tools_required: ['Laptop', 'External Drive', 'Ethernet Cable'],
        quality_checks: 'Verify backup file integrity, confirm successful restore test',
        safety_notes: 'Ensure power protection during backup process'
      },
      {
        task_id: 'T002',
        task_name: 'Check Alarm History',
        category: 'System Monitoring',
        service_tiers: ['CORE', 'ASSURE', 'GUARDIAN'],
        phase: 1,
        task_order: 2,
        is_mandatory: true,
        estimated_time_minutes: 30,
        complexity_level: 'standard',
        navigation_path: 'Station → Alarm Console',
        tools_required: ['Laptop', 'Documentation'],
        quality_checks: 'Review critical alarms, verify resolution status'
      },
      {
        task_id: 'T003',
        task_name: 'Sensor Calibration Check',
        category: 'Calibration',
        service_tiers: ['ASSURE', 'GUARDIAN'],
        phase: 2,
        task_order: 1,
        is_mandatory: true,
        estimated_time_minutes: 60,
        complexity_level: 'advanced',
        navigation_path: 'Station → Points → Sensors',
        tools_required: ['Multimeter', 'Calibration Tools'],
        quality_checks: 'Verify sensor accuracy within ±2% tolerance',
        safety_notes: 'Follow lockout/tagout procedures when accessing sensors'
      },
      {
        task_id: 'T004',
        task_name: 'Network Security Audit',
        category: 'Security',
        service_tiers: ['GUARDIAN'],
        phase: 3,
        task_order: 1,
        is_mandatory: true,
        estimated_time_minutes: 90,
        complexity_level: 'expert',
        navigation_path: 'Platform → Security Settings',
        tools_required: ['Laptop', 'Network Scanner', 'Security Checklist'],
        quality_checks: 'Verify firewall rules, check user access permissions',
        safety_notes: 'Coordinate with IT department before security testing'
      }
    ];

    let success = 0;
    const errors: string[] = [];

    for (const task of sampleTasks) {
      try {
        const { error } = await supabase
          .from('ame_tasks')
          .upsert(task, { onConflict: 'task_id' });
        
        if (error) {
          errors.push(`Task ${task.task_id}: ${error.message}`);
        } else {
          success++;
        }
      } catch (error) {
        errors.push(`Task processing error: ${error}`);
      }
    }

    return { success, errors };
  }

  /**
   * Import sample tools data
   */
  static async importSampleTools(): Promise<{ success: number; errors: string[] }> {
    const sampleTools = [
      {
        tool_id: 'TOOL_001',
        tool_name: 'Laptop with BMS Software',
        category: 'Computing',
        safety_category: 'Standard',
        is_consumable: false,
        manufacturer: 'Dell',
        model_number: 'Latitude 5520',
        current_stock: 5,
        minimum_stock: 2,
        maximum_stock: 10,
        unit_cost: 1200.00,
        tool_status: 'active',
        notes: 'Required for all service visits'
      },
      {
        tool_id: 'TOOL_002',
        tool_name: 'Digital Multimeter',
        category: 'Testing Equipment',
        safety_category: 'Electrical',
        is_consumable: false,
        manufacturer: 'Fluke',
        model_number: '87V',
        current_stock: 8,
        minimum_stock: 3,
        maximum_stock: 12,
        unit_cost: 450.00,
        calibration_required: true,
        calibration_frequency_months: 12,
        tool_status: 'active',
        notes: 'Calibrated annually'
      },
      {
        tool_id: 'TOOL_003',
        tool_name: 'Safety Glasses',
        category: 'PPE',
        safety_category: 'Required',
        is_consumable: false,
        manufacturer: '3M',
        current_stock: 25,
        minimum_stock: 10,
        maximum_stock: 50,
        unit_cost: 15.00,
        tool_status: 'active',
        notes: 'Required for all field work'
      },
      {
        tool_id: 'TOOL_004',
        tool_name: 'Ethernet Cable (25ft)',
        category: 'Connectivity',
        safety_category: 'Standard',
        is_consumable: false,
        current_stock: 15,
        minimum_stock: 5,
        maximum_stock: 30,
        unit_cost: 25.00,
        tool_status: 'active',
        notes: 'For network diagnostics'
      }
    ];

    let success = 0;
    const errors: string[] = [];

    for (const tool of sampleTools) {
      try {
        const { error } = await supabase
          .from('ame_tools')
          .upsert(tool, { onConflict: 'tool_id' });
        
        if (error) {
          errors.push(`Tool ${tool.tool_id}: ${error.message}`);
        } else {
          success++;
        }
      } catch (error) {
        errors.push(`Tool processing error: ${error}`);
      }
    }

    return { success, errors };
  }

  /**
   * Import sample SOPs data
   */
  static async importSampleSOPs(): Promise<{ success: number; errors: string[] }> {
    const sampleSOPs = [
      {
        sop_id: 'SOP_001',
        sop_name: 'System Backup Procedure',
        category: 'System Maintenance',
        system_type: 'Niagara N4',
        description: 'Standard procedure for backing up BMS platform and station data',
        version: '2.1',
        revision_number: '2.1',
        estimated_duration: 45,
        safety_requirements: ['Power backup device required'],
        tools_required: ['Laptop', 'External storage device', 'Ethernet cable'],
        procedure_steps: [
          'Connect to BMS network',
          'Access Platform Administration',
          'Navigate to Backup/Restore section',
          'Select backup destination',
          'Initiate backup process',
          'Verify backup completion',
          'Test restore capability'
        ],
        compliance_standard: 'ASHRAE 135',
        risk_level: 'low'
      },
      {
        sop_id: 'SOP_002',
        sop_name: 'Sensor Calibration Protocol',
        category: 'Calibration',
        system_type: 'Universal',
        description: 'Procedure for calibrating temperature, humidity, and pressure sensors',
        version: '3.0',
        revision_number: '3.0',
        estimated_duration: 60,
        safety_requirements: ['LOTO procedures', 'PPE required'],
        tools_required: ['Calibrated reference instruments', 'Multimeter', 'Safety equipment'],
        procedure_steps: [
          'Verify sensor specifications',
          'Implement LOTO procedures',
          'Connect reference instruments',
          'Record baseline readings',
          'Adjust sensor calibration',
          'Verify accuracy within tolerance',
          'Document results'
        ],
        compliance_standard: 'NIST',
        training_required: true,
        certification_level: 'Level 2',
        risk_level: 'medium'
      }
    ];

    let success = 0;
    const errors: string[] = [];

    for (const sop of sampleSOPs) {
      try {
        const { error } = await supabase
          .from('ame_sops')
          .upsert(sop, { onConflict: 'sop_id' });
        
        if (error) {
          errors.push(`SOP ${sop.sop_id}: ${error.message}`);
        } else {
          success++;
        }
      } catch (error) {
        errors.push(`SOP processing error: ${error}`);
      }
    }

    return { success, errors };
  }

  /**
   * Import all sample data
   */
  static async importAllSampleData(): Promise<{
    customers: { success: number; errors: string[] };
    tasks: { success: number; errors: string[] };
    tools: { success: number; errors: string[] };
    sops: { success: number; errors: string[] };
  }> {
    const results = {
      customers: { success: 0, errors: [] as string[] },
      tasks: { success: 0, errors: [] as string[] },
      tools: { success: 0, errors: [] as string[] },
      sops: { success: 0, errors: [] as string[] }
    };

    try {
      // Import in sequence to avoid conflicts
      results.customers = await this.importSampleCustomers();
      results.tasks = await this.importSampleTasks();
      results.tools = await this.importSampleTools();
      results.sops = await this.importSampleSOPs();

      return results;
    } catch (error) {
      throw new Error(`Failed to import sample data: ${error}`);
    }
  }
}