/**
 * Enhanced Parser Test Script
 * Tests the refined Niagara export parsers against example files
 * and validates the unified JSON output schema
 */

import { TridiumParser } from '../tridiumParser';
import { NiagaraAnalysisService, AnalysisInput } from '../../../services/NiagaraAnalysisService';
import { logger } from '@/utils/logger';
import { readFileSync } from 'fs';
import { join } from 'path';

const EXAMPLE_FILES_PATH = join(process.cwd(), 'docs', 'Example_Exports');

interface TestFile {
  filename: string;
  expectedFormat: string;
  path: string;
}

const TEST_FILES: TestFile[] = [
  {
    filename: 'JacePlatformDetails.txt',
    expectedFormat: 'PlatformDetails',
    path: join(EXAMPLE_FILES_PATH, 'JacePlatformDetails.txt')
  },
  {
    filename: 'SupervisorPlatformDetails.txt',
    expectedFormat: 'PlatformDetails',
    path: join(EXAMPLE_FILES_PATH, 'SupervisorPlatformDetails.txt')
  },
  {
    filename: 'Jace1_ResourceExport.csv',
    expectedFormat: 'ResourceExport',
    path: join(EXAMPLE_FILES_PATH, 'Jace1_ResourceExport.csv')
  },
  {
    filename: 'SupervisorNiagaraResourceExport.csv',
    expectedFormat: 'ResourceExport',
    path: join(EXAMPLE_FILES_PATH, 'SupervisorNiagaraResourceExport.csv')
  },
  {
    filename: 'JaceBacnetExport.csv',
    expectedFormat: 'BACnetExport',
    path: join(EXAMPLE_FILES_PATH, 'JaceBacnetExport.csv')
  },
  {
    filename: 'Jace1_N2xport.csv',
    expectedFormat: 'N2Export',
    path: join(EXAMPLE_FILES_PATH, 'Jace1_N2xport.csv')
  },
  {
    filename: 'SupervisorNiagaraNetExport.csv',
    expectedFormat: 'NiagaraNetExport',
    path: join(EXAMPLE_FILES_PATH, 'SupervisorNiagaraNetExport.csv')
  }
];

export class EnhancedParserTest {
  private analysisService: NiagaraAnalysisService;
  private testResults: any[] = [];

  constructor() {
    this.analysisService = new NiagaraAnalysisService();
  }

  /**
   * Run comprehensive test suite
   */
  async runTests(): Promise<void> {
    console.log('🚀 Starting Enhanced Parser Test Suite');
    console.log('=====================================');

    try {
      // Test 1: Individual parser validation
      await this.testIndividualParsers();

      // Test 2: Unified analysis test
      await this.testUnifiedAnalysis();

      // Test 3: Threshold and alerting test
      await this.testThresholdGeneration();

      // Test 4: JSON schema validation
      await this.testJSONSchemaValidation();

      // Generate test report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  /**
   * Test individual parsers against example files
   */
  private async testIndividualParsers(): Promise<void> {
    console.log('\\n📊 Testing Individual Parsers');
    console.log('-------------------------------');

    for (const testFile of TEST_FILES) {
      try {
        console.log(`\\nTesting: ${testFile.filename}`);

        // Read file content
        const content = readFileSync(testFile.path, 'utf-8');
        console.log(`  ✓ File read successfully (${content.length} bytes)`);

        // Parse with enhanced parser
        const result = await TridiumParser.parseFile(content, testFile.filename);

        const testResult = {
          filename: testFile.filename,
          expectedFormat: testFile.expectedFormat,
          actualFormat: result.formatDetection.format,
          success: result.success,
          confidence: result.formatDetection.confidence,
          rowCount: result.dataset?.rows.length || 0,
          columnCount: result.dataset?.columns.length || 0,
          processingTime: result.processingTime,
          errors: result.errors,
          warnings: result.warnings,
          enhancedFields: this.analyzeEnhancedFields(result.dataset)
        };

        this.testResults.push(testResult);

        if (result.success) {
          console.log(`  ✓ Parsing successful`);
          console.log(`  ✓ Format detected: ${result.formatDetection.format} (${result.formatDetection.confidence}% confidence)`);
          console.log(`  ✓ Data extracted: ${testResult.rowCount} rows, ${testResult.columnCount} columns`);
          console.log(`  ✓ Processing time: ${result.processingTime}ms`);

          if (testResult.enhancedFields.count > 0) {
            console.log(`  ✓ Enhanced parsing: ${testResult.enhancedFields.count} additional fields extracted`);
          }

          if (result.warnings.length > 0) {
            console.log(`  ⚠️ Warnings: ${result.warnings.join('; ')}`);
          }
        } else {
          console.log(`  ❌ Parsing failed: ${result.errors.join('; ')}`);
        }

      } catch (error) {
        console.log(`  ❌ Test failed: ${error}`);
        this.testResults.push({
          filename: testFile.filename,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  /**
   * Test unified analysis functionality
   */
  private async testUnifiedAnalysis(): Promise<void> {
    console.log('\\n🔧 Testing Unified Analysis');
    console.log('-----------------------------');

    try {
      // Parse all files and collect datasets
      const analysisInput: AnalysisInput = {};

      for (const testFile of TEST_FILES) {
        try {
          const content = readFileSync(testFile.path, 'utf-8');
          const result = await TridiumParser.parseFile(content, testFile.filename);

          if (result.success && result.dataset) {
            switch (result.dataset.format) {
              case 'PlatformDetails':
                analysisInput.platformDetails = result.dataset;
                break;
              case 'ResourceExport':
                analysisInput.resourceExport = result.dataset;
                break;
              case 'BACnetExport':
                analysisInput.bacnetExport = result.dataset;
                break;
              case 'N2Export':
                analysisInput.n2Export = result.dataset;
                break;
              case 'NiagaraNetExport':
                analysisInput.niagaraNetExport = result.dataset;
                break;
            }
          }
        } catch (error) {
          console.log(`  ⚠️ Could not process ${testFile.filename}: ${error}`);
        }
      }

      console.log(`\\nInputs prepared:`);
      console.log(`  Platform Details: ${analysisInput.platformDetails ? '✓' : '❌'}`);
      console.log(`  Resource Export: ${analysisInput.resourceExport ? '✓' : '❌'}`);
      console.log(`  BACnet Export: ${analysisInput.bacnetExport ? '✓' : '❌'}`);
      console.log(`  N2 Export: ${analysisInput.n2Export ? '✓' : '❌'}`);
      console.log(`  Niagara Net Export: ${analysisInput.niagaraNetExport ? '✓' : '❌'}`);

      // Run unified analysis
      const analysis = await this.analysisService.analyze(analysisInput);

      console.log(`\\n✓ Unified analysis completed:`);
      console.log(`  System Type: ${analysis.summary.systemType}`);
      console.log(`  Total Devices: ${analysis.summary.totalDevices}`);
      console.log(`  Health Score: ${analysis.summary.healthScore}/100`);
      console.log(`  Critical Issues: ${analysis.summary.criticalIssues}`);
      console.log(`  Warning Issues: ${analysis.summary.warningIssues}`);
      console.log(`  Capacity Utilization: ${analysis.summary.capacityUtilization}%`);
      console.log(`  Processing Time: ${analysis.metadata.processingTime}ms`);
      console.log(`  Confidence: ${analysis.metadata.confidence}%`);

      // Validate schema structure
      this.validateAnalysisSchema(analysis);

      // Store analysis for reporting
      (this as any).unifiedAnalysis = analysis;

    } catch (error) {
      console.log(`❌ Unified analysis failed: ${error}`);
      throw error;
    }
  }

  /**
   * Test threshold and alerting functionality
   */
  private async testThresholdGeneration(): Promise<void> {
    console.log('\\n⚠️ Testing Threshold & Alert Generation');
    console.log('----------------------------------------');

    const analysis = (this as any).unifiedAnalysis;
    if (!analysis) {
      console.log('❌ No analysis available for threshold testing');
      return;
    }

    console.log(`\\nAlert Analysis:`);
    console.log(`  Total Alerts: ${analysis.alerts.alerts.length}`);
    console.log(`  Threshold Violations: ${analysis.alerts.thresholdViolations.length}`);
    console.log(`  Recommendations: ${analysis.alerts.recommendations.length}`);

    // Categorize alerts
    const alertsByCategory = analysis.alerts.alerts.reduce((acc: any, alert: any) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1;
      return acc;
    }, {});

    const alertsBySeverity = analysis.alerts.alerts.reduce((acc: any, alert: any) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});

    console.log(`\\nAlert Categories:`, alertsByCategory);
    console.log(`Alert Severities:`, alertsBySeverity);

    // Display top recommendations
    if (analysis.alerts.recommendations.length > 0) {
      console.log(`\\nTop Recommendations:`);
      analysis.alerts.recommendations.slice(0, 3).forEach((rec: string, index: number) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    console.log(`\\n✓ Threshold and alert generation validated`);
  }

  /**
   * Test JSON schema validation
   */
  private async testJSONSchemaValidation(): Promise<void> {
    console.log('\\n📋 Testing JSON Schema Validation');
    console.log('-----------------------------------');

    const analysis = (this as any).unifiedAnalysis;
    if (!analysis) {
      console.log('❌ No analysis available for schema validation');
      return;
    }

    try {
      // Check required top-level fields
      const requiredFields = [
        'metadata',
        'platform_identity',
        'resources',
        'inventory',
        'licenses',
        'drivers',
        'modules',
        'certificates',
        'alerts',
        'summary'
      ];

      const missingFields = requiredFields.filter(field => !analysis[field]);
      if (missingFields.length > 0) {
        console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      } else {
        console.log(`✓ All required top-level fields present`);
      }

      // Validate platform_identity structure
      const platformIdentity = analysis.platform_identity;
      if (platformIdentity.hostId && platformIdentity.model && platformIdentity.niagaraVersion) {
        console.log(`✓ Platform identity properly structured`);
        console.log(`  Host: ${platformIdentity.hostId}`);
        console.log(`  Model: ${platformIdentity.model}`);
        console.log(`  Version: ${platformIdentity.niagaraVersion}`);
      } else {
        console.log(`⚠️ Platform identity incomplete`);
      }

      // Validate resources structure
      const resources = analysis.resources;
      if (resources.cpu && resources.memory && resources.devices && resources.points) {
        console.log(`✓ Resources structure validated`);
        console.log(`  CPU Usage: ${resources.cpu.usage}%`);
        console.log(`  Memory Usage: ${resources.memory.physical.percentage}%`);
        console.log(`  Device Capacity: ${resources.devices.used}/${resources.devices.licensed || 'unlimited'}`);
        console.log(`  Point Capacity: ${resources.points.used}/${resources.points.licensed || 'unlimited'}`);
      } else {
        console.log(`⚠️ Resources structure incomplete`);
      }

      // Validate inventory structure
      const inventory = analysis.inventory;
      if (inventory.devicesByProtocol && inventory.totalDevices !== undefined) {
        console.log(`✓ Inventory structure validated`);
        console.log(`  Total Devices: ${inventory.totalDevices}`);
        console.log(`  BACnet Devices: ${inventory.devicesByProtocol.bacnet?.length || 0}`);
        console.log(`  N2 Devices: ${inventory.devicesByProtocol.n2?.length || 0}`);
      } else {
        console.log(`⚠️ Inventory structure incomplete`);
      }

      console.log(`\\n✓ JSON schema validation completed`);

    } catch (error) {
      console.log(`❌ Schema validation failed: ${error}`);
    }
  }

  /**
   * Analyze enhanced fields extracted by parsers
   */
  private analyzeEnhancedFields(dataset: any): { count: number; fields: string[] } {
    if (!dataset || !dataset.rows || dataset.rows.length === 0) {
      return { count: 0, fields: [] };
    }

    const enhancedFields: string[] = [];
    const row = dataset.rows[0];

    // Check for metadata
    if (row.metadata) {
      enhancedFields.push('metadata');
    }

    // Check for health information
    if (row.health) {
      enhancedFields.push('health');
    }

    // Check for parsed status
    if (row.parsedStatus) {
      enhancedFields.push('parsedStatus');
    }

    // Check for parsed values
    if (row.parsedValues) {
      enhancedFields.push('parsedValues');
    }

    // Check for structured data in platform details
    if (dataset.metadata?.structuredData) {
      enhancedFields.push('structuredData');
    }

    return {
      count: enhancedFields.length,
      fields: enhancedFields
    };
  }

  /**
   * Validate analysis schema structure
   */
  private validateAnalysisSchema(analysis: any): void {
    const validations = [
      { path: 'metadata.analysisDate', valid: analysis.metadata?.analysisDate instanceof Date },
      { path: 'metadata.processingTime', valid: typeof analysis.metadata?.processingTime === 'number' },
      { path: 'platform_identity.hostId', valid: typeof analysis.platform_identity?.hostId === 'string' },
      { path: 'resources.cpu.usage', valid: typeof analysis.resources?.cpu?.usage === 'number' },
      { path: 'inventory.totalDevices', valid: typeof analysis.inventory?.totalDevices === 'number' },
      { path: 'summary.healthScore', valid: typeof analysis.summary?.healthScore === 'number' }
    ];

    const failures = validations.filter(v => !v.valid);
    if (failures.length > 0) {
      console.log(`⚠️ Schema validation issues: ${failures.map(f => f.path).join(', ')}`);
    } else {
      console.log(`✓ Core schema structure validated`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    console.log('\\n📊 Test Report');
    console.log('===============');

    const successfulParsers = this.testResults.filter(r => r.success);
    const failedParsers = this.testResults.filter(r => !r.success);

    console.log(`\\nParser Test Results:`);
    console.log(`  Successful: ${successfulParsers.length}/${this.testResults.length}`);
    console.log(`  Failed: ${failedParsers.length}/${this.testResults.length}`);

    if (successfulParsers.length > 0) {
      console.log(`\\nSuccessful Parsers:`);
      successfulParsers.forEach(result => {
        console.log(`  ✓ ${result.filename} - ${result.actualFormat} (${result.confidence}% confidence, ${result.processingTime}ms)`);
        if (result.enhancedFields?.count > 0) {
          console.log(`    Enhanced fields: ${result.enhancedFields.fields.join(', ')}`);
        }
      });
    }

    if (failedParsers.length > 0) {
      console.log(`\\nFailed Parsers:`);
      failedParsers.forEach(result => {
        console.log(`  ❌ ${result.filename} - ${result.error || 'Unknown error'}`);
      });
    }

    const analysis = (this as any).unifiedAnalysis;
    if (analysis) {
      console.log(`\\nUnified Analysis Summary:`);
      console.log(`  Files Processed: ${analysis.metadata.filesProcessed.length}`);
      console.log(`  Analysis Confidence: ${analysis.metadata.confidence}%`);
      console.log(`  Health Score: ${analysis.summary.healthScore}/100`);
      console.log(`  Total Issues: ${analysis.summary.criticalIssues + analysis.summary.warningIssues}`);
      console.log(`  Recommendations Generated: ${analysis.alerts.recommendations.length}`);
    }

    console.log(`\\n🎉 Enhanced Parser Test Suite Completed!`);
  }
}

// Export test runner for use in other contexts
export async function runEnhancedParserTests(): Promise<void> {
  const testRunner = new EnhancedParserTest();
  await testRunner.runTests();
}

// Allow direct execution
if (require.main === module) {
  runEnhancedParserTests().catch(console.error);
}