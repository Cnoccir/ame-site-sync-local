# Database-Enabled Tridium Upload Components

## Overview

This document describes the new database-enabled Tridium upload components that solve the data loss on refresh issue by automatically persisting all parsed data to the Supabase database.

## Key Components

### 1. `DatabaseTridiumUpload`

The core upload component that integrates with the Enhanced Tridium Parsing Service for database persistence.

**Features:**
- Drag-and-drop file upload
- Real-time upload progress tracking
- Automatic database persistence via `EnhancedTridiumParsingService`
- Integration with `useImportedDatasets` hook for live data retrieval
- Project context display (project ID, customer, site name)
- Comprehensive error handling and user feedback

**Usage:**
```tsx
import { DatabaseTridiumUpload } from '@/components/pm-workflow/DatabaseTridiumUpload';

<DatabaseTridiumUpload
  projectId="my-project-123"
  customerId="customer-001"
  siteName="Main Building"
  onUploadComplete={(result) => {
    console.log('Upload complete:', result.systemBaselineId);
  }}
  onDataChange={() => {
    // Handle data refresh if needed
  }}
/>
```

**Props:**
- `projectId`: string - Required project identifier
- `customerId?`: string - Optional customer identifier  
- `siteName`: string - Site name for context
- `onUploadComplete?`: (result: EnhancedParsingResult) => void - Callback when upload completes
- `onDataChange?`: () => void - Callback when data changes

### 2. `EnhancedTridiumImportWizard`

A comprehensive wizard that combines database-enabled uploads with legacy import methods.

**Features:**
- Tabbed interface with Database Import, Legacy Wizards, and Analysis tabs
- Toggle between database-enabled and traditional approaches
- Real-time analysis dashboard after upload completion
- Full backward compatibility with existing `TridiumImportWizard`

**Usage:**
```tsx
import { EnhancedTridiumImportWizard } from '@/components/pm-workflow/EnhancedTridiumImportWizard';

<EnhancedTridiumImportWizard
  projectId="my-project-123"
  customerId="customer-001"
  siteName="Main Building"
  onComplete={(data) => handleComplete(data)}
  onImportComplete={(data) => handleImportComplete(data)}
  onGenerateReport={(data) => generateReport(data)}
/>
```

### 3. `DatabaseTridiumDemo`

A comprehensive demo component showcasing all database-enabled functionality.

**Features:**
- Interactive demo of direct uploads and enhanced wizards
- Live analysis dashboard
- Project context examples
- User-friendly interface for testing

**Usage:**
```tsx
import { DatabaseTridiumDemo } from '@/components/pm-workflow/DatabaseTridiumDemo';

<DatabaseTridiumDemo />
```

## Integration with Existing Systems

### PM Workflow Integration

The new components integrate seamlessly with the existing PM workflow system:

**Phase 2 System Discovery:**
- Updated to include database-enabled upload options
- Toggle between database and legacy discovery methods
- Automatic validation when database uploads complete
- Real-time analysis integration

**Usage in Phase 2:**
```tsx
// In Phase2SystemDiscovery.tsx - now includes database upload option
{useDatabase ? (
  <DatabaseTridiumUpload
    projectId={sessionId || `pm-${Date.now()}`}
    customerId={data.customer?.id}
    siteName={data.customer?.siteName || 'PM Assessment Site'}
    onUploadComplete={handleDatabaseUploadComplete}
  />
) : (
  <UnifiedSystemDiscovery // Legacy approach
    onSystemDataComplete={handleTridiumImportComplete}
  />
)}
```

### Hook Integration

The components work seamlessly with the existing hook system:

```tsx
// useImportedDatasets hook automatically retrieves database-persisted data
const { datasets, loading, error, reload } = useImportedDatasets(projectId);

// No more data loss on refresh - all data is persisted in Supabase
```

## Database Architecture

### Data Flow

1. **File Upload** → `DatabaseTridiumUpload` component
2. **Parsing** → `EnhancedTridiumParsingService.parseFiles()`
3. **Database Persistence** → `TridiumDatabaseService` saves to Supabase
4. **Retrieval** → `useImportedDatasets` hook fetches from database
5. **Analysis** → `TridiumAnalysisPanel` displays real-time results

### Database Tables Used

- `system_baselines` - Main system records with project context
- `tridium_datasets` - Individual file data with metadata
- `tridium_devices` - Device inventories from parsed files
- `tridium_resources` - Resource utilization data
- `tridium_alerts` - System health alerts and recommendations

## Enhanced Type Support

### Updated Interfaces

**TridiumExportData** (enhanced):
```typescript
export interface TridiumExportData {
  // Existing fields...
  processed: boolean;
  
  // New database-enabled fields
  databaseEnabled?: boolean;
  systemBaselineId?: string;
  importSummary?: {
    totalDevices?: number;
    systemBaselineId?: string;
    datasetsCount?: number;
    totalAlerts?: number;
    criticalAlerts?: number;
    processingTime?: number;
    databaseSaved?: boolean;
  };
}
```

## Migration Guide

### From Legacy to Database-Enabled

**Old Approach:**
```tsx
<AdaptiveTridiumImport
  onImportComplete={(data) => {
    // Data only in memory - lost on refresh
    setSystemData(data);
  }}
/>
```

**New Approach:**
```tsx
<DatabaseTridiumUpload
  projectId="project-123"
  siteName="Site Name"
  onUploadComplete={(result) => {
    // Data automatically persisted to database
    console.log('System baseline ID:', result.systemBaselineId);
  }}
/>
```

### Validation Updates

**Phase 2 Discovery Validation:**
```tsx
const validateSection = (section: string): boolean => {
  switch (section) {
    case 'discovery':
      // Now recognizes database uploads as complete
      const hasDatabaseData = data.tridiumExports?.processed && data.tridiumExports?.databaseEnabled;
      const hasLegacyData = networkTopology !== null;
      const hasManualData = data.manualInventory.totalDeviceCount > 0;
      
      return hasDatabaseData || hasLegacyData || hasManualData;
  }
};
```

## Benefits

### Data Persistence
- **No More Data Loss:** All uploaded data automatically saved to Supabase
- **Project Context:** Data organized by project ID for easy retrieval
- **System Baselines:** Unique identifiers for tracking system changes over time

### Enhanced User Experience
- **Real-Time Feedback:** Live progress tracking and status updates
- **Error Recovery:** Comprehensive error handling with retry mechanisms
- **Analysis Dashboard:** Immediate access to parsed data analysis

### Developer Experience
- **Type Safety:** Enhanced TypeScript interfaces for database operations
- **Hook Integration:** Seamless integration with existing `useImportedDatasets`
- **Backward Compatibility:** Existing code continues to work unchanged

## Testing

### Manual Testing

1. Navigate to `/database-tridium-test` page
2. Upload sample Tridium files (PlatformDetails.txt, ResourceExport.csv, etc.)
3. Verify database persistence by refreshing the page
4. Check that data remains available in the analysis dashboard

### Component Testing

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DatabaseTridiumUpload } from '@/components/pm-workflow/DatabaseTridiumUpload';

test('uploads files and persists to database', async () => {
  const mockOnComplete = jest.fn();
  
  render(
    <DatabaseTridiumUpload
      projectId="test-project"
      siteName="Test Site"
      onUploadComplete={mockOnComplete}
    />
  );
  
  // Test file upload functionality
  const fileInput = screen.getByLabelText(/choose files/i);
  const testFile = new File(['test content'], 'test.csv', { type: 'text/csv' });
  
  fireEvent.change(fileInput, { target: { files: [testFile] } });
  
  await waitFor(() => {
    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        systemBaselineId: expect.any(String),
        databaseSaved: true
      })
    );
  });
});
```

## Future Enhancements

### Planned Features
- **Batch Upload:** Support for multiple project uploads
- **Data Comparison:** Compare system baselines across time periods
- **Export Options:** Enhanced report generation with database queries
- **Real-Time Sync:** Live updates across multiple browser sessions

### Performance Optimizations
- **Caching:** Smart caching of frequently accessed datasets
- **Chunked Uploads:** Support for large file uploads
- **Background Processing:** Async parsing for improved UX

## Troubleshooting

### Common Issues

**Upload Fails with Database Error:**
- Verify Supabase connection in environment variables
- Check `EnhancedTridiumParsingService` configuration
- Ensure proper authentication for database operations

**Data Not Persisting:**
- Verify `systemBaselineId` is returned from upload
- Check database table permissions in Supabase
- Validate project ID format and consistency

**Analysis Panel Shows No Data:**
- Ensure `projectId` matches between upload and analysis components
- Check `useImportedDatasets` hook for error states
- Verify database queries are returning expected results

### Debug Mode

Enable debug logging:
```tsx
import { logger } from '@/utils/logger';

// Log level configuration
logger.setLevel('debug');
```

## Support

For issues related to database-enabled uploads:
1. Check the browser console for error messages
2. Verify Supabase database connectivity
3. Test with sample files from the demo component
4. Review the Enhanced Tridium Parsing Service logs

---

This implementation fully resolves the data loss on refresh issue by ensuring all Tridium system data is properly persisted to the database and can be reliably retrieved through the existing hook architecture.