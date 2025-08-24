import { MigrationOrchestrator, MigrationProgress } from './migrationOrchestrator';
import { CSVParser, ParsedCSVData } from './csvParser';
import { SupabaseMigrator } from './supabaseMigrator';

export interface MigrationOptions {
  validateOnly?: boolean;
  skipValidation?: boolean;
  batchSize?: number;
  onProgress?: (progress: MigrationProgress) => void;
}

export interface MigrationResult {
  success: boolean;
  parsedData?: ParsedCSVData;
  migrationResult?: any;
  errors: string[];
  verificationQueries?: string[];
  summary?: MigrationSummary;
}

export interface MigrationSummary {
  filesProcessed: number;
  recordsInserted: number;
  relationshipsCreated: number;
  tablesCreated: string[];
  duration: number;
  warnings: string[];
}

/**
 * Main orchestration function to migrate AME data from CSV files to Supabase
 */
export async function migrateAMEDataToSupabase(
  csvFiles: File[],
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate inputs
    if (!csvFiles || csvFiles.length === 0) {
      throw new Error('No CSV files provided for migration');
    }

    // Create orchestrator with progress reporting
    const orchestrator = new MigrationOrchestrator(options.onProgress);

    // Run migration
    const result = await orchestrator.migrateFromCSVFiles(csvFiles);

    // Generate verification queries
    const verificationQueries = generateVerificationQueries();

    // Create summary
    const summary: MigrationSummary = {
      filesProcessed: csvFiles.length,
      recordsInserted: result.migrationResult?.recordsInserted || 0,
      relationshipsCreated: result.migrationResult?.relationshipsCreated || 0,
      tablesCreated: [
        'service_tiers', 'system_types', 'task_categories', 'tool_categories',
        'ame_customers_normalized', 'ame_tasks_normalized', 'ame_tools_normalized', 'ame_sops_normalized',
        'task_service_tiers', 'task_tools', 'tool_service_tiers', 'task_sops'
      ],
      duration: Date.now() - startTime,
      warnings
    };

    return {
      success: result.success,
      parsedData: result.parsedData,
      migrationResult: result.migrationResult,
      errors: result.errors,
      verificationQueries,
      summary
    };

  } catch (error) {
    console.error('Migration integration error:', error);
    errors.push(`Migration failed: ${error.message}`);
    
    return {
      success: false,
      errors,
      summary: {
        filesProcessed: 0,
        recordsInserted: 0,
        relationshipsCreated: 0,
        tablesCreated: [],
        duration: Date.now() - startTime,
        warnings
      }
    };
  }
}

/**
 * Test migration without actually inserting data
 */
export async function testAMEMigration(
  csvFiles: File[],
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const startTime = Date.now();

  try {
    const orchestrator = new MigrationOrchestrator(options.onProgress);
    const result = await orchestrator.testMigration(csvFiles);

    const summary: MigrationSummary = {
      filesProcessed: csvFiles.length,
      recordsInserted: 0,
      relationshipsCreated: 0,
      tablesCreated: [],
      duration: Date.now() - startTime,
      warnings: result.validation?.errors || []
    };

    return {
      success: result.success,
      parsedData: result.parsedData,
      errors: result.errors,
      summary
    };

  } catch (error) {
    console.error('Test migration error:', error);
    return {
      success: false,
      errors: [`Test failed: ${error.message}`],
      summary: {
        filesProcessed: 0,
        recordsInserted: 0,
        relationshipsCreated: 0,
        tablesCreated: [],
        duration: Date.now() - startTime,
        warnings: []
      }
    };
  }
}

/**
 * Generate SQL verification queries to test migrated data
 */
export function generateVerificationQueries(): string[] {
  return [
    // Verify lookup tables
    `-- Verify service tiers
SELECT * FROM service_tiers ORDER BY tier_code;`,

    `-- Verify system types
SELECT * FROM system_types ORDER BY type_code;`,

    `-- Verify task categories
SELECT * FROM task_categories ORDER BY category_name;`,

    `-- Verify tool categories
SELECT * FROM tool_categories ORDER BY category_name;`,

    // Verify main tables with relationships
    `-- Check customers with service tiers
SELECT c.customer_id, c.company_name, st.tier_name, sys.type_name
FROM ame_customers_normalized c
LEFT JOIN service_tiers st ON c.service_tier_id = st.id
LEFT JOIN system_types sys ON c.system_type_id = sys.id
ORDER BY c.company_name;`,

    `-- Check tasks with categories
SELECT t.task_id, t.task_name, tc.category_name, t.duration_minutes
FROM ame_tasks_normalized t
LEFT JOIN task_categories tc ON t.category_id = tc.id
ORDER BY t.task_name;`,

    `-- Check tools with categories
SELECT tool.tool_id, tool.tool_name, tc.category_name, tool.status
FROM ame_tools_normalized tool
LEFT JOIN tool_categories tc ON tool.category_id = tc.id
ORDER BY tool.tool_name;`,

    // Verify relationships
    `-- Check task-service tier relationships
SELECT t.task_name, string_agg(st.tier_code, ', ' ORDER BY st.tier_code) as service_tiers
FROM ame_tasks_normalized t
JOIN task_service_tiers tst ON t.id = tst.task_id
JOIN service_tiers st ON tst.service_tier_id = st.id
GROUP BY t.task_name
ORDER BY t.task_name;`,

    `-- Check task-tool relationships  
SELECT t.task_name, tool.tool_name, tt.is_required
FROM ame_tasks_normalized t
JOIN task_tools tt ON t.id = tt.task_id
JOIN ame_tools_normalized tool ON tt.tool_id = tool.id
ORDER BY t.task_name, tool.tool_name;`,

    `-- Check tool-service tier relationships
SELECT tool.tool_name, string_agg(st.tier_code, ', ' ORDER BY st.tier_code) as service_tiers
FROM ame_tools_normalized tool
JOIN tool_service_tiers tst ON tool.id = tst.tool_id
JOIN service_tiers st ON tst.service_tier_id = st.id
GROUP BY tool.tool_name
ORDER BY tool.tool_name;`,

    // Data quality checks
    `-- Count records by table
SELECT 
  'service_tiers' as table_name, COUNT(*) as record_count FROM service_tiers
UNION ALL
SELECT 
  'system_types' as table_name, COUNT(*) as record_count FROM system_types
UNION ALL
SELECT 
  'task_categories' as table_name, COUNT(*) as record_count FROM task_categories
UNION ALL
SELECT 
  'customers' as table_name, COUNT(*) as record_count FROM ame_customers_normalized
UNION ALL
SELECT 
  'tasks' as table_name, COUNT(*) as record_count FROM ame_tasks_normalized
UNION ALL
SELECT 
  'tools' as table_name, COUNT(*) as record_count FROM ame_tools_normalized
UNION ALL
SELECT 
  'task_service_tiers' as table_name, COUNT(*) as record_count FROM task_service_tiers
UNION ALL
SELECT 
  'task_tools' as table_name, COUNT(*) as record_count FROM task_tools
ORDER BY table_name;`,

    `-- Check for orphaned relationships
SELECT 'task_service_tiers with invalid task_id' as issue, COUNT(*) as count
FROM task_service_tiers tst
LEFT JOIN ame_tasks_normalized t ON tst.task_id = t.id
WHERE t.id IS NULL
UNION ALL
SELECT 'task_tools with invalid task_id' as issue, COUNT(*) as count
FROM task_tools tt
LEFT JOIN ame_tasks_normalized t ON tt.task_id = t.id
WHERE t.id IS NULL
UNION ALL
SELECT 'tool_service_tiers with invalid tool_id' as issue, COUNT(*) as count
FROM tool_service_tiers tst
LEFT JOIN ame_tools_normalized tool ON tst.tool_id = tool.id
WHERE tool.id IS NULL;`
  ];
}

/**
 * Quick start migration with sample data
 */
export async function quickStartMigration(
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  try {
    const orchestrator = new MigrationOrchestrator(options.onProgress);
    const result = await orchestrator.migrateFromSampleData();

    const verificationQueries = generateVerificationQueries();

    return {
      success: result.success,
      parsedData: result.parsedData,
      migrationResult: result.migrationResult,
      errors: result.errors,
      verificationQueries,
      summary: {
        filesProcessed: 4, // Sample data files
        recordsInserted: result.migrationResult?.recordsInserted || 0,
        relationshipsCreated: result.migrationResult?.relationshipsCreated || 0,
        tablesCreated: [
          'service_tiers', 'system_types', 'task_categories', 'tool_categories',
          'ame_customers_normalized', 'ame_tasks_normalized', 'ame_tools_normalized', 'ame_sops_normalized'
        ],
        duration: 0,
        warnings: []
      }
    };

  } catch (error) {
    console.error('Quick start migration error:', error);
    return {
      success: false,
      errors: [`Quick start failed: ${error.message}`],
      summary: {
        filesProcessed: 0,
        recordsInserted: 0,
        relationshipsCreated: 0,
        tablesCreated: [],
        duration: 0,
        warnings: []
      }
    };
  }
}

/**
 * Get database statistics after migration
 */
export async function getDatabaseStatistics(): Promise<{
  customers: number;
  tasks: number;
  tools: number;
  sops: number;
  serviceTiers: number;
  systemTypes: number;
  relationships: number;
}> {
  const orchestrator = new MigrationOrchestrator();
  const stats = await orchestrator.getDatabaseStatistics();

  return {
    ...stats,
    serviceTiers: 0, // Will be populated by actual query
    systemTypes: 0   // Will be populated by actual query
  };
}

/**
 * Complete fix function with step-by-step instructions
 */
export function getAMEFixInstructions(): string {
  return `
# Complete AME PM Tool Database Fix Instructions

## Overview
Your AME PM Tool database has structural problems with flat tables and text arrays instead of proper relationships. This migration will normalize the database for better performance and maintainability.

## Current Issues
- Service tiers stored as text arrays: ["CORE","ASSURE","GUARDIAN"]
- Tool references as comma-separated text: "TOOL_041, TOOL_029"
- No foreign key relationships
- Poor query performance due to text parsing

## Migration Steps

### 1. Prepare CSV Files
Ensure you have these CSV files with proper structure:
- Customer_Sample_Data.csv
- Task_Library.csv  
- Tool_Library.csv
- SOP_Library.csv

### 2. Run Migration
\`\`\`javascript
import { migrateAMEDataToSupabase } from './services/migrationIntegrator';

// Upload your CSV files through the UI or programmatically
const csvFiles = [customerFile, taskFile, toolFile, sopFile];

// Run complete migration
const result = await migrateAMEDataToSupabase(csvFiles, {
  onProgress: (progress) => {
    console.log(\`\${progress.stage}: \${progress.message} (\${progress.progress}%)\`);
  }
});

if (result.success) {
  console.log('Migration completed successfully!');
  console.log('Summary:', result.summary);
} else {
  console.error('Migration failed:', result.errors);
}
\`\`\`

### 3. Verify Migration
Run the verification queries to ensure data integrity:
\`\`\`sql
${generateVerificationQueries().join('\n\n')}
\`\`\`

### 4. Update Application Code
After migration, update your application code to use the new normalized schema:
- Replace \`ame_tasks\` with \`ame_tasks_normalized\`
- Replace \`ame_tools\` with \`ame_tools_normalized\`
- Replace \`ame_customers\` with \`ame_customers_normalized\`
- Use JOIN queries instead of text parsing for relationships

## Benefits After Migration
- ✅ Proper foreign key relationships
- ✅ Efficient JOIN-based queries
- ✅ Better data integrity
- ✅ Scalable database design
- ✅ Easier maintenance and updates

## Support
If you encounter issues during migration, check the error logs and run the test migration first to identify any data format problems.
`;
}