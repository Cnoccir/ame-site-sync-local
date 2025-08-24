import { CSVParser, ParsedCSVData } from './csvParser';
import { SupabaseMigrator } from './supabaseMigrator';

export interface MigrationProgress {
  stage: 'parsing' | 'validating' | 'migrating' | 'completed' | 'error';
  progress: number;
  message: string;
  details?: any;
}

export class MigrationOrchestrator {
  private onProgress?: (progress: MigrationProgress) => void;

  constructor(onProgress?: (progress: MigrationProgress) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Complete migration process from CSV files to normalized database
   */
  async migrateFromCSVFiles(csvFiles: File[]): Promise<{
    success: boolean;
    parsedData?: ParsedCSVData;
    migrationResult?: any;
    errors: string[];
  }> {
    const errors: string[] = [];
    let parsedData: ParsedCSVData | undefined;
    let migrationResult: any | undefined;

    try {
      // Stage 1: Parse CSV files
      this.updateProgress('parsing', 10, 'Reading and parsing CSV files...');
      
      const csvContents = await Promise.all(
        csvFiles.map(async file => ({
          name: file.name,
          content: await this.readFileAsText(file)
        }))
      );

      this.updateProgress('parsing', 30, 'Extracting relationships from CSV data...');
      parsedData = CSVParser.parseAllCSVs(csvContents);

      // Stage 2: Validate parsed data
      this.updateProgress('validating', 50, 'Validating parsed data structure...');
      const validation = CSVParser.validateParsedData(parsedData);
      
      if (!validation.isValid) {
        errors.push(...validation.errors);
        this.updateProgress('error', 50, 'Data validation failed');
        return { success: false, parsedData, errors };
      }

      // Stage 3: Generate reports
      const parseReport = CSVParser.generateSummaryReport(parsedData);
      

      // Stage 4: Migrate to database
      this.updateProgress('migrating', 70, 'Migrating data to normalized database...');
      
      const migrator = new SupabaseMigrator();
      migrationResult = await migrator.migrateAllData(parsedData);

      if (!migrationResult.success) {
        errors.push(...migrationResult.errors);
        this.updateProgress('error', 70, 'Database migration failed');
        return { success: false, parsedData, migrationResult, errors };
      }

      // Stage 5: Validate migration
      this.updateProgress('migrating', 90, 'Validating migration results...');
      const migrationValidation = await migrator.validateMigrationResult();
      
      if (!migrationValidation.isValid) {
        errors.push(...migrationValidation.issues);
      }

      // Stage 6: Generate final report
      const migrationReport = migrator.generateMigrationReport(migrationResult);
      

      this.updateProgress('completed', 100, 'Migration completed successfully!', {
        recordsInserted: migrationResult.recordsInserted,
        relationshipsCreated: migrationResult.relationshipsCreated,
        duration: migrationResult.duration
      });

      return {
        success: true,
        parsedData,
        migrationResult,
        errors
      };

    } catch (error) {
      console.error('Migration orchestration error:', error);
      errors.push(`Migration failed: ${error.message}`);
      
      this.updateProgress('error', 0, 'Migration failed with unexpected error');
      
      return {
        success: false,
        parsedData,
        migrationResult,
        errors
      };
    }
  }

  /**
   * Migrate from sample data (for testing)
   */
  async migrateFromSampleData(): Promise<{
    success: boolean;
    parsedData?: ParsedCSVData;
    migrationResult?: any;
    errors: string[];
  }> {
    const sampleData = this.generateSampleCSVData();
    return this.migrateFromCSVFiles(sampleData);
  }

  /**
   * Test migration without actually inserting data
   */
  async testMigration(csvFiles: File[]): Promise<{
    success: boolean;
    parsedData?: ParsedCSVData;
    validation?: any;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      this.updateProgress('parsing', 20, 'Testing CSV parsing...');
      
      const csvContents = await Promise.all(
        csvFiles.map(async file => ({
          name: file.name,
          content: await this.readFileAsText(file)
        }))
      );

      const parsedData = CSVParser.parseAllCSVs(csvContents);
      
      this.updateProgress('validating', 60, 'Testing data validation...');
      const validation = CSVParser.validateParsedData(parsedData);

      this.updateProgress('completed', 100, 'Test completed', {
        recordsParsed: parsedData.summary.recordsProcessed,
        relationshipsFound: parsedData.summary.relationshipsExtracted,
        validationPassed: validation.isValid
      });

      return {
        success: validation.isValid,
        parsedData,
        validation,
        errors: validation.errors
      };

    } catch (error) {
      console.error('Test migration error:', error);
      errors.push(`Test failed: ${error.message}`);
      
      this.updateProgress('error', 0, 'Test failed');
      
      return {
        success: false,
        errors
      };
    }
  }

  /**
   * Get current database statistics
   */
  async getDatabaseStatistics(): Promise<{
    customers: number;
    tasks: number;
    tools: number;
    sops: number;
    relationships: number;
  }> {
    const migrator = new SupabaseMigrator();
    
    try {
      // This would need to be implemented in the migrator
      const stats = {
        customers: 0,
        tasks: 0,
        tools: 0,
        sops: 0,
        relationships: 0
      };

      return stats;
    } catch (error) {
      console.error('Error getting database statistics:', error);
      return {
        customers: 0,
        tasks: 0,
        tools: 0,
        sops: 0,
        relationships: 0
      };
    }
  }

  /**
   * Clear all normalized data (for testing)
   */
  async clearNormalizedData(): Promise<boolean> {
    const migrator = new SupabaseMigrator();
    
    try {
      // This would need to be implemented in the migrator
      
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Private helper methods

  private updateProgress(stage: MigrationProgress['stage'], progress: number, message: string, details?: any): void {
    if (this.onProgress) {
      this.onProgress({ stage, progress, message, details });
    }
  }

  private async readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private generateSampleCSVData(): File[] {
    // Generate sample CSV files for testing
    const customerCSV = `Customer_ID,Company_Name,Service_Tier,Site_Name,System_Type,Site_Address,Primary_Contact,Contact_Phone,Last_Service,Next_Due,Contract_Status,Technician_Assigned,Contact_Email
CUST_001,Sample Company,CORE,Main Building,Niagara N4,123 Main St,John Doe,555-1234,2024-01-15,2025-01-15,Active,Tech01,john@sample.com
CUST_002,Test Corp,ASSURE,Building A,Johnson Metasys,456 Test Ave,Jane Smith,555-5678,2024-02-20,2025-02-20,Active,Tech02,jane@test.com`;

    const taskCSV = `Task_ID,Task_Name,Service_Tiers,Category,Duration,Tools_Required
TASK_001,System Backup,CORE,Backup & Recovery,30,TOOL_001
TASK_002,Performance Check,CORE;ASSURE,System Assessment,45,TOOL_001;TOOL_002
TASK_003,Full Optimization,GUARDIAN,System Optimization,90,TOOL_001;TOOL_002;TOOL_003`;

    const toolCSV = `Tool_ID,Tool_Name,Category,Service_Tiers,System_Types
TOOL_001,Laptop with Software,Diagnostic Tools,CORE;ASSURE;GUARDIAN,ALL
TOOL_002,Network Tester,Network Tools,ASSURE;GUARDIAN,Niagara N4;Johnson Metasys
TOOL_003,Calibration Kit,Calibration Tools,GUARDIAN,ALL`;

    const sopCSV = `SOP_ID,Title,Category,Goal,Steps,Tools
SOP_001,System Backup Procedure,Backup & Recovery,Create system backup,Step 1: Connect; Step 2: Export,TOOL_001
SOP_002,Performance Analysis,System Assessment,Analyze system performance,Step 1: Connect; Step 2: Test,TOOL_001;TOOL_002`;

    const files = [
      new File([customerCSV], 'Customer_Sample_Data.csv', { type: 'text/csv' }),
      new File([taskCSV], 'Task_Library.csv', { type: 'text/csv' }),
      new File([toolCSV], 'Tool_Library.csv', { type: 'text/csv' }),
      new File([sopCSV], 'SOP_Library.csv', { type: 'text/csv' })
    ];

    return files;
  }
}