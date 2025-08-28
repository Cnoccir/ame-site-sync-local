import { supabase } from '@/integrations/supabase/client';
import { EnhancedGoogleDriveService } from './enhancedGoogleDriveService';
import { FolderAssociationService } from './folderAssociationService';
import { 
  EnhancedFolderCrudService,
  ExistingFolderMatch as CrudExistingFolderMatch,
  EnhancedProjectFolder as CrudEnhancedProjectFolder,
  CustomerFolderAssociation as CrudCustomerFolderAssociation
} from './enhancedFolderCrudService';

export interface ProjectFolderDetectionResult {
  hasExistingFolder: boolean;
  existingFolder?: {
    folderId: string;
    folderName: string;
    folderUrl: string;
    confidence: 'high' | 'medium' | 'low';
    matchType: 'exact' | 'fuzzy' | 'contains' | 'partial';
    lastModified?: string;
    fileCount?: number;
  };
  recommendedAction: 'use_existing' | 'create_new' | 'ask_user';
  alternativeFolders?: Array<{
    folderId: string;
    folderName: string;
    folderUrl: string;
    confidence: 'high' | 'medium' | 'low';
    matchType: 'exact' | 'fuzzy' | 'contains' | 'partial';
  }>;
  searchDuration: number;
}

export interface FolderCreationStrategy {
  strategy: 'use_existing' | 'create_new' | 'link_both';
  primaryFolderId: string;
  primaryFolderUrl: string;
  associatedFolders?: Array<{
    folderId: string;
    folderUrl: string;
    associationType: 'main' | 'reference' | 'backup' | 'archive';
  }>;
  notes?: string;
}

export interface EnhancedProjectFolder {
  mainFolderId: string;
  mainFolderUrl: string;
  isNewlyCreated: boolean;
  associatedFolders: Array<{
    folderId: string;
    folderName: string;
    folderUrl: string;
    associationType: 'main' | 'reference' | 'backup' | 'archive';
    notes?: string;
  }>;
  subfolders?: {
    backups: { id: string; url: string };
    projectDocs: { id: string; url: string };
    sitePhotos: { id: string; url: string };
    maintenance: { id: string; url: string };
    reports: { id: string; url: string };
    correspondence: { id: string; url: string };
  };
  createdAt: string;
  metadata: {
    customerName: string;
    searchPerformed: boolean;
    existingFoldersFound: number;
    strategy: string;
    confidence: string;
  };
}

/**
 * Enhanced Project Folder Management Service
 * Handles intelligent folder detection, creation, and multi-folder association
 */
export class EnhancedProjectFolderService {
  private static crudService = new EnhancedFolderCrudService();

  /**
   * Intelligently detect existing project folders for a customer
   */
  static async detectExistingProjectFolders(
    customerName: string,
    customerData: {
      site_name?: string;
      site_nickname?: string;
      site_address?: string;
      customer_id?: string;
    }
  ): Promise<ProjectFolderDetectionResult> {
    console.log(`🔍 Detecting existing project folders for: ${customerName}`);
    const startTime = Date.now();
    
    try {
      // First, check the cache for recent search results
      const cachedResults = await this.crudService.getCachedSearchResults(customerName);
      
      if (cachedResults.length > 0) {
        console.log(`📋 Found ${cachedResults.length} cached search results`);
        return this.analyzeCachedResults(cachedResults, Date.now() - startTime);
      }
      
      // Perform fresh search if no cached results
      console.log('🔍 Performing fresh folder search...');
      const searchResults = await EnhancedGoogleDriveService.searchExistingCustomerFolders(
        customerName,
        customerData.site_address,
        customerData.site_name,
        customerData.site_nickname
      );
      
      // Cache the search results
      const formattedResults = searchResults.existingFolders.map(folder => ({
        folderId: folder.folderId,
        folderName: folder.folderName,
        folderUrl: folder.webViewLink,
        matchScore: folder.matchScore,
        matchType: folder.matchType,
        confidence: folder.confidence,
        parentFolderId: folder.parentFolder,
        parentFolderName: folder.parentFolderType,
        lastModified: folder.lastModified,
        fileCount: folder.fileCount
      }));
      
      await this.crudService.cacheSearchResults(customerName, formattedResults);
      
      return this.analyzeSearchResults(searchResults, Date.now() - startTime);
      
    } catch (error) {
      console.error('❌ Folder detection failed:', error);
      
      return {
        hasExistingFolder: false,
        recommendedAction: 'create_new',
        searchDuration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Analyze cached search results to determine folder strategy
   */
  private static analyzeCachedResults(
    cachedResults: any[],
    searchDuration: number
  ): ProjectFolderDetectionResult {
    if (cachedResults.length === 0) {
      return {
        hasExistingFolder: false,
        recommendedAction: 'create_new',
        searchDuration
      };
    }
    
    // Find the highest confidence match
    const sortedResults = cachedResults.sort((a, b) => {
      const confidenceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return (confidenceOrder[b.confidence] || 0) - (confidenceOrder[a.confidence] || 0);
    });
    
    const bestMatch = sortedResults[0];
    const highConfidenceMatches = sortedResults.filter(r => r.confidence === 'high');
    
    // If we have high confidence matches, recommend using existing
    if (highConfidenceMatches.length > 0) {
      return {
        hasExistingFolder: true,
        existingFolder: {
          folderId: bestMatch.folderId,
          folderName: bestMatch.folderName,
          folderUrl: bestMatch.folderUrl,
          confidence: bestMatch.confidence,
          matchType: bestMatch.matchType,
          lastModified: bestMatch.lastModified,
          fileCount: bestMatch.fileCount
        },
        recommendedAction: 'use_existing',
        alternativeFolders: sortedResults.slice(1, 4).map(result => ({
          folderId: result.folderId,
          folderName: result.folderName,
          folderUrl: result.folderUrl,
          confidence: result.confidence,
          matchType: result.matchType
        })),
        searchDuration
      };
    }
    
    // If we have medium confidence matches, ask user
    if (sortedResults.some(r => r.confidence === 'medium')) {
      return {
        hasExistingFolder: true,
        existingFolder: {
          folderId: bestMatch.folderId,
          folderName: bestMatch.folderName,
          folderUrl: bestMatch.folderUrl,
          confidence: bestMatch.confidence,
          matchType: bestMatch.matchType,
          lastModified: bestMatch.lastModified,
          fileCount: bestMatch.fileCount
        },
        recommendedAction: 'ask_user',
        alternativeFolders: sortedResults.slice(1, 4).map(result => ({
          folderId: result.folderId,
          folderName: result.folderName,
          folderUrl: result.folderUrl,
          confidence: result.confidence,
          matchType: result.matchType
        })),
        searchDuration
      };
    }
    
    // Low confidence matches - recommend creating new
    return {
      hasExistingFolder: true,
      existingFolder: {
        folderId: bestMatch.folderId,
        folderName: bestMatch.folderName,
        folderUrl: bestMatch.folderUrl,
        confidence: bestMatch.confidence,
        matchType: bestMatch.matchType,
        lastModified: bestMatch.lastModified,
        fileCount: bestMatch.fileCount
      },
      recommendedAction: 'create_new',
      alternativeFolders: sortedResults.slice(1, 4).map(result => ({
        folderId: result.folderId,
        folderName: result.folderName,
        folderUrl: result.folderUrl,
        confidence: result.confidence,
        matchType: result.matchType
      })),
      searchDuration
    };
  }
  
  /**
   * Analyze live search results
   */
  private static analyzeSearchResults(
    searchResults: any,
    searchDuration: number
  ): ProjectFolderDetectionResult {
    const folders = searchResults.existingFolders || [];
    
    if (folders.length === 0) {
      return {
        hasExistingFolder: false,
        recommendedAction: 'create_new',
        searchDuration
      };
    }
    
    // Use the recommended action from the search results
    const recommendedAction = searchResults.recommendedActions?.action || 'create_new';
    
    const bestMatch = folders[0];
    
    return {
      hasExistingFolder: true,
      existingFolder: {
        folderId: bestMatch.folderId,
        folderName: bestMatch.folderName,
        folderUrl: bestMatch.webViewLink,
        confidence: bestMatch.confidence,
        matchType: bestMatch.matchType,
        lastModified: bestMatch.lastModified,
        fileCount: bestMatch.fileCount
      },
      recommendedAction: recommendedAction === 'use_existing' ? 'use_existing' : 
                        recommendedAction === 'link_multiple' ? 'ask_user' : 'create_new',
      alternativeFolders: folders.slice(1, 4).map(folder => ({
        folderId: folder.folderId,
        folderName: folder.folderName,
        folderUrl: folder.webViewLink,
        confidence: folder.confidence,
        matchType: folder.matchType
      })),
      searchDuration
    };
  }
  
  /**
   * Create or associate project folders based on detection results and user choice
   */
  static async createOrAssociateProjectFolder(
    customerName: string,
    customerId: string,
    customerData: {
      site_name?: string;
      site_nickname?: string;
      site_address?: string;
      service_tier?: string;
      contact_name?: string;
      phone?: string;
    },
    strategy: FolderCreationStrategy
  ): Promise<EnhancedProjectFolder> {
    console.log(`🏗️ Creating/associating project folder for: ${customerName} with strategy: ${strategy.strategy}`);
    
    try {
      let mainFolderId: string;
      let mainFolderUrl: string;
      let isNewlyCreated = false;
      let subfolders: any = undefined;
      const associatedFolders: any[] = [];
      
      if (strategy.strategy === 'use_existing') {
        // Use existing folder as main project folder
        mainFolderId = strategy.primaryFolderId;
        mainFolderUrl = strategy.primaryFolderUrl;
        isNewlyCreated = false;
        
        console.log(`✅ Using existing folder: ${mainFolderId}`);
        
        associatedFolders.push({
          folderId: mainFolderId,
          folderName: customerName + ' - Existing Project Folder',
          folderUrl: mainFolderUrl,
          associationType: 'main',
          notes: 'Primary existing project folder'
        });
        
      } else if (strategy.strategy === 'create_new') {
        // Create a new structured project folder
        console.log('🏗️ Creating new structured project folder...');
        
        const folderStructure = await EnhancedGoogleDriveService.createStructuredProjectFolder(
          customerName,
          customerData
        );
        
        mainFolderId = folderStructure.mainFolderId;
        mainFolderUrl = folderStructure.mainFolderUrl;
        subfolders = folderStructure.subfolders;
        isNewlyCreated = true;
        
        associatedFolders.push({
          folderId: mainFolderId,
          folderName: customerName + ' - New Project Folder',
          folderUrl: mainFolderUrl,
          associationType: 'main',
          notes: 'Newly created structured project folder'
        });
        
        console.log(`✅ New folder created: ${mainFolderId}`);
        
      } else if (strategy.strategy === 'link_both') {
        // Create new structured folder and link existing for reference
        console.log('🏗️ Creating new folder and linking existing...');
        
        const folderStructure = await EnhancedGoogleDriveService.createStructuredProjectFolder(
          customerName,
          customerData
        );
        
        mainFolderId = folderStructure.mainFolderId;
        mainFolderUrl = folderStructure.mainFolderUrl;
        subfolders = folderStructure.subfolders;
        isNewlyCreated = true;
        
        // Main new folder
        associatedFolders.push({
          folderId: mainFolderId,
          folderName: customerName + ' - New Project Folder',
          folderUrl: mainFolderUrl,
          associationType: 'main',
          notes: 'Primary structured project folder'
        });
        
        // Link existing folder for reference
        if (strategy.associatedFolders && strategy.associatedFolders.length > 0) {
          strategy.associatedFolders.forEach(folder => {
            associatedFolders.push({
              folderId: folder.folderId,
              folderName: customerName + ' - Reference Folder',
              folderUrl: folder.folderUrl,
              associationType: folder.associationType || 'reference',
              notes: 'Existing folder linked for reference'
            });
          });
        }
        
        console.log(`✅ New folder created: ${mainFolderId}, existing folders linked`);
      }
      
      // Save enhanced project folder record
      await this.crudService.createEnhancedProjectFolder({
        customer_id: customerId,
        customer_name: customerName,
        main_folder_id: mainFolderId,
        main_folder_url: mainFolderUrl,
        folder_structure: subfolders ? JSON.stringify(subfolders) : null,
        creation_strategy: strategy.strategy,
        notes: strategy.notes || null,
        is_active: true
      });
      
      // Save folder associations for all associated folders
      for (const folder of associatedFolders) {
        await this.crudService.createCustomerFolderAssociation({
          customer_id: customerId,
          folder_id: folder.folderId,
          folder_name: folder.folderName,
          folder_url: folder.folderUrl,
          association_type: folder.associationType as 'main' | 'reference' | 'backup' | 'archive',
          confidence_score: 0.95,
          notes: folder.notes,
          is_primary: folder.associationType === 'main'
        });
      }
      
      // Update customer record with main folder information
      await this.crudService.updateCustomerFolderReference(
        customerId,
        mainFolderId,
        mainFolderUrl
      );
      
      const result: EnhancedProjectFolder = {
        mainFolderId,
        mainFolderUrl,
        isNewlyCreated,
        associatedFolders,
        subfolders,
        createdAt: new Date().toISOString(),
        metadata: {
          customerName,
          searchPerformed: true,
          existingFoldersFound: strategy.associatedFolders?.length || 0,
          strategy: strategy.strategy,
          confidence: 'high'
        }
      };
      
      console.log(`✅ Project folder management completed for ${customerName}`);
      return result;
      
    } catch (error) {
      console.error('❌ Project folder creation/association failed:', error);
      throw new Error(`Failed to create/associate project folder: ${error.message}`);
    }
  }
  
  /**
   * Get all associated folders for a customer
   */
  static async getCustomerProjectFolders(customerId: string): Promise<{
    main: { folderId: string; folderUrl: string } | null;
    associated: Array<{
      folderId: string;
      folderName: string;
      folderUrl: string;
      associationType: string;
      notes?: string;
    }>;
  }> {
    try {
      const associations = await this.crudService.getCustomerFolderAssociations(customerId);
      
      let mainFolder = null;
      const associatedFolders = [];
      
      for (const association of associations) {
        if (association.new_project_folder_id) {
          mainFolder = {
            folderId: association.new_project_folder_id,
            folderUrl: association.new_project_folder_url || ''
          };
        }
        
        if (association.existing_folder_id) {
          associatedFolders.push({
            folderId: association.existing_folder_id,
            folderName: association.existing_folder_name || 'Unknown Folder',
            folderUrl: association.existing_folder_url || '',
            associationType: association.association_type || 'reference',
            notes: association.notes
          });
        }
      }
      
      return {
        main: mainFolder,
        associated: associatedFolders
      };
      
    } catch (error) {
      console.error('Failed to get customer project folders:', error);
      return {
        main: null,
        associated: []
      };
    }
  }
  
  /**
   * Search within customer's associated project folders
   */
  static async searchWithinProjectFolders(
    customerId: string,
    searchQuery: string
  ): Promise<{
    files: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      parentFolder: string;
      lastModified: string;
    }>;
    searchDuration: number;
  }> {
    console.log(`🔍 Searching within project folders for customer: ${customerId}`);
    const startTime = Date.now();
    
    try {
      const projectFolders = await this.getCustomerProjectFolders(customerId);
      const folderIds: string[] = [];
      
      if (projectFolders.main) {
        folderIds.push(projectFolders.main.folderId);
      }
      
      projectFolders.associated.forEach(folder => {
        folderIds.push(folder.folderId);
      });
      
      if (folderIds.length === 0) {
        return {
          files: [],
          searchDuration: Date.now() - startTime
        };
      }
      
      // Search within all associated folders
      // This would call a Google Drive API endpoint to search within specific folders
      // For now, return empty results as the implementation would require additional API work
      
      console.log(`ℹ️ Project folder search would search in ${folderIds.length} folders`);
      
      return {
        files: [],
        searchDuration: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Failed to search within project folders:', error);
      return {
        files: [],
        searchDuration: Date.now() - startTime
      };
    }
  }
}
