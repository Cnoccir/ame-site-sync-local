import { supabase } from '@/integrations/supabase/client';

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
  createdTime?: string;
  modifiedTime?: string;
  parentId?: string;
  description?: string;
}

interface CreateProjectFolderInput {
  company_name: string;
  customer_id?: string;
  site_address?: string;
  service_tier?: string;
}

/**
 * Real Google Drive service that calls our Supabase Edge Function (google-drive-scanner)
 * No mocks.
 */
export class GoogleDriveFolderService {
  // Known AME root folders per user spec
  static ROOTS = {
    SITE_BACKUPS: '0AA0zN0U9WLD6Uk9PVA',
    ENGINEERING_MASTER: '0AHYT5lRT-50cUk9PVA',
    ENGINEERING_2021: '1maB0Nq9V4l05p63DXU9YEIUQlGvjVI0g',
    ENGINEERING_2022: '10uM5VcqEfBqDuHOi9of3Nj0gfGfxo2QU',
    ENGINEERING_2023: '1UjzlUQaleGSedk39ZYxQCTAUhu9TLBrM',
    ENGINEERING_2024: '1kh6bp8m80Lt-GyqBFY2fPMFmFZfhGyMy',
    ENGINEERING_2025: '17t5MFAl1Hr0iZgWfYbu2TJ-WckFZt41K',
    SERVICE_MAINTENANCE: '0AEG566vw75FqUk9PVA',
    NEW_JOB_PARENT: '1kHsxb9AAeeMtG3G_LjIAoR4UCPky6efU'
  } as const;

  static async testConnection(): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke('google-drive-scanner', {
      body: { action: 'test_connection' }
    });
    if (error) return false;
    return Boolean((data as any)?.success);
  }

  // Server-side search across known roots
  static async searchFolders(query: string): Promise<DriveFolder[]> {
    const { data, error } = await supabase.functions.invoke('google-drive-scanner', {
      body: { action: 'list_project_folders', query }
    });
    if (error) {
      console.error('Drive search failed', error);
      throw error;
    }

    const folders = ((data as any)?.folders || []) as DriveFolder[];
    return folders;
  }

  static async createProjectFolder(input: CreateProjectFolderInput): Promise<{ folderId: string; folderUrl: string }> {
    const folderName = `${input.company_name} Project Folder`;
    const { data, error } = await supabase.functions.invoke('google-drive-scanner', {
      body: { action: 'create_project_folder', name: folderName }
    });

    if (error) {
      console.error('Create project folder failed', error);
      throw error;
    }

    return { folderId: (data as any).folderId, folderUrl: (data as any).folderUrl };
  }
}
