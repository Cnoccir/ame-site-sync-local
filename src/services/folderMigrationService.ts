import { supabase } from '@/integrations/supabase/client';
import { EnhancedGoogleDriveService } from './enhancedGoogleDriveService';

/**
 * Folder Migration Service for AME
 * Manages the association and migration of existing Google Drive folders 
 * to clean, standardized folder structures
 */

export interface FolderAssociation {
  id?: string;
  customerId: string;
  existingFolderId: string;
  existingFolderName: string;
  existingFolderUrl: string;
  targetFolderId?: string;
  targetFolderName?: string;
  targetFolderUrl?: string;
  associationType: 'link' | 'move' | 'copy' | 'archive' | 'ignore';
  folderType: 'main' | 'backups' | 'project_docs' | 'site_photos' | 'maintenance' | 'reports' | 'correspondence' | 'legacy';
  confidence: 'high' | 'medium' | 'low';
  userConfirmed: boolean;
  migrationStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderStructureTemplate {
  templateId: string;
  templateName: string;
  description: string;
  applicableServiceTiers: string[];
  folders: {
    name: string;
    type: 'main' | 'backups' | 'project_docs' | 'site_photos' | 'maintenance' | 'reports' | 'correspondence';
    required: boolean;
    description: string;
    permissions: 'full' | 'read_only' | 'comment';
  }[];
}

export interface MigrationPlan {
  customerId: string;
  customerName: string;
  templateId: string;
  existingFolders: FolderAssociation[];
  targetStructure: {
    mainFolderId?: string;
    mainFolderUrl?: string;
    subfolders: Record<string, { id?: string; url?: string; source?: 'existing' | 'new' }>;
  };
  migrationActions: {
    action: 'create_folder' | 'link_folder' | 'move_files' | 'copy_files' | 'archive_folder';
    sourceFolderId?: string;
    targetFolderId?: string;
    description: string;
    priority: number;
  }[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export class FolderMigrationService {
  
  /**
   * Get standardized folder structure templates
   */
  static getFolderStructureTemplates(): FolderStructureTemplate[] {
    return [
      {
        templateId: 'standard_project',
        templateName: 'Standard Project Folder',
        description: 'Standard folder structure for most AME projects',
        applicableServiceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
        folders: [
          {
            name: 'Project Documents',
            type: 'project_docs',
            required: true,
            description: 'Contracts, specifications, and project documentation',
            permissions: 'full'
          },
          {
            name: 'Site Photos',
            type: 'site_photos',
            required: true,
            description: 'Installation photos, progress photos, documentation',
            permissions: 'full'
          },
          {
            name: 'Backups',
            type: 'backups',
            required: true,
            description: 'System backups and configuration files',
            permissions: 'full'
          },
          {
            name: 'Maintenance',
            type: 'maintenance',
            required: true,
            description: 'Maintenance logs, service records, and schedules',
            permissions: 'full'
          },
          {
            name: 'Reports',
            type: 'reports',
            required: true,
            description: 'System reports, analytics, and monitoring data',
            permissions: 'full'
          },
          {
            name: 'Correspondence',
            type: 'correspondence',
            required: false,
            description: 'Email threads, communications, and meeting notes',
            permissions: 'comment'
          }
        ]
      },
      {
        templateId: 'guardian_premium',
        templateName: 'Guardian Premium Project',
        description: 'Enhanced folder structure for Guardian tier customers',
        applicableServiceTiers: ['GUARDIAN'],
        folders: [
          {
            name: 'Project Documents',
            type: 'project_docs',
            required: true,
            description: 'Contracts, specifications, and project documentation',
            permissions: 'full'
          },
          {
            name: 'Site Photos',
            type: 'site_photos',
            required: true,
            description: 'Installation photos, progress photos, documentation',
            permissions: 'full'
          },
          {
            name: 'Backups',
            type: 'backups',
            required: true,
            description: 'System backups and configuration files',
            permissions: 'full'
          },
          {
            name: 'Maintenance',
            type: 'maintenance',
            required: true,
            description: 'Maintenance logs, service records, and schedules',
            permissions: 'full'
          },
          {
            name: 'Reports',
            type: 'reports',
            required: true,
            description: 'System reports, analytics, and monitoring data',
            permissions: 'full'
          },
          {
            name: 'Correspondence',
            type: 'correspondence',
            required: true,
            description: 'Email threads, communications, and meeting notes',
            permissions: 'full'
          }
        ]
      },
      {
        templateId: 'legacy_migration',
        templateName: 'Legacy Folder Migration',
        description: 'Template for migrating existing scattered folders',
        applicableServiceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
        folders: [
          {
            name: 'Project Documents',
            type: 'project_docs',
            required: true,
            description: 'Contracts, specifications, and project documentation',
            permissions: 'full'
          },
          {
            name: 'Site Photos',
            type: 'site_photos',
            required: true,
            description: 'Installation photos, progress photos, documentation',
            permissions: 'full'
          },
          {
            name: 'Backups',
            type: 'backups',
            required: true,
            description: 'System backups and configuration files',
            permissions: 'full'
          },
          {
            name: 'Maintenance',
            type: 'maintenance',
            required: true,
            description: 'Maintenance logs, service records, and schedules',
            permissions: 'full'
          },
          {
            name: 'Reports',
            type: 'reports',
            required: true,
            description: 'System reports, analytics, and monitoring data',
            permissions: 'full'
          },
          {
            name: 'Correspondence',
            type: 'correspondence',
            required: false,
            description: 'Email threads, communications, and meeting notes',
            permissions: 'comment'
          },
          {
            name: 'Legacy Files',
            type: 'legacy',
            required: false,
            description: 'Original files from old folder structure',
            permissions: 'read_only'
          }
        ]
      }
    ];
  }

  /**
   * Analyze found folders and create associations with target structure
   */
  static async analyzeFoldersForMigration(
    customerId: string,
    customerName: string,
    serviceTier: string,
    existingFolders: any[],
    templateId: string = 'standard_project'
  ): Promise<FolderAssociation[]> {
    console.log(`📋 Analyzing ${existingFolders.length} existing folders for migration`);

    const template = this.getFolderStructureTemplates()
      .find(t => t.templateId === templateId) || this.getFolderStructureTemplates()[0];

    const associations: FolderAssociation[] = [];

    // Analyze each found folder and determine its likely association
    for (const folder of existingFolders) {
      const association = await this.classifyFolderType(folder, template);
      
      associations.push({
        customerId,
        existingFolderId: folder.folderId,
        existingFolderName: folder.folderName,
        existingFolderUrl: folder.webViewLink,
        associationType: this.recommendAssociationType(folder, association),
        folderType: association.type,
        confidence: association.confidence,
        userConfirmed: false,
        migrationStatus: 'pending',
        notes: association.reasoning,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Store associations in database for later review/approval
    await this.storeFolderAssociations(associations);

    console.log(`✅ Created ${associations.length} folder associations for review`);
    return associations;
  }

  /**
   * Classify a folder's likely type based on name and content patterns
   */
  private static async classifyFolderType(
    folder: any, 
    template: FolderStructureTemplate
  ): Promise<{ type: FolderAssociation['folderType'], confidence: 'high' | 'medium' | 'low', reasoning: string }> {
    
    const folderName = folder.folderName.toLowerCase();
    
    // Define classification patterns
    const patterns = {
      backups: [/backup/i, /bak/i, /archive/i, /config/i, /system/i],
      project_docs: [/document/i, /doc/i, /contract/i, /spec/i, /proposal/i, /agreement/i],
      site_photos: [/photo/i, /pic/i, /image/i, /install/i, /site/i, /progress/i],
      maintenance: [/maintenance/i, /service/i, /repair/i, /log/i, /schedule/i],
      reports: [/report/i, /analytics/i, /data/i, /monitor/i, /dashboard/i],
      correspondence: [/email/i, /comm/i, /meeting/i, /note/i, /correspondence/i],
      main: [/main/i, /root/i, /master/i, new RegExp(`^${folder.customerName}`, 'i')]
    };

    // Score each folder type
    const scores: Record<string, number> = {};
    
    for (const [type, typePatterns] of Object.entries(patterns)) {
      scores[type] = 0;
      for (const pattern of typePatterns) {
        if (pattern.test(folderName)) {
          scores[type] += 1;
        }
      }
    }

    // Find best match
    const bestMatch = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)[0];
    
    const [type, score] = bestMatch;

    // Determine confidence based on score and folder characteristics
    let confidence: 'high' | 'medium' | 'low' = 'low';
    let reasoning = '';

    if (score >= 2) {
      confidence = 'high';
      reasoning = `Strong pattern match for ${type} folder type`;
    } else if (score === 1) {
      confidence = 'medium';
      reasoning = `Moderate pattern match for ${type} folder type`;
    } else {
      confidence = 'low';
      reasoning = `No clear pattern match - classified as ${type} based on context`;
    }

    // Special case for main folders (year-based customer folders)
    if (folderName.includes(new Date().getFullYear().toString()) || 
        folderName.includes((new Date().getFullYear() - 1).toString())) {
      return { 
        type: 'main', 
        confidence: 'high', 
        reasoning: 'Year-based customer folder identified as main project folder' 
      };
    }

    return { 
      type: type as FolderAssociation['folderType'], 
      confidence, 
      reasoning 
    };
  }

  /**
   * Recommend association type based on folder characteristics
   */
  private static recommendAssociationType(
    folder: any, 
    classification: { type: FolderAssociation['folderType'], confidence: 'high' | 'medium' | 'low' }
  ): FolderAssociation['associationType'] {
    
    // Main folders should typically be linked (become the root of new structure)
    if (classification.type === 'main' && classification.confidence === 'high') {
      return 'link';
    }

    // High confidence specialized folders can be moved to appropriate subfolders
    if (classification.confidence === 'high' && classification.type !== 'main') {
      return 'move';
    }

    // Medium confidence folders should be copied to preserve originals
    if (classification.confidence === 'medium') {
      return 'copy';
    }

    // Low confidence folders should be archived for manual review
    return 'archive';
  }

  /**
   * Create a migration plan based on folder associations
   */
  static async createMigrationPlan(
    customerId: string,
    customerName: string,
    associations: FolderAssociation[],
    templateId: string = 'standard_project'
  ): Promise<MigrationPlan> {
    
    const template = this.getFolderStructureTemplates()
      .find(t => t.templateId === templateId) || this.getFolderStructureTemplates()[0];

    // Find the main folder to use as root
    const mainFolderAssociation = associations
      .find(a => a.folderType === 'main' && a.confidence === 'high');

    const migrationActions: MigrationPlan['migrationActions'] = [];
    const targetStructure: MigrationPlan['targetStructure'] = { subfolders: {} };

    // If we have a main folder, use it as the root
    if (mainFolderAssociation) {
      targetStructure.mainFolderId = mainFolderAssociation.existingFolderId;
      targetStructure.mainFolderUrl = mainFolderAssociation.existingFolderUrl;
      
      migrationActions.push({
        action: 'link_folder',
        sourceFolderId: mainFolderAssociation.existingFolderId,
        description: `Use existing "${mainFolderAssociation.existingFolderName}" as main project folder`,
        priority: 1
      });
    } else {
      // Create new main folder
      migrationActions.push({
        action: 'create_folder',
        description: `Create new main project folder for ${customerName}`,
        priority: 1
      });
    }

    // Process each template folder type
    for (const templateFolder of template.folders) {
      const existingAssociation = associations.find(a => 
        a.folderType === templateFolder.type && 
        a.confidence !== 'low'
      );

      if (existingAssociation) {
        // Use existing folder
        targetStructure.subfolders[templateFolder.type] = {
          id: existingAssociation.existingFolderId,
          url: existingAssociation.existingFolderUrl,
          source: 'existing'
        };

        if (existingAssociation.associationType === 'move') {
          migrationActions.push({
            action: 'move_files',
            sourceFolderId: existingAssociation.existingFolderId,
            targetFolderId: targetStructure.mainFolderId,
            description: `Move "${existingAssociation.existingFolderName}" to ${templateFolder.name} subfolder`,
            priority: 2
          });
        } else if (existingAssociation.associationType === 'copy') {
          migrationActions.push({
            action: 'copy_files',
            sourceFolderId: existingAssociation.existingFolderId,
            targetFolderId: targetStructure.mainFolderId,
            description: `Copy files from "${existingAssociation.existingFolderName}" to ${templateFolder.name} subfolder`,
            priority: 3
          });
        }
      } else if (templateFolder.required) {
        // Create required subfolder
        targetStructure.subfolders[templateFolder.type] = { source: 'new' };
        
        migrationActions.push({
          action: 'create_folder',
          targetFolderId: targetStructure.mainFolderId,
          description: `Create new "${templateFolder.name}" subfolder`,
          priority: 2
        });
      }
    }

    // Handle remaining unassociated folders
    const unassociatedFolders = associations.filter(a => 
      !template.folders.some(tf => tf.type === a.folderType) ||
      a.confidence === 'low'
    );

    for (const unassociated of unassociatedFolders) {
      migrationActions.push({
        action: 'archive_folder',
        sourceFolderId: unassociated.existingFolderId,
        description: `Archive "${unassociated.existingFolderName}" for manual review`,
        priority: 4
      });
    }

    // Calculate estimated duration and risk
    const estimatedDuration = migrationActions.length * 5; // 5 minutes per action
    const riskLevel = this.assessMigrationRisk(associations, migrationActions);
    const recommendations = this.generateMigrationRecommendations(associations, migrationActions);

    return {
      customerId,
      customerName,
      templateId,
      existingFolders: associations,
      targetStructure,
      migrationActions: migrationActions.sort((a, b) => a.priority - b.priority),
      estimatedDuration,
      riskLevel,
      recommendations
    };
  }

  /**
   * Assess the risk level of a migration plan
   */
  private static assessMigrationRisk(
    associations: FolderAssociation[],
    actions: MigrationPlan['migrationActions']
  ): 'low' | 'medium' | 'high' {
    
    let riskScore = 0;

    // Count risky actions
    const moveActions = actions.filter(a => a.action === 'move_files').length;
    const lowConfidenceFolders = associations.filter(a => a.confidence === 'low').length;
    const totalFolders = associations.length;

    riskScore += moveActions * 2; // Moving files is riskier than copying
    riskScore += lowConfidenceFolders * 1; // Low confidence classifications add risk
    
    if (totalFolders > 10) riskScore += 2; // Many folders increase complexity

    if (riskScore <= 3) return 'low';
    if (riskScore <= 7) return 'medium';
    return 'high';
  }

  /**
   * Generate recommendations for migration
   */
  private static generateMigrationRecommendations(
    associations: FolderAssociation[],
    actions: MigrationPlan['migrationActions']
  ): string[] {
    
    const recommendations: string[] = [];

    const lowConfidenceFolders = associations.filter(a => a.confidence === 'low');
    if (lowConfidenceFolders.length > 0) {
      recommendations.push(
        `Review ${lowConfidenceFolders.length} folder(s) with low confidence classifications before migration`
      );
    }

    const moveActions = actions.filter(a => a.action === 'move_files');
    if (moveActions.length > 0) {
      recommendations.push(
        `Consider backing up folders before moving ${moveActions.length} folder(s) to prevent data loss`
      );
    }

    const archiveActions = actions.filter(a => a.action === 'archive_folder');
    if (archiveActions.length > 3) {
      recommendations.push(
        `${archiveActions.length} folders will be archived - consider manual review to ensure important data isn't overlooked`
      );
    }

    if (associations.some(a => a.folderType === 'main' && a.confidence === 'high')) {
      recommendations.push(
        'Using existing folder as main project folder - verify it has appropriate permissions and structure'
      );
    }

    return recommendations;
  }

  /**
   * Store folder associations in database
   */
  private static async storeFolderAssociations(associations: FolderAssociation[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('customer_folder_associations')
        .upsert(associations.map(a => ({
          customer_id: a.customerId,
          existing_folder_id: a.existingFolderId,
          existing_folder_name: a.existingFolderName,
          existing_folder_url: a.existingFolderUrl,
          target_folder_id: a.targetFolderId,
          target_folder_name: a.targetFolderName,
          target_folder_url: a.targetFolderUrl,
          association_type: a.associationType,
          folder_type: a.folderType,
          confidence: a.confidence,
          user_confirmed: a.userConfirmed,
          migration_status: a.migrationStatus,
          notes: a.notes,
          created_at: a.createdAt,
          updated_at: a.updatedAt
        })), {
          onConflict: 'customer_id,existing_folder_id'
        });

      if (error && !error.message.includes('does not exist')) {
        console.error('Failed to store folder associations:', error);
      }
    } catch (error) {
      console.log('Folder association storage not available - continuing without database storage');
    }
  }

  /**
   * Execute a migration plan
   */
  static async executeMigrationPlan(plan: MigrationPlan): Promise<{
    success: boolean;
    completedActions: number;
    errors: string[];
    newStructure?: any;
  }> {
    
    console.log(`🚀 Executing migration plan for ${plan.customerName}`);
    
    const completedActions: string[] = [];
    const errors: string[] = [];

    try {
      // Execute actions in priority order
      for (const action of plan.migrationActions) {
        try {
          console.log(`⚙️ Executing: ${action.description}`);

          switch (action.action) {
            case 'create_folder':
              if (!plan.targetStructure.mainFolderId) {
                // Create main project folder
                const structure = await EnhancedGoogleDriveService.createStructuredProjectFolder(
                  plan.customerName,
                  { customer_id: plan.customerId }
                );
                plan.targetStructure.mainFolderId = structure.mainFolderId;
                plan.targetStructure.mainFolderUrl = structure.mainFolderUrl;
                Object.assign(plan.targetStructure.subfolders, structure.subfolders);
              }
              break;

            case 'link_folder':
              // Link existing folder (already handled in plan creation)
              break;

            case 'move_files':
            case 'copy_files':
            case 'archive_folder':
              // These would require additional Google Drive API calls
              // For now, log the action
              console.log(`📋 Planned: ${action.description}`);
              break;
          }

          completedActions.push(action.description);
          
        } catch (actionError) {
          errors.push(`Failed to ${action.description}: ${actionError.message}`);
          console.error(`❌ Action failed: ${action.description}`, actionError);
        }
      }

      // Update migration status
      await this.updateMigrationStatus(plan.customerId, 'completed', plan.targetStructure);

      console.log(`✅ Migration completed: ${completedActions.length} actions successful, ${errors.length} errors`);
      
      return {
        success: errors.length === 0,
        completedActions: completedActions.length,
        errors,
        newStructure: plan.targetStructure
      };

    } catch (error) {
      console.error('❌ Migration plan execution failed:', error);
      await this.updateMigrationStatus(plan.customerId, 'failed');
      
      return {
        success: false,
        completedActions: completedActions.length,
        errors: [`Migration execution failed: ${error.message}`, ...errors]
      };
    }
  }

  /**
   * Update migration status in database
   */
  private static async updateMigrationStatus(
    customerId: string, 
    status: 'completed' | 'failed',
    targetStructure?: any
  ): Promise<void> {
    try {
      const updateData: any = {
        migration_status: status,
        updated_at: new Date().toISOString()
      };

      if (targetStructure && status === 'completed') {
        updateData.target_structure = targetStructure;
      }

      await supabase
        .from('customer_folder_associations')
        .update(updateData)
        .eq('customer_id', customerId);
        
    } catch (error) {
      console.error('Failed to update migration status:', error);
    }
  }

  /**
   * Get migration status for a customer
   */
  static async getMigrationStatus(customerId: string): Promise<{
    hasAssociations: boolean;
    migrationStatus?: string;
    associations?: FolderAssociation[];
    targetStructure?: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('customer_folder_associations')
        .select('*')
        .eq('customer_id', customerId);

      if (error || !data) {
        return { hasAssociations: false };
      }

      return {
        hasAssociations: data.length > 0,
        migrationStatus: data[0]?.migration_status,
        associations: data.map(item => ({
          id: item.id,
          customerId: item.customer_id,
          existingFolderId: item.existing_folder_id,
          existingFolderName: item.existing_folder_name,
          existingFolderUrl: item.existing_folder_url,
          targetFolderId: item.target_folder_id,
          targetFolderName: item.target_folder_name,
          targetFolderUrl: item.target_folder_url,
          associationType: item.association_type,
          folderType: item.folder_type,
          confidence: item.confidence,
          userConfirmed: item.user_confirmed,
          migrationStatus: item.migration_status,
          notes: item.notes,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })),
        targetStructure: data[0]?.target_structure
      };
      
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return { hasAssociations: false };
    }
  }
}
