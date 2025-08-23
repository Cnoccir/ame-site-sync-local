import { GOOGLE_DRIVE_CONFIG } from '@/types';

/**
 * Google Drive service for accessing AME maintenance system files
 */
export class GoogleDriveService {
  private static readonly BASE_URL = 'https://drive.google.com';
  
  /**
   * Get the direct download URL for a Google Drive file
   */
  static getDownloadUrl(fileId: string): string {
    return `${this.BASE_URL}/uc?export=download&id=${fileId}`;
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
        download: this.getDownloadUrl(GOOGLE_DRIVE_CONFIG.files.customers),
        view: this.getViewUrl(GOOGLE_DRIVE_CONFIG.files.customers)
      },
      sopLibrary: {
        download: this.getDownloadUrl(GOOGLE_DRIVE_CONFIG.files.sopLibrary),
        view: this.getViewUrl(GOOGLE_DRIVE_CONFIG.files.sopLibrary)
      },
      taskLibrary: {
        download: this.getDownloadUrl(GOOGLE_DRIVE_CONFIG.files.taskLibrary),
        view: this.getViewUrl(GOOGLE_DRIVE_CONFIG.files.taskLibrary)
      },
      toolLibrary: {
        download: this.getDownloadUrl(GOOGLE_DRIVE_CONFIG.files.toolLibrary),
        view: this.getViewUrl(GOOGLE_DRIVE_CONFIG.files.toolLibrary)
      }
    };
  }
  
  /**
   * Download and parse CSV data from Google Drive
   */
  static async downloadCsvData(fileId: string): Promise<string> {
    try {
      const response = await fetch(this.getDownloadUrl(fileId));
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      return await response.text();
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
}