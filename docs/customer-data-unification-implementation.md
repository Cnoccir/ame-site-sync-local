# Customer Data Unification Implementation Guide

## Overview
This guide provides step-by-step instructions for updating all customer-related components to use the unified data system, ensuring data consistency across the application.

## Phase 1: Implementation Components

### Files Created
1. **`src/types/customer.unified.ts`** - Unified customer type definitions
2. **`src/constants/customerOptions.ts`** - Standardized dropdown options
3. **`src/services/unifiedCustomerService.ts`** - Single service for all CRUD operations

## Required Updates to Existing Components

### 1. Update NewCustomerWizard (`src/components/customers/NewCustomerWizard.tsx`)

**Changes Required:**
```typescript
// At the top of the file, replace existing imports:
import { 
  UnifiedCustomer, 
  CustomerFormData,
  prepareCustomerForDatabase 
} from '@/types/customer.unified';
import { UnifiedCustomerService } from '@/services/unifiedCustomerService';
import {
  SERVICE_TIER_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  BUILDING_TYPE_OPTIONS,
  SYSTEM_ARCHITECTURE_OPTIONS,
  BAS_PLATFORM_OPTIONS,
  CONTACT_ROLE_OPTIONS,
  ACCESS_METHOD_OPTIONS,
  SITE_HAZARD_OPTIONS
} from '@/constants/customerOptions';

// Replace the CustomerFormData interface with:
// (Remove the local interface definition, use the one from customer.unified.ts)

// Update the handleSubmit function:
const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
    
    // Validate using unified service
    const validation = UnifiedCustomerService.validateCustomerData(formData);
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    if (editMode?.isEdit) {
      // Update existing customer
      const updatedCustomer = await UnifiedCustomerService.updateCustomer(
        editMode.initialData.id,
        formData
      );
      if (onComplete) {
        onComplete(updatedCustomer);
      }
    } else {
      // Create new customer
      const createdCustomer = await UnifiedCustomerService.createCustomer(formData);
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      
      if (onCustomerCreated) {
        onCustomerCreated();
      }
    }
    
    handleClose();
  } catch (error: any) {
    console.error('Error processing customer:', error);
    toast({
      title: "Error",
      description: error.message || "Failed to process customer",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};

// Update all dropdown components to use standardized options:
// Example for service tier:
<Select value={formData.service_tier} onValueChange={(value) => updateFormData('service_tier', value)}>
  <SelectTrigger>
    <SelectValue placeholder="Select service tier" />
  </SelectTrigger>
  <SelectContent>
    {SERVICE_TIER_OPTIONS.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 2. Update CustomerDetailsModal (`src/components/customers/CustomerDetailsModal.tsx`)

**Changes Required:**
```typescript
// Update imports:
import { UnifiedCustomer } from '@/types/customer.unified';
import { UnifiedCustomerService } from '@/services/unifiedCustomerService';
import {
  SERVICE_TIER_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  getServiceTierColor,
  getContractStatusColor
} from '@/constants/customerOptions';

// Update the interface:
interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: UnifiedCustomer | null;
  onCustomerUpdated: (customer: UnifiedCustomer) => void;
  mode: 'view' | 'edit';
}

// Update the component:
export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
  mode: initialMode,
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [formData, setFormData] = useState<UnifiedCustomer | null>(customer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!formData) return;

    try {
      setIsSubmitting(true);
      const updatedCustomer = await UnifiedCustomerService.updateCustomer(
        formData.id,
        formData
      );
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      
      onCustomerUpdated(updatedCustomer);
      setMode('view');
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update field rendering to use UnifiedCustomer type
  const InputField = ({ 
    label, 
    field, 
    type = 'text', 
    placeholder = '', 
    rows = 3 
  }: { 
    label: string;
    field: keyof UnifiedCustomer;
    type?: string;
    placeholder?: string;
    rows?: number;
  }) => (
    // ... rest of component
  );
};
```

### 3. Update WorkflowDashboard (`src/components/visit/WorkflowDashboard.tsx`)

**Changes Required:**
```typescript
// Update imports:
import { UnifiedCustomer } from '@/types/customer.unified';
import { UnifiedCustomerService } from '@/services/unifiedCustomerService';
import { getServiceTierColor } from '@/constants/customerOptions';

// Update customer state:
const [customer, setCustomer] = useState<UnifiedCustomer | null>(null);

// Update customer fetch:
useEffect(() => {
  const loadCustomer = async () => {
    if (customerId) {
      try {
        const customerData = await UnifiedCustomerService.getCustomer(customerId);
        if (customerData) {
          setCustomer(customerData);
        }
      } catch (error) {
        console.error('Error loading customer:', error);
      }
    }
  };
  loadCustomer();
}, [customerId]);

// Update handleCustomerUpdated:
const handleCustomerUpdated = async () => {
  if (customerId) {
    const updatedCustomer = await UnifiedCustomerService.getCustomer(customerId);
    if (updatedCustomer) {
      setCustomer(updatedCustomer);
    }
  }
};
```

### 4. Update PreVisitWorkflowEnhanced (`src/components/visit/phases/PreVisitWorkflowEnhanced.tsx`)

**Changes Required:**
```typescript
// Update imports:
import { UnifiedCustomer } from '@/types/customer.unified';
import { UnifiedCustomerService } from '@/services/unifiedCustomerService';
import {
  BAS_PLATFORM_OPTIONS,
  SITE_EXPERIENCE_OPTIONS,
  ACCESS_METHOD_OPTIONS
} from '@/constants/customerOptions';

// Update props interface:
interface PreVisitWorkflowEnhancedProps {
  customer: UnifiedCustomer;
  onPhaseComplete: () => void;
  updateCustomerData?: (updates: Partial<UnifiedCustomer>) => void;
  autoSaveEnabled?: boolean;
}

// Update state initialization:
const [formData, setFormData] = useState<Partial<UnifiedCustomer>>({
  ...customer
});

// Update field updates to use UnifiedCustomer type:
const updateField = (field: keyof UnifiedCustomer, value: any) => {
  const updates = { [field]: value };
  setFormData(prev => ({ ...prev, ...updates }));
  
  if (autoSaveEnabled && updateCustomerData) {
    debouncedSave(updates);
  }
};

// Use standardized options in dropdowns:
<Select value={formData.primary_bas_platform} onValueChange={(value) => updateField('primary_bas_platform', value)}>
  <SelectTrigger>
    <SelectValue placeholder="Select BAS platform" />
  </SelectTrigger>
  <SelectContent>
    {BAS_PLATFORM_OPTIONS.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label} {option.category && `(${option.category})`}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 5. Update Customer Management Components

**Update `src/components/customers/UnifiedCustomerManagement.tsx`:**
```typescript
// Replace AMEService imports with UnifiedCustomerService:
import { UnifiedCustomer } from '@/types/customer.unified';
import { UnifiedCustomerService } from '@/services/unifiedCustomerService';

// Update all AMEService calls:
// Replace: const customers = await AMEService.getCustomers();
// With: const customers = await UnifiedCustomerService.getAllCustomers();

// Replace: await AMEService.deleteCustomer(customerId);
// With: await UnifiedCustomerService.deleteCustomer(customerId);
```

**Update `src/components/customers/CustomerTable.tsx`:**
```typescript
import { UnifiedCustomer } from '@/types/customer.unified';
import { getServiceTierColor, getContractStatusColor } from '@/constants/customerOptions';

// Update interface:
interface CustomerTableProps {
  customers: UnifiedCustomer[];
  onEdit: (customer: UnifiedCustomer) => void;
  onDelete: (customer: UnifiedCustomer) => void;
}
```

## Database Migration

Create the following migration to clean up legacy data:

```sql
-- Migration: Clean up customer data and ensure consistency
-- File: supabase/migrations/[timestamp]_unify_customer_data.sql

BEGIN;

-- Step 1: Migrate any data from 'customers' table to 'ame_customers' if needed
-- (Only if there's data in the customers table)
INSERT INTO ame_customers (
  company_name, site_name, site_address, 
  primary_contact, contact_phone, contact_email,
  service_tier, contract_status
)
SELECT 
  company_name, 
  COALESCE(site_nickname, company_name) as site_name,
  COALESCE(mailing_address, '') as site_address,
  COALESCE(primary_contact_name, '') as primary_contact,
  COALESCE(primary_contact_phone, '') as contact_phone,
  COALESCE(primary_contact_email, '') as contact_email,
  COALESCE(service_tier, 'CORE') as service_tier,
  'Active' as contract_status
FROM customers
WHERE NOT EXISTS (
  SELECT 1 FROM ame_customers 
  WHERE ame_customers.company_name = customers.company_name
);

-- Step 2: Drop the unused customers table
DROP TABLE IF EXISTS customers CASCADE;

-- Step 3: Ensure all boolean fields have proper defaults
ALTER TABLE ame_customers 
  ALTER COLUMN ppe_required SET DEFAULT true,
  ALTER COLUMN badge_required SET DEFAULT false,
  ALTER COLUMN training_required SET DEFAULT false,
  ALTER COLUMN remote_access SET DEFAULT false,
  ALTER COLUMN vpn_required SET DEFAULT false,
  ALTER COLUMN different_platform_station_creds SET DEFAULT false,
  ALTER COLUMN service_address_different SET DEFAULT false;

-- Step 4: Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_ame_customers_service_tier ON ame_customers(service_tier);
CREATE INDEX IF NOT EXISTS idx_ame_customers_contract_status ON ame_customers(contract_status);
CREATE INDEX IF NOT EXISTS idx_ame_customers_site_number ON ame_customers(site_number);
CREATE INDEX IF NOT EXISTS idx_ame_customers_customer_id ON ame_customers(customer_id);

-- Step 5: Update RPC function to use consistent types
CREATE OR REPLACE FUNCTION update_customer_with_validation(
  p_customer_id UUID,
  p_updates JSONB
)
RETURNS ame_customers AS $$
DECLARE
  v_customer ame_customers;
BEGIN
  -- Validate service_tier
  IF p_updates->>'service_tier' IS NOT NULL AND 
     p_updates->>'service_tier' NOT IN ('CORE', 'ASSURE', 'GUARDIAN') THEN
    RAISE EXCEPTION 'Invalid service_tier: %', p_updates->>'service_tier';
  END IF;
  
  -- Validate contract_status
  IF p_updates->>'contract_status' IS NOT NULL AND 
     p_updates->>'contract_status' NOT IN ('Active', 'Inactive', 'Pending', 'Expired') THEN
    RAISE EXCEPTION 'Invalid contract_status: %', p_updates->>'contract_status';
  END IF;
  
  -- Perform the update
  UPDATE ame_customers
  SET 
    company_name = COALESCE(p_updates->>'company_name', company_name),
    site_name = COALESCE(p_updates->>'site_name', site_name),
    site_nickname = COALESCE(p_updates->>'site_nickname', site_nickname),
    site_address = COALESCE(p_updates->>'site_address', site_address),
    service_tier = COALESCE(p_updates->>'service_tier', service_tier),
    contract_status = COALESCE(p_updates->>'contract_status', contract_status),
    -- ... (other fields)
    updated_at = NOW()
  WHERE id = p_customer_id
  RETURNING * INTO v_customer;
  
  RETURN v_customer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
```

## Testing Checklist

After implementing these changes, test the following:

### 1. New Customer Creation
- [ ] Create a new customer via NewCustomerWizard
- [ ] Verify all fields are saved correctly
- [ ] Check that dropdowns show correct options
- [ ] Confirm service tier and contract status are properly set

### 2. Customer Editing
- [ ] Edit customer from Customer Management page
- [ ] Edit customer from Workflow Dashboard
- [ ] Edit customer from Customer Details Modal
- [ ] Verify changes appear immediately in all views

### 3. Data Consistency
- [ ] Update a field in one view and verify it shows in all other views
- [ ] Check that boolean fields maintain their state
- [ ] Verify site_hazards array is handled correctly
- [ ] Confirm date fields are formatted consistently

### 4. Workflow Integration
- [ ] Start a visit workflow and verify customer data loads
- [ ] Update customer data in Phase 1 and verify it persists
- [ ] Check that technician assignments show correctly
- [ ] Verify access requirements display properly

### 5. Search and Filtering
- [ ] Search for customers by name
- [ ] Filter by service tier
- [ ] Filter by contract status
- [ ] Verify search results use consistent data

## Benefits of This Implementation

1. **Single Source of Truth**: All data comes from and goes to `ame_customers` table
2. **Type Safety**: TypeScript interfaces ensure consistent data types
3. **Consistent UI**: All dropdowns use the same options
4. **No Data Duplication**: One service handles all CRUD operations
5. **Better Error Handling**: Centralized validation and error messages
6. **Maintainability**: Changes in one place affect entire application

## Next Steps

1. Deploy the database migration
2. Update all components as described
3. Run comprehensive testing
4. Monitor for any data inconsistencies
5. Document any edge cases found

## Support

If you encounter issues during implementation:
1. Check browser console for errors
2. Verify database migration was successful
3. Ensure all imports are updated correctly
4. Test with a clean browser cache
5. Review the unified types for field mapping

This implementation ensures that no matter where customer data is updated in the application, it will be consistent and properly typed throughout all interfaces.
