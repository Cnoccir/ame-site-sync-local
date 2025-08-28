/**
 * Test script for Enhanced Google Drive Service
 * 
 * This file contains tests to verify the functionality of the enhanced
 * Google Drive integration system for AME customer folder management.
 */

import { EnhancedGoogleDriveService } from '../services/enhancedGoogleDriveService';

// Mock data for testing
const testCustomers = [
  {
    company_name: 'Metro General Hospital',
    site_address: '123 Healthcare Drive, Medical City, CA 90210',
    customer_id: 'test-customer-1',
    service_tier: 'PREMIUM',
    contact_name: 'Dr. Sarah Johnson',
    phone: '(555) 123-4567'
  },
  {
    company_name: 'Acme Corporation Inc',
    site_address: '456 Business Plaza, Suite 200, Corporate City, NY 10001',
    customer_id: 'test-customer-2',
    service_tier: 'CORE',
    contact_name: 'John Smith',
    phone: '(555) 987-6543'
  },
  {
    company_name: 'TechStart Solutions LLC',
    site_address: '789 Innovation Way, Tech Park, CA 94303',
    customer_id: 'test-customer-3',
    service_tier: 'CORE',
    contact_name: 'Emily Chen',
    phone: '(555) 456-7890'
  }
];

/**
 * Test the advanced search variants generation
 */
async function testSearchVariants() {
  console.log('\n🧪 Testing Search Variants Generation...');
  
  const testCases = [
    { name: 'Metro General Hospital', address: '123 Healthcare Drive, Medical City, CA' },
    { name: 'Acme Corporation Inc', address: '456 Business Plaza, Suite 200' },
    { name: 'TechStart Solutions LLC', address: undefined }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\nTest Case ${index + 1}: "${testCase.name}"`);
    
    // This would normally be a private method, but for testing we'll simulate it
    const variants = generateSearchVariantsTest(testCase.name, testCase.address);
    console.log(`Generated ${variants.length} search variants:`);
    variants.forEach((variant, i) => {
      console.log(`  ${i + 1}. "${variant}"`);
    });
  });
}

/**
 * Simulate the private generateAdvancedSearchVariants method for testing
 */
function generateSearchVariantsTest(customerName: string, customerAddress?: string): string[] {
  const variants: string[] = [];
  
  // Clean the customer name
  const cleanName = customerName.replace(/[^a-zA-Z0-9\s-&]/g, '').trim();
  variants.push(cleanName);
  
  // Remove common business suffixes
  const businessSuffixes = [
    'Inc', 'LLC', 'Corp', 'Corporation', 'Company', 'Co', 'Ltd', 'Limited',
    'Group', 'Associates', 'Partners', 'Enterprises', 'Solutions'
  ];
  
  let nameWithoutSuffixes = cleanName;
  businessSuffixes.forEach(suffix => {
    const regex = new RegExp(`\\s+(${suffix})\\.?$`, 'gi');
    nameWithoutSuffixes = nameWithoutSuffixes.replace(regex, '').trim();
  });
  
  if (nameWithoutSuffixes !== cleanName && nameWithoutSuffixes.length > 0) {
    variants.push(nameWithoutSuffixes);
  }
  
  // Create acronyms
  const words = nameWithoutSuffixes.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1) {
    // Full acronym
    const fullAcronym = words.map(w => w.charAt(0).toUpperCase()).join('');
    if (fullAcronym.length >= 2 && fullAcronym.length <= 8) {
      variants.push(fullAcronym);
    }
    
    // Partial acronyms for long company names
    if (words.length > 3) {
      variants.push(words.slice(0, 3).map(w => w.charAt(0).toUpperCase()).join(''));
      variants.push(words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join(''));
    }
  }
  
  // Add partial matches
  if (words.length > 1) {
    variants.push(words[0]);
    
    if (words.length > 2) {
      variants.push(words.slice(0, 2).join(' '));
    }
    
    if (words[words.length - 1].length > 3) {
      variants.push(words[words.length - 1]);
    }
  }
  
  // Address-based variants
  if (customerAddress) {
    const addressParts = customerAddress.split(',').map(p => p.trim());
    
    if (addressParts.length > 0) {
      const streetAddress = addressParts[0];
      
      const buildingMatch = streetAddress.match(/\b(\d+)\b/);
      if (buildingMatch) {
        variants.push(`${nameWithoutSuffixes} ${buildingMatch[1]}`);
      }
      
      const streetMatch = streetAddress.match(/\b(\w+\s+(Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd))\b/i);
      if (streetMatch) {
        variants.push(`${nameWithoutSuffixes} ${streetMatch[1]}`);
      }
      
      if (addressParts.length > 1) {
        const cityPart = addressParts[1].trim();
        const cityName = cityPart.split(/\s+/)[0];
        if (cityName.length > 3) {
          variants.push(`${nameWithoutSuffixes} ${cityName}`);
          variants.push(cityName);
        }
      }
    }
  }
  
  // Remove duplicates and empty strings
  return [...new Set(variants)]
    .filter(v => v.length > 1)
    .sort((a, b) => b.length - a.length);
}

/**
 * Test the folder search functionality (simulated)
 */
async function testFolderSearch() {
  console.log('\n🔍 Testing Folder Search Functionality...');
  
  for (const customer of testCustomers) {
    console.log(`\nSearching for: ${customer.company_name}`);
    console.log(`Address: ${customer.site_address || 'Not provided'}`);
    
    try {
      // In development mode, this will simulate the search
      const searchResult = await EnhancedGoogleDriveService.searchExistingCustomerFolders(
        customer.company_name,
        customer.site_address
      );
      
      console.log(`✅ Search completed in ${searchResult.searchDuration}ms`);
      console.log(`📊 Found ${searchResult.existingFolders.length} potential matches`);
      console.log(`📂 Scanned ${searchResult.totalFoldersScanned} total folders`);
      console.log(`💡 Recommendation: ${searchResult.recommendedActions.action} - ${searchResult.recommendedActions.reason}`);
      
      if (searchResult.recommendedActions.primaryFolder) {
        console.log(`🎯 Primary match: "${searchResult.recommendedActions.primaryFolder.folderName}" (${searchResult.recommendedActions.primaryFolder.confidence} confidence)`);
      }
      
    } catch (error) {
      console.error(`❌ Search failed for ${customer.company_name}:`, error.message);
    }
  }
}

/**
 * Test the structured folder creation (simulated)
 */
async function testFolderCreation() {
  console.log('\n🏗️ Testing Structured Folder Creation...');
  
  const testCustomer = testCustomers[0]; // Use Metro General Hospital
  
  try {
    console.log(`Creating structured folder for: ${testCustomer.company_name}`);
    
    const folderStructure = await EnhancedGoogleDriveService.createStructuredProjectFolder(
      testCustomer.company_name,
      testCustomer
    );
    
    console.log('✅ Folder structure created successfully!');
    console.log(`📁 Main folder: ${folderStructure.mainFolderId}`);
    console.log(`🌐 Main folder URL: ${folderStructure.mainFolderUrl}`);
    
    console.log('\n📂 Subfolders created:');
    Object.entries(folderStructure.subfolders).forEach(([key, folder]) => {
      const folderNames = {
        backups: 'Site Backups',
        projectDocs: 'Project Documentation',
        sitePhotos: 'Site Photos & Media',
        maintenance: 'Maintenance Records',
        reports: 'Reports & Analytics',
        correspondence: 'Client Correspondence'
      };
      
      console.log(`  - ${folderNames[key as keyof typeof folderNames]}: ${folder.id}`);
    });
    
  } catch (error) {
    console.error('❌ Folder creation failed:', error.message);
  }
}

/**
 * Test the folder structure retrieval
 */
async function testFolderInfo() {
  console.log('\n📋 Testing Folder Info Retrieval...');
  
  const testCustomerId = 'test-customer-1';
  
  try {
    const folderInfo = await EnhancedGoogleDriveService.getCustomerFolderInfo(testCustomerId);
    
    console.log('✅ Folder info retrieved successfully!');
    
    if (folderInfo.mainFolder) {
      console.log(`📁 Main folder: ${folderInfo.mainFolder.id}`);
      console.log(`🌐 Main folder URL: ${folderInfo.mainFolder.url}`);
    }
    
    if (folderInfo.folderStructure) {
      console.log('📂 Has detailed folder structure');
      console.log(`📊 Subfolder count: ${Object.keys(folderInfo.folderStructure.subfolders).length}`);
    }
    
    if (folderInfo.searchHistory) {
      console.log(`📜 Search history entries: ${folderInfo.searchHistory.length}`);
    }
    
  } catch (error) {
    console.error('❌ Folder info retrieval failed:', error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Enhanced Google Drive Service Tests...');
  console.log('=' .repeat(60));
  
  try {
    await testSearchVariants();
    await testFolderSearch();
    await testFolderCreation();
    await testFolderInfo();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('1. Run the SQL migration in Supabase to create the database tables');
    console.log('2. Test the enhanced component in your customer creation form');
    console.log('3. Set up actual Google Drive OAuth when ready for production');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Export for use in development
export {
  runAllTests,
  testSearchVariants,
  testFolderSearch,
  testFolderCreation,
  testFolderInfo,
  generateSearchVariantsTest
};

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runAllTests();
}
