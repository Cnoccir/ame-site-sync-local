# Tridium System API Reference

## Table of Contents

- [TridiumCSVParser](#tridiumcsvparser)
- [ValidationService](#validationservice)
- [NetworkTopologyService](#networktopologyservice)
- [HealthMonitoringService](#healthmonitoringservice)
- [React Components](#react-components)
- [Type Definitions](#type-definitions)

## TridiumCSVParser

### Static Methods

#### `parseFileContent(fileContent: string, filename: string): TridiumDataset`

Parses file content and returns a structured dataset.

**Parameters:**
- `fileContent` - The raw file content as a string
- `filename` - The filename for format detection

**Returns:** `TridiumDataset` - Parsed and structured dataset

**Example:**
```typescript
const dataset = TridiumCSVParser.parseFileContent(csvContent, 'n2_export.csv');
console.log(`Parsed ${dataset.rows.length} devices`);
```

#### `parseStatus(statusValue: string): ParsedStatus`

Parses status strings into normalized status objects.

**Parameters:**
- `statusValue` - Raw status string (e.g., "{down,alarm,unackedAlarm}")

**Returns:** `ParsedStatus` - Normalized status with severity and badge info

**Example:**
```typescript
const status = TridiumCSVParser.parseStatus('{down,alarm}');
console.log(status.status); // 'down'
console.log(status.severity); // 'critical'
console.log(status.badge.text); // 'DOWN/ALARM'
```

#### `parseValue(value: any): ParsedValue`

Parses and extracts structured information from values.

**Parameters:**
- `value` - Value to parse (string, number, etc.)

**Returns:** `ParsedValue` - Structured value with type and metadata

**Example:**
```typescript
const parsed = TridiumCSVParser.parseValue('84 (Limit: 101)');
console.log(parsed.type); // 'count'
console.log(parsed.metadata?.limit); // 101
console.log(parsed.metadata?.percentage); // 83.17
```

#### `validateFile(fileContent: string, filename: string): ValidationResult`

Validates file content before parsing.

**Parameters:**
- `fileContent` - File content to validate
- `filename` - Filename for validation context

**Returns:** `ValidationResult` - Validation status with errors and warnings

**Example:**
```typescript
const validation = TridiumCSVParser.validateFile(content, 'test.csv');
if (validation.isValid) {
  const dataset = TridiumCSVParser.parseFileContent(content, 'test.csv');
} else {
  console.error('Validation errors:', validation.errors);
}
```

#### `getErrorStatistics(): ErrorStatistics`

Retrieves parser error statistics.

**Returns:** Object containing error counts and recommendations

**Example:**
```typescript
const stats = TridiumCSVParser.getErrorStatistics();
console.log(`Parse errors: ${stats.counts.parseErrors}`);
if (stats.shouldReset) {
  TridiumCSVParser.resetErrorStatistics();
}
```

#### `resetErrorStatistics(): void`

Resets error statistics counters.

#### `sanitizeData(data: any): any`

Sanitizes data by removing control characters and null bytes.

**Parameters:**
- `data` - Data to sanitize (string, object, or array)

**Returns:** Sanitized data

## ValidationService

### Instance Management

#### `ValidationService.getInstance(): ValidationService`

Returns the singleton instance of ValidationService.

**Example:**
```typescript
const validator = ValidationService.getInstance();
```

### Core Methods

#### `validateDataset(dataset: TridiumDataset): Promise<ValidationResult>`

Performs comprehensive dataset validation.

**Parameters:**
- `dataset` - Dataset to validate

**Returns:** Promise resolving to validation result with errors, warnings, and metrics

**Example:**
```typescript
const result = await validator.validateDataset(dataset);
if (result.isValid) {
  console.log('Dataset is valid');
} else {
  console.error('Validation failed:', result.errors);
}
```

#### `getValidationHistory(): ValidationResult[]`

Returns the validation history.

**Returns:** Array of previous validation results

#### `getValidationStatistics(): ValidationStatistics`

Calculates validation statistics from history.

**Returns:** Statistics object with averages, error rates, and common issues

**Example:**
```typescript
const stats = validator.getValidationStatistics();
console.log(`Average processing time: ${stats.averageProcessingTime}ms`);
console.log(`Error rate: ${(stats.errorRate * 100).toFixed(2)}%`);
```

#### `clearHistory(): void`

Clears the validation history.

#### `exportValidationReport(result: ValidationResult): string`

Exports a validation result as a JSON report.

**Parameters:**
- `result` - Validation result to export

**Returns:** JSON string representation of the report

## NetworkTopologyService

### Constructor

#### `new NetworkTopologyService()`

Creates a new topology service instance.

### Core Methods

#### `addDataset(dataset: TridiumDataset): void`

Adds a dataset to the topology builder.

**Parameters:**
- `dataset` - Dataset containing network device information

#### `buildTopology(): NetworkTopology`

Builds the network topology from added datasets.

**Returns:** `NetworkTopology` - Hierarchical network structure

**Example:**
```typescript
const topologyService = new NetworkTopologyService();
topologyService.addDataset(n2Dataset);
topologyService.addDataset(bacnetDataset);

const topology = topologyService.buildTopology();
console.log(`Built topology with ${topology.nodes.length} nodes`);
```

#### `getRootNodes(): TopologyNode[]`

Gets the root nodes of the topology.

**Returns:** Array of nodes without parents

#### `getDevicesByType(): Record<string, TopologyNode[]>`

Groups devices by their type.

**Returns:** Object mapping device types to node arrays

#### `calculateHealthSummary(): HealthSummary`

Calculates overall health metrics for the topology.

**Returns:** Health summary with aggregated metrics

#### `findShortestPath(fromId: string, toId: string): TopologyNode[] | null`

Finds the shortest path between two nodes.

**Parameters:**
- `fromId` - Source node ID
- `toId` - Target node ID

**Returns:** Array of nodes representing the path, or null if no path exists

#### `clear(): void`

Clears all datasets and resets the topology.

## HealthMonitoringService

### Constructor

#### `new HealthMonitoringService()`

Creates a new health monitoring service instance.

### Core Methods

#### `convertToEnhancedDataset(dataset: TridiumDataset): EnhancedTridiumDataset`

Converts a dataset to include health metrics.

**Parameters:**
- `dataset` - Original dataset

**Returns:** Enhanced dataset with health information

#### `generateConfiguration(serviceTier: ServiceTier): DashboardConfiguration`

Generates dashboard configuration for a service tier.

**Parameters:**
- `serviceTier` - 'CORE', 'ASSURE', or 'GUARDIAN'

**Returns:** Configuration object for the specified tier

#### `calculateDeviceHealth(device: TridiumDataRow): DeviceHealth`

Calculates comprehensive health metrics for a device.

**Parameters:**
- `device` - Device data row

**Returns:** Device health object with scores and diagnostics

#### `generateHealthReport(datasets: EnhancedTridiumDataset[], serviceTier: ServiceTier): HealthReport`

Generates a comprehensive health report.

**Parameters:**
- `datasets` - Array of enhanced datasets
- `serviceTier` - Service tier level

**Returns:** Health report with summary and recommendations

**Example:**
```typescript
const healthService = new HealthMonitoringService();
const enhanced = datasets.map(ds => healthService.convertToEnhancedDataset(ds));
const report = healthService.generateHealthReport(enhanced, 'ASSURE');

console.log(`Overall health score: ${report.overallHealthScore}`);
report.recommendations.forEach(rec => console.log(`- ${rec}`));
```

#### `exportForAssessment(datasets: EnhancedTridiumDataset[]): AssessmentExportData`

Exports health data for assessment workflows.

**Parameters:**
- `datasets` - Enhanced datasets to export

**Returns:** Assessment-compatible export data

## React Components

### NetworkHealthDashboard

#### Props

```typescript
interface NetworkHealthDashboardProps {
  datasets: TridiumDataset[];
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  onRefresh?: () => void;
  refreshInterval?: number; // milliseconds, default 30000
}
```

#### Usage

```typescript
<NetworkHealthDashboard 
  datasets={datasets}
  serviceTier="ASSURE"
  onRefresh={handleRefresh}
  refreshInterval={30000}
/>
```

#### Features

- **System Overview**: High-level health metrics and status cards
- **Device Health**: Tabbed view of device-by-device health analysis
- **Network Topology**: Visual representation of network hierarchy
- **Resource Monitoring**: System resource utilization charts
- **Alerts**: Active alerts and notifications
- **Auto-refresh**: Configurable automatic data refresh

## Type Definitions

### TridiumDataset

```typescript
interface TridiumDataset {
  id: string;
  filename: string;
  type: keyof TridiumDataTypes;
  format: string;
  columns: CSVColumn[];
  rows: TridiumDataRow[];
  summary: DatasetSummary;
  metadata: {
    totalRows: number;
    parseErrors: string[];
    validationWarnings?: string[];
    uploadedAt: Date;
    fileSize: number;
    detectedFormat: string;
    errorCounts?: ErrorCounts;
    isValid?: boolean;
  };
}
```

### ParsedStatus

```typescript
interface ParsedStatus {
  status: 'ok' | 'down' | 'alarm' | 'fault' | 'unknown';
  severity: 'normal' | 'warning' | 'critical';
  details: string[];
  badge: {
    text: string;
    variant: 'default' | 'success' | 'warning' | 'destructive';
  };
}
```

### ParsedValue

```typescript
interface ParsedValue {
  value: any;
  unit?: string;
  formatted: string;
  type: 'text' | 'count' | 'percentage' | 'memory' | 'duration' | 'timestamp';
  metadata?: {
    limit?: number;
    percentage?: number;
    originalValue?: any;
    originalUnit?: string;
    isIPAddress?: boolean;
    isVersion?: boolean;
  };
}
```

### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metrics: ValidationMetrics;
}

interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'error';
  context?: Record<string, any>;
  suggestions?: string[];
}

interface ValidationWarning {
  code: string;
  message: string;
  context?: Record<string, any>;
  recommendations?: string[];
}

interface ValidationMetrics {
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  processingTime: number;
}
```

### DeviceHealth

```typescript
interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  overallHealth: HealthScore;
  subsystemHealth: {
    connectivity: HealthScore;
    performance: HealthScore;
    configuration: HealthScore;
  };
  alerts: HealthAlert[];
  lastUpdated: Date;
  diagnostics?: HealthDiagnostics;
}

interface HealthScore {
  score: number; // 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  trend: 'improving' | 'stable' | 'degrading';
  details: string[];
}
```

### NetworkTopology

```typescript
interface NetworkTopology {
  nodes: TopologyNode[];
  relationships: TopologyRelationship[];
  healthSummary: HealthSummary;
}

interface TopologyNode {
  id: string;
  name: string;
  type: 'supervisor' | 'jace' | 'controller' | 'device';
  protocol: 'N2' | 'BACnet' | 'Niagara' | 'Unknown';
  address?: string;
  parentId?: string;
  children: string[];
  health: HealthScore;
  metadata: Record<string, any>;
}
```

## Error Codes

### Parser Error Codes

- `PARSE_ERROR` - General parsing error
- `FORMAT_DETECTION_FAILED` - Unable to detect file format
- `INVALID_CSV_STRUCTURE` - Malformed CSV content
- `ENCODING_ERROR` - File encoding issues

### Validation Error Codes

- `MISSING_REQUIRED_FIELDS` - Dataset missing required properties
- `NO_COLUMNS` - Dataset has no column definitions
- `NO_DATA_ROWS` - Dataset contains no data rows
- `INCONSISTENT_ROW_STRUCTURE` - Rows have inconsistent column counts
- `INVALID_BACNET_DEVICE_IDS` - BACnet Device IDs outside valid range
- `VALIDATION_FAILED` - Validation process failure

### Validation Warning Codes

- `MISSING_METADATA` - Dataset metadata is missing
- `MISSING_SUMMARY` - Dataset summary is missing
- `EMPTY_CRITICAL_FIELDS` - Critical fields are empty
- `DUPLICATE_ENTRIES` - Duplicate entries detected
- `POTENTIAL_DATA_CORRUPTION` - Signs of data corruption
- `INVALID_NETWORK_ADDRESSES` - Invalid network address formats
- `UNPARSABLE_RESOURCE_VALUES` - Resource values that cannot be parsed
- `UNKNOWN_FORMAT` - Unrecognized dataset format
- `LARGE_DATASET` - Dataset may impact performance
- `MANY_COLUMNS` - Large number of columns
- `POTENTIAL_SENSITIVE_DATA` - Potentially sensitive data detected

## Usage Patterns

### Basic File Processing

```typescript
// 1. Validate file
const validation = TridiumCSVParser.validateFile(content, filename);
if (!validation.isValid) {
  throw new Error(`File validation failed: ${validation.errors.join(', ')}`);
}

// 2. Parse file
const dataset = TridiumCSVParser.parseFileContent(content, filename);

// 3. Validate dataset
const validator = ValidationService.getInstance();
const validationResult = await validator.validateDataset(dataset);

if (!validationResult.isValid) {
  console.warn('Dataset has validation issues:', validationResult.warnings);
}

// 4. Use dataset
console.log(`Parsed ${dataset.rows.length} devices of type ${dataset.type}`);
```

### Health Monitoring Workflow

```typescript
// 1. Convert datasets for health monitoring
const healthService = new HealthMonitoringService();
const enhancedDatasets = datasets.map(ds => 
  healthService.convertToEnhancedDataset(ds)
);

// 2. Generate configuration
const config = healthService.generateConfiguration('ASSURE');

// 3. Generate health report
const report = healthService.generateHealthReport(enhancedDatasets, 'ASSURE');

// 4. Display in dashboard
<NetworkHealthDashboard 
  datasets={enhancedDatasets}
  serviceTier="ASSURE"
  onRefresh={handleRefresh}
/>
```

### Network Topology Analysis

```typescript
// 1. Build topology
const topologyService = new NetworkTopologyService();
datasets.forEach(dataset => topologyService.addDataset(dataset));
const topology = topologyService.buildTopology();

// 2. Analyze structure
const rootNodes = topologyService.getRootNodes();
const devicesByType = topologyService.getDevicesByType();

// 3. Calculate health
const healthSummary = topologyService.calculateHealthSummary();

console.log(`Network has ${rootNodes.length} root nodes`);
console.log(`Overall health score: ${healthSummary.overallScore}`);
```

## Best Practices

### Error Handling

Always wrap parser operations in try-catch blocks:

```typescript
try {
  const dataset = TridiumCSVParser.parseFileContent(content, filename);
  // Process dataset
} catch (error) {
  console.error('Parse failed:', error.message);
  // Handle error appropriately
}
```

### Performance Optimization

For large datasets:

```typescript
// Check file size before processing
if (content.length > 10 * 1024 * 1024) { // 10MB
  console.warn('Large file detected, processing may be slow');
}

// Use validation to catch issues early
const validation = TridiumCSVParser.validateFile(content, filename);
if (validation.warnings.some(w => w.includes('performance'))) {
  // Consider pagination or streaming
}
```

### Memory Management

```typescript
// Reset error statistics periodically
const stats = TridiumCSVParser.getErrorStatistics();
if (stats.shouldReset) {
  TridiumCSVParser.resetErrorStatistics();
}

// Clear validation history when not needed
const validator = ValidationService.getInstance();
validator.clearHistory();
```
