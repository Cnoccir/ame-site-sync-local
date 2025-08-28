// Intelligent Auto-Population Service
export class IntelligentAutoPopulationService {
  static populateAssessmentFromCustomer(customer: any) {
    return {
      step1Data: {
        contactPerson: customer.primary_contact || '',
        contactNumber: customer.contact_phone || '',
        contactEmail: customer.contact_email || '',
        communicationPreference: customer.communication_preference || 'call',
        onSiteContactVerified: false,
        specialRequests: customer.special_instructions || ''
      },
      
      step2Data: {
        ppeAvailable: false, // Always require confirmation
        hazardsReviewed: false, // Always require confirmation  
        emergencyProcedures: false, // Always require confirmation
        safetyRequirements: customer.safety_requirements || customer.ppe_required ? 'PPE Required' : '',
        siteHazards: Array.isArray(customer.site_hazards) ? customer.site_hazards.join(', ') : customer.site_hazards || '',
        notes: customer.safety_notes || ''
      },
      
      step3Data: {
        supervisorLocation: customer.bms_supervisor_location || '',
        supervisorAccess: customer.system_access_notes || '',
        buildingAccessType: customer.building_access_type || '',
        buildingAccessDetails: customer.building_access_details || customer.access_procedure || '',
        // Safety checkboxes always require manual confirmation
        panelsAccessible: false,
        wiringCondition: false, 
        environmentalOk: false,
        issuesFound: customer.known_issues?.join('; ') || ''
      },
      
      step4Data: {
        supervisorIp: customer.bms_supervisor_ip || '',
        workbenchUsername: customer.workbench_username || '',
        platformUsername: customer.platform_username || '',
        webSupervisorUrl: customer.web_supervisor_url || '',
        vpnRequired: customer.vpn_required || false,
        vpnDetails: customer.vpn_details || '',
        systemVersion: customer.system_platform || '',
        // Passwords and test results never auto-populate for security
        workbenchPassword: '',
        supervisorPassword: '',
        supervisorStatus: 'not_tested' as const,
        workbenchStatus: 'not_tested' as const,
        connectionNotes: customer.remote_access_notes || '',
        remoteAccessResults: {}
      }
    };
  }
}
