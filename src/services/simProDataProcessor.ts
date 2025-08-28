import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';

interface RawCustomer {
  Customer: string;
  'Labor Tax Code': string;
  Email: string;
  'Mailing Address': string;
  'Mailing City': string;
  'Mailing State': string;
  'Mailing ZIP Code': string;
  'Customer ID': string;
  'Part Tax Code': string;
  'Contract Customer': string;
}

interface RawContract {
  Customer: string;
  'Contract Name': string;
  'Contract No.': string;
  Value: string;
  Status: string;
  'Start Date': string;
  'End Date': string;
  Email: string;
  Notes: string;
}

interface CleanedCustomer {
  id: string;
  simpro_customer_id: string;
  company_name: string;
  email: string;
  mailing_address: string;
  mailing_city: string;
  mailing_state: string;
  mailing_zip: string;
  labor_tax_code: string;
  part_tax_code: string;
  is_contract_customer: boolean;
  has_active_contracts: boolean;
  total_contract_value: number;
  active_contract_count: number;
  latest_contract_email: string;
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  contracts: CleanedContract[];
}

interface CleanedContract {
  id: string;
  customer_id: string;
  contract_name: string;
  contract_number: string;
  contract_value: number;
  contract_status: 'Active' | 'Expired';
  start_date: string;
  end_date: string;
  contract_email: string;
  contract_notes: string;
}

export class SimProDataProcessor {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Process and clean SimPro customer data
   */
  public async processCustomerData(customersCSV: string): Promise<CleanedCustomer[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(customersCSV, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rawCustomers = results.data as RawCustomer[];
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
  public async processContractData(contractsCSV: string): Promise<{ contracts: CleanedContract[], customerNames: string[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(contractsCSV, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rawContracts = results.data as RawContract[];
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
  private cleanCustomerData(rawCustomers: RawCustomer[]): CleanedCustomer[] {
    const customerMap = new Map<string, CleanedCustomer>();

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
  private cleanContractData(rawContracts: RawContract[]): { contracts: CleanedContract[], customerNames: string[] } {
    const cleanedContracts: CleanedContract[] = [];
    const customerNames: string[] = [];

    for (const raw of rawContracts) {
      // Skip header row and empty rows
      if (!raw.Customer || raw.Customer.includes('Selected Criteria') || !raw['Contract Name']) {
        continue;
      }

      const contract: CleanedContract = {
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
  public async consolidateData(customers: CleanedCustomer[], contracts: CleanedContract[], contractCustomerNames: string[]): Promise<CleanedCustomer[]> {
    // Create a map for quick customer lookup by name
    const customerByName = new Map<string, CleanedCustomer>();
    
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
   * Save consolidated data to Supabase
   */
  public async saveToDatabase(customers: CleanedCustomer[]): Promise<void> {
    try {
      // Save customers
      const customersToInsert = customers.map(customer => ({
        id: customer.id,
        simpro_customer_id: customer.simpro_customer_id,
        company_name: customer.company_name,
        email: customer.email,
        mailing_address: customer.mailing_address,
        mailing_city: customer.mailing_city,
        mailing_state: customer.mailing_state,
        mailing_zip: customer.mailing_zip,
        labor_tax_code: customer.labor_tax_code,
        part_tax_code: customer.part_tax_code,
        is_contract_customer: customer.is_contract_customer,
        has_active_contracts: customer.has_active_contracts,
        total_contract_value: customer.total_contract_value,
        active_contract_count: customer.active_contract_count,
        latest_contract_email: customer.latest_contract_email,
        service_tier: customer.service_tier
      }));

      const { error: customerError } = await this.supabase
        .from('simpro_customers')
        .upsert(customersToInsert);

      if (customerError) {
        throw new Error(`Failed to save customers: ${customerError.message}`);
      }

      // Save contracts
      const contractsToInsert = customers.flatMap(customer => 
        customer.contracts.map(contract => ({
          id: contract.id,
          customer_id: contract.customer_id,
          contract_name: contract.contract_name,
          contract_number: contract.contract_number,
          contract_value: contract.contract_value,
          contract_status: contract.contract_status,
          start_date: contract.start_date,
          end_date: contract.end_date,
          contract_email: contract.contract_email,
          contract_notes: contract.contract_notes
        }))
      );

      const { error: contractError } = await this.supabase
        .from('simpro_customer_contracts')
        .upsert(contractsToInsert);

      if (contractError) {
        throw new Error(`Failed to save contracts: ${contractError.message}`);
      }

      console.log(`Successfully saved ${customers.length} customers and ${contractsToInsert.length} contracts`);
    } catch (error) {
      console.error('Error saving to database:', error);
      throw error;
    }
  }

  /**
   * Export processed data as SQL INSERT statements
   */
  public exportAsSQL(customers: CleanedCustomer[]): string {
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
  private cleanEmail(email: string): string {
    return email?.trim().toLowerCase() || '';
  }

  private cleanAddress(address: string): string {
    if (!address) return '';
    return address.replace(/\n/g, ', ').trim();
  }

  private parseContractCustomer(value: string): boolean {
    return value?.trim().toLowerCase() === 'yes';
  }

  private parseContractValue(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/[$,]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private parseContractStatus(status: string): 'Active' | 'Expired' {
    return status?.trim() === 'Active' ? 'Active' : 'Expired';
  }

  private parseDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  private determineServiceTier(contractValue: number): 'CORE' | 'ASSURE' | 'GUARDIAN' {
    if (contractValue >= 250000) return 'GUARDIAN';
    if (contractValue >= 100000) return 'ASSURE';
    return 'CORE';
  }

  private escapeSQLString(str: string): string {
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
  }

  /**
   * Get processing statistics
   */
  public getProcessingStats(customers: CleanedCustomer[]): {
    totalCustomers: number;
    activeCustomers: number;
    totalContracts: number;
    activeContracts: number;
    totalContractValue: number;
    servicesTiers: Record<string, number>;
  } {
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
