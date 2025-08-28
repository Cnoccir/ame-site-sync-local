# Prompt 2: Enhanced Access & Contact Intelligence

## Objective
Address Rob's feedback about timing issues and POC availability by creating an intelligent contact and access management system. Implement contact verification workflows and access intelligence that learns from visit patterns.

## Context
Rob's feedback identified these critical issues:
- "Timing, POC isn't on site at time of job start"
- Need to know "who scheduling coordinated with, and who scheduling expected us to meet"
- "Amount of times a phone number or just go to site and we will find out happens..."
- Need secondary contact fields

## Current Code to Modify
- Customer interface and database schema
- `src/components/visit/phases/PreVisitPhase.tsx` - Add contact verification
- Create new contact verification workflow
- Add access intelligence tracking

## Requirements

### 1. Database Schema Enhancements
Create migration for enhanced contact tracking:
```sql
-- Add to customers table
ALTER TABLE customers ADD COLUMN secondary_contact VARCHAR(100);
ALTER TABLE customers ADD COLUMN secondary_phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN secondary_email VARCHAR(100);
ALTER TABLE customers ADD COLUMN best_arrival_time VARCHAR(50);
ALTER TABLE customers ADD COLUMN typical_availability_hours VARCHAR(100);
ALTER TABLE customers ADD COLUMN scheduling_notes TEXT;

-- Create contact verification log table
CREATE TABLE contact_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  visit_id UUID REFERENCES ame_visits(id),
  contact_method VARCHAR(20), -- 'phone', 'email', 'text'
  contact_person VARCHAR(100),
  attempted_at TIMESTAMP DEFAULT NOW(),
  successful BOOLEAN,
  response_notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Create access intelligence table
CREATE TABLE access_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  best_arrival_times VARCHAR(100),
  worst_arrival_times VARCHAR(100),
  access_success_rate DECIMAL(3,2),
  common_access_issues TEXT,
  backup_contacts TEXT,
  learned_patterns JSONB,
  last_updated TIMESTAMP DEFAULT NOW()
);
```

### 2. Enhanced Customer Interface
Update Customer interface in `src/types/index.ts`:
```typescript
interface Customer {
  // ... existing fields
  
  // Enhanced Contact Information
  secondary_contact?: string;
  secondary_phone?: string;
  secondary_email?: string;
  best_arrival_time?: string;
  typical_availability_hours?: string;
  scheduling_notes?: string;
  
  // Access Intelligence (computed fields)
  access_success_rate?: number;
  recommended_arrival_time?: string;
  access_warnings?: string[];
}

interface ContactVerification {
  id: string;
  customer_id: string;
  visit_id: string;
  contact_method: 'phone' | 'email' | 'text';
  contact_person: string;
  attempted_at: Date;
  successful: boolean;
  response_notes?: string;
}

interface AccessIntelligence {
  customer_id: string;
  best_arrival_times: string;
  worst_arrival_times: string;
  access_success_rate: number;
  common_access_issues: string;
  backup_contacts: string;
  learned_patterns: any;
}
```

### 3. Contact Verification Service
Create `src/services/contactVerificationService.ts`:
```typescript
export class ContactVerificationService {
  // Pre-visit contact verification workflow
  static async initiateContactVerification(customerId: string, visitId: string): Promise<ContactVerification[]>;
  
  // Log contact attempt results
  static async logContactAttempt(
    customerId: string,
    visitId: string,
    method: string,
    person: string,
    successful: boolean,
    notes?: string
  ): Promise<void>;
  
  // Get contact verification status for visit
  static async getVerificationStatus(visitId: string): Promise<{
    primaryVerified: boolean;
    secondaryVerified: boolean;
    lastAttempt?: Date;
    recommendations: string[];
  }>;
  
  // Update scheduling coordination tracking
  static async updateSchedulingCoordination(
    customerId: string,
    coordinatedWith: string,
    expectedContact: string,
    notes: string
  ): Promise<void>;
}
```

### 4. Access Intelligence Service
Create `src/services/accessIntelligenceService.ts`:
```typescript
export class AccessIntelligenceService {
  // Learn from visit outcomes
  static async recordAccessOutcome(
    customerId: string,
    arrivalTime: Date,
    successful: boolean,
    issues?: string,
    contactMet?: string
  ): Promise<void>;
  
  // Get access recommendations for site
  static async getAccessRecommendations(customerId: string): Promise<{
    recommendedArrivalTime: string;
    successRate: number;
    commonIssues: string[];
    backupContacts: string[];
    tips: string[];
  }>;
  
  // Update access patterns
  static async updateAccessPatterns(customerId: string): Promise<void>;
}
```

### 5. Enhanced Pre-Visit Phase Component
Update `PreVisitPhase.tsx` to include:

#### Contact Verification Section
```typescript
const ContactVerificationSection = ({ customer, visitId }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Contact Verification & Coordination
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Primary Contact Verification */}
          <ContactVerificationCard
            type="Primary"
            name={customer.primary_contact}
            phone={customer.contact_phone}
            email={customer.contact_email}
            onVerify={(method, successful, notes) => handleVerification('primary', method, successful, notes)}
          />
          
          {/* Secondary Contact Verification */}
          {customer.secondary_contact && (
            <ContactVerificationCard
              type="Secondary"
              name={customer.secondary_contact}
              phone={customer.secondary_phone}
              email={customer.secondary_email}
              onVerify={(method, successful, notes) => handleVerification('secondary', method, successful, notes)}
            />
          )}
          
          {/* Scheduling Coordination Tracking */}
          <SchedulingCoordinationCard
            coordinatedWith=""
            expectedContact=""
            notes=""
            onChange={handleSchedulingUpdate}
          />
        </div>
      </CardContent>
    </Card>
  );
};
```

#### Access Intelligence Display
```typescript
const AccessIntelligenceCard = ({ customer }: Props) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Access Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Success Rate:</span>
            <Badge variant={getSuccessRateVariant(customer.access_success_rate)}>
              {customer.access_success_rate}%
            </Badge>
          </div>
          
          <div>
            <span className="text-sm font-medium">Best Arrival Time:</span>
            <p className="text-sm text-muted-foreground">{customer.recommended_arrival_time}</p>
          </div>
          
          {customer.access_warnings && customer.access_warnings.length > 0 && (
            <div className="space-y-1">
              <span className="text-sm font-medium text-orange-600">Warnings:</span>
              {customer.access_warnings.map((warning, index) => (
                <p key={index} className="text-sm text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### 6. Contact Verification Components
Create `src/components/contact/ContactVerificationCard.tsx`:
```typescript
interface ContactVerificationCardProps {
  type: 'Primary' | 'Secondary';
  name: string;
  phone?: string;
  email?: string;
  onVerify: (method: string, successful: boolean, notes: string) => void;
}

export const ContactVerificationCard = ({ type, name, phone, email, onVerify }: ContactVerificationCardProps) => {
  // Component for individual contact verification
  // Includes call/email/text buttons
  // Success/failure tracking
  // Notes field for response details
};
```

## Success Criteria
1. Pre-visit contact verification workflow is intuitive and trackable
2. Access intelligence learns and improves recommendations over time
3. Scheduling coordination is properly tracked (who coordinated vs. who to meet)
4. Secondary contacts are prominently available
5. Access success rates and patterns are visible to technicians
6. Common access issues and solutions are surfaced

## Testing Requirements
1. Test contact verification workflow end-to-end
2. Verify access intelligence pattern learning
3. Test scheduling coordination tracking
4. Ensure all contact methods work properly
5. Verify access recommendations are helpful and accurate

## Notes
- Directly addresses Rob's most critical feedback about timing and POC availability
- Creates learning system that improves with each visit
- Provides clear tracking of scheduling coordination vs. actual contact expectations
- Secondary contacts become easily accessible for backup