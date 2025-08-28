import { readFileSync, writeFileSync } from 'fs';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

class SimProDataProcessor {
  /**
   * Process and clean SimPro customer data
   */
  async processCustomerData(customersCSV) {
    return new Promise((resolve, reject) => {
      Papa.parse(customersCSV, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rawCustomers = results.data;
            const cleanedCustomers = this.cleanCustomerData(rawCustomers);
            resolve(cleanedCustomers);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Process and clean SimPro contract data
   */
  async processContractData(contractsCSV) {
    return new Promise((resolve, reject) => {
      // Skip the first line (report title) by removing it from the CSV content
      const lines = contractsCSV.split('\n');
      const csvWithoutTitle = lines.slice(1).join('\n');
      
      Papa.parse(csvWithoutTitle, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rawContracts = results.data;
            const { contracts, customerNames } = this.cleanContractData(rawContracts);
            resolve({ contracts, customerNames });
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  /**
   * Clean and deduplicate customer data
   */
  cleanCustomerData(rawCustomers) {
    const customerMap = new Map();

    for (const raw of rawCustomers) {
      // Skip rows that don't have essential data
      if (!raw.Customer || !raw['Customer ID']) {
        continue;
      }

      const customerId = raw['Customer ID'].trim();
      const companyName = raw.Customer.trim();

      // Create or get existing customer
      let customer = customerMap.get(customerId);
      if (!customer) {
        customer = {
          id: uuidv4(),
          simpro_customer_id: customerId,
          company_name: companyName,
          email: this.cleanEmail(raw.Email),
          mailing_address: this.cleanAddress(raw['Mailing Address']),
          mailing_city: raw['Mailing City']?.trim() || '',
          mailing_state: raw['Mailing State']?.trim() || '',
          mailing_zip: raw['Mailing ZIP Code']?.trim() || '',
          labor_tax_code: raw['Labor Tax Code']?.trim() || '',
          part_tax_code: raw['Part Tax Code']?.trim() || '',
          is_contract_customer: this.parseContractCustomer(raw['Contract Customer']),
          has_active_contracts: false,
          total_contract_value: 0,
          active_contract_count: 0,
          latest_contract_email: '',
          service_tier: 'CORE', // Default, will be determined by contracts
          contracts: []
        };
        customerMap.set(customerId, customer);
      }
    }

    return Array.from(customerMap.values());
  }

  /**
   * Clean and process contract data
   */
  cleanContractData(rawContracts) {
    const cleanedContracts = [];
    const customerNames = [];

    for (const raw of rawContracts) {
      // Skip header row and empty rows
      if (!raw.Customer || raw.Customer.includes('Selected Criteria') || !raw['Contract Name']) {
        continue;
      }

      const contract = {
        id: uuidv4(),
        customer_id: '', // Will be linked during consolidation
        contract_name: raw['Contract Name'].trim(),
        contract_number: raw['Contract No.']?.trim() || '',
        contract_value: this.parseContractValue(raw.Value),
        contract_status: this.parseContractStatus(raw.Status),
        start_date: this.parseDate(raw['Start Date']),
        end_date: this.parseDate(raw['End Date']),
        contract_email: this.cleanEmail(raw.Email),
        contract_notes: raw.Notes?.trim() || ''
      };

      cleanedContracts.push(contract);
      customerNames.push(raw.Customer.trim());
    }

    return { contracts: cleanedContracts, customerNames };
  }

  /**
   * Consolidate customers with their contracts
   */
  async consolidateData(customers, contracts, contractCustomerNames) {
    // Create a map for quick customer lookup by name
    const customerByName = new Map();
    
    for (const customer of customers) {
      customerByName.set(customer.company_name.toUpperCase(), customer);
    }

    // Link contracts to customers using the raw customer names from contracts
    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i];
      const rawCustomerName = contractCustomerNames[i] || '';
      
      let customer = customerByName.get(rawCustomerName.toUpperCase());
      
      // If not found by exact match, create a new customer entry
      if (!customer) {
        customer = {
          id: uuidv4(),
          simpro_customer_id: '', // No specific ID from contracts file
          company_name: rawCustomerName,
          email: contract.contract_email,
          mailing_address: '',
          mailing_city: '',
          mailing_state: '',
          mailing_zip: '',
          labor_tax_code: '',
          part_tax_code: '',
          is_contract_customer: true, // Assume true since they have contracts
          has_active_contracts: false,
          total_contract_value: 0,
          active_contract_count: 0,
          latest_contract_email: contract.contract_email,
          service_tier: 'CORE',
          contracts: []
        };
        customerByName.set(rawCustomerName.toUpperCase(), customer);
        customers.push(customer);
      }
      
      contract.customer_id = customer.id;
      customer.contracts.push(contract);
      
      // Update customer statistics
      if (contract.contract_status === 'Active') {
        customer.has_active_contracts = true;
        customer.active_contract_count += 1;
        customer.total_contract_value += contract.contract_value;
        
        if (contract.contract_email && !customer.latest_contract_email) {
          customer.latest_contract_email = contract.contract_email;
        }
      }
    }

    // Determine service tiers based on contract values
    for (const customer of customers) {
      customer.service_tier = this.determineServiceTier(customer.total_contract_value);
    }

    return customers;
  }

  /**
   * Export processed data as SQL INSERT statements
   */
  exportAsSQL(customers) {
    let sql = '';
    
    // Generate customer inserts
    sql += '-- Insert SimPro Customers\n';
    sql += 'INSERT INTO simpro_customers (id, simpro_customer_id, company_name, email, mailing_address, mailing_city, mailing_state, mailing_zip, labor_tax_code, part_tax_code, is_contract_customer, has_active_contracts, total_contract_value, active_contract_count, latest_contract_email, service_tier) VALUES\n';
    
    const customerValues = customers.map(customer => 
      `('${customer.id}', '${customer.simpro_customer_id}', '${this.escapeSQLString(customer.company_name)}', '${customer.email}', '${this.escapeSQLString(customer.mailing_address)}', '${customer.mailing_city}', '${customer.mailing_state}', '${customer.mailing_zip}', '${customer.labor_tax_code}', '${customer.part_tax_code}', ${customer.is_contract_customer}, ${customer.has_active_contracts}, ${customer.total_contract_value}, ${customer.active_contract_count}, '${customer.latest_contract_email}', '${customer.service_tier}')`
    ).join(',\n');
    
    sql += customerValues + ';\n\n';
    
    // Generate contract inserts
    sql += '-- Insert SimPro Customer Contracts\n';
    sql += 'INSERT INTO simpro_customer_contracts (id, customer_id, contract_name, contract_number, contract_value, contract_status, start_date, end_date, contract_email, contract_notes) VALUES\n';
    
    const contractValues = customers.flatMap(customer => 
      customer.contracts.map(contract =>
        `('${contract.id}', '${contract.customer_id}', '${this.escapeSQLString(contract.contract_name)}', '${contract.contract_number}', ${contract.contract_value}, '${contract.contract_status}', '${contract.start_date}', '${contract.end_date}', '${contract.contract_email}', '${this.escapeSQLString(contract.contract_notes)}')`
      )
    ).join(',\n');
    
    sql += contractValues + ';\n';
    
    return sql;
  }

  // Helper methods
  cleanEmail(email) {
    return email?.trim().toLowerCase() || '';
  }

  cleanAddress(address) {
    if (!address) return '';
    return address.replace(/\n/g, ', ').trim();
  }

  parseContractCustomer(value) {
    return value?.trim().toLowerCase() === 'yes';
  }

  parseContractValue(value) {
    if (!value) return 0;
    const cleaned = value.replace(/[$,]/g, '');
    return parseFloat(cleaned) || 0;
  }

  parseContractStatus(status) {
    return status?.trim() === 'Active' ? 'Active' : 'Expired';
  }

  parseDate(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  determineServiceTier(contractValue) {
    if (contractValue >= 250000) return 'GUARDIAN';
    if (contractValue >= 100000) return 'ASSURE';
    return 'CORE';
  }

  escapeSQLString(str) {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  /**
   * Get processing statistics
   */
  getProcessingStats(customers) {
    const stats = {
      totalCustomers: customers.length,
      activeCustomers: customers.filter(c => c.has_active_contracts).length,
      totalContracts: customers.reduce((sum, c) => sum + c.contracts.length, 0),
      activeContracts: customers.reduce((sum, c) => sum + c.active_contract_count, 0),
      totalContractValue: customers.reduce((sum, c) => sum + c.total_contract_value, 0),
      servicesTiers: {
        CORE: 0,
        ASSURE: 0,
        GUARDIAN: 0
      }
    };

    customers.forEach(customer => {
      stats.servicesTiers[customer.service_tier]++;
    });

    return stats;
  }
}

async function main() {
  console.log('🚀 Starting SimPro Data Processing...\n');

  try {
    // Read the CSV files
    console.log('📂 Reading CSV files...');
    const customersCSV = readFileSync('docs/data/customers.csv', 'utf-8');
    const contractsCSV = readFileSync('docs/data/Customer_Contracts_Report_reportTable.csv', 'utf-8');
    console.log('✅ CSV files loaded successfully\n');

    // Initialize the processor
    const processor = new SimProDataProcessor();

    // Process customer data
    console.log('🔄 Processing customer data...');
    const customers = await processor.processCustomerData(customersCSV);
    console.log(`✅ Processed ${customers.length} customers from customers.csv\n`);

    // Process contract data
    console.log('🔄 Processing contract data...');
    const { contracts, customerNames } = await processor.processContractData(contractsCSV);
    console.log(`✅ Processed ${contracts.length} contracts from Customer_Contracts_Report_reportTable.csv\n`);

    // Consolidate data
    console.log('🔄 Consolidating customers with their contracts...');
    const consolidatedCustomers = await processor.consolidateData(customers, contracts, customerNames);
    console.log(`✅ Consolidated ${consolidatedCustomers.length} customers with their contracts\n`);

    // Generate statistics
    const stats = processor.getProcessingStats(consolidatedCustomers);
    console.log('📊 Processing Statistics:');
    console.log(`   Total Customers: ${stats.totalCustomers}`);
    console.log(`   Active Customers: ${stats.activeCustomers}`);
    console.log(`   Total Contracts: ${stats.totalContracts}`);
    console.log(`   Active Contracts: ${stats.activeContracts}`);
    console.log(`   Total Contract Value: $${stats.totalContractValue.toLocaleString()}`);
    console.log('   Service Tiers:');
    console.log(`     🏛️  GUARDIAN: ${stats.servicesTiers.GUARDIAN}`);
    console.log(`     🔷 ASSURE: ${stats.servicesTiers.ASSURE}`);
    console.log(`     ⚡ CORE: ${stats.servicesTiers.CORE}\n`);

    // Export as SQL
    console.log('🔄 Generating SQL migration file...');
    const sqlContent = processor.exportAsSQL(consolidatedCustomers);
    
    // Write SQL to file
    const migrationFileName = `simpro_data_migration_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.sql`;
    writeFileSync(migrationFileName, sqlContent);
    console.log(`✅ SQL migration file created: ${migrationFileName}\n`);

    console.log('🎉 SimPro Data Processing completed successfully!');
    console.log(`📄 Generated migration file with ${consolidatedCustomers.length} customers and ${stats.totalContracts} contracts`);

  } catch (error) {
    console.error('❌ Error processing SimPro data:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the main function
main();
