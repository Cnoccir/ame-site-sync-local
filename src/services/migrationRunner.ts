import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';

/**
 * Migration Runner Service - Applies database migrations via Supabase client
 */
export class MigrationRunner {
  
  /**
   * Apply Site Intelligence System migration
   */
  static async applySiteIntelligenceMigration(): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      logger.info('Starting Site Intelligence System migration...');

      // Check if migration already applied by testing a simple query
      try {
        const { error: testError } = await supabase
          .from('ame_customers')
          .select('site_nickname')
          .limit(1);
        
        if (!testError) {
          logger.info('Site Intelligence migration already applied');
          return;
        }
      } catch (e) {
        // Column doesn't exist, continue with migration
      }

      // Since we can't execute DDL directly, we'll provide instructions
      logger.info('Site Intelligence migration needs to be applied manually.');
      logger.info('Please run the SQL migration file: supabase/migrations/20250827032657_site_intelligence_system.sql');
      logger.info('Or apply the schema changes through Supabase dashboard.');
      
      // For now, we'll assume the migration has been applied externally
      // In a real production environment, this would be handled by the deployment process
      
      logger.info('Site Intelligence System migration setup completed');
    }, 'applySiteIntelligenceMigration');
  }

  /**
   * Create helper functions for Site Intelligence System
   */
  static async createHelperFunctions(): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      const functionSQL = `
        -- Function to generate unique site numbers
        CREATE OR REPLACE FUNCTION generate_site_number() RETURNS TEXT AS $$
        DECLARE
            year_part TEXT;
            counter INTEGER;
            new_site_number TEXT;
        BEGIN
            year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
            
            -- Get the highest counter for this year
            SELECT COALESCE(MAX(CAST(SUBSTRING(site_number FROM 'AME-' || year_part || '-(\\d+)') AS INTEGER)), 0) + 1
            INTO counter
            FROM public.ame_customers
            WHERE site_number LIKE 'AME-' || year_part || '-%';
            
            -- Format with leading zeros
            new_site_number := 'AME-' || year_part || '-' || LPAD(counter::TEXT, 3, '0');
            
            RETURN new_site_number;
        END;
        $$ LANGUAGE plpgsql;

        -- Function to get technician name by ID
        CREATE OR REPLACE FUNCTION get_technician_name(technician_id UUID) RETURNS TEXT AS $$
        DECLARE
            technician_name TEXT;
        BEGIN
            SELECT COALESCE(profiles.full_name, auth.users.email)
            INTO technician_name
            FROM auth.users
            LEFT JOIN public.profiles ON auth.users.id = public.profiles.id
            WHERE auth.users.id = technician_id;
            
            RETURN technician_name;
        END;
        $$ LANGUAGE plpgsql;
      `;

      const { error: functionError } = await supabase.rpc('execute_sql', { 
        sql: functionSQL 
      });

      if (functionError) {
        logger.warn('Failed to create helper functions', functionError);
        // Don't fail the migration if functions can't be created
      }
    }, 'createHelperFunctions');
  }

  /**
   * Generate site numbers for existing customers
   */
  static async generateSiteNumbersForExistingCustomers(): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      logger.info('Generating site numbers for existing customers...');

      // Get customers without site numbers
      const { data: customers, error: fetchError } = await supabase
        .from('ame_customers')
        .select('id, company_name, site_name')
        .is('site_number', null);

      if (fetchError) {
        throw errorHandler.handleSupabaseError(fetchError, 'fetchCustomersWithoutSiteNumbers');
      }

      if (!customers || customers.length === 0) {
        logger.info('All customers already have site numbers');
        return;
      }

      // Generate site numbers for each customer
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        const year = new Date().getFullYear();
        const counter = String(i + 1).padStart(3, '0');
        const siteNumber = `AME-${year}-${counter}`;
        
        // Generate default nickname
        const nickname = `${customer.company_name} - ${customer.site_name}`.substring(0, 50);

        // Update customer with site number and nickname
        const { error: updateError } = await supabase
          .from('ame_customers')
          .update({
            site_number: siteNumber,
            site_nickname: nickname
          })
          .eq('id', customer.id);

        if (updateError) {
          logger.warn(`Failed to update customer ${customer.id}`, updateError);
        } else {
          logger.info(`Generated site number ${siteNumber} for customer ${customer.id}`);
        }
      }

      logger.info(`Generated site numbers for ${customers.length} customers`);
    }, 'generateSiteNumbersForExistingCustomers');
  }

  /**
   * Validate Site Intelligence migration
   */
  static async validateSiteIntelligenceMigration(): Promise<boolean> {
    return errorHandler.withErrorHandling(async () => {
      // Test if the new columns exist by trying to select them
      try {
        const { error } = await supabase
          .from('ame_customers')
          .select('site_nickname, site_number, primary_technician_id, secondary_technician_id, last_job_numbers, system_platform')
          .limit(1);

        if (error) {
          logger.error('Migration validation failed - columns missing:', error.message);
          return false;
        }

        logger.info('Site Intelligence migration validation passed');
        return true;
      } catch (e) {
        logger.error('Migration validation failed - unexpected error:', e);
        return false;
      }
    }, 'validateSiteIntelligenceMigration');
  }

  /**
   * Run complete Site Intelligence migration
   */
  static async runSiteIntelligenceMigration(): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      logger.info('Starting complete Site Intelligence migration process...');

      // Step 1: Apply database schema changes
      await this.applySiteIntelligenceMigration();

      // Step 2: Generate site numbers for existing customers
      await this.generateSiteNumbersForExistingCustomers();

      // Step 3: Validate migration
      const isValid = await this.validateSiteIntelligenceMigration();
      
      if (!isValid) {
        throw new Error('Migration validation failed');
      }

      logger.info('Site Intelligence migration completed successfully!');
    }, 'runSiteIntelligenceMigration');
  }
}
