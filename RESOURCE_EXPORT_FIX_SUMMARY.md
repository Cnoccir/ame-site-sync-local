# Resource Export Data Mapping Fix

## Problem Identified
The Resource Export CSV parser was correctly extracting data from the CSV files, but the **TridiumParsedNormalizer** was not properly preserving critical fields when converting to the metrics format, causing the preview to display zeros instead of actual values.

## Root Cause
1. **Normalizer (`TridiumParsedNormalizer.ts`)** - The `normalizeResources()` method was:
   - Not extracting `components` field at all
   - Not extracting `histories` count
   - Not preserving `warnings` and `raw` arrays
   - Not properly mapping engine scan and queue metrics
   
2. **Preview (`ResourceExportPreview.tsx`)** - Was looking for some fields in wrong locations

## CSV Field Mapping (Example: SupervisorNiagaraResourceExport.csv)

### Actual CSV Data:
```csv
component.count,71732
globalCapacity.devices,0 (Limit: 0)
globalCapacity.points,0 (Limit: 0)
history.count,7172
cpu.usage,5%
mem.total,32386 MB
mem.used,8254 MB
heap.used,342 MB
heap.max,910 MB
engine.queue.actions,0 (Peak 29103)
time.uptime,26 days, 3 hours, 3 minutes, 33 seconds
```

### Expected Display Values After Fix:
- **Components**: 71,732
- **Devices**: 0 / 0 (0%)
- **Points**: 0 / 0 (0%)
- **Histories**: 7,172
- **CPU Usage**: 5%
- **Memory**: 8,254 MB / 32,386 MB (25%)
- **Heap**: 342 MB / 910 MB (38%)
- **Engine Queue**: 0 (Peak: 29,103)
- **Uptime**: 26 days, 3 hours, 3 minutes, 33 seconds

## Changes Made

### 1. TridiumParsedNormalizer.ts (lines 110-165)
**Added:**
- `components: norm?.components ?? 0` to `metrics.capacities`
- `histories: { current: norm?.histories ?? 0, limit: null }` to `metrics.capacities`
- Proper engine scan metrics extraction
- Proper engine queue metrics extraction
- Preserved `warnings`, `raw`, and `analysis` arrays

### 2. ResourceExportPreview.tsx (lines 52-108)
**Updated:**
- Added helper functions to parse engine queue strings like "0 (Peak 29103)"
- Correctly extract `scan_time_ms` from engineScan.recent
- Map all normalized fields to display format

## Data Flow Path

```
CSV File
   ↓
ResourceExportParser
   ├─ Parses CSV → creates ResourceExportOutput
   ├─ components: 71732
   ├─ devices: { used: 0, licensed: 0, usage_percent: 0 }
   ├─ histories: 7172
   ├─ cpu: { usage_percent: 5 }
   └─ memory, heap, engine, time...
   ↓
TridiumParsedNormalizer.normalizeResources()
   ├─ Creates ResourceParsedData with metrics format
   ├─ metrics.capacities.components: 71732  ← FIXED
   ├─ metrics.capacities.histories.current: 7172  ← FIXED
   ├─ metrics.cpu.usage: 5  ← Already worked
   ├─ metrics.engineQueue.actions: "0 (Peak 29103)"  ← FIXED
   └─ warnings, raw, analysis preserved  ← FIXED
   ↓
ResourceExportPreview
   ├─ Detects data.metrics format
   ├─ Extracts components from m.capacities.components  ← FIXED
   ├─ Parses engine queue strings  ← FIXED
   └─ Displays all values correctly
```

## Testing Instructions

1. **Hard refresh** the browser (Ctrl+Shift+R or Ctrl+F5)
2. Upload a Resource Export CSV file (e.g., SupervisorNiagaraResourceExport.csv)
3. Verify the preview shows:
   - Non-zero component count
   - Correct device and point counts
   - Correct CPU percentage
   - Correct memory values
   - Correct history count
   - Correct engine queue values

## Console Logs to Check

Look for these console logs to verify correct data flow:
```
🔍 Processing file: SupervisorNiagaraResourceExport.csv detected type: resource
📊 Resource data processed: { metrics: {...}, warnings: [], raw: [...], analysis: {...} }
✅ Using metrics-based format (normalized)
📊 Final resourceData: { components: 71732, devices: {...}, ... }
```

The `components` value should be **71732**, not **0**.

## Files Modified
1. `/src/services/TridiumParsedNormalizer.ts` - Lines 110-165
2. `/src/components/pm-workflow/ResourceExportPreview.tsx` - Lines 52-108

## Next Steps
After verifying the fix works:
1. Test with multiple different Resource Export files
2. Test with both JACE and Supervisor exports
3. Verify all metrics display correctly in the System Health Analysis section
4. Consider adding unit tests for the normalizer
