import { GOOGLE_DRIVE_CONFIG } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Enhanced Google Drive API types
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  parents: string[];
  size?: string;
  thumbnailLink?: string;
  description?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
  createdTime: string;
  modifiedTime: string;
}

interface SearchOptions {
  customerId?: string;
  yearFilter?: number;
  fileTypes?: string[];
  searchQuery?: string;
  maxResults?: number;
  orderBy?: 'name' | 'createdTime' | 'modifiedTime' | 'relevance';
}

interface IndexingProgress {
  folderId: string;
  folderName: string;
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  status: 'indexing' | 'completed' | 'error';
  startTime: Date;
  estimatedCompletion?: Date;
}

interface DriveConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  tokenExpiry?: Date;
}

/**
 * Enhanced Google Drive service for advanced document management and search
 */
export class GoogleDriveService {
  private static readonly BASE_URL = 'https://drive.google.com';
  private static config: DriveConfig = {};
  private static indexingProgress: Map<string, IndexingProgress> = new Map();
  
  /**
   * Get the CSV export URL for a public Google Drive file
   * Uses the direct download format that works with public files
   */
  static getCsvExportUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  
  /**
   * Get the view URL for a Google Drive file
   */
  static getViewUrl(fileId: string): string {
    return `${this.BASE_URL}/file/d/${fileId}/view`;
  }
  
  /**
   * Get the folder URL for a Google Drive folder
   */
  static getFolderUrl(folderId: string): string {
    return `${this.BASE_URL}/drive/folders/${folderId}`;
  }
  
  /**
   * Get URLs for all configured files
   */
  static getFileUrls() {
    return {
      masterFolder: this.getFolderUrl(GOOGLE_DRIVE_CONFIG.masterFolder),
      serviceToolDataFolder: this.getFolderUrl(GOOGLE_DRIVE_CONFIG.serviceToolDataFolder),
      customers: {
        download: this.getCsvExportUrl(GOOGLE_DRIVE_CONFIG.files.customers),
        view: this.getViewUrl(GOOGLE_DRIVE_CONFIG.files.customers)
      },
      sopLibrary: {
        download: this.getCsvExportUrl(GOOGLE_DRIVE_CONFIG.files.sopLibrary),
        view: this.getViewUrl(GOOGLE_DRIVE_CONFIG.files.sopLibrary)
      },
      taskLibrary: {
        download: this.getCsvExportUrl(GOOGLE_DRIVE_CONFIG.files.taskLibrary),
        view: this.getViewUrl(GOOGLE_DRIVE_CONFIG.files.taskLibrary)
      },
      toolLibrary: {
        download: this.getCsvExportUrl(GOOGLE_DRIVE_CONFIG.files.toolLibrary),
        view: this.getViewUrl(GOOGLE_DRIVE_CONFIG.files.toolLibrary)
      }
    };
  }
  
  /**
   * Download and parse CSV data from Google Drive via Supabase Edge Function
   */
  static async downloadCsvData(fileId: string): Promise<string> {
    try {
      // Use Supabase Edge Function to proxy the request and avoid CORS issues
      const proxyUrl = `https://ncqwrabuujjgquakxrkw.supabase.co/functions/v1/google-drive-csv-proxy?fileId=${fileId}`;
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Proxy response error:', errorData);
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      
      const csvData = await response.text();
      
      return csvData;
      
    } catch (error) {
      console.error('Error downloading CSV from Google Drive:', error);
      throw error;
    }
  }
  
  /**
   * Get customers data from Google Drive
   */
  static async getCustomersData(): Promise<string> {
    return this.downloadCsvData(GOOGLE_DRIVE_CONFIG.files.customers);
  }
  
  /**
   * Get SOP library data from Google Drive
   */
  static async getSopLibraryData(): Promise<string> {
    return this.downloadCsvData(GOOGLE_DRIVE_CONFIG.files.sopLibrary);
  }
  
  /**
   * Get task library data from Google Drive
   */
  static async getTaskLibraryData(): Promise<string> {
    return this.downloadCsvData(GOOGLE_DRIVE_CONFIG.files.taskLibrary);
  }
  
  /**
   * Get tool library data from Google Drive
   */
  static async getToolLibraryData(): Promise<string> {
    return this.downloadCsvData(GOOGLE_DRIVE_CONFIG.files.toolLibrary);
  }

  // ============ ENHANCED DRIVE API FUNCTIONALITY ============

  /**
   * Initialize Google Drive API configuration
   */
  static async initializeConfig(): Promise<void> {
    try {
      // Get configuration from Supabase secrets/settings
      const { data: settings, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['google_drive_api_key', 'google_drive_client_id', 'google_drive_client_secret', 'google_drive_refresh_token']);

      if (error) {
        console.error('Error loading Google Drive config:', error);
        return;
      }

      settings?.forEach(setting => {
        switch (setting.setting_key) {
          case 'google_drive_api_key':
            this.config.apiKey = setting.setting_value;
            break;
          case 'google_drive_client_id':
            this.config.clientId = setting.setting_value;
            break;
          case 'google_drive_client_secret':
            this.config.clientSecret = setting.setting_value;
            break;
          case 'google_drive_refresh_token':
            this.config.refreshToken = setting.setting_value;
            break;
        }
      });

      // Refresh access token if needed
      await this.refreshAccessTokenIfNeeded();
    } catch (error) {
      console.error('Error initializing Google Drive config:', error);
    }
  }

  /**
   * Test connectivity to Google Drive API
   */
  static async testConnectivity(): Promise<{success: boolean, message: string, details?: any}> {
    try {
      if (!this.config.apiKey) {
        return { success: false, message: 'Google Drive API key not configured' };
      }

      // Test basic API access with about endpoint
      const response = await fetch(`https://www.googleapis.com/drive/v3/about?fields=user&key=${this.config.apiKey}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { 
          success: false, 
          message: `API request failed: ${response.status}`,
          details: errorData 
        };
      }

      const data = await response.json();
      return { 
        success: true, 
        message: 'Google Drive connectivity successful',
        details: { user: data.user?.displayName || 'Unknown' }
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Get folder details by ID
   */
  static async getFolderDetails(folderId: string): Promise<DriveFolder | null> {
    try {
      await this.refreshAccessTokenIfNeeded();

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,webViewLink,createdTime,modifiedTime&key=${this.config.apiKey}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      );

      if (!response.ok) {
        console.error(`Failed to get folder details for ${folderId}:`, response.status);
        return null;
      }

      const folder = await response.json();
      return folder as DriveFolder;
    } catch (error) {
      console.error('Error getting folder details:', error);
      return null;
    }
  }

  /**
   * Search documents in customer-specific folders with year filtering (last 4 years max)
   */
  static async searchDocuments(options: SearchOptions = {}): Promise<{
    files: DriveFile[];
    hasMore: boolean;
    indexingStatus?: IndexingProgress[];
  }> {
    try {
      await this.refreshAccessTokenIfNeeded();

      // Get customer folder IDs if customer is specified
      let folderIds: string[] = [];
      if (options.customerId) {
        const customerFolders = await this.getCustomerFolderIds(options.customerId);
        folderIds = customerFolders;
      } else {
        // Get all configured folder IDs
        folderIds = await this.getAllConfiguredFolderIds();
      }

      if (folderIds.length === 0) {
        return { files: [], hasMore: false };
      }

      // Build search query
      const searchQuery = this.buildSearchQuery(folderIds, options);
      
      // Execute search with batching
      const files = await this.executeSearch(searchQuery, options.maxResults || 50);

      // Filter by year if specified (default: last 4 years)
      const yearFilter = options.yearFilter || new Date().getFullYear() - 3;
      const filteredFiles = this.filterFilesByYear(files, yearFilter);

      return {
        files: filteredFiles,
        hasMore: files.length >= (options.maxResults || 50),
        indexingStatus: Array.from(this.indexingProgress.values())
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      return { files: [], hasMore: false };
    }
  }

  /**
   * Index folder contents for faster searching
   */
  static async indexFolder(folderId: string, folderName: string): Promise<void> {
    try {
      // Initialize indexing progress
      const progress: IndexingProgress = {
        folderId,
        folderName,
        totalFiles: 0,
        processedFiles: 0,
        status: 'indexing',
        startTime: new Date()
      };
      this.indexingProgress.set(folderId, progress);

      await this.refreshAccessTokenIfNeeded();

      // First, get total file count
      const totalFiles = await this.getFolderFileCount(folderId);
      progress.totalFiles = totalFiles;
      progress.estimatedCompletion = new Date(Date.now() + (totalFiles * 100)); // ~100ms per file estimate

      // Process files in batches to prevent overwhelming the API
      const batchSize = 100;
      let pageToken = '';
      let processedCount = 0;

      do {
        const batch = await this.getFilesBatch(folderId, batchSize, pageToken);
        
        for (const file of batch.files) {
          // Index individual file
          await this.indexFile(file);
          processedCount++;
          
          progress.processedFiles = processedCount;
          progress.currentFile = file.name;
          this.indexingProgress.set(folderId, { ...progress });

          // Small delay to prevent API rate limiting
          await new Promise(resolve => setTimeout(resolve, 10));
        }

        pageToken = batch.nextPageToken || '';
      } while (pageToken);

      // Mark as completed
      progress.status = 'completed';
      progress.currentFile = undefined;
      this.indexingProgress.set(folderId, progress);

      console.log(`Successfully indexed ${processedCount} files from folder: ${folderName}`);
    } catch (error) {
      console.error(`Error indexing folder ${folderId}:`, error);
      
      const progress = this.indexingProgress.get(folderId);
      if (progress) {
        progress.status = 'error';
        this.indexingProgress.set(folderId, progress);
      }
    }
  }

  /**
   * Get indexing progress for a folder
   */
  static getIndexingProgress(folderId: string): IndexingProgress | null {
    return this.indexingProgress.get(folderId) || null;
  }

  /**
   * Get all active indexing operations
   */
  static getAllIndexingProgress(): IndexingProgress[] {
    return Array.from(this.indexingProgress.values());
  }

  /**
   * Associate folder with customer
   */
  static async associateFolderWithCustomer(customerId: string, folderId: string, folderName: string): Promise<void> {
    try {
      // Verify folder exists and is accessible
      const folderDetails = await this.getFolderDetails(folderId);
      if (!folderDetails) {
        throw new Error('Folder not accessible or does not exist');
      }

      // Update customer record with folder information
      const { error } = await supabase
        .from('customers')
        .update({
          drive_folder_id: folderId,
          drive_folder_url: folderDetails.webViewLink,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);

      if (error) {
        throw error;
      }

      // Store folder mapping for quick lookup
      await supabase
        .from('customer_drive_folders')
        .upsert({
          customer_id: customerId,
          folder_id: folderId,
          folder_name: folderName,
          folder_url: folderDetails.webViewLink,
          last_indexed: null,
          is_active: true
        }, { onConflict: 'customer_id,folder_id' });

    } catch (error) {
      console.error('Error associating folder with customer:', error);
      throw error;
    }
  }

  // ============ PRIVATE HELPER METHODS ============

  private static async refreshAccessTokenIfNeeded(): Promise<void> {
    if (!this.config.accessToken || !this.config.tokenExpiry || new Date() >= this.config.tokenExpiry) {
      await this.refreshAccessToken();
    }
  }

  private static async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken || !this.config.clientId || !this.config.clientSecret) {
      throw new Error('Missing OAuth configuration for token refresh');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      this.config.accessToken = data.access_token;
      this.config.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  private static async getCustomerFolderIds(customerId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('customer_drive_folders')
      .select('folder_id')
      .eq('customer_id', customerId)
      .eq('is_active', true);

    if (error || !data) {
      return [];
    }

    return data.map(row => row.folder_id);
  }

  private static async getAllConfiguredFolderIds(): Promise<string[]> {
    const { data, error } = await supabase
      .from('customer_drive_folders')
      .select('folder_id')
      .eq('is_active', true);

    if (error || !data) {
      return [];
    }

    return [...new Set(data.map(row => row.folder_id))]; // Remove duplicates
  }

  private static buildSearchQuery(folderIds: string[], options: SearchOptions): string {
    const conditions: string[] = [];

    // Folder restriction
    if (folderIds.length > 0) {
      const folderConditions = folderIds.map(id => `'${id}' in parents`);
      conditions.push(`(${folderConditions.join(' or ')})`);
    }

    // File type restriction
    if (options.fileTypes && options.fileTypes.length > 0) {
      const typeConditions = options.fileTypes.map(type => `mimeType='${type}'`);
      conditions.push(`(${typeConditions.join(' or ')})`);
    }

    // Text search
    if (options.searchQuery) {
      conditions.push(`fullText contains '${options.searchQuery.replace(/'/g, "\\\'")}'}`);
    }

    // Not trashed
    conditions.push('trashed=false');

    return conditions.join(' and ');
  }

  private static async executeSearch(query: string, maxResults: number): Promise<DriveFile[]> {
    const orderBy = 'modifiedTime desc';
    const fields = 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,parents,size,thumbnailLink,description)';
    
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=${orderBy}&fields=${fields}&pageSize=${Math.min(maxResults, 1000)}&key=${this.config.apiKey}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.files || [];
  }

  private static filterFilesByYear(files: DriveFile[], yearThreshold: number): DriveFile[] {
    return files.filter(file => {
      const fileYear = new Date(file.modifiedTime).getFullYear();
      return fileYear >= yearThreshold;
    });
  }

  private static async getFolderFileCount(folderId: string): Promise<number> {
    const query = `'${folderId}' in parents and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1000&key=${this.config.apiKey}`;

    let totalCount = 0;
    let pageToken = '';

    do {
      const pageUrl = pageToken ? `${url}&pageToken=${pageToken}` : url;
      const response = await fetch(pageUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Count request failed: ${response.status}`);
      }

      const data = await response.json();
      totalCount += (data.files || []).length;
      pageToken = data.nextPageToken || '';
    } while (pageToken);

    return totalCount;
  }

  private static async getFilesBatch(folderId: string, batchSize: number, pageToken: string): Promise<{files: DriveFile[], nextPageToken?: string}> {
    const query = `'${folderId}' in parents and trashed=false`;
    const fields = 'files(id,name,mimeType,createdTime,modifiedTime,webViewLink,parents,size,thumbnailLink,description),nextPageToken';
    
    let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${fields}&pageSize=${batchSize}&key=${this.config.apiKey}`;
    
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Batch request failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken
    };
  }

  private static async indexFile(file: DriveFile): Promise<void> {
    try {
      // Store file metadata in search index
      await supabase
        .from('drive_file_index')
        .upsert({
          file_id: file.id,
          name: file.name,
          mime_type: file.mimeType,
          created_time: file.createdTime,
          modified_time: file.modifiedTime,
          web_view_link: file.webViewLink,
          parent_folders: file.parents,
          file_size: file.size ? parseInt(file.size) : null,
          thumbnail_link: file.thumbnailLink,
          description: file.description,
          indexed_at: new Date().toISOString()
        }, { onConflict: 'file_id' });
    } catch (error) {
      console.error(`Error indexing file ${file.id}:`, error);
    }
  }
}

// Export types for use in components
export type { 
  DriveFile, 
  DriveFolder, 
  SearchOptions, 
  IndexingProgress, 
  DriveConfig 
};
