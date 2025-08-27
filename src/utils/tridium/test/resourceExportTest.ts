import { TridiumParser } from '../tridiumParser';
import { logger } from '@/utils/logger';

/**
 * Quick test for the new Resource Export parser
 */
export async function testResourceExportParsing() {
  const sampleResourceExport = `﻿Name,Value
capacityLicensing.recountLastFail,never
capacityLicensing.recountLastFailReason,
capacityLicensing.recountLastRun,19-Aug-25 2:12 PM EDT
component.count,14185
cpu.usage,12%
engine.queue.actions,0 (Peak 2212)
engine.queue.longTimers,662 (Peak 1305)
engine.queue.mediumTimers,96 (Peak 100)
engine.queue.shortTimers,0 (Peak 4)
engine.scan.lifetime,.204 ms
engine.scan.peak,18970.000 ms
engine.scan.peakInterscan,6070.000 ms
engine.scan.recent,.000 ms
engine.scan.timeOfPeak,09-Aug-25 2:15 PM EDT
engine.scan.timeOfPeakInterscan,26-Jul-25 9:01 PM EDT
engine.scan.usage,1%
fd.max,8000
fd.open,1823
globalCapacity.devices,84 (Limit: 101)
globalCapacity.histories,"1,625 (Limit: none)"
globalCapacity.links,"1,580 (Limit: none)"
globalCapacity.networks,2 (Limit: none)
globalCapacity.points,"3,303 (Limit: 5,000)"
globalCapacity.schedules,9 (Limit: none)
heap.free,265 MB
heap.max,371 MB
heap.total,371 MB
heap.used,109 MB
history.count,1625
mem.total,1024 MB
mem.used,681 MB
resources.category.alarm,0.500 kRU
resources.category.component,647.951 kRU
resources.category.device,450.000 kRU
resources.category.history,488.900 kRU
resources.category.network,200.000 kRU
resources.category.program,3.000 kRU
resources.category.proxyExt,827.750 kRU
resources.limit,none
resources.total,"2,618.101 kRU"
time.current,19-Aug-25 2:13 PM EDT
time.start,18-Jul-25 6:31 PM EDT
time.uptime,"31 days, 19 hours, 42 minutes"
version.java,OpenJDK Client VM 25.352-b08
version.niagara,4.12.1.16
version.os,aarch32 QNX 7.0.X`;

  try {
    console.log('🧪 Testing Resource Export parsing...');
    
    const result = await TridiumParser.parseFile(
      sampleResourceExport, 
      'test_resource_export.csv'
    );

    console.log('✅ Parse result:', {
      success: result.success,
      format: result.formatDetection.format,
      confidence: result.formatDetection.confidence,
      rowCount: result.dataset?.rows.length || 0,
      errors: result.errors
    });

    if (result.success && result.dataset) {
      console.log('🎯 Format detected as:', result.formatDetection.format);
      console.log('📊 Dataset summary:', {
        filename: result.dataset.filename,
        format: result.dataset.format,
        category: result.dataset.category,
        totalRows: result.dataset.rows.length,
        totalColumns: result.dataset.columns.length
      });

      // Check a few sample rows
      const sampleRows = result.dataset.rows.slice(0, 3);
      console.log('📋 Sample rows:');
      sampleRows.forEach(row => {
        console.log(`  - ${row.data.Name}: ${row.data.Value}`);
        if (row.parsedValues?.Value) {
          console.log(`    📈 Parsed: ${JSON.stringify(row.parsedValues.Value, null, 2)}`);
        }
      });

      return result;
    } else {
      console.error('❌ Parsing failed:', result.errors);
      return null;
    }
  } catch (error) {
    console.error('💥 Test failed with exception:', error);
    return null;
  }
}

// Export for running standalone
if (require.main === module) {
  testResourceExportParsing().then(result => {
    process.exit(result ? 0 : 1);
  });
}
