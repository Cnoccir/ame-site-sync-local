import Papa from 'papaparse';
import { supabase } from '@/integrations/supabase/client';

// Clean data interfaces
interface CleanCustomerData {
  customer_id: number;
  company_name: string;
  email: string;
  mailing_address: string;
  mailing_city: string;
  mailing_state: string;
  mailing_zip: string;
  has_contract_flag: boolean;
  site_nickname: string;
  site_number: string;
}

interface CleanContractData {
  customer_name: string;
  contract_name: string;
  contract_number: string;
  value_string: string;
  value_numeric: number;
  status: string;
  start_date: Date | null;
  end_date: Date | null;
  email: string;
  notes: string;
}

interface EnhancedCustomerData extends CleanCustomerData {
  contracts: CleanContractData[];
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  active_contract?: CleanContractData;
  total_contract_value: number;
  primary_contact_email: string;
  has_active_contracts: boolean;
}

// CSV record interfaces
interface CustomerCSVRecord {
  Customer: string;
  Email: string;
  'Mailing Address': string;
  'Mailing City': string;
  'Mailing State': string;
  'Mailing ZIP Code': string;
  'Customer ID': number;
  'Contract Customer': string;
}

interface ContractCSVRecord {
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

export class DataIntegrationService {
  // Import and clean customer data from CSV
  static async importCustomerData(csvFile: File): Promise<CleanCustomerData[]> {
    const rawData = await this.parseCSV<CustomerCSVRecord>(csvFile);
    return rawData.map(row => this.cleanCustomerRecord(row));
  }
  
  // Import and clean contract data from CSV  
  static async importContractData(csvFile: File): Promise<CleanContractData[]> {
    const rawData = await this.parseCSV<ContractCSVRecord>(csvFile);
    return rawData.map(row => this.cleanContractRecord(row));
  }
  
  // Cross-reference customers with their contracts
  static async crossReferenceData(
    customers: CleanCustomerData[],
    contracts: CleanContractData[]
  ): Promise<EnhancedCustomerData[]> {
    return customers.map(customer => {
      const customerContracts = contracts.filter(
        contract => contract.customer_name.toLowerCase() === customer.company_name.toLowerCase()
      );
      
      return {
        ...customer,
        contracts: customerContracts,
        service_tier: this.determineServiceTier(customerContracts),
        active_contract: customerContracts.find(c => c.status === 'Active'),
        total_contract_value: this.calculateTotalValue(customerContracts),
        primary_contact_email: customer.email || customerContracts[0]?.email || '',
        has_active_contracts: customerContracts.some(c => c.status === 'Active')
      };
    });
  }
  
  // Determine service tier based on contract values
  static determineServiceTier(contracts: CleanContractData[]): 'CORE' | 'ASSURE' | 'GUARDIAN' {
    const activeContracts = contracts.filter(c => c.status === 'Active');
    if (activeContracts.length === 0) return 'CORE';
    
    const totalValue = activeContracts.reduce((sum, contract) => sum + contract.value_numeric, 0);
    
    // Tier determination based on annual contract value
    if (totalValue >= 200000) return 'GUARDIAN';  // $200k+ = Premium service
    if (totalValue >= 75000) return 'ASSURE';     // $75k-$200k = Enhanced service  
    return 'CORE';                                // <$75k = Basic service
  }
  
  // Calculate total contract value
  static calculateTotalValue(contracts: CleanContractData[]): number {
    return contracts
      .filter(c => c.status === 'Active')
      .reduce((sum, contract) => sum + contract.value_numeric, 0);
  }
  
  // Import data to database
  static async importToDatabase(enhancedData: EnhancedCustomerData[]): Promise<void> {
    try {
      console.log('Starting database import for', enhancedData.length, 'customers');
      
      for (const customer of enhancedData) {
        // Insert customer
        const { data: customerRecord, error: customerError } = await supabase
          .from('ame_customers')
          .insert({
            customer_id: `AME-${customer.customer_id.toString().padStart(6, '0')}`,
            company_name: customer.company_name,
            site_nickname: customer.site_nickname,
            site_name: customer.company_name,
            site_address: customer.mailing_address,
            primary_contact: 'Main Contact',
            contact_phone: '000-000-0000',
            contact_email: customer.primary_contact_email,
            service_tier: customer.service_tier,
            system_type: 'BAS'
          })
          .select()
          .single();
          
        if (customerError) {
          console.error('Error inserting customer:', customer.company_name, customerError);
          continue;
        }
        
        // Log contracts (no contract table available)
        for (const contract of customer.contracts) {
          console.log('Contract data:', {
            customer_id: customerRecord.id,
            contract_name: contract.contract_name,
            contract_number: contract.contract_number,
            contract_value: contract.value_numeric,
            contract_status: contract.status
          });
        }
      }
      
      console.log('Database import completed successfully');
    } catch (error) {
      console.error('Fatal error during database import:', error);
      throw error;
    }
  }
  
  // Clean and normalize customer records
  private static cleanCustomerRecord(row: CustomerCSVRecord): CleanCustomerData {
    return {
      customer_id: parseInt(String(row['Customer ID'])) || 0,
      company_name: (row.Customer || '').trim(),
      email: (row.Email || '').trim().toLowerCase(),
      mailing_address: (row['Mailing Address'] || '').trim(),
      mailing_city: (row['Mailing City'] || '').trim(),
      mailing_state: (row['Mailing State'] || '').trim(),
      mailing_zip: (row['Mailing ZIP Code'] || '').trim(),
      has_contract_flag: row['Contract Customer'] === 'Yes',
      // Generate site nickname and number
      site_nickname: this.generateSiteNickname(row.Customer),
      site_number: this.generateSiteNumber(parseInt(String(row['Customer ID'])))
    };
  }
  
  // Clean and normalize contract records
  private static cleanContractRecord(row: ContractCSVRecord): CleanContractData {
    return {
      customer_name: (row.Customer || '').trim(),
      contract_name: (row['Contract Name'] || '').trim(),
      contract_number: (row['Contract No.'] || '').trim(),
      value_string: (row.Value || '').trim(),
      value_numeric: this.parseContractValue(row.Value),
      status: (row.Status || '').trim(),
      start_date: this.parseDate(row['Start Date']),
      end_date: this.parseDate(row['End Date']),
      email: (row.Email || '').trim().toLowerCase(),
      notes: (row.Notes || '').trim()
    };
  }
  
  // Parse CSV file
  private static parseCSV<T>(file: File): Promise<T[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing errors:', results.errors);
          }
          resolve(results.data as T[]);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }
  
  // Generate site nickname from company name
  private static generateSiteNickname(companyName: string): string {
    if (!companyName) return '';
    
    // Remove common suffixes and clean up
    const cleanName = companyName
      .replace(/\b(inc|llc|corp|corporation|company|co|ltd)\b\.?/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    // Take first 3 words or characters
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      return words.slice(0, 2).join(' ');
    } else if (words.length === 1 && words[0].length > 8) {
      return words[0].substring(0, 8);
    }
    return cleanName.substring(0, 20);
  }
  
  // Generate site number from customer ID
  private static generateSiteNumber(customerId: number): string {
    if (!customerId) return '';
    return `SITE-${customerId.toString().padStart(4, '0')}`;
  }
  
  // Parse contract value string to number
  private static parseContractValue(valueString: string): number {
    if (!valueString) return 0;
    
    // Remove currency symbols, commas, and spaces
    const cleanValue = valueString.replace(/[$,\s]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  // Parse date string to Date object
  private static parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}
