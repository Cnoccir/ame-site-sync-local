# Tridium Data Processing System

## Overview

The Tridium Data Processing System is a comprehensive solution for parsing, validating, and visualizing data from Tridium Niagara system exports. It supports multiple export formats including N2 networks, BACnet devices, resource metrics, platform details, and Niagara station hierarchies.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Tridium System Architecture               │
├─────────────────────────────────────────────────────────────┤
│  React Components                                           │
│  ├── NetworkHealthDashboard                                 │
│  ├── AssessmentPhase Integration                           │
│  └── Enhanced Health Monitoring                            │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                            │
│  ├── HealthMonitoringService                              │
│  ├── ValidationService                                    │
│  └── NetworkTopologyService                               │
├─────────────────────────────────────────────────────────────┤
│  Data Processing                                           │
│  ├── TridiumCSVParser                                      │
│  ├── Status & Value Parsers                               │
│  └── Format Detection                                      │
├─────────────────────────────────────────────────────────────┤
│  Data Models & Types                                       │
│  ├── TridiumDataset                                        │
│  ├── Device Types                                          │
│  └── Health Metrics                                        │
└─────────────────────────────────────────────────────────────┘
```

## Data Formats Supported

### 1. N2 Export
- **Purpose**: Network devices on N2 protocol
- **Key Columns**: Name, Status, Address, Controller Type
- **Features**: Status parsing, device categorization, network topology

### 2. BACnet Export
- **Purpose**: BACnet devices and their properties
- **Key Columns**: Name, Type, Device ID, Status, Vendor, Model
- **Features**: Device ID validation, vendor analysis, health metrics

### 3. Resource Export
- **Purpose**: System resource utilization
- **Key Columns**: Name, Value
- **Features**: Advanced value parsing, unit normalization, capacity tracking

### 4. Platform Details (Text)
- **Purpose**: System platform information
- **Format**: Text file with key-value pairs
- **Features**: Platform summary, module listing, license tracking

### 5. Niagara Network Export
- **Purpose**: Niagara station hierarchy
- **Key Columns**: Path, Name, Type, Address, Platform Status
- **Features**: Hierarchical relationships, connection status

## Core Components

### TridiumCSVParser

The main parser class that handles all file format detection and parsing.

```typescript
// Basic usage
const dataset = TridiumCSVParser.parseFileContent(csvContent, filename);

// With validation
const fileValidation = TridiumCSVParser.validateFile(content, filename);
if (fileValidation.isValid) {
  const dataset = TridiumCSVParser.parseFileContent(content, filename);
}

// Error statistics
const stats = TridiumCSVParser.getErrorStatistics();
```

#### Key Features:
- **Automatic Format Detection**: Intelligently detects file format based on headers and filename
- **Robust CSV Parsing**: Handles quoted fields, escaped characters, and malformed rows
- **Status Normalization**: Converts complex status strings to standardized format
- **Value Extraction**: Parses units, percentages, memory values, timestamps, and more
- **Error Handling**: Comprehensive error tracking and reporting

### ValidationService

Provides comprehensive dataset validation with detailed error reporting.

```typescript
// Singleton pattern
const validator = ValidationService.getInstance();

// Validate dataset
const result = await validator.validateDataset(dataset);

// Check results
if (result.isValid) {
  console.log('Dataset is valid');
} else {
  console.log('Errors:', result.errors);
  console.log('Warnings:', result.warnings);
}

// Get validation statistics
const stats = validator.getValidationStatistics();
```

#### Validation Categories:
- **Structure Validation**: Required fields, columns, rows
- **Data Integrity**: Consistent structure, duplicate detection, corruption signs
- **Format Validation**: Format-specific rules and constraints
- **Performance**: Large dataset warnings
- **Security**: Sensitive data detection

### NetworkTopologyService

Builds hierarchical network structures from parsed datasets.

```typescript
const topologyService = new NetworkTopologyService();

// Add datasets
topologyService.addDataset(n2Dataset);
topologyService.addDataset(bacnetDataset);
topologyService.addDataset(niagaraDataset);

// Build topology
const topology = topologyService.buildTopology();

// Query topology
const rootNodes = topologyService.getRootNodes();
const devicesByType = topologyService.getDevicesByType();
```

#### Features:
- **Multi-Protocol Support**: Combines N2, BACnet, and Niagara devices
- **Hierarchical Structure**: Builds parent-child relationships
- **Health Aggregation**: Calculates health scores up the hierarchy
- **Address Detection**: Uses heuristics to determine network relationships

### HealthMonitoringService

Integrates with assessment workflows to provide health monitoring capabilities.

```typescript
const healthService = new HealthMonitoringService();

// Convert datasets
const enhancedDataset = healthService.convertToEnhancedDataset(dataset);

// Generate health report
const report = healthService.generateHealthReport(datasets, serviceTier);

// Export for assessment
const assessmentData = healthService.exportForAssessment(datasets);
```

#### Service Tiers:
- **CORE**: Basic health monitoring
- **ASSURE**: Advanced metrics and alerting
- **GUARDIAN**: Comprehensive analysis and predictive insights

## Data Models

### TridiumDataset

The primary data structure for parsed datasets.

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

### Device Health Interfaces

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

## React Components

### NetworkHealthDashboard

Comprehensive dashboard for network health visualization.

```typescript
interface NetworkHealthDashboardProps {
  datasets: TridiumDataset[];
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  onRefresh?: () => void;
  refreshInterval?: number;
}

const NetworkHealthDashboard: React.FC<NetworkHealthDashboardProps> = ({
  datasets,
  serviceTier,
  onRefresh,
  refreshInterval = 30000
}) => {
  // Component implementation
};
```

#### Features:
- **System Overview**: High-level health metrics
- **Device Health Tabs**: Detailed device-by-device analysis
- **Network Topology**: Visual network hierarchy
- **Resource Monitoring**: System resource utilization
- **Alerts Dashboard**: Active alerts and notifications
- **Auto-refresh**: Configurable refresh intervals

## Usage Examples

### Basic File Processing

```typescript
// Parse a file
const dataset = TridiumCSVParser.parseFileContent(csvContent, 'n2_export.csv');

// Validate the dataset
const validator = ValidationService.getInstance();
const validation = await validator.validateDataset(dataset);

if (validation.isValid) {
  console.log('Successfully parsed', dataset.rows.length, 'devices');
} else {
  console.error('Validation errors:', validation.errors);
}
```

### Health Monitoring Integration

```typescript
// Convert datasets for health monitoring
const healthService = new HealthMonitoringService();
const enhancedDatasets = datasets.map(ds => 
  healthService.convertToEnhancedDataset(ds)
);

// Generate health report
const report = healthService.generateHealthReport(enhancedDatasets, 'ASSURE');

// Use in React component
<NetworkHealthDashboard 
  datasets={enhancedDatasets}
  serviceTier="ASSURE"
  onRefresh={handleRefresh}
  refreshInterval={30000}
/>
```

### Network Topology Analysis

```typescript
// Build network topology
const topologyService = new NetworkTopologyService();
datasets.forEach(dataset => topologyService.addDataset(dataset));
const topology = topologyService.buildTopology();

// Analyze the network
console.log('Root nodes:', topology.nodes.filter(n => !n.parentId));
console.log('Total devices:', topology.nodes.length);
console.log('Overall health:', topology.healthSummary);
```

## Error Handling

The system provides comprehensive error handling at multiple levels:

### Parse-Level Errors
- Malformed CSV rows
- Invalid data formats
- Encoding issues

### Validation Errors
- Missing required fields
- Data integrity issues
- Format-specific violations

### Runtime Errors
- Service failures
- Network timeouts
- Resource limitations

### Error Recovery
- Fallback parsing modes
- Partial data processing
- Graceful degradation

## Performance Considerations

### Large Dataset Handling
- Streaming parsing for files > 50MB
- Pagination for > 10,000 rows
- Virtual scrolling in UI components

### Memory Management
- Lazy loading of dataset details
- Cleanup of unused validation history
- Efficient data structures

### Optimization Features
- Memoized calculations
- Debounced validations
- Background processing for non-critical tasks

## Security

### Data Protection
- No sensitive data logging
- Secure data sanitization
- Validation of potentially harmful content

### File Safety
- File size limits (50MB max)
- Content validation before processing
- Encoding verification

## Troubleshooting

### Common Issues

1. **Format Detection Failed**
   - Check filename conventions
   - Verify header row format
   - Ensure required columns are present

2. **Validation Errors**
   - Review data for completeness
   - Check for encoding issues
   - Verify file format matches expectations

3. **Performance Issues**
   - Use pagination for large datasets
   - Enable virtual scrolling
   - Consider data filtering

### Debug Information

```typescript
// Enable detailed logging
const stats = TridiumCSVParser.getErrorStatistics();
console.log('Parser statistics:', stats);

const validationStats = validator.getValidationStatistics();
console.log('Validation statistics:', validationStats);
```

## Extension Points

The system is designed for extensibility:

### Adding New Formats
1. Extend `TridiumDataTypes` interface
2. Add format detection rules
3. Implement format-specific parser
4. Add validation rules

### Custom Health Metrics
1. Extend `DeviceHealth` interface
2. Implement custom calculators
3. Add visualization components
4. Configure service tier features

### Integration Points
- Assessment workflow integration
- External system connectors
- Custom export formats
- Alerting system hooks

## Configuration

### Parser Configuration

```typescript
// Validation limits
const config = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_ROWS: 100000, // 100k rows
  MIN_COLUMNS: 1,
  MAX_COLUMNS: 100
};
```

### Dashboard Configuration

```typescript
// Service tier features
const tierConfig = {
  CORE: {
    basicHealthMetrics: true,
    alerting: false,
    predictiveAnalytics: false
  },
  ASSURE: {
    basicHealthMetrics: true,
    alerting: true,
    predictiveAnalytics: false
  },
  GUARDIAN: {
    basicHealthMetrics: true,
    alerting: true,
    predictiveAnalytics: true
  }
};
```

## API Reference

See the TypeScript interfaces and JSDoc comments in the source code for detailed API documentation.

## Testing

The system includes comprehensive test coverage:
- Unit tests for parsers and services
- Integration tests for component interaction
- Validation tests with sample data
- Performance benchmarks

Run tests with:
```bash
npm test
npm run test:coverage
npm run test:performance
```
