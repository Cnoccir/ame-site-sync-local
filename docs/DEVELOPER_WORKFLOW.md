# Developer Workflow & Best Practices Guide

## Development Environment Setup

### Local Development Requirements
```bash
# System requirements
Node.js: 18.x or higher (LTS recommended)
npm: 9.x or higher
Git: Latest version
VS Code: Recommended IDE with extensions

# Essential VS Code Extensions
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense  
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
```

### Project Setup Workflow
```bash
# 1. Clone from Lovable/GitHub integration
git clone <repository-url>
cd ame-maintenance-system

# 2. Install dependencies
npm install

# 3. Environment configuration
cp .env.example .env.local
# Add Supabase credentials and API keys

# 4. Start development server
npm run dev
# Application runs on http://localhost:8080
```

## Lovable Platform Integration

### Development Modes
1. **Lovable Web IDE**: Direct browser-based development
   - Instant hot-reload and preview
   - Component-level editing with visual feedback
   - One-click deployment to production

2. **Local Development**: Traditional IDE workflow
   - Full TypeScript support and debugging
   - Advanced Git operations and branching
   - Integration testing and build optimization

3. **Hybrid Workflow**: Best of both approaches
   - Prototype in Lovable for rapid iteration
   - Refine locally for complex features
   - Sync automatically via GitHub integration

### GitHub Integration Pattern
```bash
# Changes flow automatically between environments
Lovable Editor ↔ GitHub Repository ↔ Local Development

# Best practices for collaboration
1. Use feature branches for significant changes
2. Small commits with clear messages
3. Regular syncing between Lovable and local
4. Code reviews via GitHub pull requests
```

## Code Organization Standards

### File and Folder Naming Conventions
```
Components: PascalCase
├── CustomerCard.tsx
├── WorkflowDashboard.tsx
└── CarouselSOPViewer.tsx

Utilities: camelCase  
├── dateHelpers.ts
├── errorHandler.ts
└── idGenerators.ts

Constants: UPPER_SNAKE_CASE
├── VISIT_PHASES
├── SERVICE_TIERS
└── API_ENDPOINTS

Types: PascalCase with descriptive names
├── Customer
├── VisitSession
└── TaskProgress
```

### Component Development Standards
```typescript
// Standard component structure
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { Customer } from '@/types/customer';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CustomerCard({ customer, onEdit, onDelete }: CustomerCardProps) {
  const { hasPermission } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Component logic here

  return (
    <Card className="border-card-border shadow-sm">
      <CardHeader>
        <h3 className="font-semibold text-ame-navy">{customer.name}</h3>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
}
```

### Custom Hook Development Pattern
```typescript
// hooks/useVisitSession.ts
import { useState, useEffect, useCallback } from 'react';
import { AMEService } from '@/services/ameService';
import { useAutoSave } from './useAutoSave';

export function useVisitSession(visitId: string) {
  const [sessionData, setSessionData] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auto-save integration
  const { saveData } = useAutoSave(
    (data) => AMEService.saveVisitProgress(visitId, data),
    30000 // 30-second interval
  );

  const completePhase = useCallback(async (phaseId: number) => {
    try {
      await AMEService.completePhase(visitId, phaseId);
      setCurrentPhase(phaseId + 1);
    } catch (error) {
      console.error('Phase completion failed:', error);
      throw error;
    }
  }, [visitId]);

  return {
    sessionData,
    currentPhase,
    isLoading,
    completePhase,
    saveProgress: saveData
  };
}
```

## Database Development Practices

### Schema Migration Workflow
```sql
-- 1. Create migration in Supabase dashboard
-- 2. Test locally with development data
-- 3. Apply RLS policies immediately
-- 4. Update TypeScript types
-- 5. Create service layer methods
-- 6. Add component integration
-- 7. Deploy to production

-- Example migration pattern
-- Migration: Add customer feedback system
CREATE TABLE customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES ame_visits(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comments TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policy
CREATE POLICY customer_feedback_policy ON customer_feedback
FOR ALL USING (
  visit_id IN (
    SELECT id FROM ame_visits 
    WHERE technician_id = (
      SELECT id FROM ame_technicians 
      WHERE user_id = auth.uid()
    )
  )
);
```

### Service Layer Development
```typescript
// services/ameService.ts - Add new methods following patterns
export class AMEService {
  static async createCustomerFeedback(
    visitId: string, 
    feedback: CustomerFeedbackInput
  ): Promise<CustomerFeedback> {
    return this.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('customer_feedback')
        .insert({
          visit_id: visitId,
          rating: feedback.rating,
          comments: feedback.comments
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }, 'createCustomerFeedback', { visitId });
  }
}
```

## Testing Strategy

### Component Testing Approach
```typescript
// __tests__/components/CustomerCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { mockCustomer } from '@/tests/mocks/customer';

describe('CustomerCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders customer information correctly', () => {
    render(
      <CustomerCard 
        customer={mockCustomer} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(mockCustomer.name)).toBeInTheDocument();
    expect(screen.getByText(mockCustomer.serviceTier)).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <CustomerCard 
        customer={mockCustomer} 
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(mockOnEdit).toHaveBeenCalledWith(mockCustomer.id);
  });
});
```

### Integration Testing Pattern
```typescript
// __tests__/integration/visitWorkflow.test.tsx
import { renderWithProviders } from '@/tests/utils/renderWithProviders';
import { WorkflowDashboard } from '@/components/visit/WorkflowDashboard';
import { mockVisitSession } from '@/tests/mocks/visitSession';

describe('Visit Workflow Integration', () => {
  it('completes full visit workflow', async () => {
    const { user } = renderWithProviders(
      <WorkflowDashboard visitId="test-visit-id" />
    );

    // Test phase progression
    expect(screen.getByText('Phase 1: Pre-Visit')).toBeInTheDocument();
    
    await user.click(screen.getByRole('button', { name: /complete phase/i }));
    
    expect(screen.getByText('Phase 2: Assessment')).toBeInTheDocument();
  });
});
```

## Error Handling Standards

### Error Boundary Implementation
```typescript
// components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // Log to error tracking service
    logger.error('Component error', error, {
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-6 bg-destructive/10 rounded-lg">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4">
            An error occurred while loading this component.
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Service Layer Error Handling
```typescript
// utils/errorHandler.ts
export class ErrorHandler {
  static withErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: any
  ): Promise<T> {
    return operation().catch((error) => {
      const enhancedError = {
        operation: operationName,
        context,
        originalError: error,
        timestamp: new Date().toISOString()
      };

      logger.error(`Operation failed: ${operationName}`, enhancedError);

      // Transform Supabase errors to user-friendly messages
      if (error?.code === 'PGRST116') {
        throw new Error('No data found for the requested operation');
      }

      if (error?.code === '23503') {
        throw new Error('Cannot delete record due to existing references');
      }

      throw error;
    });
  }
}
```

## Performance Optimization Practices

### Component Performance
```typescript
// Memoization patterns
const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      computed: expensiveCalculation(item)
    }));
  }, [data]);

  return <div>{/* Component content */}</div>;
});

// Callback optimization
const ParentComponent = () => {
  const [items, setItems] = useState([]);

  const handleItemUpdate = useCallback((itemId: string, updates: any) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  }, []);

  return (
    <>
      {items.map(item => (
        <ItemComponent 
          key={item.id} 
          item={item} 
          onUpdate={handleItemUpdate} 
        />
      ))}
    </>
  );
};
```

### Database Query Optimization
```typescript
// Efficient service tier querying
static async getTasksForServiceTier(tier: string): Promise<Task[]> {
  const inheritedTiers = this.getInheritedTiers(tier);
  
  const { data, error } = await supabase
    .from('ame_tasks_normalized')
    .select(`
      id,
      task_code,
      title,
      estimated_duration,
      category:ame_task_categories(name, color)
    `)
    .overlaps('applicable_tiers', inheritedTiers)
    .order('estimated_duration');

  if (error) throw error;
  return data;
}
```

## Deployment & Release Process

### Lovable Deployment Workflow
```bash
# 1. Development phase
- Code changes in Lovable or locally
- Automatic GitHub sync
- Real-time preview updates

# 2. Testing phase  
- Manual testing in Lovable preview
- Component-level validation
- Cross-browser compatibility check

# 3. Production release
- Click "Share → Publish" in Lovable
- Custom domain configuration (if needed)
- Environment variable updates via Supabase

# 4. Post-deployment monitoring
- Check Supabase logs for errors
- Verify key functionality
- Monitor performance metrics
```

### Release Checklist
```markdown
Pre-deployment:
- [ ] All TypeScript errors resolved
- [ ] Component tests passing
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Security policies updated

Post-deployment:
- [ ] Authentication flow verified
- [ ] Database connections confirmed
- [ ] Key user workflows tested
- [ ] Error monitoring enabled
- [ ] Performance baseline established
```

## Troubleshooting Common Issues

### Authentication Problems
```typescript
// Debug authentication state
console.log('Current session:', supabase.auth.getSession());
console.log('Current user:', supabase.auth.getUser());

// Check RLS policies
const testQuery = await supabase
  .from('ame_customers')
  .select('*')
  .limit(1);

if (testQuery.error?.code === '42501') {
  console.error('RLS policy blocking access');
}
```

### Performance Issues
```typescript
// Monitor component re-renders
const ComponentWithRenderTracking = (props) => {
  const renderCount = useRef(0);
  renderCount.current += 1;
  
  console.log(`Component rendered ${renderCount.current} times`);
  
  return <ActualComponent {...props} />;
};

// Database query performance
const startTime = performance.now();
const result = await supabase.from('table').select('*');
const queryTime = performance.now() - startTime;
console.log(`Query took ${queryTime}ms`);
```

This workflow guide ensures consistent, high-quality development practices while maintaining the rapid development benefits that make Lovable an effective platform for sophisticated business applications.
