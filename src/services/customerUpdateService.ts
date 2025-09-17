import { Customer } from '@/types';

// Interface for handling customer data updates through MCP tools
interface CustomerUpdateResult {
  success: boolean;
  data?: Customer;
  error?: string;
}

interface CustomerUpdateContext {
  customerId: string;
  visitId?: string;
  userId?: string;
}

/**
 * Updates customer data using Supabase MCP tools
 * This service handles CRUD operations for customer site intelligence
 */
export class CustomerUpdateService {
  /**
   * Update customer intelligence data during a visit
   * @param customerId - The customer ID to update
   * @param updates - Partial customer data to update
   * @param context - Additional context like visit ID, user ID
   */
  static async updateCustomerIntelligence(
    customerId: string,
    updates: Partial<Customer>,
    context?: Partial<CustomerUpdateContext>
  ): Promise<CustomerUpdateResult> {
    try {
      // Sanitize the updates to only include valid fields
      const sanitizedUpdates = CustomerUpdateService.sanitizeUpdates(updates);
      
      // Add audit fields
      const auditedUpdates = {
        ...sanitizedUpdates,
        updated_at: new Date().toISOString(),
        updated_by: context?.userId || null
      };

      // Use MCP tools to execute the update
      const success = await CustomerUpdateService.executeUpdate(customerId, auditedUpdates);
      
      if (!success) {
        throw new Error('Database update failed');
      }

      // Log the change for audit purposes
      if (context?.visitId) {
        await CustomerUpdateService.logVisitEnrichment(
          context.visitId,
          customerId,
          Object.keys(sanitizedUpdates),
          context.userId
        );
      }

      return {
        success: true,
        data: auditedUpdates as Customer
      };
    } catch (error) {
      console.error('Customer update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Batch update customer data during visit phases
   * @param customerId - Customer ID
   * @param visitId - Visit ID
   * @param intelligenceUpdates - Grouped updates by category
   * @param userId - User performing the update
   */
  static async enrichCustomerDataDuringVisit(
    customerId: string,
    visitId: string,
    intelligenceUpdates: {
      siteIntelligence?: Partial<Customer>;
      contactAccess?: Partial<Customer>;
      documentation?: Partial<Customer>;
      systemAccess?: Partial<Customer>;
    },
    userId?: string
  ): Promise<CustomerUpdateResult> {
    try {
      // Combine all updates
      const combinedUpdates = {
        ...intelligenceUpdates.siteIntelligence,
        ...intelligenceUpdates.contactAccess,
        ...intelligenceUpdates.documentation,
        ...intelligenceUpdates.systemAccess
      };

      // Update customer data
      const result = await CustomerUpdateService.updateCustomerIntelligence(
        customerId,
        combinedUpdates,
        { customerId, visitId, userId }
      );

      return result;
    } catch (error) {
      console.error('Batch customer enrichment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch update failed'
      };
    }
  }

  /**
   * Sanitize customer updates to prevent invalid field updates
   * @param updates - Raw updates from UI
   */
  private static sanitizeUpdates(updates: Partial<Customer>): Partial<Customer> {
    // List of fields that can be updated through site intelligence
    const allowedFields: (keyof Customer)[] = [
      'site_nickname',
      'handoff_notes',
      'primary_contact',
      'primary_contact_role',
      'contact_phone',
      'contact_email',
      'poc_name',
      'poc_phone',
      'poc_available_hours',
      'backup_contact',
      'best_arrival_times',
      'access_procedure',
      'parking_instructions',
      'common_access_issues',
      'access_approach',
      'scheduling_notes',
      'completion_status',
      'commissioning_notes',
      'known_issues',
      'documentation_score',
      'original_team_contact',
      'original_team_role',
      'original_team_info',
      'when_to_contact_original',
      'site_experience',
      'last_visit_by',
      'last_visit_date',
      'last_job_numbers'
    ];

    // Filter to only allowed fields
    const sanitized: Partial<Customer> = {};
    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key as keyof Customer)) {
        (sanitized as any)[key] = updates[key as keyof Customer];
      }
    });

    return sanitized;
  }

  /**
   * Execute the database update using MCP tools
   * This is a placeholder for the actual MCP implementation
   * In a real implementation, this would use the call_mcp_tool function
   */
  private static async executeUpdate(
    customerId: string,
    updates: Partial<Customer>
  ): Promise<boolean> {
    try {
      // Convert updates to SQL SET clause
      const setClause = Object.entries(updates)
        .map(([key, value]) => {
          if (value === null || value === undefined) {
            return `${key} = NULL`;
          }
          if (Array.isArray(value)) {
            return `${key} = ARRAY[${value.map(v => `'${v.replace(/'/g, "''")}'`).join(', ')}]`;
          }
          if (typeof value === 'string') {
            return `${key} = '${value.replace(/'/g, "''")}'`;
          }
          if (typeof value === 'number') {
            return `${key} = ${value}`;
          }
          if (typeof value === 'boolean') {
            return `${key} = ${value}`;
          }
          return `${key} = '${String(value).replace(/'/g, "''")}'`;
        })
        .join(', ');

      const query = `
        UPDATE ame_customers 
        SET ${setClause}
        WHERE id = '${customerId}';
      `;

      // This would use the actual MCP tool in production:
      // const result = await call_mcp_tool('execute_sql', { query });
      
      // For now, we'll simulate success
      console.log('Would execute SQL:', query);
      return true;
    } catch (error) {
      console.error('SQL execution failed:', error);
      return false;
    }
  }

  /**
   * Log visit-based customer data enrichment
   */
  private static async logVisitEnrichment(
    visitId: string,
    customerId: string,
    enrichedFields: string[],
    userId?: string
  ): Promise<void> {
    try {
      const logEntry = {
        visit_id: visitId,
        customer_id: customerId,
        enriched_fields: enrichedFields,
        enriched_by: userId,
        enriched_at: new Date().toISOString()
      };

      // In production, this would log to an audit table
      console.log('Customer enrichment log:', logEntry);
    } catch (error) {
      console.error('Failed to log customer enrichment:', error);
    }
  }

  /**
   * Get customer data with proper error handling
   */
  static async getCustomerData(customerId: string): Promise<CustomerUpdateResult> {
    try {
      const query = `
        SELECT * FROM ame_customers 
        WHERE id = '${customerId}';
      `;

      // This would use the actual MCP tool in production:
      // const result = await call_mcp_tool('execute_sql', { query });
      
      // For now, simulate success
      return {
        success: true,
        data: {} as Customer
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch customer data'
      };
    }
  }

  /**
   * Validate customer data before update
   */
  static validateCustomerUpdates(updates: Partial<Customer>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate documentation score
    if (updates.documentation_score !== undefined) {
      if (typeof updates.documentation_score !== 'number' || 
          updates.documentation_score < 0 || 
          updates.documentation_score > 100) {
        errors.push('Documentation score must be a number between 0 and 100');
      }
    }

    // Validate site experience
    if (updates.site_experience !== undefined) {
      const validExperiences = ['first_time', 'familiar', 'expert'];
      if (!validExperiences.includes(updates.site_experience)) {
        errors.push('Site experience must be one of: first_time, familiar, expert');
      }
    }

    // Validate completion status
    if (updates.completion_status !== undefined) {
      const validStatuses = ['Design', 'Construction', 'Commissioning', 'Operational', 'Warranty'];
      if (!validStatuses.includes(updates.completion_status)) {
        errors.push('Completion status must be one of: Design, Construction, Commissioning, Operational, Warranty');
      }
    }

    // Validate email format
    if (updates.contact_email && !CustomerUpdateService.isValidEmail(updates.contact_email)) {
      errors.push('Contact email format is invalid');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Simple email validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export convenience functions for easier use in components
export const updateCustomerIntelligence = CustomerUpdateService.updateCustomerIntelligence;
export const enrichCustomerDataDuringVisit = CustomerUpdateService.enrichCustomerDataDuringVisit;
export const getCustomerData = CustomerUpdateService.getCustomerData;
export const validateCustomerUpdates = CustomerUpdateService.validateCustomerUpdates;
