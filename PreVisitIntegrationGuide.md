# PreVisit Workflow Integration Guide

This guide shows how to integrate the new database schema and services with the existing PreVisitWorkflowEnhanced component.

## Implementation Summary

✅ **Database Schema Created**
- Added missing fields to `ame_customers` table
- Created `previsit_preparations` table for workflow tracking
- Created `ame_tool_catalog` table with 21 tools from the component
- Created `previsit_tool_selections` junction table
- Added helper functions and comprehensive view

✅ **Data Transformation Layer**
- Created `previsit-data-transforms.ts` with type-safe transformations
- Bidirectional mapping between database and form state
- Progress calculation and validation logic

✅ **CRUD Services**
- Created `previsit-service.ts` with complete CRUD operations
- Auto-save functionality with debouncing
- Analytics and reporting functions
- Error handling and recovery

## Quick Integration Steps

### 1. Update PreVisitWorkflowEnhanced Component

Replace the existing data loading and saving logic:

```typescript
// src/components/visit/phases/PreVisitWorkflowEnhanced.tsx

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  loadPreVisitData, 
  savePreVisitData, 
  completePreVisitPreparation,
  createDebouncedAutoSave 
} from '@/services/previsit-service';
import { 
  PreVisitFormData,
  transformCustomerToPreVisitForm,
  calculateFormProgress,
  validatePreVisitForm
} from '@/utils/previsit-data-transforms';

interface PreVisitWorkflowEnhancedProps {
  customer: Customer;
  visitId?: string;
  onPhaseComplete: () => void;
  updateCustomerData?: (updates: Partial<Customer>) => void;
  autoSaveEnabled?: boolean;
}

export const PreVisitWorkflowEnhanced = ({ 
  customer, 
  visitId,
  onPhaseComplete,
  autoSaveEnabled = true
}: PreVisitWorkflowEnhancedProps) => {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<PreVisitFormData | null>(null);
  const [tools, setTools] = useState<ToolCatalogItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const { toast } = useToast();

  // Create debounced auto-save function
  const debouncedAutoSave = useMemo(() => 
    createDebouncedAutoSave(1000), []
  );

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await loadPreVisitData(customer.id, visitId);
        setFormData(data.formData);
        setTools(data.tools);
      } catch (error) {
        console.error('Failed to load PreVisit data:', error);
        toast({
          title: 'Loading Error',
          description: 'Failed to load preparation data',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [customer.id, visitId]);

  // Update field with auto-save
  const updateField = (field: string, value: any) => {
    if (!formData) return;
    
    const updatedFormData = {
      ...formData,
      [field]: value
    };
    setFormData(updatedFormData);
    
    if (autoSaveEnabled) {
      debouncedAutoSave(updatedFormData, customer.id, visitId);
    }
  };

  // Manual save
  const handleSave = async () => {
    if (!formData) return;
    
    try {
      setIsSaving(true);
      await savePreVisitData(formData, customer.id, visitId);
      setLastSaveTime(new Date());
      toast({
        title: 'Progress Saved',
        description: 'Your preparation progress has been saved.'
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save progress',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Complete phase
  const handlePhaseComplete = async () => {
    if (!formData) return;
    
    const errors = validatePreVisitForm(formData);
    if (errors.length > 0) {
      toast({
        title: 'Incomplete Preparation',
        description: errors[0],
        variant: 'destructive'
      });
      return;
    }

    try {
      await completePreVisitPreparation(customer.id, visitId);
      toast({
        title: 'Pre-Visit Preparation Complete',
        description: 'All preparation tasks completed. Ready for site visit.'
      });
      onPhaseComplete();
    } catch (error) {
      console.error('Phase completion failed:', error);
      toast({
        title: 'Completion Failed',
        description: 'Failed to complete preparation',
        variant: 'destructive'
      });
    }
  };

  // Calculate progress
  const progress = formData ? calculateFormProgress(formData) : 0;

  if (isLoading) {
    return <div>Loading preparation data...</div>;
  }

  if (!formData) {
    return <div>Failed to load preparation data</div>;
  }

  // Rest of component JSX remains the same...
  return (
    <div className="pre-visit-workflow h-full flex flex-col">
      {/* Existing JSX structure */}
    </div>
  );
};
```

### 2. Update Tool Selection Logic

Replace the hardcoded TOOLS_CATALOG with database-driven tools:

```typescript
// In the Tools section of PreVisitWorkflowEnhanced.tsx

// Get system-specific tools from database instead of hardcoded catalog
const systemSpecificTools = useMemo(() => {
  return tools.filter(tool => 
    tool.system_platforms.includes(formData.siteIntelligence.systemPlatform) &&
    tool.category !== 'standard' && 
    tool.category !== 'spareparts'
  );
}, [tools, formData.siteIntelligence.systemPlatform]);

// Standard tools
const standardTools = tools.filter(tool => tool.category === 'standard');

// Spare parts
const spareParts = tools.filter(tool => tool.category === 'spareparts');

// Auto-select required tools when system platform changes
useEffect(() => {
  if (formData.siteIntelligence.systemPlatform && tools.length > 0) {
    const autoSelected = tools
      .filter(tool => 
        tool.is_required && (
          tool.category === 'standard' ||
          tool.system_platforms.includes(formData.siteIntelligence.systemPlatform)
        )
      )
      .map(tool => tool.tool_id);
    
    updateField('tools.selectedTools', autoSelected);
  }
}, [formData.siteIntelligence.systemPlatform, tools]);
```

### 3. Update Documentation Section

Use the new document availability tracking:

```typescript
// Replace documentAvailability state with formData.documentation.availability
const toggleDocumentAvailability = (docType: string, available: boolean) => {
  updateField('documentation.availability', {
    ...formData.documentation.availability,
    [docType]: available
  });
};
```

### 4. Update Progress Tracking

Replace the manual progress calculation:

```typescript
// Remove calculateProgress function and use the new one
import { calculateFormProgress, getSectionCompletionStatus } from '@/utils/previsit-data-transforms';

// In JSX
<Progress value={calculateFormProgress(formData)} className="w-32" />
<span className="text-sm font-medium">{calculateFormProgress(formData)}%</span>
```

## Testing the Integration

### 1. Test Data Loading

```typescript
// Test loading customer data
const testCustomer = await loadPreVisitData('customer-id-here');
console.log('Loaded data:', testCustomer);
```

### 2. Test Auto-Save

```typescript
// Test auto-save functionality
const autoSave = createDebouncedAutoSave(500);
autoSave(partialFormData, customerId, visitId);
```

### 3. Test Tool Filtering

```typescript
// Test tool loading for different platforms
const n4Tools = await loadToolCatalog('N4');
const fxTools = await loadToolCatalog('FX');
console.log('N4 tools:', n4Tools.length);
console.log('FX tools:', fxTools.length);
```

## Database Functions Available

### Core Functions
- `get_or_create_previsit_preparation(customer_id, visit_id)` - Get or create preparation record
- `calculate_previsit_progress(preparation_id)` - Calculate and update progress
- `get_tools_for_platform(system_platform)` - Get filtered tools
- `update_previsit_auto_save(customer_id, visit_id, auto_save_data)` - Auto-save data

### Views
- `previsit_workflow_data` - Combined customer and preparation data

## Analytics and Reporting

The new system includes analytics functions:

```typescript
import { getPreVisitAnalytics } from '@/services/previsit-service';

// Get overall analytics
const analytics = await getPreVisitAnalytics();
console.log('Completion rate:', analytics.completion_rate_by_section);

// Get analytics for date range
const monthlyAnalytics = await getPreVisitAnalytics({
  start: '2024-01-01',
  end: '2024-01-31'
});
```

## Migration Strategy

### Phase 1: Database Setup (✅ Completed)
- Database schema created
- Tools populated
- Functions created

### Phase 2: Service Integration
1. Test the new services with existing data
2. Update PreVisitWorkflowEnhanced component gradually
3. Test auto-save functionality

### Phase 3: Full Integration
1. Replace all hardcoded tool catalogs
2. Update all form state management
3. Test progress tracking

### Phase 4: Validation & Optimization
1. Test with real customer data
2. Optimize query performance
3. Add error recovery
4. Validate data integrity

## Error Handling

The new system includes comprehensive error handling:

```typescript
// Service calls automatically handle errors
try {
  const data = await loadPreVisitData(customerId, visitId);
  // Handle success
} catch (error) {
  // Error is already logged
  toast({
    title: 'Loading Failed',
    description: 'Please try again',
    variant: 'destructive'
  });
}
```

## Performance Considerations

- All database queries are indexed
- Auto-save is debounced to prevent excessive database calls
- Tool catalog is cached per system platform
- Progress calculation is done server-side

## Security & RLS

The new tables inherit RLS policies from existing tables:
- `previsit_preparations` - Customer-level access control
- `ame_tool_catalog` - Public read access (tools are not sensitive)
- `previsit_tool_selections` - Linked to preparation access

## Support Functions

Additional utility functions available:

```typescript
// Reset preparation for testing
await resetPreVisitPreparation(customerId, visitId);

// Get current status
const status = await getPreVisitStatus(customerId, visitId);

// Validate form before submission
const errors = validatePreVisitForm(formData);
if (errors.length > 0) {
  // Handle validation errors
}
```

This implementation provides:
- ✅ Seamless data loading and saving
- ✅ Robust auto-save with debouncing
- ✅ Comprehensive progress tracking
- ✅ Dynamic tool management
- ✅ Data integrity and validation
- ✅ Analytics and reporting capabilities
- ✅ Error handling and recovery
- ✅ Performance optimization

The system is ready for integration and testing with the existing PreVisitWorkflowEnhanced component.
