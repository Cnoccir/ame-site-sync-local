# Prompt 6: Real Data Integration & Enhanced CRUD Operations

## Objective
Transform the current mock data interface into a fully functional system with real customer/contract data, complete CRUD operations, smart auto-fill capabilities, and dynamic service tier determination based on contract values.

## Context
- Current system shows proper UI structure but uses mock data
- Two CSV files contain real customer and contract data that need integration
- All fields need to be editable with proper validation and auto-complete
- Service tiers should be determined by contract values automatically
- Need cross-referencing between customers and contracts for intelligent data population

## CSV Data Structure Analysis

### customers.csv Contains:
```typescript
interface CustomerCSVRecord {
  Customer: string;           // Company name
  Email: string;             // Primary contact email  
  "Mailing Address": string; // Street address
  "Mailing City": string;    // City
  "Mailing State": string;   // State
  "Mailing ZIP Code": string; // ZIP code
  "Customer ID": number;     // Unique customer identifier
  "Contract Customer": string; // "Yes"/"No" indicates if they have contracts
}
```

### Customer_Contracts_Report_reportTable.csv Contains:
```typescript
interface ContractCSVRecord {
  Customer: string;          // Links to customers.csv Customer field
  "Contract Name": string;   // Service contract description
  "Contract No.": string;    // Contract identifier
  Value: string;            // Contract value (e.g., "$436,320.00")
  Status: string;           // "Active", "Expired", "Pending"
  "Start Date": string;     // MM/DD/YYYY format
  "End Date": string;       // MM/DD/YYYY format
  Email: string;            // Contract-specific contact email
  Notes: string;            // Contract-specific notes
}
```

## Requirements

### 1. Data Integration & Cleanup Service
Create `src/services/dataIntegrationService.ts`:
```typescript
export class DataIntegrationService {
  // Import and clean customer data from CSV
  static async importCustomerData(csvFile: File): Promise<CleanCustomerData[]> {
    const rawData = await this.parseCSV(csvFile);
    return rawData.map(row => this.cleanCustomerRecord(row));
  }
  
  // Import and clean contract data from CSV  
  static async importContractData(csvFile: File): Promise<CleanContractData[]> {
    const rawData = await this.parseCSV(csvFile);
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
  
  // Clean and normalize customer records
  private static cleanCustomerRecord(row: any): CleanCustomerData {
    return {
      customer_id: parseInt(row['Customer ID']) || 0,
      company_name: (row.Customer || '').trim(),
      email: (row.Email || '').trim().toLowerCase(),
      mailing_address: (row['Mailing Address'] || '').trim(),
      mailing_city: (row['Mailing City'] || '').trim(),
      mailing_state: (row['Mailing State'] || '').trim(),
      mailing_zip: (row['Mailing ZIP Code'] || '').trim(),
      has_contract_flag: row['Contract Customer'] === 'Yes',
      // Generate site nickname and number
      site_nickname: this.generateSiteNickname(row.Customer),
      site_number: this.generateSiteNumber(parseInt(row['Customer ID']))
    };
  }
  
  // Clean and normalize contract records
  private static cleanContractRecord(row: any): CleanContractData {
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
}

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

interface EnhancedCustomerData extends CleanCustomerData {
  contracts: CleanContractData[];
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  active_contract?: CleanContractData;
  total_contract_value: number;
  primary_contact_email: string;
  has_active_contracts: boolean;
}
```

### 2. Enhanced Customer Management Database Schema
```sql
-- Drop and recreate customers table with proper structure
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- From CSV data
  legacy_customer_id INTEGER UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  site_nickname VARCHAR(100),
  site_number VARCHAR(20) UNIQUE,
  
  -- Address information
  mailing_address TEXT,
  mailing_city VARCHAR(100),
  mailing_state VARCHAR(10),
  mailing_zip VARCHAR(20),
  
  -- Contact information
  primary_contact_email VARCHAR(255),
  primary_contact_name VARCHAR(100),
  primary_contact_phone VARCHAR(50),
  secondary_contact_email VARCHAR(255),
  secondary_contact_name VARCHAR(100),
  secondary_contact_phone VARCHAR(50),
  
  -- Service information  
  service_tier VARCHAR(20) DEFAULT 'CORE',
  system_platform VARCHAR(50),
  has_active_contracts BOOLEAN DEFAULT FALSE,
  total_contract_value DECIMAL(12,2) DEFAULT 0,
  
  -- Site intelligence
  primary_technician_id UUID REFERENCES auth.users(id),
  secondary_technician_id UUID REFERENCES auth.users(id),
  best_arrival_time VARCHAR(100),
  access_notes TEXT,
  site_hazards TEXT,
  special_instructions TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create contracts table
CREATE TABLE customer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- From CSV data
  contract_name VARCHAR(255),
  contract_number VARCHAR(100),
  contract_value DECIMAL(12,2),
  contract_status VARCHAR(50),
  start_date DATE,
  end_date DATE,
  contract_email VARCHAR(255),
  contract_notes TEXT,
  
  -- Additional fields
  billing_frequency VARCHAR(50), -- Monthly, Quarterly, Annual
  service_hours_included INTEGER,
  emergency_coverage BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_customers_legacy_id ON customers(legacy_customer_id);
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_site_number ON customers(site_number);
CREATE INDEX idx_contracts_customer_id ON customer_contracts(customer_id);
CREATE INDEX idx_contracts_status ON customer_contracts(contract_status);
```

### 3. Smart Auto-Complete & Validation Service
Create `src/services/smartAutoCompleteService.ts`:
```typescript
export class SmartAutoCompleteService {
  // Get customer suggestions based on partial input
  static async getCustomerSuggestions(query: string): Promise<CustomerSuggestion[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('id, company_name, site_nickname, site_number, service_tier')
      .or(`company_name.ilike.%${query}%,site_nickname.ilike.%${query}%,site_number.ilike.%${query}%`)
      .limit(10);
      
    if (error) throw error;
    
    return data.map(customer => ({
      id: customer.id,
      label: `${customer.company_name} (${customer.site_nickname})`,
      sublabel: `${customer.site_number} • ${customer.service_tier}`,
      value: customer
    }));
  }
  
  // Auto-populate fields based on selected customer
  static async autoPopulateCustomerFields(customerId: string): Promise<CustomerAutoFill> {
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        customer_contracts!inner(*)
      `)
      .eq('id', customerId)
      .single();
      
    if (customerError) throw customerError;
    
    return {
      siteIdentity: {
        company_name: customer.company_name,
        site_nickname: customer.site_nickname,
        site_number: customer.site_number,
        service_tier: customer.service_tier,
        system_platform: customer.system_platform
      },
      contactInfo: {
        primary_contact_email: customer.primary_contact_email,
        primary_contact_name: customer.primary_contact_name,
        primary_contact_phone: customer.primary_contact_phone,
        secondary_contact_email: customer.secondary_contact_email,
        secondary_contact_name: customer.secondary_contact_name,
        secondary_contact_phone: customer.secondary_contact_phone
      },
      siteAccess: {
        mailing_address: customer.mailing_address,
        mailing_city: customer.mailing_city,
        mailing_state: customer.mailing_state,
        best_arrival_time: customer.best_arrival_time,
        access_notes: customer.access_notes,
        site_hazards: customer.site_hazards
      },
      contractInfo: {
        active_contracts: customer.customer_contracts.filter(c => c.contract_status === 'Active'),
        total_value: customer.total_contract_value,
        primary_contract: customer.customer_contracts.find(c => c.contract_status === 'Active')
      }
    };
  }
  
  // Validate and suggest corrections for data entry
  static async validateCustomerData(data: Partial<Customer>): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: DataSuggestion[] = [];
    
    // Validate required fields
    if (!data.company_name?.trim()) {
      errors.push({ field: 'company_name', message: 'Company name is required' });
    }
    
    // Check for duplicate site numbers
    if (data.site_number) {
      const existing = await this.checkSiteNumberExists(data.site_number, data.id);
      if (existing) {
        errors.push({ field: 'site_number', message: 'Site number already exists' });
      }
    }
    
    // Suggest improvements
    if (data.company_name && !data.site_nickname) {
      suggestions.push({
        field: 'site_nickname',
        suggestion: this.generateSuggestedNickname(data.company_name),
        reason: 'Generated from company name for quick reference'
      });
    }
    
    return { errors, warnings, suggestions, isValid: errors.length === 0 };
  }
}
```

### 4. Enhanced Editable UI Components
Update the main customer info section with full CRUD operations:

#### Enhanced Site Identity Card
```typescript
// src/components/visit/customer/EditableSiteIdentityCard.tsx
export const EditableSiteIdentityCard = ({ customer, onUpdate }: Props) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(customer);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Site Identity
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditMode(!editMode)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {editMode ? (
          <EditableSiteIdentityForm
            data={formData}
            onSave={handleSave}
            onCancel={() => setEditMode(false)}
            suggestions={suggestions}
          />
        ) : (
          <SiteIdentityDisplay data={customer} />
        )}
      </CardContent>
    </Card>
  );
};

const EditableSiteIdentityForm = ({ data, onSave, onCancel, suggestions }: Props) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Company Name with Auto-complete */}
      <div>
        <Label htmlFor="company_name">Company Name *</Label>
        <AutoCompleteInput
          id="company_name"
          value={data.company_name}
          onChange={handleCompanyNameChange}
          suggestions={suggestions}
          onSuggestionSelect={handleSuggestionSelect}
          placeholder="Start typing company name..."
        />
      </div>
      
      {/* Site Nickname with Auto-generation */}
      <div>
        <Label htmlFor="site_nickname">Site Nickname</Label>
        <div className="flex gap-2">
          <Input
            id="site_nickname"
            value={data.site_nickname}
            onChange={(e) => setData({...data, site_nickname: e.target.value})}
            placeholder="Quick reference name"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => generateNickname(data.company_name)}
          >
            Generate
          </Button>
        </div>
      </div>
      
      {/* Service Tier with Auto-calculation */}
      <div>
        <Label htmlFor="service_tier">Service Tier</Label>
        <div className="flex items-center gap-2">
          <Select value={data.service_tier} onValueChange={handleServiceTierChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CORE">CORE - Basic Service</SelectItem>
              <SelectItem value="ASSURE">ASSURE - Enhanced Service</SelectItem>
              <SelectItem value="GUARDIAN">GUARDIAN - Premium Service</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => calculateTierFromContracts(data.id)}
          >
            <Calculator className="w-4 h-4" />
          </Button>
        </div>
        {suggestedTier && suggestedTier !== data.service_tier && (
          <p className="text-sm text-muted-foreground mt-1">
            Suggested: {suggestedTier} (based on contract value: ${totalContractValue.toLocaleString()})
          </p>
        )}
      </div>
      
      {/* System Platform */}
      <div>
        <Label htmlFor="system_platform">System Platform</Label>
        <Select value={data.system_platform} onValueChange={handlePlatformChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Niagara-N4">Niagara N4</SelectItem>
            <SelectItem value="Niagara-FX">Facility Explorer (FX)</SelectItem>
            <SelectItem value="Niagara-WEBs">Honeywell WEBs</SelectItem>
            <SelectItem value="Mixed-Platform">Mixed Platform</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button type="submit">Save Changes</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};
```

#### Enhanced Contact Information Card
```typescript
// src/components/visit/customer/EditableContactInfoCard.tsx  
export const EditableContactInfoCard = ({ customer, onUpdate }: Props) => {
  const [editMode, setEditMode] = useState(false);
  const [contactData, setContactData] = useState({
    primary_contact_name: customer.primary_contact_name || '',
    primary_contact_email: customer.primary_contact_email || '',
    primary_contact_phone: customer.primary_contact_phone || '',
    secondary_contact_name: customer.secondary_contact_name || '',
    secondary_contact_email: customer.secondary_contact_email || '',
    secondary_contact_phone: customer.secondary_contact_phone || ''
  });
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Team Contact
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditMode(!editMode)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {editMode ? (
          <ContactInfoForm
            data={contactData}
            onSave={handleContactSave}
            onCancel={() => setEditMode(false)}
          />
        ) : (
          <ContactInfoDisplay data={customer} />
        )}
      </CardContent>
    </Card>
  );
};
```

### 5. Data Import & Management Interface
Create an admin interface for importing and managing CSV data:
```typescript
// src/components/admin/DataImportInterface.tsx
export const DataImportInterface = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Customer & Contract Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="customers">
            <TabsList>
              <TabsTrigger value="customers">Import Customers</TabsTrigger>
              <TabsTrigger value="contracts">Import Contracts</TabsTrigger>
              <TabsTrigger value="cross-reference">Cross Reference</TabsTrigger>
            </TabsList>
            
            <TabsContent value="customers">
              <CustomerImportPanel />
            </TabsContent>
            
            <TabsContent value="contracts">
              <ContractImportPanel />
            </TabsContent>
            
            <TabsContent value="cross-reference">
              <CrossReferencePanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
```

## Success Criteria
1. All customer data from CSV successfully imported and cleaned
2. Service tiers automatically determined from contract values
3. All fields editable with validation and auto-complete
4. Smart suggestions based on existing data
5. Cross-referencing between customers and contracts working
6. Real-time CRUD operations with optimistic updates
7. Data integrity maintained through validation

## Integration Steps
1. **Import CSV data** using the DataIntegrationService
2. **Set up database** with proper schema and relationships
3. **Implement CRUD operations** with validation
4. **Add auto-complete functionality** for all relevant fields
5. **Create edit modes** for all customer information cards
6. **Test data integrity** and cross-referencing

This transforms your mock interface into a fully functional system with real data!