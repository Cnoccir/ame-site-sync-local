import { supabase } from '@/integrations/supabase/client';

// Enhanced type definitions for folder management
export interface CustomerFolderSearchCache {
  id?: string;
  customer_name: string;
  search_results: {
    folders: ExistingFolderMatch[];
    search_timestamp: string;
    total_matches: number;
  };
  cached_at?: string;
  expires_at: string;
  search_duration_ms?: number;
  total_folders_found: number;
  authentication_required?: boolean;
  created_at?: string;
  updated_at?: string;
}

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

export interface EnhancedProjectFolder {
  id?: string;
  customer_id: string;
  customer_name: string;
  main_folder_id: string;
  main_folder_url: string;
  is_newly_created: boolean;
  associated_folders: AssociatedFolder[];
  subfolders?: {
    backups: { id: string; url: string };
    projectDocs: { id: string; url: string };
    sitePhotos: { id: string; url: string };
    maintenance: { id: string; url: string };
    reports: { id: string; url: string };
    correspondence: { id: string; url: string };
  };
  metadata: {
    customerName: string;
    searchPerformed: boolean;
    existingFoldersFound: number;
    strategy: string;
    confidence: string;
    [key: string]: any;
  };
  created_at?: string;
  updated_at?: string;
}

export interface AssociatedFolder {
  folderId: string;
  folderName: string;
  folderUrl: string;
  associationType: 'main' | 'reference' | 'backup' | 'archive';
  notes?: string;
}

export interface CustomerFolderAssociation {
  id?: string;
  customer_id: string;
  customer_name?: string;
  existing_folder_id?: string;
  existing_folder_name?: string;
  existing_folder_url?: string;
  new_project_folder_id?: string;
  new_project_folder_url?: string;
  association_type: 'use_existing' | 'create_new' | 'link_both' | 'reference_link';
  confidence_score?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectFolderSearchIndex {
  id?: string;
  customer_id: string;
  folder_id: string;
  folder_name: string;
  folder_path?: string;
  folder_type: 'main' | 'subfolder' | 'associated' | 'legacy';
  association_type?: 'main' | 'reference' | 'backup' | 'archive';
  parent_folder_id?: string;
  file_count: number;
  last_indexed?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

/**
 * Enhanced Folder CRUD Service
 * Provides type-safe, error-handled operations for all folder management tables
 */
export class EnhancedFolderCrudService {
  
  /**
   * CUSTOMER FOLDER SEARCH CACHE OPERATIONS
   */
  
  static async cacheSearchResults(
    customerName: string, 
    searchResults: ExistingFolderMatch[],
    searchDurationMs?: number,
    authenticationRequired = false
  ): Promise<CustomerFolderSearchCache | null> {
    try {
      // First, clear any existing cache for this customer
      await supabase
        .from('customer_folder_search_cache')
        .delete()
        .eq('customer_name', customerName.toLowerCase());

      const cacheRecord: Partial<CustomerFolderSearchCache> = {
        customer_name: customerName.toLowerCase(),
        search_results: {
          folders: searchResults,
          search_timestamp: new Date().toISOString(),
          total_matches: searchResults.length
        },
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        search_duration_ms: searchDurationMs,
        total_folders_found: searchResults.length,
        authentication_required: authenticationRequired
      };

      const { data, error } = await supabase
        .from('customer_folder_search_cache')
        .insert(cacheRecord)
        .select()
        .single();

      if (error) {
        console.warn('Failed to cache search results:', error.message);
        return null;
      }

      return data as CustomerFolderSearchCache;
    } catch (error) {
      console.warn('Search result caching failed:', error);
      return null;
    }
  }

  static async getCachedSearchResults(customerName: string): Promise<ExistingFolderMatch[]> {
    try {
      const { data, error } = await supabase
        .from('customer_folder_search_cache')
        .select('search_results, expires_at')
        .eq('customer_name', customerName.toLowerCase())
        .order('cached_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return [];
      }

      // Check if cache is expired
      if (new Date(data.expires_at) < new Date()) {
        // Clean up expired cache
        await this.cleanupExpiredCache();
        return [];
      }

      return data.search_results?.folders || [];
    } catch (error) {
      console.warn('Failed to get cached search results:', error);
      return [];
    }
  }

  static async cleanupExpiredCache(): Promise<number> {
    try {
      const { error, count } = await supabase
        .from('customer_folder_search_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.warn('Failed to cleanup expired cache:', error.message);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
      return 0;
    }
  }

  /**
   * ENHANCED PROJECT FOLDERS OPERATIONS
   */

  static async createEnhancedProjectFolder(
    folderData: Omit<EnhancedProjectFolder, 'id' | 'created_at' | 'updated_at'>
  ): Promise<EnhancedProjectFolder | null> {
    try {
      const { data, error } = await supabase
        .from('enhanced_project_folders')
        .insert({
          customer_id: folderData.customer_id,
          customer_name: folderData.customer_name,
          main_folder_id: folderData.main_folder_id,
          main_folder_url: folderData.main_folder_url,
          is_newly_created: folderData.is_newly_created,
          associated_folders: folderData.associated_folders,
          subfolders: folderData.subfolders,
          metadata: folderData.metadata
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create enhanced project folder:', error);
        throw new Error(`Failed to create enhanced project folder: ${error.message}`);
      }

      return data as EnhancedProjectFolder;
    } catch (error) {
      console.error('Enhanced project folder creation failed:', error);
      throw error;
    }
  }

  static async getEnhancedProjectFolder(customerId: string): Promise<EnhancedProjectFolder | null> {
    try {
      const { data, error } = await supabase
        .from('enhanced_project_folders')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.warn('Failed to get enhanced project folder:', error.message);
        return null;
      }

      return data as EnhancedProjectFolder;
    } catch (error) {
      console.warn('Failed to fetch enhanced project folder:', error);
      return null;
    }
  }

  static async updateEnhancedProjectFolder(
    customerId: string,
    updates: Partial<Omit<EnhancedProjectFolder, 'id' | 'customer_id' | 'created_at' | 'updated_at'>>
  ): Promise<EnhancedProjectFolder | null> {
    try {
      const { data, error } = await supabase
        .from('enhanced_project_folders')
        .update(updates)
        .eq('customer_id', customerId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update enhanced project folder:', error);
        throw new Error(`Failed to update enhanced project folder: ${error.message}`);
      }

      return data as EnhancedProjectFolder;
    } catch (error) {
      console.error('Enhanced project folder update failed:', error);
      throw error;
    }
  }

  /**
   * CUSTOMER FOLDER ASSOCIATIONS OPERATIONS
   */

  static async createFolderAssociation(
    association: Omit<CustomerFolderAssociation, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CustomerFolderAssociation | null> {
    try {
      const { data, error } = await supabase
        .from('customer_folder_associations')
        .insert({
          customer_id: association.customer_id,
          customer_name: association.customer_name,
          existing_folder_id: association.existing_folder_id,
          existing_folder_name: association.existing_folder_name,
          existing_folder_url: association.existing_folder_url,
          new_project_folder_id: association.new_project_folder_id,
          new_project_folder_url: association.new_project_folder_url,
          association_type: association.association_type,
          confidence_score: association.confidence_score,
          notes: association.notes
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create folder association:', error);
        throw new Error(`Failed to create folder association: ${error.message}`);
      }

      return data as CustomerFolderAssociation;
    } catch (error) {
      console.error('Folder association creation failed:', error);
      throw error;
    }
  }

  static async getFolderAssociations(customerId: string): Promise<CustomerFolderAssociation[]> {
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

      return data as CustomerFolderAssociation[];
    } catch (error) {
      console.warn('Failed to fetch folder associations:', error);
      return [];
    }
  }

  static async updateFolderAssociation(
    associationId: string,
    updates: Partial<Omit<CustomerFolderAssociation, 'id' | 'customer_id' | 'created_at' | 'updated_at'>>
  ): Promise<CustomerFolderAssociation | null> {
    try {
      const { data, error } = await supabase
        .from('customer_folder_associations')
        .update(updates)
        .eq('id', associationId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update folder association:', error);
        throw new Error(`Failed to update folder association: ${error.message}`);
      }

      return data as CustomerFolderAssociation;
    } catch (error) {
      console.error('Folder association update failed:', error);
      throw error;
    }
  }

  static async deleteFolderAssociation(associationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customer_folder_associations')
        .delete()
        .eq('id', associationId);

      if (error) {
        console.error('Failed to delete folder association:', error);
        throw new Error(`Failed to delete folder association: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Folder association deletion failed:', error);
      throw error;
    }
  }

  /**
   * PROJECT FOLDER SEARCH INDEX OPERATIONS
   */

  static async indexProjectFolders(
    customerId: string,
    folders: Omit<ProjectFolderSearchIndex, 'id' | 'customer_id' | 'created_at' | 'updated_at'>[]
  ): Promise<ProjectFolderSearchIndex[]> {
    try {
      // First, deactivate existing indexes for this customer
      await supabase
        .from('project_folder_search_index')
        .update({ is_active: false })
        .eq('customer_id', customerId);

      // Insert new folder indexes
      const indexRecords = folders.map(folder => ({
        customer_id: customerId,
        folder_id: folder.folder_id,
        folder_name: folder.folder_name,
        folder_path: folder.folder_path,
        folder_type: folder.folder_type,
        association_type: folder.association_type,
        parent_folder_id: folder.parent_folder_id,
        file_count: folder.file_count,
        last_indexed: new Date().toISOString(),
        is_active: true,
        metadata: folder.metadata
      }));

      const { data, error } = await supabase
        .from('project_folder_search_index')
        .insert(indexRecords)
        .select();

      if (error) {
        console.error('Failed to index project folders:', error);
        throw new Error(`Failed to index project folders: ${error.message}`);
      }

      return data as ProjectFolderSearchIndex[];
    } catch (error) {
      console.error('Project folder indexing failed:', error);
      throw error;
    }
  }

  static async getProjectFolderIndex(customerId: string): Promise<ProjectFolderSearchIndex[]> {
    try {
      const { data, error } = await supabase
        .from('project_folder_search_index')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('folder_type', { ascending: true });

      if (error) {
        console.warn('Failed to get project folder index:', error.message);
        return [];
      }

      return data as ProjectFolderSearchIndex[];
    } catch (error) {
      console.warn('Failed to fetch project folder index:', error);
      return [];
    }
  }

  static async updateProjectFolderIndex(
    indexId: string,
    updates: Partial<Omit<ProjectFolderSearchIndex, 'id' | 'customer_id' | 'created_at' | 'updated_at'>>
  ): Promise<ProjectFolderSearchIndex | null> {
    try {
      const { data, error } = await supabase
        .from('project_folder_search_index')
        .update({ ...updates, last_indexed: new Date().toISOString() })
        .eq('id', indexId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update project folder index:', error);
        throw new Error(`Failed to update project folder index: ${error.message}`);
      }

      return data as ProjectFolderSearchIndex;
    } catch (error) {
      console.error('Project folder index update failed:', error);
      throw error;
    }
  }

  /**
   * UTILITY OPERATIONS
   */

  static async updateCustomerFolderInfo(
    customerId: string,
    folderId: string,
    folderUrl: string
  ): Promise<boolean> {
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
        console.error('Failed to update customer folder info:', error);
        throw new Error(`Failed to update customer folder info: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Customer folder info update failed:', error);
      throw error;
    }
  }

  static async getCustomerFolderSummary(customerId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('customer_folder_summary')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error) {
        console.warn('Failed to get customer folder summary:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to fetch customer folder summary:', error);
      return null;
    }
  }

  static async getFolderSearchStats(customerName?: string): Promise<any[]> {
    try {
      let query = supabase.from('folder_search_stats').select('*');
      
      if (customerName) {
        query = query.eq('customer_name', customerName.toLowerCase());
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Failed to get folder search stats:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.warn('Failed to fetch folder search stats:', error);
      return [];
    }
  }

  /**
   * BATCH OPERATIONS FOR EFFICIENCY
   */

  static async batchCreateFolderAssociations(
    associations: Omit<CustomerFolderAssociation, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<CustomerFolderAssociation[]> {
    try {
      const { data, error } = await supabase
        .from('customer_folder_associations')
        .insert(associations)
        .select();

      if (error) {
        console.error('Failed to batch create folder associations:', error);
        throw new Error(`Failed to batch create folder associations: ${error.message}`);
      }

      return data as CustomerFolderAssociation[];
    } catch (error) {
      console.error('Batch folder association creation failed:', error);
      throw error;
    }
  }

  static async getCustomerWithFolderInfo(customerId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ame_customers')
        .select(`
          *,
          enhanced_project_folders (
            main_folder_id,
            main_folder_url,
            is_newly_created,
            associated_folders,
            metadata,
            created_at
          )
        `)
        .eq('id', customerId)
        .single();

      if (error) {
        console.warn('Failed to get customer with folder info:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Failed to fetch customer with folder info:', error);
      return null;
    }
  }

  /**
   * ERROR RECOVERY AND MAINTENANCE
   */

  static async repairBrokenFolderAssociations(): Promise<{
    repaired: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let repaired = 0;

    try {
      // Find associations with missing customer names
      const { data: missingNames, error: queryError } = await supabase
        .from('customer_folder_associations')
        .select('id, customer_id')
        .is('customer_name', null);

      if (queryError) {
        errors.push(`Failed to query missing names: ${queryError.message}`);
        return { repaired, errors };
      }

      // Update missing customer names
      for (const association of missingNames || []) {
        try {
          const { data: customer, error: customerError } = await supabase
            .from('ame_customers')
            .select('company_name')
            .eq('id', association.customer_id)
            .single();

          if (customerError || !customer) {
            errors.push(`Failed to find customer ${association.customer_id}`);
            continue;
          }

          const { error: updateError } = await supabase
            .from('customer_folder_associations')
            .update({ customer_name: customer.company_name })
            .eq('id', association.id);

          if (updateError) {
            errors.push(`Failed to update association ${association.id}: ${updateError.message}`);
          } else {
            repaired++;
          }
        } catch (error) {
          errors.push(`Error processing association ${association.id}: ${error.message}`);
        }
      }

      return { repaired, errors };
    } catch (error) {
      errors.push(`Repair operation failed: ${error.message}`);
      return { repaired, errors };
    }
  }
}
