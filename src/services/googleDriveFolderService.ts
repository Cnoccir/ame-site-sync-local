import { supabase } from '@/integrations/supabase/client';
import { GoogleDriveIntelligenceService } from './googleDriveIntelligenceService';

/**
 * Service for creating and managing Google Drive project folders
 */
export class GoogleDriveFolderService {
  
  /**
   * Create project folder structure for a customer
   */
  static async createProjectFolder(customer: any): Promise<{ folderId: string; folderUrl: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: {
          action: 'createProjectFolder',
          data: {
            customerName: customer.company_name,
            customerId: customer.customer_id,
            siteLocation: customer.site_address,
            serviceType: customer.service_tier
          }
        }
      });

      if (error) throw error;

      return {
        folderId: data.folderId,
        folderUrl: data.folderUrl
      };
    } catch (error) {
      console.error('Failed to create project folder:', error);
      throw error;
    }
  }

  /**
   * Update customer record with Google Drive folder information
   */
  static async updateCustomerWithFolder(customerId: string, folderId: string, folderUrl: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ame_customers')
        .update({
          drive_folder_id: folderId,
          drive_folder_url: folderUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to update customer with folder info:', error);
      throw error;
    }
  }

  /**
   * Check if customer has project folder and create if needed
   */
  static async ensureProjectFolderExists(customer: any): Promise<{ folderId: string; folderUrl: string }> {
    // If customer already has folder info, return it
    if (customer.drive_folder_id && customer.drive_folder_url) {
      return {
        folderId: customer.drive_folder_id,
        folderUrl: customer.drive_folder_url
      };
    }

    // Create new folder structure
    const folderInfo = await this.createProjectFolder(customer);
    
    // Update customer record
    await this.updateCustomerWithFolder(customer.id, folderInfo.folderId, folderInfo.folderUrl);
    
    return folderInfo;
  }

  /**
   * Test Google Drive connection using OAuth status
   */
  static async testConnection(): Promise<boolean> {
    try {
      const status = await GoogleDriveIntelligenceService.checkOAuthConnection();
      return status.connected;
    } catch (error) {
      console.error('Google Drive OAuth connection test failed:', error);
      return false;
    }
  }

  /**
   * List all project folders
   */
  static async listProjectFolders(): Promise<any[]> {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: {
          action: 'listProjectFolders'
        }
      });

      if (error) throw error;
      return data.folders || [];
    } catch (error) {
      console.error('Failed to list project folders:', error);
      return [];
    }
  }
}