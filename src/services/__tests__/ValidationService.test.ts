import ValidationService, { 
  ValidationResult, 
  ValidationError, 
  ValidationWarning 
} from '../ValidationService';
import { TridiumDataset, TridiumDataRow, CSVColumn } from '@/types/tridium';

describe('ValidationService', () => {
  let validationService: ValidationService;

  beforeEach(() => {
    validationService = ValidationService.getInstance();
    validationService.clearHistory();
  });

  const createMockDataset = (overrides: Partial<TridiumDataset> = {}): TridiumDataset => ({
    id: 'test-dataset-1',
    filename: 'test.csv',
    type: 'networkDevices',
    format: 'N2Export',
    columns: [
      { key: 'Name', label: 'Name', type: 'text', visible: true, sortable: true, width: 100 },
      { key: 'Status', label: 'Status', type: 'status', visible: true, sortable: true, width: 100 },
      { key: 'Address', label: 'Address', type: 'number', visible: true, sortable: true, width: 100 }
    ],
    rows: [
      {
        id: 'row-1',
        selected: false,
        data: { Name: 'Device1', Status: 'ok', Address: '1' },
        parsedStatus: {
          status: 'ok',
          severity: 'normal',
          details: ['System operational'],
          badge: { text: 'OK', variant: 'success' }
        }
      },
      {
        id: 'row-2',
        selected: false,
        data: { Name: 'Device2', Status: 'down', Address: '2' },
        parsedStatus: {
          status: 'down',
          severity: 'critical',
          details: ['Device offline'],
          badge: { text: 'DOWN', variant: 'destructive' }
        }
      }
    ],
    summary: {
      totalDevices: 2,
      statusBreakdown: { ok: 1, down: 1, alarm: 0, fault: 0, unknown: 0 },
      typeBreakdown: { 'Controller': 2 },
      criticalFindings: ['Device2: Device offline'],
      recommendations: ['1 devices are offline and require immediate attention']
    },
    metadata: {
      totalRows: 2,
      parseErrors: [],
      uploadedAt: new Date(),
      fileSize: 1024
    },
    ...overrides
  });

  describe('Singleton Pattern', () => {
    test('should return the same instance', () => {
      const instance1 = ValidationService.getInstance();
      const instance2 = ValidationService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Dataset Validation', () => {
    test('should validate a correct dataset successfully', async () => {
      const dataset = createMockDataset();
      const result = await validationService.validateDataset(dataset);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.metrics.totalChecks).toBeGreaterThan(0);
      expect(result.metrics.processingTime).toBeGreaterThan(0);
    });

    test('should detect missing required fields', async () => {
      const dataset = createMockDataset({ id: '', filename: '' });
      const result = await validationService.validateDataset(dataset);

      expect(result.isValid).toBe(false);
      const missingFieldsError = result.errors.find(e => e.code === 'MISSING_REQUIRED_FIELDS');
      expect(missingFieldsError).toBeDefined();
      expect(missingFieldsError?.severity).toBe('critical');
    });

    test('should detect datasets with no columns', async () => {
      const dataset = createMockDataset({ columns: [] });
      const result = await validationService.validateDataset(dataset);

      expect(result.isValid).toBe(false);
      const noColumnsError = result.errors.find(e => e.code === 'NO_COLUMNS');
      expect(noColumnsError).toBeDefined();
      expect(noColumnsError?.severity).toBe('critical');
    });

    test('should detect datasets with no rows', async () => {
      const dataset = createMockDataset({ rows: [] });
      const result = await validationService.validateDataset(dataset);

      expect(result.isValid).toBe(false);
      const noRowsError = result.errors.find(e => e.code === 'NO_DATA_ROWS');
      expect(noRowsError).toBeDefined();
      expect(noRowsError?.severity).toBe('error');
    });

    test('should warn about missing metadata', async () => {
      const dataset = createMockDataset({ metadata: undefined as any });
      const result = await validationService.validateDataset(dataset);

      const metadataWarning = result.warnings.find(w => w.code === 'MISSING_METADATA');
      expect(metadataWarning).toBeDefined();
      expect(metadataWarning?.recommendations).toContain('Add metadata for better tracking and debugging');
    });

    test('should warn about missing summary', async () => {
      const dataset = createMockDataset({ summary: undefined as any });
      const result = await validationService.validateDataset(dataset);

      const summaryWarning = result.warnings.find(w => w.code === 'MISSING_SUMMARY');
      expect(summaryWarning).toBeDefined();
      expect(summaryWarning?.recommendations).toContain('Generate summary statistics for better insights');
    });
  });

  describe('Data Integrity Validation', () => {
    test('should detect inconsistent row structure', async () => {
      const dataset = createMockDataset({
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { Name: 'Device1', Status: 'ok' } // Missing Address field
          }
        ] as TridiumDataRow[]
      });

      const result = await validationService.validateDataset(dataset);
      const integrityError = result.errors.find(e => e.code === 'INCONSISTENT_ROW_STRUCTURE');
      expect(integrityError).toBeDefined();
      expect(integrityError?.context?.expected).toBe(3);
      expect(integrityError?.context?.inconsistentCount).toBe(1);
    });

    test('should detect empty critical fields', async () => {
      const dataset = createMockDataset({
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { Name: '', Status: 'ok', Address: '1' }
          },
          {
            id: 'row-2',
            selected: false,
            data: { Name: 'Device2', Status: 'ok', Address: '2' }
          }
        ]
      });

      const result = await validationService.validateDataset(dataset);
      const emptyFieldsWarning = result.warnings.find(w => w.code === 'EMPTY_CRITICAL_FIELDS');
      expect(emptyFieldsWarning).toBeDefined();
      expect(emptyFieldsWarning?.context?.emptyCount).toBe(1);
    });

    test('should detect duplicate entries', async () => {
      const dataset = createMockDataset({
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { Name: 'Device1', Status: 'ok', Address: '1' }
          },
          {
            id: 'row-2',
            selected: false,
            data: { Name: 'Device1', Status: 'down', Address: '2' }
          }
        ]
      });

      const result = await validationService.validateDataset(dataset);
      const duplicatesWarning = result.warnings.find(w => w.code === 'DUPLICATE_ENTRIES');
      expect(duplicatesWarning).toBeDefined();
      expect(duplicatesWarning?.context?.duplicateCount).toBe(1);
    });

    test('should detect potential data corruption', async () => {
      const dataset = createMockDataset({
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { Name: 'Device\x00Corrupted', Status: 'ok', Address: '1' }
          }
        ]
      });

      const result = await validationService.validateDataset(dataset);
      const corruptionWarning = result.warnings.find(w => w.code === 'POTENTIAL_DATA_CORRUPTION');
      expect(corruptionWarning).toBeDefined();
      expect(corruptionWarning?.context?.corruptedCount).toBe(1);
    });
  });

  describe('Format-Specific Validation', () => {
    test('should validate N2 network devices', async () => {
      const dataset = createMockDataset({
        type: 'networkDevices',
        columns: [
          { key: 'Name', label: 'Name', type: 'text', visible: true, sortable: true, width: 100 },
          { key: 'Address', label: 'Address', type: 'text', visible: true, sortable: true, width: 100 }
        ],
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { Name: 'Device1', Address: 'invalid_address' }
          }
        ]
      });

      const result = await validationService.validateDataset(dataset);
      const addressWarning = result.warnings.find(w => w.code === 'INVALID_NETWORK_ADDRESSES');
      expect(addressWarning).toBeDefined();
      expect(addressWarning?.context?.invalidCount).toBe(1);
    });

    test('should validate BACnet devices', async () => {
      const dataset = createMockDataset({
        type: 'bacnetDevices',
        columns: [
          { key: 'Name', label: 'Name', type: 'text', visible: true, sortable: true, width: 100 },
          { key: 'Device ID', label: 'Device ID', type: 'number', visible: true, sortable: true, width: 100 }
        ],
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { Name: 'Device1', 'Device ID': '9999999' } // Invalid BACnet Device ID
          }
        ]
      });

      const result = await validationService.validateDataset(dataset);
      const deviceIdError = result.errors.find(e => e.code === 'INVALID_BACNET_DEVICE_IDS');
      expect(deviceIdError).toBeDefined();
      expect(deviceIdError?.context?.invalidCount).toBe(1);
      expect(deviceIdError?.context?.validRange).toBe('0-4194303');
    });

    test('should validate resource metrics', async () => {
      const dataset = createMockDataset({
        type: 'resourceMetrics',
        columns: [
          { key: 'Name', label: 'Name', type: 'text', visible: true, sortable: true, width: 100 },
          { key: 'Value', label: 'Value', type: 'value', visible: true, sortable: true, width: 100 }
        ],
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { Name: 'Memory Usage', Value: 'unparseable_value' }
          }
        ]
      });

      const result = await validationService.validateDataset(dataset);
      const unparsableWarning = result.warnings.find(w => w.code === 'UNPARSABLE_RESOURCE_VALUES');
      expect(unparsableWarning).toBeDefined();
      expect(unparsableWarning?.context?.unparsableCount).toBe(1);
    });

    test('should handle unknown formats', async () => {
      const dataset = createMockDataset({
        type: 'unknown' as any
      });

      const result = await validationService.validateDataset(dataset);
      const unknownFormatWarning = result.warnings.find(w => w.code === 'UNKNOWN_FORMAT');
      expect(unknownFormatWarning).toBeDefined();
      expect(unknownFormatWarning?.message).toContain("Dataset format 'unknown' is not recognized");
    });
  });

  describe('Performance Validation', () => {
    test('should warn about large datasets', async () => {
      const largeRows = Array.from({ length: 15000 }, (_, i) => ({
        id: `row-${i}`,
        selected: false,
        data: { Name: `Device${i}`, Status: 'ok', Address: `${i}` }
      }));

      const dataset = createMockDataset({
        rows: largeRows,
        summary: {
          ...createMockDataset().summary!,
          totalDevices: 15000
        }
      });

      const result = await validationService.validateDataset(dataset);
      const largeDatasetWarning = result.warnings.find(w => w.code === 'LARGE_DATASET');
      expect(largeDatasetWarning).toBeDefined();
      expect(largeDatasetWarning?.context?.rowCount).toBe(15000);
    });

    test('should warn about many columns', async () => {
      const manyColumns = Array.from({ length: 60 }, (_, i) => ({
        key: `Column${i}`,
        label: `Column ${i}`,
        type: 'text' as const,
        visible: true,
        sortable: true,
        width: 100
      }));

      const dataset = createMockDataset({
        columns: manyColumns
      });

      const result = await validationService.validateDataset(dataset);
      const manyColumnsWarning = result.warnings.find(w => w.code === 'MANY_COLUMNS');
      expect(manyColumnsWarning).toBeDefined();
      expect(manyColumnsWarning?.context?.columnCount).toBe(60);
    });
  });

  describe('Security Validation', () => {
    test('should detect potential sensitive data', async () => {
      const dataset = createMockDataset({
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { 
              Name: 'Device1', 
              Status: 'ok', 
              Address: '192.168.1.1',
              Email: 'admin@example.com',
              Password: 'secret123'
            }
          }
        ]
      });

      const result = await validationService.validateDataset(dataset);
      const sensitiveDataWarning = result.warnings.find(w => w.code === 'POTENTIAL_SENSITIVE_DATA');
      expect(sensitiveDataWarning).toBeDefined();
      expect(sensitiveDataWarning?.context?.findings).toBeDefined();
    });
  });

  describe('Validation History', () => {
    test('should store validation history', async () => {
      const dataset1 = createMockDataset({ id: 'dataset-1' });
      const dataset2 = createMockDataset({ id: 'dataset-2' });

      await validationService.validateDataset(dataset1);
      await validationService.validateDataset(dataset2);

      const history = validationService.getValidationHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toHaveProperty('isValid');
      expect(history[0]).toHaveProperty('metrics');
    });

    test('should limit history size', async () => {
      // Create many validation results
      for (let i = 0; i < 150; i++) {
        const dataset = createMockDataset({ id: `dataset-${i}` });
        await validationService.validateDataset(dataset);
      }

      const history = validationService.getValidationHistory();
      expect(history).toHaveLength(100); // Should be limited to MAX_HISTORY
    });

    test('should clear history', async () => {
      const dataset = createMockDataset();
      await validationService.validateDataset(dataset);

      expect(validationService.getValidationHistory()).toHaveLength(1);
      
      validationService.clearHistory();
      expect(validationService.getValidationHistory()).toHaveLength(0);
    });
  });

  describe('Validation Statistics', () => {
    test('should calculate validation statistics', async () => {
      const validDataset = createMockDataset({ id: 'valid-dataset' });
      const invalidDataset = createMockDataset({ 
        id: 'invalid-dataset',
        columns: [] // Will cause validation error
      });

      await validationService.validateDataset(validDataset);
      await validationService.validateDataset(invalidDataset);

      const stats = validationService.getValidationStatistics();
      expect(stats.totalValidations).toBe(2);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
      expect(stats.errorRate).toBeGreaterThan(0);
      expect(stats.mostCommonErrors).toBeDefined();
      expect(stats.mostCommonWarnings).toBeDefined();
    });

    test('should return empty statistics for no history', () => {
      validationService.clearHistory();
      const stats = validationService.getValidationStatistics();
      
      expect(stats.totalValidations).toBe(0);
      expect(stats.averageProcessingTime).toBe(0);
      expect(stats.errorRate).toBe(0);
      expect(stats.mostCommonErrors).toHaveLength(0);
      expect(stats.mostCommonWarnings).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle validation process failures', async () => {
      // Create a dataset that might cause validation to fail
      const problematicDataset = {
        ...createMockDataset(),
        columns: null as any // This should cause an error in validation
      };

      const result = await validationService.validateDataset(problematicDataset);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      const error = result.errors[0];
      expect(error.code).toBe('VALIDATION_FAILED');
      expect(error.severity).toBe('critical');
    });

    test('should track processing time even on failure', async () => {
      const problematicDataset = {
        ...createMockDataset(),
        columns: null as any
      };

      const result = await validationService.validateDataset(problematicDataset);
      expect(result.metrics.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Validation Report Export', () => {
    test('should export validation report as JSON', async () => {
      const dataset = createMockDataset();
      const result = await validationService.validateDataset(dataset);
      
      const report = validationService.exportValidationReport(result);
      const parsedReport = JSON.parse(report);
      
      expect(parsedReport).toHaveProperty('timestamp');
      expect(parsedReport).toHaveProperty('isValid');
      expect(parsedReport).toHaveProperty('metrics');
      expect(parsedReport).toHaveProperty('errors');
      expect(parsedReport).toHaveProperty('warnings');
    });

    test('should include error and warning details in export', async () => {
      const dataset = createMockDataset({ 
        columns: [], // Will cause error
        metadata: undefined as any // Will cause warning
      });
      
      const result = await validationService.validateDataset(dataset);
      const report = validationService.exportValidationReport(result);
      const parsedReport = JSON.parse(report);
      
      expect(parsedReport.errors).toHaveLength(1);
      expect(parsedReport.errors[0]).toHaveProperty('code');
      expect(parsedReport.errors[0]).toHaveProperty('message');
      expect(parsedReport.errors[0]).toHaveProperty('severity');
    });
  });

  describe('Validation Metrics', () => {
    test('should track validation metrics accurately', async () => {
      const dataset = createMockDataset();
      const result = await validationService.validateDataset(dataset);
      
      expect(result.metrics.totalChecks).toBeGreaterThan(0);
      expect(result.metrics.passed).toBeGreaterThanOrEqual(0);
      expect(result.metrics.failed).toBe(result.errors.length);
      expect(result.metrics.warnings).toBe(result.warnings.length);
      expect(result.metrics.processingTime).toBeGreaterThan(0);
    });

    test('should calculate passed checks correctly', async () => {
      const dataset = createMockDataset();
      const result = await validationService.validateDataset(dataset);
      
      const expectedPassed = result.metrics.totalChecks - result.errors.length - result.warnings.length;
      expect(result.metrics.passed).toBe(expectedPassed);
    });
  });

  describe('Real-world Scenarios', () => {
    test('should handle typical N2 export validation', async () => {
      const n2Dataset = createMockDataset({
        type: 'networkDevices',
        format: 'N2Export',
        columns: [
          { key: 'Name', label: 'Name', type: 'text', visible: true, sortable: true, width: 100 },
          { key: 'Status', label: 'Status', type: 'status', visible: true, sortable: true, width: 100 },
          { key: 'Address', label: 'Address', type: 'number', visible: true, sortable: true, width: 100 },
          { key: 'Controller Type', label: 'Controller Type', type: 'text', visible: true, sortable: true, width: 150 }
        ],
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { Name: 'AHU-1', Status: '{ok}', Address: '1', 'Controller Type': 'AHU Controller' }
          },
          {
            id: 'row-2',
            selected: false,
            data: { Name: 'VAV-101', Status: '{down,alarm}', Address: '2', 'Controller Type': 'VAV Controller' }
          }
        ]
      });

      const result = await validationService.validateDataset(n2Dataset);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    test('should handle problematic resource export', async () => {
      const resourceDataset = createMockDataset({
        type: 'resourceMetrics',
        format: 'ResourceExport',
        columns: [
          { key: 'Name', label: 'Name', type: 'text', visible: true, sortable: true, width: 100 },
          { key: 'Value', label: 'Value', type: 'value', visible: true, sortable: true, width: 100 }
        ],
        rows: [
          {
            id: 'row-1',
            selected: false,
            data: { Name: 'Memory Usage', Value: '512 MB' }
          },
          {
            id: 'row-2',
            selected: false,
            data: { Name: 'Unknown Metric', Value: 'not_a_value' }
          }
        ]
      });

      const result = await validationService.validateDataset(resourceDataset);
      expect(result.isValid).toBe(true); // Warnings don't make it invalid
      const unparsableWarning = result.warnings.find(w => w.code === 'UNPARSABLE_RESOURCE_VALUES');
      expect(unparsableWarning).toBeDefined();
    });
  });
});
