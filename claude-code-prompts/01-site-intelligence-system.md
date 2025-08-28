# Prompt 1: Site Intelligence System - Nicknames & Persistent Site Numbers

## Objective
Implement a site intelligence system that addresses Rob's feedback about job number confusion and the need for quick site reference nicknames. Create persistent site identifiers that stay consistent across changing contracts.

## Context
- Current system uses customer.id and company_name for identification
- Team feedback indicates job numbers and contract numbers keep changing
- Technicians want quick "nickname" references for sites
- Need persistent site numbers that survive contract changes
- Primary/secondary technician assignments need tracking

## Current Code to Modify
- `src/types/index.ts` - Customer interface
- `src/components/visit/CustomerInfoCard.tsx` - Display component
- `src/components/visit/phases/PreVisitPhase.tsx` - Pre-visit preparation
- Database schema in `supabase/migrations/`

## Requirements

### 1. Database Schema Changes
Create a new migration to add fields to customers table:
```sql
ALTER TABLE customers ADD COLUMN site_nickname VARCHAR(50);
ALTER TABLE customers ADD COLUMN site_number VARCHAR(20) UNIQUE;
ALTER TABLE customers ADD COLUMN primary_technician_id UUID REFERENCES auth.users(id);
ALTER TABLE customers ADD COLUMN secondary_technician_id UUID REFERENCES auth.users(id);
ALTER TABLE customers ADD COLUMN last_job_numbers TEXT[]; -- Track changing job numbers
ALTER TABLE customers ADD COLUMN system_platform VARCHAR(50); -- N4, FX, WEBs, etc.
```

### 2. Enhanced Customer Interface
Update the Customer interface in `src/types/index.ts`:
```typescript
interface Customer {
  // ... existing fields
  site_nickname?: string;           // Quick reference name
  site_number?: string;            // Persistent unique identifier
  primary_technician_id?: string;
  secondary_technician_id?: string;
  primary_technician_name?: string;  // Derived from user lookup
  secondary_technician_name?: string; // Derived from user lookup
  last_job_numbers?: string[];     // Historical job numbers
  system_platform?: 'N4' | 'FX' | 'WEBs' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other';
}
```

### 3. Site Intelligence Service
Create `src/services/siteIntelligenceService.ts`:
```typescript
export class SiteIntelligenceService {
  // Generate unique site numbers automatically
  static generateSiteNumber(): Promise<string>;
  
  // Get technician names from IDs
  static getTechnicianNames(primaryId?: string, secondaryId?: string): Promise<{primary?: string, secondary?: string}>;
  
  // Update site intelligence data
  static updateSiteIntelligence(customerId: string, updates: Partial<Customer>): Promise<void>;
  
  // Get site context for technician handoffs
  static getSiteContext(customerId: string): Promise<SiteContext>;
}

interface SiteContext {
  nickname: string;
  siteNumber: string;
  systemPlatform: string;
  primaryTech: string;
  secondaryTech?: string;
  lastVisit?: {
    technicianName: string;
    date: Date;
    phase: number;
  };
}
```

### 4. Enhanced Customer Info Display
Update `CustomerInfoCard.tsx` to show:
- Site nickname prominently
- Site number (persistent ID)
- System platform badge
- Primary/secondary technician assignments
- Quick access to edit site intelligence

### 5. Pre-Visit Phase Enhancement
In `PreVisitPhase.tsx`, add section for:
- Site intelligence verification
- Technician assignment confirmation
- System platform confirmation
- Site nickname display for quick reference

### 6. Site Number Generation Logic
Implement automatic site number generation:
- Format: `AME-{YYYY}-{###}` (e.g., "AME-2025-001")
- Check for uniqueness
- Allow manual override for existing sites

## Success Criteria
1. All customers have persistent site numbers
2. Technicians can see site nicknames in all relevant views
3. Primary/secondary technician info displays correctly
4. System platform is tracked and displayed
5. Job number history is maintained for reference
6. Site intelligence can be easily updated

## Testing Requirements
1. Test site number generation uniqueness
2. Verify technician lookup performance
3. Test migration on existing customers
4. Ensure site intelligence displays in all relevant components
5. Test editing capabilities for site intelligence

## Notes
- This addresses Rob's feedback about job numbers changing and needing nicknames
- Provides foundation for better technician handoffs
- System platform tracking supports John's feedback about knowing main system types
- Site numbers provide stable reference across contract changes