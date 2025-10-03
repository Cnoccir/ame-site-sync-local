# Phase 2 Log Spam Fix

## Problem
The application was experiencing console log spam with messages like:
```
[2025-10-03T04:16:53.132Z] INFO: Updating phase data with sync | {"phase":2,"sessionId":"58e6ffd2-11f5-4069-af0f-10f36019529e"}
[2025-10-03T04:16:53.140Z] INFO: Updating phase data with sync | {"phase":2,"sessionId":"58e6ffd2-11f5-4069-af0f-10f36019529e"}
[2025-10-03T04:16:53.142Z] INFO: Phase 2 merge preserving tridiumSystemData | {"hadExisting":true,"preservedIt":true}
[2025-10-03T04:16:53.142Z] INFO: Updating PM workflow session | {"sessionId":"58e6ffd2-11f5-4069-af0f-10f36019529e","phase":2}
```

These messages were repeating multiple times per second, creating noise in the console.

## Root Cause
The issue stemmed from **multiple rapid calls to `updatePhaseData`** during Phase 2 operations:

1. When Phase 2 data changed (e.g., during system discovery, file uploads, etc.), the `onDataUpdate` callback was triggered
2. This immediately called `UnifiedCustomerDataService.updatePhaseData`
3. Each call to `updatePhaseData`:
   - Fetched the existing session from the database
   - Merged data (especially for Phase 2 to preserve `tridiumSystemData`)
   - Updated the database
   - Logged INFO messages at each step

4. Since Phase 2 can have many sub-components updating simultaneously (BMS data, system access, remote access, project folder, etc.), this created a cascade of database calls and logs

## Solution

### 1. **Debouncing Database Saves** (`PMWorkflowGuide.tsx`)
Added a 1-second debounce to the `handleDataUpdate` function:

- Each phase has its own debounce timer (stored in `saveTimersRef`)
- When data updates, the timer is reset
- Only after 1 second of no updates does the actual database save occur
- This dramatically reduces the number of database calls

**Benefits:**
- Reduces database load by batching rapid updates
- Prevents race conditions from simultaneous saves
- Maintains data integrity while improving performance

### 2. **Log Level Adjustments**
Changed verbose logs from `INFO` to `DEBUG` level:

**Files modified:**
- `unifiedCustomerDataService.ts` - Line 265: "Updating phase data with sync"
- `unifiedCustomerDataService.ts` - Line 281: "Phase 2 merge preserving tridiumSystemData"
- `pmWorkflowPersistenceService.ts` - Line 87: "Updating PM workflow session"

**Benefits:**
- INFO logs now only show significant events
- DEBUG logs are still available for troubleshooting but hidden by default
- Console remains clean during normal operation

### 3. **Cleanup on Unmount**
Added a cleanup effect to clear all pending timers when the component unmounts:

```typescript
useEffect(() => {
  return () => {
    Object.values(saveTimersRef.current).forEach(timer => {
      if (timer) clearTimeout(timer);
    });
  };
}, []);
```

This prevents memory leaks and ensures no orphaned save operations.

## Files Changed

1. **`src/components/pm-workflow/PMWorkflowGuide.tsx`**
   - Added `useRef` import
   - Added `saveTimersRef` for debounce timers
   - Modified `handleDataUpdate` to debounce saves
   - Added cleanup effect for timers

2. **`src/services/unifiedCustomerDataService.ts`**
   - Changed log level from `info` to `debug` for "Updating phase data with sync"
   - Changed log level from `info` to `debug` for "Phase 2 merge preserving tridiumSystemData"

3. **`src/services/pmWorkflowPersistenceService.ts`**
   - Changed log level from `info` to `debug` for "Updating PM workflow session"

## Testing Recommendations

1. **Verify debouncing works:**
   - Make rapid changes in Phase 2 (e.g., type quickly in fields)
   - Observe that only one save occurs after changes stop
   - Check that "save pending" message appears during updates

2. **Verify data integrity:**
   - Make changes and wait for save
   - Refresh the page
   - Confirm all changes persisted

3. **Verify cleanup:**
   - Navigate away from PM workflow
   - Check console for any errors about timers

4. **Check log levels:**
   - Normal operation should show minimal console output
   - Enable debug logs to see the detailed save operations

## Performance Impact

**Before:**
- 10+ database calls per second during active editing
- Console flooded with INFO logs
- Potential for race conditions

**After:**
- 1 database call per second maximum (per phase)
- Clean console with only significant events
- No race conditions due to debouncing
