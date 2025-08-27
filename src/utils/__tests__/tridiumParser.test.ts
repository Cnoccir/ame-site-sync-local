import { TridiumCSVParser } from '../tridiumParser';
import { TridiumDataset, ParsedStatus, ParsedValue } from '@/types/tridium';

describe('TridiumCSVParser', () => {
  // Sample data for testing
  const sampleN2Export = `Name,Status,Address,Controller Type
AHU-1,{ok},1,AHU Controller
VAV-101,{down,alarm},2,VAV Controller
LIGHT-1,{fault},3,Lighting Controller`;

  const sampleResourceExport = `Name,Value
Memory Usage,84 (Limit: 101)
CPU Usage,45.2%
Connection Pool,15 of 20
Platform Version,4.12.1.16`;

  const sampleBacnetExport = `Name,Type,Device ID,Status,Vendor,Model
BAS-1,Controller,1001,{ok},Tridium,JACE-8000
VAV-201,VAV,1002,{alarm,unackedAlarm},Johnson Controls,VMA1045`;

  const samplePlatformDetails = `Platform Summary:
Platform: Niagara AX 3.7.106.10
Station Name: BAS-SUPERVISOR
License Type: JACE-8000

Modules:
- bacnet
- niagaraDriver
- webService

Applications:
- Building Management System
- Energy Monitoring`;

  const malformedCSV = `Name,Status,Address
Device1,ok,1
Device2,down,2,extra_column
Device3`;

  describe('File Content Parsing', () => {
    test('should parse N2 export format correctly', () => {
      const result = TridiumCSVParser.parseFileContent(sampleN2Export, 'n2_export.csv');
      
      expect(result.type).toBe('networkDevices');
      expect(result.format).toBe('N2Export');
      expect(result.rows).toHaveLength(3);
      expect(result.columns).toHaveLength(4);
      
      const firstRow = result.rows[0];
      expect(firstRow.data.Name).toBe('AHU-1');
      expect(firstRow.data['Controller Type']).toBe('AHU Controller');
      expect(firstRow.parsedStatus?.status).toBe('ok');
    });

    test('should parse Resource export format correctly', () => {
      const result = TridiumCSVParser.parseFileContent(sampleResourceExport, 'resource_export.csv');
      
      expect(result.type).toBe('resourceMetrics');
      expect(result.format).toBe('ResourceExport');
      expect(result.rows).toHaveLength(4);
      expect(result.columns).toHaveLength(2);
      
      const memoryRow = result.rows[0];
      expect(memoryRow.data.Name).toBe('Memory Usage');
      expect(memoryRow.parsedValues?.Value?.type).toBe('count');
      expect(memoryRow.parsedValues?.Value?.metadata?.limit).toBe(101);
    });

    test('should parse BACnet export format correctly', () => {
      const result = TridiumCSVParser.parseFileContent(sampleBacnetExport, 'bacnet_export.csv');
      
      expect(result.type).toBe('bacnetDevices');
      expect(result.format).toBe('BacnetExport');
      expect(result.rows).toHaveLength(2);
      
      const firstDevice = result.rows[0];
      expect(firstDevice.data.Name).toBe('BAS-1');
      expect(firstDevice.data['Device ID']).toBe('1001');
      expect(firstDevice.data.Vendor).toBe('Tridium');
    });

    test('should parse platform details text file correctly', () => {
      const result = TridiumCSVParser.parseFileContent(samplePlatformDetails, 'platform_details.txt');
      
      expect(result.type).toBe('resourceMetrics');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].data.Platform).toContain('Niagara AX 3.7.106.10');
    });
  });

  describe('Status Parsing', () => {
    test('should parse simple status values', () => {
      const okStatus = TridiumCSVParser.parseStatus('ok');
      expect(okStatus.status).toBe('ok');
      expect(okStatus.severity).toBe('normal');
      expect(okStatus.badge.variant).toBe('success');

      const downStatus = TridiumCSVParser.parseStatus('down');
      expect(downStatus.status).toBe('down');
      expect(downStatus.severity).toBe('critical');
      expect(downStatus.badge.variant).toBe('destructive');
    });

    test('should parse compound status strings', () => {
      const compoundStatus = TridiumCSVParser.parseStatus('{down,alarm,unackedAlarm}');
      expect(compoundStatus.status).toBe('down');
      expect(compoundStatus.severity).toBe('critical');
      expect(compoundStatus.details).toContain('Device offline');
      expect(compoundStatus.details).toContain('Alarm condition present');
    });

    test('should handle empty or unknown status', () => {
      const emptyStatus = TridiumCSVParser.parseStatus('');
      expect(emptyStatus.status).toBe('unknown');
      expect(emptyStatus.badge.text).toBe('UNKNOWN');
      
      const unknownStatus = TridiumCSVParser.parseStatus('custom_status');
      expect(unknownStatus.status).toBe('unknown');
    });

    test('should parse fault conditions correctly', () => {
      const faultStatus = TridiumCSVParser.parseStatus('{fault,alarm}');
      expect(faultStatus.status).toBe('fault');
      expect(faultStatus.severity).toBe('critical');
      expect(faultStatus.badge.text).toBe('FAULT');
    });
  });

  describe('Value Parsing', () => {
    test('should parse memory values with units', () => {
      const result = TridiumCSVParser.parseValue('512 MB');
      expect(result.type).toBe('memory');
      expect(result.value).toBe(512);
      expect(result.unit).toBe('MB');
    });

    test('should parse percentage values', () => {
      const result = TridiumCSVParser.parseValue('75.5%');
      expect(result.type).toBe('percentage');
      expect(result.value).toBe(75.5);
      expect(result.unit).toBe('%');
    });

    test('should parse values with limits', () => {
      const result = TridiumCSVParser.parseValue('84 (Limit: 101)');
      expect(result.type).toBe('count');
      expect(result.value).toBe(84);
      expect(result.metadata?.limit).toBe(101);
      expect(result.metadata?.percentage).toBeCloseTo(83.17, 1);
    });

    test('should parse comma-separated numbers', () => {
      const result = TridiumCSVParser.parseValue('3,303');
      expect(result.type).toBe('count');
      expect(result.value).toBe(3303);
    });

    test('should parse duration values', () => {
      const result = TridiumCSVParser.parseValue('5.5 hours');
      expect(result.type).toBe('duration');
      expect(result.value).toBe(5.5);
      expect(result.unit).toBe('hours');
    });

    test('should parse IP addresses', () => {
      const result = TridiumCSVParser.parseValue('192.168.1.100:1911');
      expect(result.type).toBe('text');
      expect(result.value).toBe('192.168.1.100:1911');
      expect(result.metadata?.isIPAddress).toBe(true);
    });

    test('should parse version numbers', () => {
      const result = TridiumCSVParser.parseValue('4.12.1.16');
      expect(result.type).toBe('text');
      expect(result.value).toBe('4.12.1.16');
      expect(result.metadata?.isVersion).toBe(true);
    });

    test('should parse kRU (Kilo Resource Units)', () => {
      const result = TridiumCSVParser.parseValue('2.5 kRU');
      expect(result.type).toBe('count');
      expect(result.value).toBe(2.5);
      expect(result.unit).toBe('kRU');
    });

    test('should handle empty values', () => {
      const result = TridiumCSVParser.parseValue('');
      expect(result.type).toBe('text');
      expect(result.value).toBe('');
      expect(result.formatted).toBe('');
    });

    test('should normalize memory units', () => {
      const kbResult = TridiumCSVParser.parseValue('1024 KB');
      expect(kbResult.type).toBe('memory');
      expect(kbResult.value).toBe(1); // Normalized to MB

      const gbResult = TridiumCSVParser.parseValue('2 GB');
      expect(gbResult.type).toBe('memory');
      expect(gbResult.value).toBe(2048); // Normalized to MB
    });
  });

  describe('Format Detection', () => {
    test('should detect N2 export format', () => {
      const headers = ['Name', 'Status', 'Address', 'Controller Type'];
      const format = (TridiumCSVParser as any).detectFormat(headers, 'n2_export.csv');
      expect(format.name).toBe('N2Export');
      expect(format.type).toBe('networkDevices');
    });

    test('should detect Resource export format', () => {
      const headers = ['Name', 'Value'];
      const format = (TridiumCSVParser as any).detectFormat(headers, 'resource_metrics.csv');
      expect(format.name).toBe('ResourceExport');
      expect(format.type).toBe('resourceMetrics');
    });

    test('should detect BACnet export format', () => {
      const headers = ['Name', 'Type', 'Device ID', 'Status', 'Vendor'];
      const format = (TridiumCSVParser as any).detectFormat(headers, 'bacnet_devices.csv');
      expect(format.name).toBe('BacnetExport');
      expect(format.type).toBe('bacnetDevices');
    });

    test('should detect Niagara Network export format', () => {
      const headers = ['Path', 'Name', 'Type', 'Address', 'Platform Status'];
      const format = (TridiumCSVParser as any).detectFormat(headers, 'niagara_net.csv');
      expect(format.name).toBe('NiagaraNetExport');
      expect(format.type).toBe('niagaraStations');
    });

    test('should handle unknown format gracefully', () => {
      const headers = ['Unknown1', 'Unknown2'];
      const format = (TridiumCSVParser as any).detectFormat(headers, 'unknown.csv');
      expect(format.name).toBe('Unknown');
      expect(format.type).toBe('unknown');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed CSV gracefully', () => {
      const result = TridiumCSVParser.parseFileContent(malformedCSV, 'malformed.csv');
      expect(result.metadata.parseErrors.length).toBeGreaterThan(0);
      expect(result.rows.length).toBe(2); // Should parse valid rows
    });

    test('should validate file before parsing', () => {
      const validation = TridiumCSVParser.validateFile('', 'empty.csv');
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('File is empty or contains only whitespace');
    });

    test('should detect encoding issues', () => {
      const contentWithNulls = 'Name,Status\nDevice1\x00,ok';
      const validation = TridiumCSVParser.validateFile(contentWithNulls, 'test.csv');
      expect(validation.warnings.some(w => w.includes('null bytes'))).toBe(true);
    });

    test('should handle oversized files', () => {
      const largeContent = 'x'.repeat(51 * 1024 * 1024); // 51MB
      const validation = TridiumCSVParser.validateFile(largeContent, 'large.csv');
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(e => e.includes('exceeds maximum limit'))).toBe(true);
    });

    test('should track error statistics', () => {
      // Reset statistics
      TridiumCSVParser.resetErrorStatistics();
      
      // Parse malformed data to generate errors
      TridiumCSVParser.parseFileContent(malformedCSV, 'malformed.csv');
      
      const stats = TridiumCSVParser.getErrorStatistics();
      expect(stats.counts.parseErrors).toBeGreaterThan(0);
    });
  });

  describe('CSV Line Parsing', () => {
    test('should parse quoted CSV fields correctly', () => {
      const line = 'Device1,"Status with, comma",Address1';
      const result = (TridiumCSVParser as any).parseCSVLine(line);
      expect(result).toEqual(['Device1', 'Status with, comma', 'Address1']);
    });

    test('should handle escaped quotes in CSV', () => {
      const line = 'Device1,"Status ""quoted"" value",Address1';
      const result = (TridiumCSVParser as any).parseCSVLine(line);
      expect(result).toEqual(['Device1', 'Status "quoted" value', 'Address1']);
    });

    test('should handle mixed quoted and unquoted fields', () => {
      const line = 'Device1,ok,"192.168.1.1",Controller';
      const result = (TridiumCSVParser as any).parseCSVLine(line);
      expect(result).toEqual(['Device1', 'ok', '192.168.1.1', 'Controller']);
    });
  });

  describe('Column Type Detection', () => {
    test('should detect status column types', () => {
      const statusType = (TridiumCSVParser as any).detectColumnType('Status');
      expect(statusType).toBe('status');
      
      const healthType = (TridiumCSVParser as any).detectColumnType('Device Health');
      expect(healthType).toBe('status');
    });

    test('should detect value column types', () => {
      const valueType = (TridiumCSVParser as any).detectColumnType('Value');
      expect(valueType).toBe('value');
      
      const usageType = (TridiumCSVParser as any).detectColumnType('CPU Usage %');
      expect(usageType).toBe('value');
    });

    test('should detect date column types', () => {
      const dateType = (TridiumCSVParser as any).detectColumnType('Last Updated');
      expect(dateType).toBe('date');
      
      const timestampType = (TridiumCSVParser as any).detectColumnType('Timestamp');
      expect(timestampType).toBe('date');
    });

    test('should detect number column types', () => {
      const idType = (TridiumCSVParser as any).detectColumnType('Device ID');
      expect(idType).toBe('number');
      
      const countType = (TridiumCSVParser as any).detectColumnType('Connection Count');
      expect(countType).toBe('number');
    });
  });

  describe('Data Sanitization', () => {
    test('should sanitize control characters', () => {
      const dirtyData = 'Device1\x00\x01\x02';
      const cleaned = TridiumCSVParser.sanitizeData(dirtyData);
      expect(cleaned).toBe('Device1');
    });

    test('should sanitize Unicode replacement characters', () => {
      const dirtyData = 'Device�Name';
      const cleaned = TridiumCSVParser.sanitizeData(dirtyData);
      expect(cleaned).toBe('Device?Name');
    });

    test('should sanitize nested objects', () => {
      const dirtyData = {
        name: 'Device\x00Name',
        status: 'OK�Status',
        nested: {
          value: 'Test\x01Value'
        }
      };
      const cleaned = TridiumCSVParser.sanitizeData(dirtyData);
      expect(cleaned.name).toBe('DeviceName');
      expect(cleaned.status).toBe('OK?Status');
      expect(cleaned.nested.value).toBe('TestValue');
    });

    test('should sanitize arrays', () => {
      const dirtyArray = ['Device\x00Name', 'Status\x01OK'];
      const cleaned = TridiumCSVParser.sanitizeData(dirtyArray);
      expect(cleaned).toEqual(['DeviceName', 'StatusOK']);
    });
  });

  describe('Summary Generation', () => {
    test('should generate correct device count summary', () => {
      const result = TridiumCSVParser.parseFileContent(sampleN2Export, 'n2_export.csv');
      expect(result.summary.totalDevices).toBe(3);
    });

    test('should generate status breakdown', () => {
      const result = TridiumCSVParser.parseFileContent(sampleN2Export, 'n2_export.csv');
      expect(result.summary.statusBreakdown.ok).toBe(1);
      expect(result.summary.statusBreakdown.down).toBe(1);
      expect(result.summary.statusBreakdown.fault).toBe(1);
    });

    test('should generate type breakdown', () => {
      const result = TridiumCSVParser.parseFileContent(sampleN2Export, 'n2_export.csv');
      expect(result.summary.typeBreakdown['AHU Controller']).toBe(1);
      expect(result.summary.typeBreakdown['VAV Controller']).toBe(1);
      expect(result.summary.typeBreakdown['Lighting Controller']).toBe(1);
    });

    test('should generate recommendations based on status', () => {
      const result = TridiumCSVParser.parseFileContent(sampleN2Export, 'n2_export.csv');
      expect(result.summary.recommendations).toContain('1 devices are offline and require immediate attention');
      expect(result.summary.recommendations).toContain('1 devices show fault conditions');
    });
  });

  describe('Platform Details Parsing', () => {
    test('should extract platform summary correctly', () => {
      const result = TridiumCSVParser.parsePlatformDetails(samplePlatformDetails, 'platform.txt');
      expect(result.rows[0].data.Platform).toContain('Niagara AX 3.7.106.10');
      expect(result.rows[0].data['Station Name']).toBe('BAS-SUPERVISOR');
    });

    test('should handle sectioned data', () => {
      const result = TridiumCSVParser.parsePlatformDetails(samplePlatformDetails, 'platform.txt');
      expect(result.rows[0].data.Modules).toContain('bacnet');
      expect(result.rows[0].data.Applications).toContain('Building Management System');
    });
  });

  describe('Edge Cases', () => {
    test('should handle files with only headers', () => {
      const headerOnlyCSV = 'Name,Status,Address';
      expect(() => {
        TridiumCSVParser.parseFileContent(headerOnlyCSV, 'header_only.csv');
      }).toThrow('CSV file must have at least a header and one data row');
    });

    test('should handle completely empty files', () => {
      const validation = TridiumCSVParser.validateFile('', 'empty.csv');
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('File is empty or contains only whitespace');
    });

    test('should handle files with inconsistent column counts', () => {
      const inconsistentCSV = `Name,Status,Address
Device1,ok,1
Device2,down
Device3,fault,3,extra`;
      
      const result = TridiumCSVParser.parseFileContent(inconsistentCSV, 'inconsistent.csv');
      expect(result.metadata.parseErrors.length).toBeGreaterThan(0);
    });

    test('should handle special characters in data', () => {
      const specialCharCSV = `Name,Status,Address
"Device, with comma",ok,1
Device with "quotes",down,2
Device with 'apostrophe',fault,3`;
      
      const result = TridiumCSVParser.parseFileContent(specialCharCSV, 'special.csv');
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].data.Name).toBe('Device, with comma');
    });

    test('should handle Unicode characters', () => {
      const unicodeCSV = `Name,Status,Address
Température Sensor,ok,1
Contrôleur Principal,down,2`;
      
      const result = TridiumCSVParser.parseFileContent(unicodeCSV, 'unicode.csv');
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].data.Name).toBe('Température Sensor');
    });
  });

  describe('Performance', () => {
    test('should handle moderately large datasets', () => {
      const largeCSV = 'Name,Status,Address,Type\n' + 
        Array.from({ length: 1000 }, (_, i) => `Device${i},ok,${i},Controller`).join('\n');
      
      const startTime = Date.now();
      const result = TridiumCSVParser.parseFileContent(largeCSV, 'large.csv');
      const endTime = Date.now();
      
      expect(result.rows).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should parse in under 5 seconds
    });

    test('should track processing time in metadata', () => {
      const result = TridiumCSVParser.parseFileContent(sampleN2Export, 'n2_export.csv');
      expect(result.metadata.uploadedAt).toBeInstanceOf(Date);
      expect(result.metadata.fileSize).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  test('should handle real-world N2 export scenario', () => {
    const realWorldN2 = `Name,Status,Address,Controller Type,Network
AHU-MAIN-01,{ok},1,AHU Controller,N2-1
AHU-MAIN-02,{down,alarm,unackedAlarm},2,AHU Controller,N2-1
VAV-ZONE-101,{ok},3,VAV Controller,N2-1
VAV-ZONE-102,{fault,alarm},4,VAV Controller,N2-1
LIGHT-PANEL-A,{ok},5,Lighting Controller,N2-2`;
    
    const result = TridiumCSVParser.parseFileContent(realWorldN2, 'building_n2_export.csv');
    
    expect(result.type).toBe('networkDevices');
    expect(result.rows).toHaveLength(5);
    expect(result.summary.statusBreakdown.ok).toBe(2);
    expect(result.summary.statusBreakdown.down).toBe(1);
    expect(result.summary.statusBreakdown.fault).toBe(1);
  });

  test('should handle complex resource metrics', () => {
    const complexResources = `Name,Value
Heap Memory Usage,425.7 MB (Limit: 512.0 MB)
Non-Heap Memory Usage,156.3 MB (Limit: 256.0 MB)
CPU Usage,23.4%
GC Collection Time,45.2 ms
Thread Count,47
Class Loading Count,1,234
Connection Pool Size,8 of 20
Platform Up Time,15.5 days
License Expiry,2024-12-31`;
    
    const result = TridiumCSVParser.parseFileContent(complexResources, 'system_resources.csv');
    
    expect(result.type).toBe('resourceMetrics');
    expect(result.rows).toHaveLength(9);
    
    // Check memory parsing
    const heapMemory = result.rows[0];
    expect(heapMemory.parsedValues?.Value?.type).toBe('memory');
    
    // Check percentage parsing
    const cpuUsage = result.rows[2];
    expect(cpuUsage.parsedValues?.Value?.type).toBe('percentage');
    expect(cpuUsage.parsedValues?.Value?.value).toBe(23.4);
  });
});

describe('Regression Tests', () => {
  test('should maintain backward compatibility with existing parsers', () => {
    const legacyFormat = `Name,Status,Address
Device1,ok,1
Device2,down,2`;
    
    const result = TridiumCSVParser.parseFileContent(legacyFormat, 'legacy.csv');
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].data.Name).toBe('Device1');
    expect(result.rows[0].data.Status).toBe('ok');
  });

  test('should handle previously problematic status formats', () => {
    const problematicStatuses = [
      '{ok,enabled}',
      '{down,disabled,alarm}', 
      'disconnected',
      'online',
      'N/A',
      ''
    ];
    
    problematicStatuses.forEach(status => {
      const parsed = TridiumCSVParser.parseStatus(status);
      expect(parsed).toHaveProperty('status');
      expect(parsed).toHaveProperty('severity');
      expect(parsed).toHaveProperty('badge');
    });
  });
});
