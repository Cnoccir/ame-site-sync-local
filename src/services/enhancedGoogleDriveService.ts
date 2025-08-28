import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced Google Drive Service for AME
 * Handles proper folder search and creation based on your specific folder structure
 */

// Your specific AME Drive folder structure
const AME_DRIVE_FOLDERS = {
  SITE_BACKUPS: '0AA0zN0U9WLD6Uk9PVA',
  ENGINEERING_MASTER: '0AHYT5lRT-50cUk9PVA',
  ENGINEERING_2021: '1maB0Nq9V4l05p63DXU9YEIUQlGvjVI0g',
  ENGINEERING_2022: '10uM5VcqEfBqDuHOi9of3Nj0gfGfxo2QU',
  ENGINEERING_2023: '1UjzlUQaleGSedk39ZYxQCTAUhu9TLBrM',
  ENGINEERING_2024: '1kh6bp8m80Lt-GyqBFY2fPMFmFZfhGyMy',
  ENGINEERING_2025: '17t5MFAl1Hr0iZgWfYbu2TJ-WckFZt41K',
  SERVICE_MAINTENANCE: '0AEG566vw75FqUk9PVA',
  // Add the new job folder location
  NEW_JOB_FOLDER: '1kHsxb9AAeeMtG3G_LjIAoR4UCPky6efU'
};

interface CustomerFolderMatch {
  folderId: string;
  folderName: string;
  folderPath: string;
  webViewLink: string;
  matchScore: number;
  matchType: 'exact' | 'fuzzy' | 'contains' | 'alias' | 'partial';
  confidence: 'high' | 'medium' | 'low';
  parentFolder: string;
  parentFolderType: string;
  yearFolder?: string;
  fileCount?: number;
  lastModified?: string;
  createdDate?: string;
}

interface ProjectFolderStructure {
  mainFolderId: string;
  mainFolderUrl: string;
  subfolders: {
    backups: { id: string; url: string };
    projectDocs: { id: string; url: string };
    sitePhotos: { id: string; url: string };
    maintenance: { id: string; url: string };
    reports: { id: string; url: string };
    correspondence: { id: string; url: string };
  };
}

interface CustomerSearchResult {
  existingFolders: CustomerFolderMatch[];
  recommendedActions: {
    action: 'use_existing' | 'create_new' | 'link_multiple';
    primaryFolder?: CustomerFolderMatch;
    alternativeFolders?: CustomerFolderMatch[];
    reason: string;
  };
  searchDuration: number;
  totalFoldersScanned: number;
}

export class EnhancedGoogleDriveService {
  
  /**
   * Get the current year's engineering folder ID
   */
  private static getCurrentYearFolderId(): string {
    const currentYear = new Date().getFullYear();
    const folderKey = `ENGINEERING_${currentYear}` as keyof typeof AME_DRIVE_FOLDERS;
    
    if (AME_DRIVE_FOLDERS[folderKey]) {
      return AME_DRIVE_FOLDERS[folderKey];
    }
    
    // Fallback to most recent year if current year folder doesn't exist
    const availableYears = Object.keys(AME_DRIVE_FOLDERS)
      .filter(key => key.startsWith('ENGINEERING_') && key !== 'ENGINEERING_MASTER')
      .map(key => parseInt(key.replace('ENGINEERING_', '')))
      .sort((a, b) => b - a);
    
    if (availableYears.length > 0) {
      return AME_DRIVE_FOLDERS[`ENGINEERING_${availableYears[0]}` as keyof typeof AME_DRIVE_FOLDERS];
    }
    
    // Ultimate fallback to master folder
    return AME_DRIVE_FOLDERS.ENGINEERING_MASTER;
  }

  /**
   * Search for existing customer folders across all AME drive locations
   */
  static async searchExistingCustomerFolders(
    customerName: string,
    customerAddress?: string
  ): Promise<CustomerSearchResult> {
    const startTime = Date.now();
    console.log(`🔍 Searching for existing folders for: ${customerName}`);
    
    try {
      // Generate comprehensive search variants
      const searchVariants = this.generateAdvancedSearchVariants(customerName, customerAddress);
      console.log('🔍 Search variants:', searchVariants);
      
      const allMatches: CustomerFolderMatch[] = [];
      let totalFoldersScanned = 0;
      
      // Search all major folder areas
      const searchAreas = [
        { key: 'SITE_BACKUPS', id: AME_DRIVE_FOLDERS.SITE_BACKUPS, name: 'Site Backups' },
        { key: 'SERVICE_MAINTENANCE', id: AME_DRIVE_FOLDERS.SERVICE_MAINTENANCE, name: 'Service Maintenance' },
        { key: 'ENGINEERING_MASTER', id: AME_DRIVE_FOLDERS.ENGINEERING_MASTER, name: 'Engineering Master' },
        { key: 'ENGINEERING_2024', id: AME_DRIVE_FOLDERS.ENGINEERING_2024, name: 'Engineering 2024' },
        { key: 'ENGINEERING_2025', id: AME_DRIVE_FOLDERS.ENGINEERING_2025, name: 'Engineering 2025' },
        { key: 'ENGINEERING_2023', id: AME_DRIVE_FOLDERS.ENGINEERING_2023, name: 'Engineering 2023' },
        { key: 'ENGINEERING_2022', id: AME_DRIVE_FOLDERS.ENGINEERING_2022, name: 'Engineering 2022' },
        { key: 'ENGINEERING_2021', id: AME_DRIVE_FOLDERS.ENGINEERING_2021, name: 'Engineering 2021' }
      ];
      
      // Search each area in parallel for efficiency
      const searchPromises = searchAreas.map(async (area) => {
        try {
          console.log(`📂 Scanning ${area.name}...`);
          const matches = await this.scanFolderForMatches(
            area.id,
            area.key,
            area.name,
            searchVariants
          );
          return matches;
        } catch (error) {
          console.error(`Error scanning ${area.name}:`, error);
          return [];
        }
      });
      
      const searchResults = await Promise.all(searchPromises);
      searchResults.forEach(matches => {
        allMatches.push(...matches);
        totalFoldersScanned += matches.length;
      });
      
      // Sort matches by relevance (confidence, then score, then recency)
      const sortedMatches = allMatches.sort((a, b) => {
        if (a.confidence !== b.confidence) {
          const confidenceOrder = { high: 3, medium: 2, low: 1 };
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        }
        if (a.matchScore !== b.matchScore) {
          return b.matchScore - a.matchScore;
        }
        // Prefer more recent folders
        if (a.lastModified && b.lastModified) {
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        }
        return 0;
      });
      
      // Analyze results and provide recommendations
      const recommendations = this.analyzeSearchResults(sortedMatches, customerName);
      
      const result: CustomerSearchResult = {
        existingFolders: sortedMatches,
        recommendedActions: recommendations,
        searchDuration: Date.now() - startTime,
        totalFoldersScanned
      };
      
      // Cache results for future use
      await this.cacheSearchResults(customerName, result);
      
      console.log(`✅ Search complete: Found ${sortedMatches.length} potential matches in ${result.searchDuration}ms`);
      return result;
      
    } catch (error) {
      console.error('❌ Customer folder search failed:', error);
      throw new Error(`Folder search failed: ${error.message}`);
    }
  }
  
  /**
   * Create a properly structured project folder for a new customer
   */
  static async createStructuredProjectFolder(
    customerName: string,
    customerData: {
      customer_id?: string;
      site_address?: string;
      service_tier?: string;
      contact_name?: string;
      phone?: string;
    }
  ): Promise<ProjectFolderStructure> {
    console.log(`🏗️ Creating structured project folder for: ${customerName}`);
    
    try {
      const currentYear = new Date().getFullYear();
      const currentYearFolderId = this.getCurrentYearFolderId();
      
      // Generate folder name with proper format
      const sanitizedName = this.sanitizeCompanyName(customerName);
      const folderName = `${sanitizedName} - ${currentYear}`;
      
      // Call edge function to create the main project folder and subfolders
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: {
          action: 'create_structured_project_folder',
          customerName: sanitizedName,
          customerData,
          parentFolderId: currentYearFolderId,
          folderName,
          year: currentYear
        }
      });
      
      if (error) {
        throw new Error(`Folder creation failed: ${error.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error('Folder creation returned invalid response');
      }
      
      const folderStructure: ProjectFolderStructure = {
        mainFolderId: data.mainFolder.id,
        mainFolderUrl: data.mainFolder.url,
        subfolders: {
          backups: {
            id: data.subfolders.backups.id,
            url: data.subfolders.backups.url
          },
          projectDocs: {
            id: data.subfolders.projectDocs.id,
            url: data.subfolders.projectDocs.url
          },
          sitePhotos: {
            id: data.subfolders.sitePhotos.id,
            url: data.subfolders.sitePhotos.url
          },
          maintenance: {
            id: data.subfolders.maintenance.id,
            url: data.subfolders.maintenance.url
          },
          reports: {
            id: data.subfolders.reports.id,
            url: data.subfolders.reports.url
          },
          correspondence: {
            id: data.subfolders.correspondence.id,
            url: data.subfolders.correspondence.url
          }
        }
      };
      
      // Store the folder structure in database
      if (customerData.customer_id) {
        await this.storeFolderStructure(customerData.customer_id, folderStructure);
      }
      
      console.log(`✅ Project folder structure created successfully for ${customerName}`);
      return folderStructure;
      
    } catch (error) {
      console.error('❌ Project folder creation failed:', error);
      throw new Error(`Failed to create project folder: ${error.message}`);
    }
  }
  
  /**
   * Generate advanced search variants for better matching
   */
  private static generateAdvancedSearchVariants(customerName: string, customerAddress?: string): string[] {
    const variants: string[] = [];
    
    // Clean the customer name
    const cleanName = customerName.replace(/[^a-zA-Z0-9\s-&]/g, '').trim();
    variants.push(cleanName);
    
    // Remove common business suffixes
    const businessSuffixes = [
      'Inc', 'LLC', 'Corp', 'Corporation', 'Company', 'Co', 'Ltd', 'Limited',
      'Group', 'Associates', 'Partners', 'Enterprises', 'Solutions'
    ];
    
    let nameWithoutSuffixes = cleanName;
    businessSuffixes.forEach(suffix => {
      const regex = new RegExp(`\\s+(${suffix})\\.?$`, 'gi');
      nameWithoutSuffixes = nameWithoutSuffixes.replace(regex, '').trim();
    });
    
    if (nameWithoutSuffixes !== cleanName && nameWithoutSuffixes.length > 0) {
      variants.push(nameWithoutSuffixes);
    }
    
    // Create acronyms
    const words = nameWithoutSuffixes.split(/\s+/).filter(w => w.length > 0);
    if (words.length > 1) {
      // Full acronym
      const fullAcronym = words.map(w => w.charAt(0).toUpperCase()).join('');
      if (fullAcronym.length >= 2 && fullAcronym.length <= 8) {
        variants.push(fullAcronym);
      }
      
      // Partial acronyms for long company names
      if (words.length > 3) {
        variants.push(words.slice(0, 3).map(w => w.charAt(0).toUpperCase()).join(''));
        variants.push(words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join(''));
      }
    }
    
    // Add partial matches
    if (words.length > 1) {
      // First word only (for "Microsoft" from "Microsoft Corporation")
      variants.push(words[0]);
      
      // First two words
      if (words.length > 2) {
        variants.push(words.slice(0, 2).join(' '));
      }
      
      // Last word (often the most distinctive)
      if (words[words.length - 1].length > 3) {
        variants.push(words[words.length - 1]);
      }
    }
    
    // Address-based variants
    if (customerAddress) {
      const addressParts = customerAddress.split(',').map(p => p.trim());
      
      if (addressParts.length > 0) {
        const streetAddress = addressParts[0];
        
        // Building/suite numbers
        const buildingMatch = streetAddress.match(/\b(\d+)\b/);
        if (buildingMatch) {
          variants.push(`${nameWithoutSuffixes} ${buildingMatch[1]}`);
        }
        
        // Street names
        const streetMatch = streetAddress.match(/\b(\w+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd))\b/i);
        if (streetMatch) {
          variants.push(`${nameWithoutSuffixes} ${streetMatch[1]}`);
        }
        
        // City name (usually second part after comma)
        if (addressParts.length > 1) {
          const cityPart = addressParts[1].trim();
          const cityName = cityPart.split(/\s+/)[0]; // First word of city part
          if (cityName.length > 3) {
            variants.push(`${nameWithoutSuffixes} ${cityName}`);
            variants.push(cityName);
          }
        }
      }
    }
    
    // Common variations
    variants.push(
      ...this.generateCommonVariations(nameWithoutSuffixes)
    );
    
    // Remove duplicates and empty strings, sort by length (longer = more specific)
    return [...new Set(variants)]
      .filter(v => v.length > 1)
      .sort((a, b) => b.length - a.length);
  }
  
  /**
   * Generate common variations of company names
   */
  private static generateCommonVariations(name: string): string[] {
    const variations: string[] = [];
    
    // Handle common abbreviations and expansions
    const replacements = [
      { from: /\b(and|&)\b/gi, to: ['&', 'and'] },
      { from: /\bInc\b/gi, to: ['Inc', 'Incorporated'] },
      { from: /\bCorp\b/gi, to: ['Corp', 'Corporation'] },
      { from: /\bLLC\b/gi, to: ['LLC', 'Limited Liability Company'] },
      { from: /\bLtd\b/gi, to: ['Ltd', 'Limited'] },
      { from: /\bCo\b/gi, to: ['Co', 'Company'] }
    ];
    
    replacements.forEach(({ from, to }) => {
      if (from.test(name)) {
        to.forEach(replacement => {
          const variation = name.replace(from, replacement);
          if (variation !== name) {
            variations.push(variation);
          }
        });
      }
    });
    
    return variations;
  }
  
  /**
   * Scan a specific folder for customer matches using the edge function
   */
  private static async scanFolderForMatches(
    parentFolderId: string,
    folderKey: string,
    folderName: string,
    searchVariants: string[]
  ): Promise<CustomerFolderMatch[]> {
    try {
      const { data, error } = await supabase.functions.invoke('google-drive-folder-search', {
        body: {
          action: 'scan_folder_for_customer',
          parentFolderId,
          folderType: folderKey,
          folderName,
          searchVariants
        }
      });
      
      if (error) {
        console.error(`Error scanning ${folderName}:`, error);
        return this.scanFolderForMatchesFallback(parentFolderId, folderKey, folderName, searchVariants);
      }
      
      return (data?.matches || []).map(match => ({
        ...match,
        parentFolderType: folderKey
      }));
      
    } catch (error) {
      console.error(`Failed to scan ${folderName}:`, error);
      return this.scanFolderForMatchesFallback(parentFolderId, folderKey, folderName, searchVariants);
    }
  }

  /**
   * Fallback method when Edge Functions are unavailable
   * Returns mock results or cached data if available
   */
  private static async scanFolderForMatchesFallback(
    parentFolderId: string,
    folderKey: string,
    folderName: string,
    searchVariants: string[]
  ): Promise<CustomerFolderMatch[]> {
    console.log(`🔄 Using fallback for ${folderName} (Edge Functions unavailable)`);
    
    // Try to get cached results first
    const cachedResults = await this.getCachedSearchResults(searchVariants[0]);
    if (cachedResults && cachedResults.existingFolders.length > 0) {
      const folderTypeMatches = cachedResults.existingFolders.filter(
        folder => folder.parentFolderType === folderKey
      );
      if (folderTypeMatches.length > 0) {
        console.log(`📦 Found ${folderTypeMatches.length} cached results for ${folderName}`);
        return folderTypeMatches;
      }
    }
    
    // If no cached results, return empty array but log the attempt
    console.log(`⚠️ No cached results available for ${folderName}. Edge Functions required for live search.`);
    return [];
  }
  
  /**
   * Analyze search results and provide intelligent recommendations
   */
  private static analyzeSearchResults(
    matches: CustomerFolderMatch[],
    customerName: string
  ): CustomerSearchResult['recommendedActions'] {
    
    if (matches.length === 0) {
      return {
        action: 'create_new',
        reason: 'No existing folders found. Create a new structured project folder.'
      };
    }
    
    const highConfidenceMatches = matches.filter(m => m.confidence === 'high');
    const exactMatches = matches.filter(m => m.matchType === 'exact' && m.matchScore >= 0.9);
    
    // If we have exact matches, recommend using the most recent one
    if (exactMatches.length > 0) {
      return {
        action: 'use_existing',
        primaryFolder: exactMatches[0],
        alternativeFolders: exactMatches.slice(1, 3),
        reason: `Found exact match for "${customerName}". This folder likely belongs to the same customer.`
      };
    }
    
    // If we have high-confidence matches, suggest linking
    if (highConfidenceMatches.length === 1) {
      return {
        action: 'use_existing',
        primaryFolder: highConfidenceMatches[0],
        reason: `Found high-confidence match. This folder likely belongs to the same customer.`
      };
    }
    
    // If multiple high-confidence matches, let user decide
    if (highConfidenceMatches.length > 1) {
      return {
        action: 'link_multiple',
        primaryFolder: highConfidenceMatches[0],
        alternativeFolders: highConfidenceMatches.slice(1, 5),
        reason: `Found multiple potential matches. Review and select the correct folder or create a new one.`
      };
    }
    
    // Medium confidence matches - suggest but recommend creating new
    const mediumMatches = matches.filter(m => m.confidence === 'medium');
    if (mediumMatches.length > 0) {
      return {
        action: 'create_new',
        alternativeFolders: mediumMatches.slice(0, 3),
        reason: `Found some potential matches, but none with high confidence. Consider creating a new folder or linking to one of these alternatives.`
      };
    }
    
    // Low confidence only
    return {
      action: 'create_new',
      alternativeFolders: matches.slice(0, 3),
      reason: 'Found some possible matches with low confidence. Creating a new folder is recommended.'
    };
  }
  
  /**
   * Sanitize company name for folder creation
   */
  private static sanitizeCompanyName(companyName: string): string {
    return companyName
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid folder characters
      .replace(/\s+/g, ' ')         // Normalize spaces
      .trim()
      .substring(0, 100);           // Limit length
  }
  
  /**
   * Cache search results for performance
   */
  private static async cacheSearchResults(
    customerName: string,
    searchResult: CustomerSearchResult
  ): Promise<void> {
    try {
      // Store search results in a cache table (if it exists)
      const { error } = await supabase
        .from('customer_folder_search_cache')
        .upsert({
          customer_name: customerName.toLowerCase(),
          search_results: searchResult,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }, {
          onConflict: 'customer_name'
        });
      
      if (error && !error.message.includes('does not exist')) {
        console.error('Failed to cache search results:', error);
      }
    } catch (error) {
      // Silently fail if caching table doesn't exist
      console.log('Search result caching not available');
    }
  }

  /**
   * Get cached search results for a customer
   */
  private static async getCachedSearchResults(customerName: string): Promise<CustomerSearchResult | null> {
    try {
      const { data, error } = await supabase
        .from('customer_folder_search_cache')
        .select('search_results, expires_at')
        .eq('customer_name', customerName.toLowerCase())
        .single();
      
      if (error || !data) {
        return null;
      }
      
      // Check if cache is expired
      if (new Date(data.expires_at) < new Date()) {
        // Clean up expired cache entry
        await supabase
          .from('customer_folder_search_cache')
          .delete()
          .eq('customer_name', customerName.toLowerCase());
        return null;
      }
      
      return data.search_results as CustomerSearchResult;
      
    } catch (error) {
      // Silently fail if caching table doesn't exist
      return null;
    }
  }
  
  /**
   * Store folder structure in database
   */
  private static async storeFolderStructure(
    customerId: string,
    folderStructure: ProjectFolderStructure
  ): Promise<void> {
    try {
      // Update customer record with main folder info
      await supabase
        .from('ame_customers')
        .update({
          drive_folder_id: folderStructure.mainFolderId,
          drive_folder_url: folderStructure.mainFolderUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);
      
      // Store detailed folder structure if table exists
      await supabase
        .from('customer_drive_folder_structure')
        .upsert({
          customer_id: customerId,
          main_folder_id: folderStructure.mainFolderId,
          main_folder_url: folderStructure.mainFolderUrl,
          backups_folder_id: folderStructure.subfolders.backups.id,
          backups_folder_url: folderStructure.subfolders.backups.url,
          project_docs_folder_id: folderStructure.subfolders.projectDocs.id,
          project_docs_folder_url: folderStructure.subfolders.projectDocs.url,
          site_photos_folder_id: folderStructure.subfolders.sitePhotos.id,
          site_photos_folder_url: folderStructure.subfolders.sitePhotos.url,
          maintenance_folder_id: folderStructure.subfolders.maintenance.id,
          maintenance_folder_url: folderStructure.subfolders.maintenance.url,
          reports_folder_id: folderStructure.subfolders.reports.id,
          reports_folder_url: folderStructure.subfolders.reports.url,
          correspondence_folder_id: folderStructure.subfolders.correspondence.id,
          correspondence_folder_url: folderStructure.subfolders.correspondence.url,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'customer_id'
        });
        
    } catch (error) {
      console.error('Failed to store folder structure:', error);
      // Don't throw - folder creation succeeded, database storage is secondary
    }
  }
  
  /**
   * Get comprehensive folder information for a customer
   */
  static async getCustomerFolderInfo(customerId: string): Promise<{
    mainFolder?: { id: string; url: string };
    folderStructure?: ProjectFolderStructure;
    searchHistory?: CustomerFolderMatch[];
  }> {
    try {
      // Get basic folder info from customer record
      const { data: customerData } = await supabase
        .from('ame_customers')
        .select('drive_folder_id, drive_folder_url')
        .eq('id', customerId)
        .single();
      
      const result: any = {};
      
      if (customerData?.drive_folder_id) {
        result.mainFolder = {
          id: customerData.drive_folder_id,
          url: customerData.drive_folder_url
        };
        
        // Try to get detailed folder structure
        const { data: structureData } = await supabase
          .from('customer_drive_folder_structure')
          .select('*')
          .eq('customer_id', customerId)
          .single();
        
        if (structureData) {
          result.folderStructure = {
            mainFolderId: structureData.main_folder_id,
            mainFolderUrl: structureData.main_folder_url,
            subfolders: {
              backups: {
                id: structureData.backups_folder_id,
                url: structureData.backups_folder_url
              },
              projectDocs: {
                id: structureData.project_docs_folder_id,
                url: structureData.project_docs_folder_url
              },
              sitePhotos: {
                id: structureData.site_photos_folder_id,
                url: structureData.site_photos_folder_url
              },
              maintenance: {
                id: structureData.maintenance_folder_id,
                url: structureData.maintenance_folder_url
              },
              reports: {
                id: structureData.reports_folder_id,
                url: structureData.reports_folder_url
              },
              correspondence: {
                id: structureData.correspondence_folder_id,
                url: structureData.correspondence_folder_url
              }
            }
          };
        }
      }
      
      // Get search history
      const { data: historyData } = await supabase
        .from('customer_drive_folders')
        .select('*')
        .eq('customer_id', customerId)
        .order('match_score', { ascending: false });
      
      if (historyData && historyData.length > 0) {
        result.searchHistory = historyData.map(item => ({
          folderId: item.folder_id,
          folderName: item.folder_name,
          folderPath: '',
          webViewLink: item.folder_url,
          matchScore: item.match_score,
          matchType: item.match_type,
          confidence: item.confidence_level,
          parentFolder: '',
          parentFolderType: '',
          lastModified: item.last_indexed
        }));
      }
      
      return result;
      
    } catch (error) {
      console.error('Failed to get customer folder info:', error);
      return {};
    }
  }
}
