import { TridiumDataset, TridiumDataRow } from '@/types/tridium';
import { logger } from '@/utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metrics: ValidationMetrics;
}

export interface ValidationError {
  code: string;
  message: string;
  severity: 'critical' | 'error';
  context?: Record<string, any>;
  suggestions?: string[];
}

export interface ValidationWarning {
  code: string;
  message: string;
  context?: Record<string, any>;
  recommendations?: string[];
}

export interface ValidationMetrics {
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  processingTime: number;
}

export class ValidationService {
  private static instance: ValidationService;
  private validationHistory: ValidationResult[] = [];
  private readonly MAX_HISTORY = 100;

  private constructor() {}

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Comprehensive dataset validation
   */
  async validateDataset(dataset: TridiumDataset): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let totalChecks = 0;

    try {
      logger.info('Starting dataset validation', { 
        datasetId: dataset.id, 
        filename: dataset.filename,
        rowCount: dataset.rows.length 
      });

      // Basic structure validation
      const structureValidation = this.validateStructure(dataset);
      errors.push(...structureValidation.errors);
      warnings.push(...structureValidation.warnings);
      totalChecks += structureValidation.checksPerformed;

      // Data integrity validation
      const integrityValidation = this.validateDataIntegrity(dataset);
      errors.push(...integrityValidation.errors);
      warnings.push(...integrityValidation.warnings);
      totalChecks += integrityValidation.checksPerformed;

      // Format-specific validation
      const formatValidation = this.validateFormat(dataset);
      errors.push(...formatValidation.errors);
      warnings.push(...formatValidation.warnings);
      totalChecks += formatValidation.checksPerformed;

      // Performance validation
      const performanceValidation = this.validatePerformance(dataset);
      warnings.push(...performanceValidation.warnings);
      totalChecks += performanceValidation.checksPerformed;

      // Security validation
      const securityValidation = this.validateSecurity(dataset);
      errors.push(...securityValidation.errors);
      warnings.push(...securityValidation.warnings);
      totalChecks += securityValidation.checksPerformed;

      const processingTime = Date.now() - startTime;
      const result: ValidationResult = {
        isValid: errors.filter(e => e.severity === 'critical').length === 0,
        errors,
        warnings,
        metrics: {
          totalChecks,
          passed: totalChecks - errors.length - warnings.length,
          failed: errors.length,
          warnings: warnings.length,
          processingTime
        }
      };

      // Store in history
      this.addToHistory(result);

      logger.info('Dataset validation completed', {
        datasetId: dataset.id,
        isValid: result.isValid,
        errorCount: errors.length,
        warningCount: warnings.length,
        processingTime
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const criticalError: ValidationError = {
        code: 'VALIDATION_FAILED',
        message: `Validation process failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        context: { datasetId: dataset.id, filename: dataset.filename }
      };

      const result: ValidationResult = {
        isValid: false,
        errors: [criticalError],
        warnings: [],
        metrics: {
          totalChecks,
          passed: 0,
          failed: 1,
          warnings: 0,
          processingTime
        }
      };

      logger.error('Dataset validation failed', { error, datasetId: dataset.id });
      return result;
    }
  }

  /**
   * Validate dataset structure
   */
  private validateStructure(dataset: TridiumDataset): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checksPerformed: number;
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checksPerformed = 0;

    // Check if dataset has required properties
    checksPerformed++;
    if (!dataset.id || !dataset.filename) {
      errors.push({
        code: 'MISSING_REQUIRED_FIELDS',
        message: 'Dataset is missing required fields (id or filename)',
        severity: 'critical',
        context: { hasId: !!dataset.id, hasFilename: !!dataset.filename }
      });
    }

    // Check columns structure
    checksPerformed++;
    if (!dataset.columns || dataset.columns.length === 0) {
      errors.push({
        code: 'NO_COLUMNS',
        message: 'Dataset has no columns defined',
        severity: 'critical',
        suggestions: ['Ensure the file has a proper header row']
      });
    }

    // Check rows structure
    checksPerformed++;
    if (!dataset.rows || dataset.rows.length === 0) {
      errors.push({
        code: 'NO_DATA_ROWS',
        message: 'Dataset contains no data rows',
        severity: 'error',
        suggestions: ['Ensure the file contains data beyond the header row']
      });
    }

    // Check metadata presence
    checksPerformed++;
    if (!dataset.metadata) {
      warnings.push({
        code: 'MISSING_METADATA',
        message: 'Dataset metadata is missing',
        recommendations: ['Add metadata for better tracking and debugging']
      });
    }

    // Check summary presence
    checksPerformed++;
    if (!dataset.summary) {
      warnings.push({
        code: 'MISSING_SUMMARY',
        message: 'Dataset summary is missing',
        recommendations: ['Generate summary statistics for better insights']
      });
    }

    return { errors, warnings, checksPerformed };
  }

  /**
   * Validate data integrity
   */
  private validateDataIntegrity(dataset: TridiumDataset): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checksPerformed: number;
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checksPerformed = 0;

    if (!dataset.rows || !dataset.columns) {
      return { errors, warnings, checksPerformed };
    }

    // Check row consistency
    checksPerformed++;
    const expectedColumnCount = dataset.columns.length;
    const inconsistentRows = dataset.rows.filter(row => 
      Object.keys(row.data).length !== expectedColumnCount
    );

    if (inconsistentRows.length > 0) {
      errors.push({
        code: 'INCONSISTENT_ROW_STRUCTURE',
        message: `${inconsistentRows.length} rows have inconsistent column count`,
        severity: 'error',
        context: { 
          expected: expectedColumnCount,
          inconsistentCount: inconsistentRows.length,
          totalRows: dataset.rows.length
        },
        suggestions: ['Check for malformed CSV rows or missing data']
      });
    }

    // Check for empty critical fields
    checksPerformed++;
    const nameColumn = dataset.columns.find(c => 
      c.key.toLowerCase().includes('name') || c.key.toLowerCase().includes('id')
    );

    if (nameColumn) {
      const emptyNameRows = dataset.rows.filter(row => 
        !row.data[nameColumn.key] || 
        row.data[nameColumn.key].toString().trim() === ''
      );

      if (emptyNameRows.length > 0) {
        warnings.push({
          code: 'EMPTY_CRITICAL_FIELDS',
          message: `${emptyNameRows.length} rows have empty name/ID fields`,
          context: { 
            columnKey: nameColumn.key,
            emptyCount: emptyNameRows.length,
            percentage: (emptyNameRows.length / dataset.rows.length * 100).toFixed(1)
          },
          recommendations: ['Review data source for completeness']
        });
      }
    }

    // Check for duplicate entries
    checksPerformed++;
    if (nameColumn) {
      const nameValues = dataset.rows
        .map(row => row.data[nameColumn.key])
        .filter(Boolean)
        .map(name => name.toString().trim().toLowerCase());
      
      const duplicates = nameValues.filter((name, index, array) => 
        array.indexOf(name) !== index
      );

      if (duplicates.length > 0) {
        const uniqueDuplicates = [...new Set(duplicates)];
        warnings.push({
          code: 'DUPLICATE_ENTRIES',
          message: `Found ${uniqueDuplicates.length} duplicate entries`,
          context: { 
            duplicateCount: uniqueDuplicates.length,
            examples: uniqueDuplicates.slice(0, 5)
          },
          recommendations: ['Consider deduplication or data source review']
        });
      }
    }

    // Check for data corruption signs
    checksPerformed++;
    const corruptedRows = dataset.rows.filter(row => {
      return Object.values(row.data).some(value => {
        const str = value?.toString() || '';
        return str.includes('\x00') || 
               str.includes('�') || 
               str.match(/[\x00-\x08\x0B\x0C\x0E-\x1F]/);
      });
    });

    if (corruptedRows.length > 0) {
      warnings.push({
        code: 'POTENTIAL_DATA_CORRUPTION',
        message: `${corruptedRows.length} rows show signs of data corruption`,
        context: { corruptedCount: corruptedRows.length },
        recommendations: [
          'Check file encoding (should be UTF-8)',
          'Verify data export process',
          'Consider re-exporting the source data'
        ]
      });
    }

    return { errors, warnings, checksPerformed };
  }

  /**
   * Validate format-specific rules
   */
  private validateFormat(dataset: TridiumDataset): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checksPerformed: number;
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checksPerformed = 0;

    // Format-specific validation based on dataset category
    switch (dataset.category) {
      case 'networkDevices':
        const networkValidation = this.validateNetworkDevices(dataset);
        errors.push(...networkValidation.errors);
        warnings.push(...networkValidation.warnings);
        checksPerformed += networkValidation.checksPerformed;
        break;

      case 'bacnetDevices':
        const bacnetValidation = this.validateBacnetDevices(dataset);
        errors.push(...bacnetValidation.errors);
        warnings.push(...bacnetValidation.warnings);
        checksPerformed += bacnetValidation.checksPerformed;
        break;

      case 'resourceMetrics':
        const resourceValidation = this.validateResourceMetrics(dataset);
        errors.push(...resourceValidation.errors);
        warnings.push(...resourceValidation.warnings);
        checksPerformed += resourceValidation.checksPerformed;
        break;

      default:
        checksPerformed++;
        warnings.push({
          code: 'UNKNOWN_FORMAT',
          message: `Dataset format '${dataset.category}' is not recognized`,
          recommendations: ['Verify file format and naming conventions']
        });
    }

    return { errors, warnings, checksPerformed };
  }

  /**
   * Validate network devices
   */
  private validateNetworkDevices(dataset: TridiumDataset): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checksPerformed: number;
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checksPerformed = 1;

    const addressColumn = dataset.columns.find(c => c.key === 'Address');
    if (addressColumn) {
      const invalidAddresses = dataset.rows.filter(row => {
        const addr = row.data[addressColumn.key];
        if (!addr) return false;
        const addrStr = addr.toString();
        return isNaN(parseInt(addrStr)) && !addrStr.includes('.');
      });

      if (invalidAddresses.length > 0) {
        warnings.push({
          code: 'INVALID_NETWORK_ADDRESSES',
          message: `${invalidAddresses.length} devices have invalid address formats`,
          context: { invalidCount: invalidAddresses.length },
          recommendations: ['Verify address format (should be numeric or IP address)']
        });
      }
    }

    return { errors, warnings, checksPerformed };
  }

  /**
   * Validate BACnet devices
   */
  private validateBacnetDevices(dataset: TridiumDataset): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checksPerformed: number;
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checksPerformed = 1;

    const deviceIdColumn = dataset.columns.find(c => c.key === 'Device ID');
    if (deviceIdColumn) {
      const invalidDeviceIds = dataset.rows.filter(row => {
        const deviceId = row.data[deviceIdColumn.key];
        if (!deviceId) return false;
        const id = parseInt(deviceId.toString());
        return isNaN(id) || id < 0 || id > 4194303; // BACnet Device ID range
      });

      if (invalidDeviceIds.length > 0) {
        errors.push({
          code: 'INVALID_BACNET_DEVICE_IDS',
          message: `${invalidDeviceIds.length} devices have invalid BACnet Device IDs`,
          severity: 'error',
          context: { 
            invalidCount: invalidDeviceIds.length,
            validRange: '0-4194303'
          },
          suggestions: ['Verify BACnet Device ID assignments']
        });
      }
    }

    return { errors, warnings, checksPerformed };
  }

  /**
   * Validate resource metrics
   */
  private validateResourceMetrics(dataset: TridiumDataset): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checksPerformed: number;
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checksPerformed = 1;

    const valueColumn = dataset.columns.find(c => c.key === 'Value');
    if (valueColumn) {
      const unparsableValues = dataset.rows.filter(row => {
        const value = row.data[valueColumn.key];
        if (!value) return false;
        
        const valueStr = value.toString().trim();
        // Check if it looks like it should be a metric but can't be parsed
        return valueStr.length > 0 && 
               !valueStr.match(/\d/) && 
               !valueStr.toLowerCase().includes('unknown') &&
               !valueStr.toLowerCase().includes('n/a');
      });

      if (unparsableValues.length > 0) {
        warnings.push({
          code: 'UNPARSABLE_RESOURCE_VALUES',
          message: `${unparsableValues.length} resource values could not be parsed`,
          context: { unparsableCount: unparsableValues.length },
          recommendations: ['Review data format for numeric values and units']
        });
      }
    }

    return { errors, warnings, checksPerformed };
  }

  /**
   * Validate performance aspects
   */
  private validatePerformance(dataset: TridiumDataset): {
    warnings: ValidationWarning[];
    checksPerformed: number;
  } {
    const warnings: ValidationWarning[] = [];
    let checksPerformed = 0;

    // Check dataset size
    checksPerformed++;
    if (dataset.rows.length > 10000) {
      warnings.push({
        code: 'LARGE_DATASET',
        message: `Dataset has ${dataset.rows.length} rows, which may impact performance`,
        context: { rowCount: dataset.rows.length },
        recommendations: [
          'Consider pagination for large datasets',
          'Implement virtual scrolling for UI display',
          'Add data filtering capabilities'
        ]
      });
    }

    // Check column count
    checksPerformed++;
    if (dataset.columns.length > 50) {
      warnings.push({
        code: 'MANY_COLUMNS',
        message: `Dataset has ${dataset.columns.length} columns`,
        context: { columnCount: dataset.columns.length },
        recommendations: ['Consider column virtualization for better performance']
      });
    }

    return { warnings, checksPerformed };
  }

  /**
   * Validate security aspects
   */
  private validateSecurity(dataset: TridiumDataset): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    checksPerformed: number;
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let checksPerformed = 0;

    // Check for potential sensitive data
    checksPerformed++;
    const sensitivePatterns = [
      { pattern: /password|pwd|secret|key/i, type: 'credentials' },
      { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, type: 'ip_address' },
      { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, type: 'email' }
    ];

    const sensitiveFindings: { type: string; count: number }[] = [];

    dataset.rows.forEach(row => {
      Object.values(row.data).forEach(value => {
        const str = value?.toString() || '';
        sensitivePatterns.forEach(({ pattern, type }) => {
          if (pattern.test(str)) {
            const existing = sensitiveFindings.find(f => f.type === type);
            if (existing) {
              existing.count++;
            } else {
              sensitiveFindings.push({ type, count: 1 });
            }
          }
        });
      });
    });

    if (sensitiveFindings.length > 0) {
      warnings.push({
        code: 'POTENTIAL_SENSITIVE_DATA',
        message: 'Dataset may contain sensitive information',
        context: { findings: sensitiveFindings },
        recommendations: [
          'Review data for sensitive information',
          'Ensure proper data handling procedures',
          'Consider data masking for non-production use'
        ]
      });
    }

    return { errors, warnings, checksPerformed };
  }

  /**
   * Add validation result to history
   */
  private addToHistory(result: ValidationResult): void {
    this.validationHistory.unshift(result);
    if (this.validationHistory.length > this.MAX_HISTORY) {
      this.validationHistory = this.validationHistory.slice(0, this.MAX_HISTORY);
    }
  }

  /**
   * Get validation history
   */
  getValidationHistory(): ValidationResult[] {
    return [...this.validationHistory];
  }

  /**
   * Get validation statistics
   */
  getValidationStatistics(): {
    totalValidations: number;
    averageProcessingTime: number;
    errorRate: number;
    mostCommonErrors: Array<{ code: string; count: number }>;
    mostCommonWarnings: Array<{ code: string; count: number }>;
  } {
    if (this.validationHistory.length === 0) {
      return {
        totalValidations: 0,
        averageProcessingTime: 0,
        errorRate: 0,
        mostCommonErrors: [],
        mostCommonWarnings: []
      };
    }

    const totalValidations = this.validationHistory.length;
    const averageProcessingTime = 
      this.validationHistory.reduce((sum, result) => sum + result.metrics.processingTime, 0) / totalValidations;
    
    const totalErrors = this.validationHistory.reduce((sum, result) => sum + result.errors.length, 0);
    const errorRate = totalErrors / totalValidations;

    // Count error codes
    const errorCounts: Record<string, number> = {};
    const warningCounts: Record<string, number> = {};

    this.validationHistory.forEach(result => {
      result.errors.forEach(error => {
        errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
      });
      result.warnings.forEach(warning => {
        warningCounts[warning.code] = (warningCounts[warning.code] || 0) + 1;
      });
    });

    const mostCommonErrors = Object.entries(errorCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostCommonWarnings = Object.entries(warningCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalValidations,
      averageProcessingTime,
      errorRate,
      mostCommonErrors,
      mostCommonWarnings
    };
  }

  /**
   * Clear validation history
   */
  clearHistory(): void {
    this.validationHistory = [];
    logger.info('Validation history cleared');
  }

  /**
   * Export validation report
   */
  exportValidationReport(result: ValidationResult): string {
    const report = {
      timestamp: new Date().toISOString(),
      isValid: result.isValid,
      metrics: result.metrics,
      errors: result.errors.map(error => ({
        code: error.code,
        message: error.message,
        severity: error.severity,
        context: error.context,
        suggestions: error.suggestions
      })),
      warnings: result.warnings.map(warning => ({
        code: warning.code,
        message: warning.message,
        context: warning.context,
        recommendations: warning.recommendations
      }))
    };

    return JSON.stringify(report, null, 2);
  }
}

export default ValidationService;
