# CSV Import Guide for Service Tier Execution Tables

This guide explains how to import CSV data into the new service tier execution tables: `service_tier_tasks`, `task_procedures`, and `visit_tasks`.

## Service Tier Tasks CSV Format

**File Purpose**: Define tasks specific to each service tier (CORE, ASSURE, GUARDIAN)

**Required Columns**:
- `service_tier` - Service tier (CORE, ASSURE, GUARDIAN)
- `task_name` - Name of the task
- `category` - Task category (e.g., "System Maintenance", "Preventive Care")

**Optional Columns**:
- `description` - Detailed task description
- `estimated_duration` - Estimated duration in minutes (default: 30)
- `is_required` - Whether task is required (true/false, default: true)
- `prerequisites` - Comma-separated list of prerequisite tasks
- `tools_required` - Comma-separated list of required tools
- `sop_content` - JSON object with additional SOP content
- `sort_order` - Sort order within category (default: 0)

**Example CSV**:
```csv
service_tier,category,task_name,description,estimated_duration,is_required,tools_required,sort_order
CORE,System Maintenance,System Status Review,Review overall system status and alarms,30,true,"Laptop,Network Scanner",1
CORE,System Maintenance,Basic Alarm Check,Check and acknowledge alarms,20,true,"Laptop",2
ASSURE,Advanced Diagnostics,Detailed Trending Analysis,Analyze historical trending data,45,true,"Laptop,Trending Software",1
GUARDIAN,Optimization,Comprehensive System Optimization,Full system optimization and tuning,120,true,"Laptop,Optimization Tools,Measurement Tools",1
```

## Task Procedures CSV Format

**File Purpose**: Define detailed procedures (SOPs) for tasks

**Required Columns**:
- `task_id` - UUID of the related service tier task
- `procedure_title` - Title of the procedure

**Optional Columns**:
- `procedure_category` - Category of the procedure
- `procedure_steps` - JSON array of step objects
- `visual_guides` - JSON array of visual guide objects
- `additional_resources` - JSON array of resource objects

**Example CSV**:
```csv
task_id,procedure_title,procedure_category,procedure_steps,visual_guides
a1b2c3d4-e5f6-7890-abcd-ef1234567890,System Status Review SOP,System Maintenance,"[{""step"": 1, ""title"": ""Access BMS"", ""description"": ""Log into the building management system""}]","[]"
```

## Visit Tasks CSV Format

**File Purpose**: Track task execution during specific visits

**Required Columns**:
- `visit_id` - Visit ID (text)
- `task_id` - UUID of the related service tier task

**Optional Columns**:
- `status` - Task status (not_started, in_progress, completed, skipped)
- `start_time` - When task was started (ISO datetime)
- `completion_time` - When task was completed (ISO datetime)
- `actual_duration` - Actual duration in minutes
- `notes` - Task execution notes

**Example CSV**:
```csv
visit_id,task_id,status,start_time,completion_time,actual_duration,notes
VIS_20241224_001,a1b2c3d4-e5f6-7890-abcd-ef1234567890,completed,2024-12-24T09:00:00Z,2024-12-24T09:30:00Z,30,Task completed successfully
VIS_20241224_001,b2c3d4e5-f6g7-8901-bcde-f23456789012,in_progress,2024-12-24T09:30:00Z,,,Task in progress
```

## Import Process

### Option 1: CSV File Upload
1. Go to Admin → Data Import Panel
2. Select "CSV File Upload" tab
3. Choose the appropriate dataset (Service Tier Tasks, Task Procedures, or Visit Tasks)
4. Upload your CSV file
5. Review import results

### Option 2: Programmatic Import
Use the CSV Import Service methods:
```typescript
// Import service tier tasks
await CSVImportService.importServiceTierTasksFromCsv(csvData);

// Import task procedures
await CSVImportService.importTaskProceduresFromCsv(csvData);

// Import visit tasks
await CSVImportService.importVisitTasksFromCsv(csvData);
```

## Sample Data

The migration already includes comprehensive sample data for all three tables:
- **Service Tier Tasks**: 6 CORE tasks, 10 ASSURE tasks, 14 GUARDIAN tasks
- **Task Procedures**: Complete SOPs for each task with step-by-step instructions
- **Visit Tasks**: No sample data (populated during actual visits)

## Notes

- Service tier tasks and task procedures use sample data from the migration
- Visit tasks are created dynamically during visit workflow execution
- CSV import is primarily for adding additional tasks or updating existing ones
- All data includes proper foreign key relationships and validation
- Use the Admin panel to view imported data and verify relationships

## Data Relationships

- `service_tier_tasks` → `task_procedures` (one-to-many via task_id)
- `service_tier_tasks` → `visit_tasks` (one-to-many via task_id)
- `visit_tasks` → `ame_visits` (many-to-one via visit_id)

Ensure your CSV data maintains these relationships for proper functionality.