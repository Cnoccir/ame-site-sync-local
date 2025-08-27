// Mock logger to avoid Vite env dependencies
const mockLogger = {
  info: console.log,
  warn: console.warn, 
  error: console.error,
  debug: console.log
};

// Mock the logger module
const loggerModule = { logger: mockLogger };
require.cache[require.resolve('@/utils/logger')] = {
  id: require.resolve('@/utils/logger'),
  filename: require.resolve('@/utils/logger'),
  loaded: true,
  parent: null,
  children: [],
  exports: loggerModule
};

import { TridiumParser } from '../tridiumParser';

// Simple console logger replacement
const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.log
};

async function testResourceExportParser() {
  console.log('🧪 Testing Resource Export Parser - Standalone');
  console.log('=' .repeat(50));

  // Sample Resource Export CSV data with typical resource metrics
  const resourceExportData = `Name,Value
CPU Usage,45.2%
Memory Usage,67.8%
Free Memory,1.2 GB
Total Memory,4.0 GB
Disk Usage,23.5%
Network Utilization,12.3%
Current Connections,42
Maximum Connections,100
Uptime,14d 7h 23m
License Usage,15 kRU
License Limit,50 kRU
Database Size,245.7 MB
Log File Size,18.3 MB
Active Alarms,3
Total Points,1247
Online Points,1198
Station Temperature,72.4°F
Last Backup,2024-01-15 14:30:22
Firmware Version,4.8.2.108
Boot Time,2024-01-01 09:15:33`;

  try {
    console.log('\n📋 Sample Resource Export Data:');
    console.log(resourceExportData.split('\n').slice(0, 6).join('\n') + '\n...');

    // Parse using the new TridiumParser
    const result = await TridiumParser.parseFile(resourceExportData, 'test_resource_export.csv');
    
    console.log('\n✅ Parse Result:');
    console.log('Success:', result.success);
    console.log('Errors:', result.errors);
    console.log('Warnings:', result.warnings);
    
    if (result.dataset) {
      const dataset = result.dataset;
      
      console.log('\n📊 Dataset Summary:');
      console.log('Format:', dataset.format);
      console.log('Category:', dataset.category);
      console.log('Rows:', dataset.rows.length);
      console.log('Columns:', dataset.columns.length);
      console.log('Confidence:', dataset.metadata.confidence);
      
      // Show column information
      console.log('\n📝 Column Information:');
      dataset.columns.forEach(col => {
        console.log(`  - ${col.label} (${col.key}): ${col.type}`);
      });
      
      // Show first few parsed rows with their values
      console.log('\n🔍 Sample Parsed Data (first 10 rows):');
      dataset.rows.slice(0, 10).forEach((row, index) => {
        const name = row.data['Name'] || 'N/A';
        const value = row.data['Value'] || 'N/A';
        const parsedValue = row.parsedValue;
        
        console.log(`  ${index + 1}. ${name}: ${value} → ${JSON.stringify(parsedValue)}`);
      });
      
      // Show resource categorization if available
      if (dataset.summary) {
        console.log('\n📈 Resource Summary:');
        console.log(dataset.summary);
      }
      
    } else {
      console.log('\n❌ No dataset returned');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Test completed');
}

// Run the test
testResourceExportParser();
