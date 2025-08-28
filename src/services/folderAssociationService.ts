import { supabase } from '@/integrations/supabase/client';
import { EnhancedFolderCrudService } from './enhancedFolderCrudService';

/**
 * Simple Folder Association Service
 * Manages relationships between existing Google Drive folders and new project structures
 */

export interface ExistingFolderMatch {
  folderId: string;
  folderName: string;
  folderUrl: string;
  matchScore: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
  confidence: 'high' | 'medium' | 'low';
  parentFolderId: string;
  parentFolderName?: string;
  lastModified?: string;
  fileCount?: number;
}

export interface FolderAssociation {
  id?: string;
  customer_id: string;
  customer_name: string;
  existing_folder_id?: string;
  existing_folder_name?: string;
  existing_folder_url?: string;
  new_project_folder_id?: string;
  new_project_folder_url?: string;
  association_type: 'use_existing' | 'create_new' | 'link_both';
  confidence_score?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export class FolderAssociationService {
  private static crudService = new EnhancedFolderCrudService();
  
  /**
   * Save search results for a customer to the cache
   */
  static async cacheSearchResults(
    customerName: string,
    searchResults: ExistingFolderMatch[]
  ): Promise<void> {
    try {
      await this.crudService.cacheSearchResults(customerName, searchResults);
    } catch (error) {
      console.warn('Search result caching not available:', error);
    }
  }

  /**
   * Get cached search results for a customer
   */
  static async getCachedSearchResults(customerName: string): Promise<ExistingFolderMatch[]> {
    try {
      return await this.crudService.getCachedSearchResults(customerName);
    } catch (error) {
      return [];
    }
  }

  /**
   * Create or update a folder association for a customer
   */
  static async saveFolderAssociation(association: FolderAssociation): Promise<FolderAssociation> {
    try {
      const record = {
        customer_id: association.customer_id,
        customer_name: association.customer_name,
        existing_folder_id: association.existing_folder_id,
        existing_folder_name: association.existing_folder_name,
        existing_folder_url: association.existing_folder_url,
        new_project_folder_id: association.new_project_folder_id,
        new_project_folder_url: association.new_project_folder_url,
        association_type: association.association_type,
        confidence_score: association.confidence_score,
        notes: association.notes,
        updated_at: new Date().toISOString()
      };

      let result;
      if (association.id) {
        // Update existing association
        result = await supabase
          .from('customer_folder_associations')
          .update(record)
          .eq('id', association.id)
          .select()
          .single();
      } else {
        // Create new association
        result = await supabase
          .from('customer_folder_associations')
          .insert({ ...record, created_at: new Date().toISOString() })
          .select()
          .single();
      }

      if (result.error) {
        throw new Error(`Failed to save folder association: ${result.error.message}`);
      }

      return result.data as FolderAssociation;
    } catch (error) {
      console.error('Failed to save folder association:', error);
      throw error;
    }
  }

  /**
   * Get folder associations for a customer
   */
  static async getCustomerFolderAssociations(customerId: string): Promise<FolderAssociation[]> {
    try {
      const { data, error } = await supabase
        .from('customer_folder_associations')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to get folder associations:', error.message);
        return [];
      }

      return data as FolderAssociation[];
    } catch (error) {
      console.warn('Folder associations not available:', error);
      return [];
    }
  }

  /**
   * Delete a folder association
   */
  static async deleteFolderAssociation(associationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_folder_associations')
        .delete()
        .eq('id', associationId);

      if (error) {
        throw new Error(`Failed to delete folder association: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to delete folder association:', error);
      throw error;
    }
  }

  /**
   * Get all existing folders that might be relevant for a customer
   */
  static async getRelevantFolders(customerName: string): Promise<{
    cached: ExistingFolderMatch[];
    associated: FolderAssociation[];
  }> {
    const [cachedFolders, associations] = await Promise.all([
      this.getCachedSearchResults(customerName),
      // Get associations by customer name since we might not have customer_id yet
      supabase
        .from('customer_folder_associations')
        .select('*')
        .ilike('customer_name', `%${customerName}%`)
        .order('confidence_score', { ascending: false })
        .then(({ data }) => data as FolderAssociation[] || [])
    ]);

    return {
      cached: cachedFolders,
      associated: associations
    };
  }

  /**
   * Update customer record with final folder information
   */
  static async updateCustomerFolderInfo(
    customerId: string,
    folderId: string,
    folderUrl: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ame_customers')
        .update({
          drive_folder_id: folderId,
          drive_folder_url: folderUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (error) {
        throw new Error(`Failed to update customer folder info: ${error.message}`);
      }
    } catch (error) {
      console.error('Failed to update customer folder info:', error);
      throw error;
    }
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpiredCache(): Promise<void> {
    try {
      await supabase
        .from('customer_folder_search_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());
    } catch (error) {
      console.warn('Failed to cleanup expired cache:', error);
    }
  }
}
