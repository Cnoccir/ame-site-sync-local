# Resource Metrics Refactoring - JSONB Storage & Dynamic Display

## Problem Statement

The previous resource export parsing approach had several issues:

1. **Data Loss**: Complex nested structures caused many metrics to be lost or not displayed
2. **Rigid Structure**: Hardcoded display logic meant only specific metrics were shown
3. **Memory Value Bug**: Heap and memory values were showing as zeros due to double-parsing
4. **Not JSONB-Friendly**: The normalized structure was difficult to query and store efficiently

## Solution Overview

We've refactored the resource export processing to use a **JSONB-friendly flat structure** that:
- ✅ Preserves ALL raw metrics from CSV files
- ✅ Stores data in a simple key-value format perfect for JSONB columns
- ✅ Displays all metrics dynamically without hardcoded logic
- ✅ Allows switching between "All Metrics" and "Key Metrics" views
- ✅ Maintains structured analytics for health scoring and alerts

## Architecture Changes

### 1. Parser Output (`TridiumExportProcessor.ts`)

The `parseResourceExport` function now returns:

```typescript
{
  metrics: {      // Structured format for analytics
    cpu: { usage: 5 },
    heap: { used: 342, max: 910 },
    capacities: { ... },
    // ... other structured metrics
  },
  
  raw: [          // Complete array of all parsed metrics
    { name: 'cpu.usage', value: 5, unit: '%' },
    { name: 'heap.used', value: 342, unit: 'MB' },
    { name: 'globalCapacity.points', value: '3,303 (Limit: 5,000)' },
    // ... all other metrics
  ],
  
  allMetrics: {   // Flat key-value map (JSONB-friendly!)
    'cpu.usage': { value: 5, unit: '%' },
    'heap.used': { value: 342, unit: 'MB' },
    'heap.max': { value: 910, unit: 'MB' },
    'globalCapacity.points': { value: '3,303 (Limit: 5,000)' },
    'component.count': { value: 71732 },
    // ... ~30-50 metrics depending on system
  },
  
  warnings: [...],
  analysis: { ... }  // Health scores, alerts, recommendations
}
```

### 2. Storage Format

The `allMetrics` object can be stored directly in a JSONB column:

```sql
CREATE TABLE jace_resources (
  id UUID PRIMARY KEY,
  jace_name TEXT NOT NULL,
  metrics JSONB NOT NULL,  -- Store the entire allMetrics object
  parsed_at TIMESTAMP DEFAULT NOW()
);

-- Query example: Find JACEs with high heap usage
SELECT jace_name, 
       (metrics->'heap.used'->>'value')::numeric as heap_used,
       (metrics->'heap.max'->>'value')::numeric as heap_max
FROM jace_resources
WHERE (metrics->'heap.used'->>'value')::numeric / 
      (metrics->'heap.max'->>'value')::numeric > 0.8;
```

### 3. Display Components

#### `DynamicResourceMetricsDisplay.tsx` (New!)

- **Purpose**: Displays ALL metrics in categorized sections
- **Features**:
  - Automatically categorizes metrics (CPU, Memory, Capacities, etc.)
  - Shows progress bars for capacity metrics with limits
  - Color-codes metrics based on utilization (green/yellow/red)
  - Includes raw JSON viewer for debugging
  - No hardcoded metric names - fully data-driven

#### `ResourceExportPreview.tsx` (Updated)

- **Added**: View mode toggle between "All Metrics" and "Key Metrics"
- **Default**: Shows "All Metrics" view (dynamic display)
- **Fallback**: Falls back to "Key Metrics" view for structured analytics

## Key Fixes

### Memory Value Parsing Bug

**Before** (lines 1141-1154):
```typescript
const getHeapMetrics = () => {
  const used = raw.find(m => m.name === 'heap.used');
  return {
    // BUG: parseMemoryValue expects "342 MB" but gets "342"
    used: used ? this.parseMemoryValue(used.value.toString()) : 0
  };
};
```

**After**:
```typescript
const getHeapMetrics = () => {
  const used = raw.find(m => m.name === 'heap.used');
  return {
    // FIX: Values already normalized to MB in parseResourceValue
    used: used ? (typeof used.value === 'number' ? used.value : 0) : 0
  };
};
```

### Memory Value Normalization

Updated `parseResourceValue` (lines 2704-2724) to normalize all memory values to MB:

```typescript
// Before: Stored value in original unit
if (memoryMatch) {
  const value = parseInt(memoryMatch[1].replace(/,/g, ''));
  const unit = memoryMatch[2];
  return { name, value, unit };
}

// After: Normalize to MB immediately
if (memoryMatch) {
  const rawValue = parseInt(memoryMatch[1].replace(/,/g, ''));
  const unit = memoryMatch[2];
  
  let valueInMB: number;
  switch (unit) {
    case 'KB': valueInMB = rawValue / 1024; break;
    case 'GB': valueInMB = rawValue * 1024; break;
    case 'MB':
    default: valueInMB = rawValue;
  }
  
  return { name, value: valueInMB, unit: 'MB' };
}
```

## Benefits

### For Storage
- **Simple JSONB schema**: Just store the `allMetrics` object
- **Easy queries**: Use JSONB operators to filter/aggregate
- **No data loss**: Every metric from the CSV is preserved
- **Flexible schema**: New metrics are automatically included

### For Display
- **Complete visibility**: All ~30-50 metrics are visible
- **Automatic categorization**: Metrics grouped intelligently
- **Visual indicators**: Progress bars and color coding for capacities
- **No maintenance**: New metrics don't require code changes

### For Analytics
- **Structured data still available**: The `metrics` and `analysis` objects remain
- **Health scoring**: Threshold-based alerts still generated
- **Comparisons**: Can normalize on-demand for cross-JACE analysis

## Migration Path

### Existing Data
Existing stored data will continue to work because:
1. The old `metrics` object is still generated
2. The UI falls back to structured view if `allMetrics` is missing
3. No breaking changes to the data shape

### New Imports
New imports will automatically include:
1. The `allMetrics` flat map
2. The `raw` array with all parsed values
3. Both old and new formats for backward compatibility

## Example Usage

### Query Specific Metric
```typescript
// From stored data
const heapUsed = data.allMetrics['heap.used'].value;
const heapMax = data.allMetrics['heap.max'].value;
const heapPercent = (heapUsed / heapMax) * 100;
```

### Find All Capacity Metrics
```typescript
const capacityMetrics = Object.entries(data.allMetrics)
  .filter(([key]) => key.includes('globalCapacity'))
  .map(([key, value]) => ({
    name: key.replace('globalCapacity.', ''),
    ...value
  }));
```

### Display in UI
```typescript
// Dynamic component handles everything
<DynamicResourceMetricsDisplay 
  data={resourceData} 
  fileName="JACE1_Resources.csv" 
/>
```

## Testing

After these changes:
1. Upload a Resource Export CSV
2. Verify in console: `Total raw metrics parsed: X` (should be 30-50+)
3. Check that heap and memory values are non-zero
4. Toggle between "All Metrics" and "Key Metrics" views
5. Expand "View Raw JSON Data" to see the complete `allMetrics` object
6. Verify all capacity metrics show percentages and progress bars

## Future Enhancements

1. **Database Views**: Create Postgres views for common metric queries
2. **Metric Comparisons**: Build UI to compare metrics across multiple JACEs
3. **Trend Analysis**: Store multiple snapshots and show trends over time
4. **Custom Metrics**: Allow users to define custom calculated metrics
5. **Export/Reports**: Generate PDF/Excel reports from the JSONB data
