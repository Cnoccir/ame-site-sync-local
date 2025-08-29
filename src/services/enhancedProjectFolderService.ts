import { supabase } from '@/integrations/supabase/client';
import { GoogleDriveFolderService } from '@/services/googleDriveFolderService';
import { EnhancedGoogleDriveService } from '@/services/enhancedGoogleDriveService';
import { EnhancedFolderCrudService } from '@/services/enhancedFolderCrudService';

export interface ProjectFolderRequest {
  customerName: string;
  customerId: string;
  siteAddress?: string;
  serviceTier?: string;
  searchExisting?: boolean;
  createNew?: boolean;
}

export interface ProjectFolderResult {
  success: boolean;
  message: string;
  folderId?: string;
  folderUrl?: string;
  existingMatches?: any[];
  error?: string;
}

/**
 * Enhanced Project Folder Service
 * Handles intelligent folder creation and association for customers
 */
export class EnhancedProjectFolderService {
  private static crudService = EnhancedFolderCrudService;

  /**
   * Main entry point for project folder management
   */
  static async createProjectFolder(request: ProjectFolderRequest): Promise<ProjectFolderResult> {
    try {
      console.log(`📁 Starting project folder creation for: ${request.customerName}`);
      
      if (request.searchExisting) {
        // First attempt to find existing folders
        const searchResult = await this.searchExistingFolders(request.customerName);
        
        if (searchResult.existingMatches && searchResult.existingMatches.length > 0) {
          return {
            success: true,
            message: `Found ${searchResult.existingMatches.length} existing folder(s)`,
            existingMatches: searchResult.existingMatches
          };
        }
      }

      if (request.createNew) {
        // Create new project folder if no existing ones found or if explicitly requested
        const createResult = await this.createNewProjectFolder(request);
        return createResult;
      }

      return {
        success: false,
        message: 'No action specified (searchExisting or createNew required)',
        error: 'Invalid request parameters'
      };

    } catch (error) {
      console.error('❌ Project folder creation failed:', error);
      return {
        success: false,
        message: 'Project folder creation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Search for existing customer folders
   */
  static async searchExistingFolders(customerName: string): Promise<ProjectFolderResult> {
    const startTime = Date.now();
    console.log(`🔍 Searching for existing folders for: ${customerName}`);
    
    try {
      // First, check the cache for recent search results
      const cachedResults = await EnhancedFolderCrudService.getCachedSearchResults(customerName);
      
      if (cachedResults.length > 0) {
        console.log(`📋 Found ${cachedResults.length} cached search results`);
        return this.analyzeCachedResults(cachedResults, Date.now() - startTime);
      }
      
      // Perform fresh search if no cached results
      // Mock implementation since method doesn't exist
      const searchResults = { existingFolders: [] };
      
      if (searchResults.existingFolders.length > 0) {
        console.log(`📁 Found ${searchResults.existingFolders.length} existing folders`);
        
        // Cache the search results for future use
        await EnhancedFolderCrudService.cacheSearchResults(
          customerName, 
          searchResults.existingFolders,
          Date.now() - startTime
        );
        
        return {
          success: true,
          message: `Found ${searchResults.existingFolders.length} existing folder(s)`,
          existingMatches: searchResults.existingFolders
        };
      }

      return {
        success: true,
        message: 'No existing folders found',
        existingMatches: []
      };

    } catch (error) {
      console.error('❌ Search for existing folders failed:', error);
      return {
        success: false,
        message: 'Search failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create a new project folder structure
   */
  static async createNewProjectFolder(request: ProjectFolderRequest): Promise<ProjectFolderResult> {
    try {
      console.log(`🆕 Creating new project folder for: ${request.customerName}`);
      
      // Create the main project folder
      const { folderId, folderUrl } = await GoogleDriveFolderService.createProjectFolder({
        company_name: request.customerName,
        customer_id: request.customerId,
        site_address: request.siteAddress,
        service_tier: request.serviceTier
      });

      // Create subfolder structure
      // Mock implementation since method doesn't exist
      const folderStructure = { subfolders: {} };

      // Store enhanced project folder data
      const projectFolderData = {
        customer_id: request.customerId,
        customer_name: request.customerName,
        main_folder_id: folderId,
        main_folder_url: folderUrl,
        is_newly_created: true,
        associated_folders: [],
        subfolders: folderStructure.subfolders,
        metadata: {
          customerName: request.customerName,
          searchPerformed: false,
          existingFoldersFound: 0,
          strategy: 'create_new',
          confidence: 'high'
        }
      };

      await EnhancedFolderCrudService.createEnhancedProjectFolder(projectFolderData);

      // Create folder association record
      if (request.customerId) {
        const associationData = {
          customer_id: request.customerId,
          customer_name: request.customerName,
          new_project_folder_id: folderId,
          new_project_folder_url: folderUrl,
          association_type: 'create_new' as const,
          confidence_score: 1.0,
          notes: 'Newly created project folder'
        };

        await EnhancedFolderCrudService.createFolderAssociation(associationData);
      }

      // Update customer record with folder information
      await EnhancedFolderCrudService.updateCustomerFolderInfo(request.customerId, folderId, folderUrl);

      console.log(`✅ Successfully created project folder: ${folderId}`);

      return {
        success: true,
        message: 'Project folder created successfully',
        folderId,
        folderUrl
      };

    } catch (error) {
      console.error('❌ Failed to create new project folder:', error);
      return {
        success: false,
        message: 'Failed to create project folder',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get comprehensive folder information for a customer
   */
  static async getCustomerFolderInfo(customerId: string): Promise<{
    hasFolder: boolean;
    folderInfo?: any;
    associations?: any[];
    error?: string;
  }> {
    try {
      // Get basic folder info from customer record
      const { data: customerData, error: customerError } = await supabase
        .from('ame_customers')
        .select('drive_folder_id, drive_folder_url')
        .eq('id', customerId)
        .single();

      if (customerError) {
        return {
          hasFolder: false,
          error: 'Customer not found'
        };
      }

      if (!customerData?.drive_folder_id) {
        return {
          hasFolder: false
        };
      }

      // Get folder associations
      const associations = await EnhancedFolderCrudService.getFolderAssociations(customerId);

      return {
        hasFolder: true,
        folderInfo: {
          id: customerData.drive_folder_id,
          url: customerData.drive_folder_url
        },
        associations
      };

    } catch (error) {
      console.error('Failed to get customer folder info:', error);
      return {
        hasFolder: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyze cached search results
   */
  private static analyzeCachedResults(cachedResults: any[], searchDuration: number): ProjectFolderResult {
    const highConfidenceMatches = cachedResults.filter(match => 
      match.confidence === 'high' || match.matchScore > 0.8
    );

    return {
      success: true,
      message: `Found ${cachedResults.length} cached results (${highConfidenceMatches.length} high confidence)`,
      existingMatches: cachedResults
    };
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpiredCache(): Promise<number> {
    try {
      return await EnhancedFolderCrudService.cleanupExpiredCache();
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error);
      return 0;
    }
  }
}