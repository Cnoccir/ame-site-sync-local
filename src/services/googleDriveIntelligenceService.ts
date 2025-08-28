import { supabase } from '@/integrations/supabase/client';

/**
 * Enhanced Google Drive Intelligence Service for AME
 * Scans the company's shared drive folders to automatically match customers
 */

// Your specific folder structure
const AME_DRIVE_FOLDERS = {
  SITE_BACKUPS: '0AA0zN0U9WLD6Uk9PVA',
  ENGINEERING_MASTER: '0AHYT5lRT-50cUk9PVA', 
  ENGINEERING_2021: '1maB0Nq9V4l05p63DXU9YEIUQlGvjVI0g',
  ENGINEERING_2022: '10uM5VcqEfBqDuHOi9of3Nj0gfGfxo2QU',
  ENGINEERING_2023: '1UjzlUQaleGSedk39ZYxQCTAUhu9TLBrM',
  ENGINEERING_2024: '1kh6bp8m80Lt-GyqBFY2fPMFmFZfhGyMy',
  ENGINEERING_2025: '17t5MFAl1Hr0iZgWfYbu2TJ-WckFZt41K',
  SERVICE_MAINTENANCE: '0AEG566vw75FqUk9PVA'
};

interface CustomerFolderMatch {
  folderId: string;
  folderName: string;
  folderPath: string;
  webViewLink: string;
  matchScore: number;
  matchType: 'exact' | 'fuzzy' | 'contains' | 'alias';
  confidence: 'high' | 'medium' | 'low';
  parentFolder: string;
  yearFolder?: string;
  fileCount?: number;
  lastModified?: string;
}

interface DiscoveryResult {
  customerId: string;
  customerName: string;
  matches: CustomerFolderMatch[];
  totalFoldersScanned: number;
  searchDuration: number;
}

export class GoogleDriveIntelligenceService {
  
  /**
   * Check if Google Drive OAuth is connected and working
   */
  static async checkOAuthConnection(): Promise<{
    connected: boolean;
    message: string;
    user?: { email: string; name: string };
  }> {
    try {
      // First try the new edge function if deployed
      try {
        const { data, error } = await supabase.functions.invoke('google-drive-folder-search', {
          body: {
            action: 'check_oauth_status'
          }
        });
        
        if (!error && data) {
          return data;
        }
      } catch (functionError) {
        console.log('New function not deployed yet, falling back to direct database check');
      }
      
      // Fallback: Check OAuth status directly in database
      const { data: oauthData, error } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error || !oauthData) {
        return {
          connected: false,
          message: 'Google OAuth not configured'
        };
      }

      // Check if token is still valid (not expired)
      const now = new Date();
      const expiresAt = new Date(oauthData.expires_at);
      
      if (expiresAt <= now) {
        return {
          connected: false,
          message: 'OAuth token expired, refresh required'
        };
      }

      return {
        connected: true,
        message: 'Google Drive access confirmed',
        user: {
          email: oauthData.user_email,
          name: oauthData.user_name
        }
      };
      
    } catch (error) {
      console.error('OAuth status check failed:', error);
      return {
        connected: false,
        message: 'OAuth check failed'
      };
    }
  }
  
  /**
   * Discover project folders for a customer by scanning your company drives
   */
  static async discoverCustomerFolders(
    customerId: string, 
    customerName: string, 
    customerAddress?: string
  ): Promise<DiscoveryResult> {
    const startTime = Date.now();
    
    console.log(`🔍 Starting folder discovery for: ${customerName}`);
    
    try {
      // Generate search variants for the customer
      const searchVariants = this.generateSearchVariants(customerName, customerAddress);
      
      // Scan all AME Drive folders for matches
      const allMatches: CustomerFolderMatch[] = [];
      let totalFoldersScanned = 0;
      
      // Scan each major folder area
      for (const [folderType, folderId] of Object.entries(AME_DRIVE_FOLDERS)) {
        console.log(`📂 Scanning ${folderType} folder...`);
        
        const folderMatches = await this.scanFolderForCustomer(
          folderId,
          folderType,
          searchVariants
        );
        
        allMatches.push(...folderMatches);
        totalFoldersScanned += folderMatches.length;
      }
      
      // Sort matches by confidence and score
      const sortedMatches = allMatches.sort((a, b) => {
        if (a.confidence !== b.confidence) {
          const confidenceOrder = { high: 3, medium: 2, low: 1 };
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        }
        return b.matchScore - a.matchScore;
      });
      
      // Store results in database for caching
      await this.cacheDiscoveryResults(customerId, sortedMatches);
      
      return {
        customerId,
        customerName,
        matches: sortedMatches,
        totalFoldersScanned,
        searchDuration: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('❌ Folder discovery failed:', error);
      throw error;
    }
  }
  
  /**
   * Generate search variants for a customer name
   */
  private static generateSearchVariants(customerName: string, customerAddress?: string): string[] {
    const variants: string[] = [];
    
    // Clean the customer name
    const cleanName = customerName.replace(/[^\w\s-]/g, '').trim();
    
    // Add original name
    variants.push(cleanName);
    
    // Add name without common business suffixes
    const withoutSuffixes = cleanName
      .replace(/\s+(Inc|LLC|Corp|Corporation|Company|Co|Ltd|Limited)\.?$/i, '')
      .trim();
    if (withoutSuffixes !== cleanName) {
      variants.push(withoutSuffixes);
    }
    
    // Add acronym if multiple words
    const words = cleanName.split(/\s+/);
    if (words.length > 1) {
      const acronym = words.map(w => w.charAt(0).toUpperCase()).join('');
      if (acronym.length >= 2) {
        variants.push(acronym);
      }
    }
    
    // Add partial matches for long names
    if (words.length > 2) {
      // First two words
      variants.push(words.slice(0, 2).join(' '));
      // Last two words  
      variants.push(words.slice(-2).join(' '));
    }
    
    // Add address-based variants if available
    if (customerAddress) {
      const addressParts = customerAddress.split(',');
      if (addressParts.length > 0) {
        const streetAddress = addressParts[0].trim();
        variants.push(`${withoutSuffixes} ${streetAddress}`);
        
        // Extract building numbers or names
        const buildingMatch = streetAddress.match(/\b(\d+|\w+\s+(Building|Bldg|Tower|Plaza))\b/i);
        if (buildingMatch) {
          variants.push(`${withoutSuffixes} ${buildingMatch[1]}`);
        }
      }
    }
    
    // Remove duplicates and empty strings
    return [...new Set(variants.filter(v => v.length > 0))];
  }
  
  /**
   * Scan a specific folder for customer matches
   */
  private static async scanFolderForCustomer(
    parentFolderId: string,
    folderType: string,
    searchVariants: string[]
  ): Promise<CustomerFolderMatch[]> {
    
    try {
      // Call the OAuth-compatible Google Drive folder search function
      const { data, error } = await supabase.functions.invoke('google-drive-folder-search', {
        body: {
          action: 'scan_folder_for_customer',
          parentFolderId,
          folderType,
          searchVariants
        }
      });
      
      if (error) {
        console.error(`Error scanning ${folderType}:`, error);
        return [];
      }
      
      return data.matches || [];
      
    } catch (error) {
      console.error(`Failed to scan ${folderType}:`, error);
      return [];
    }
  }
  
  /**
   * Calculate match score between search term and folder name
   */
  static calculateMatchScore(searchTerm: string, folderName: string): number {
    const search = searchTerm.toLowerCase();
    const folder = folderName.toLowerCase();
    
    // Exact match
    if (folder === search) return 1.0;
    
    // Contains exact term
    if (folder.includes(search)) return 0.9;
    
    // Word boundary match
    const searchWords = search.split(/\s+/);
    const folderWords = folder.split(/\s+/);
    
    let matchingWords = 0;
    for (const searchWord of searchWords) {
      if (folderWords.some(fw => fw.includes(searchWord))) {
        matchingWords++;
      }
    }
    
    const wordMatchRatio = matchingWords / searchWords.length;
    if (wordMatchRatio >= 0.8) return 0.8;
    if (wordMatchRatio >= 0.6) return 0.6;
    if (wordMatchRatio >= 0.4) return 0.4;
    
    // Character similarity (simple Levenshtein-like)
    return this.calculateSimilarity(search, folder);
  }
  
  /**
   * Simple character similarity calculation
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++;
      }
    }
    
    return matches / longer.length;
  }
  
  /**
   * Cache discovery results for future quick access
   */
  private static async cacheDiscoveryResults(
    customerId: string, 
    matches: CustomerFolderMatch[]
  ): Promise<void> {
    try {
      // Store in customer_drive_folders table
      for (const match of matches.slice(0, 5)) { // Store top 5 matches
        const { error } = await supabase
          .from('customer_drive_folders')
          .upsert({
            customer_id: customerId,
            folder_id: match.folderId,
            folder_name: match.folderName,
            folder_url: match.webViewLink,
            match_score: match.matchScore,
            match_type: match.matchType,
            confidence_level: match.confidence,
            is_active: true,
            last_indexed: new Date().toISOString()
          }, {
            onConflict: 'customer_id,folder_id'
          });
          
        if (error) {
          console.error('Error caching discovery result:', error);
        }
      }
      
    } catch (error) {
      console.error('Failed to cache discovery results:', error);
    }
  }
  
  /**
   * Get cached folder matches for a customer
   */
  static async getCachedCustomerFolders(customerId: string): Promise<CustomerFolderMatch[]> {
    try {
      const { data, error } = await supabase
        .from('customer_drive_folders')
        .select('*')
        .eq('customer_id', customerId)
        .eq('is_active', true)
        .order('match_score', { ascending: false });
        
      if (error) {
        console.error('Error loading cached folders:', error);
        return [];
      }
      
      return (data || []).map(item => ({
        folderId: item.folder_id,
        folderName: item.folder_name,
        folderPath: '', // Would need to be stored separately
        webViewLink: item.folder_url,
        matchScore: item.match_score,
        matchType: item.match_type as any,
        confidence: item.confidence_level as any,
        parentFolder: '',
        lastModified: item.last_indexed
      }));
      
    } catch (error) {
      console.error('Failed to load cached folders:', error);
      return [];
    }
  }
  
  /**
   * Trigger a full refresh of customer folder associations
   */
  static async refreshAllCustomerFolders(): Promise<{
    processed: number;
    successful: number;
    errors: string[];
  }> {
    console.log('🔄 Starting full customer folder refresh...');
    
    try {
      // Get all active customers
      const { data: customers, error } = await supabase
        .from('ame_customers')
        .select('id, company_name, site_address')
        .eq('contract_status', 'Active');
        
      if (error) throw error;
      
      const results = {
        processed: 0,
        successful: 0,
        errors: [] as string[]
      };
      
      // Process each customer
      for (const customer of customers || []) {
        try {
          results.processed++;
          
          await this.discoverCustomerFolders(
            customer.id,
            customer.company_name,
            customer.site_address
          );
          
          results.successful++;
          console.log(`✅ Processed: ${customer.company_name}`);
          
        } catch (error) {
          const errorMsg = `Failed to process ${customer.company_name}: ${error}`;
          results.errors.push(errorMsg);
          console.error(errorMsg);
        }
        
        // Add small delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`🎉 Refresh complete: ${results.successful}/${results.processed} successful`);
      return results;
      
    } catch (error) {
      console.error('❌ Full refresh failed:', error);
      throw error;
    }
  }
  
  /**
   * Search for folders by customer info when setting up a new customer
   */
  static async searchFoldersForNewCustomer(
    companyName: string,
    siteAddress?: string
  ): Promise<CustomerFolderMatch[]> {
    console.log(`🔍 Searching folders for new customer: ${companyName}`);
    
    const searchVariants = this.generateSearchVariants(companyName, siteAddress);
    const allMatches: CustomerFolderMatch[] = [];
    
    // Search across all major folder areas
    for (const [folderType, folderId] of Object.entries(AME_DRIVE_FOLDERS)) {
      const matches = await this.scanFolderForCustomer(folderId, folderType, searchVariants);
      allMatches.push(...matches);
    }
    
    // Return top matches sorted by score
    return allMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }
}
