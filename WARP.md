# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AME Site Sync is a field service management application for building automation maintenance technicians. The application supports a 4-phase visit workflow (Pre-Visit → Assessment → Service Execution → Post-Visit) with integrated SOPs, customer management, and real-time session tracking.

**Technology Stack:**
- React 18.3.1 + TypeScript
- Vite 5.4.19 (dev server, build tool)  
- Supabase (PostgreSQL backend + Auth)
- shadcn/ui + Tailwind CSS
- TanStack React Query (server state)
- React Router 6.30.1

## Essential Commands

### Development Server
```bash
# Start development server (includes git fetch)
npm run dev
# Server runs on http://localhost:8080

# Type checking without build
npm run type-check

# Safe start with git pull and dependencies
npm run safe-start
```

### Build & Deploy  
```bash
# Production build
npm run build

# Development mode build
npm run build:dev

# Preview production build locally
npm run preview
```

### Code Quality & Linting
```bash
# Run ESLint
npm run lint
```

### Git Integration & Sync
```bash
# Check sync status with origin
npm run sync-check

# View commit differences
npm run sync-status

# Emergency reset to origin/main (with stash)
npm run emergency-reset
```

## Architecture Overview

### Service Layer Pattern
The application uses a centralized service layer (`src/services/ameService.ts`) - the `AMEService` class handles all database operations:

```typescript
// All database operations go through AMEService
AMEService.getCustomers()
AMEService.createVisitWithSession(customerId, technicianId)  
AMEService.saveVisitProgress(visitId, sessionToken, progressData)
```

**Key Service Methods:**
- Customer CRUD: `getCustomers()`, `createCustomer()`, `updateCustomer()`  
- Visit workflow: `createVisitWithSession()`, `completeVisitPhase()`, `saveVisitProgress()`
- Task management: `getTasksByServiceTier()`, `getToolsByServiceTier()`
- Session handling: `getVisitSession()`, `createSessionForVisit()`

### Component Architecture
```
src/components/
├── ui/                    # shadcn/ui base components
├── layout/                # MainLayout, AppSidebar, Header
├── auth/                  # ProtectedRoute, auth components  
├── customers/             # CustomerCard, CustomerTable, NewCustomerWizard
├── visit/                 # Visit workflow components
│   ├── phases/           # PreVisitPhase, AssessmentPhase, etc.
│   └── task-execution/   # IntegratedTaskCard, CarouselSOPViewer
├── dashboard/            # DashboardStats, RecentActivity
└── admin/                # CsvFileUpload, DataImportPanel
```

### State Management Strategy
- **Server State**: TanStack React Query for caching and synchronization
- **Local State**: useState/useEffect for UI interactions  
- **Session State**: Custom hooks with localStorage persistence (`useVisitSession`, `useAutoSave`)
- **Global State**: Context only for UI providers (minimal usage)

### Database Schema Highlights
**Core Tables:**
- `ame_customers` - Customer data with service tiers (CORE/ASSURE/GUARDIAN)
- `ame_visits` - 4-phase visit workflow tracking
- `ame_visit_sessions` - Real-time session management with auto-save
- `ame_tasks_normalized` - Standardized task library with service tier inheritance
- `ame_sops_normalized` - Rich SOP content with HTML + hyperlinks

**Service Tier Inheritance:**
- CORE: Base level (5-8 tasks)
- ASSURE: Inherits CORE + additional tasks (8-12 total)  
- GUARDIAN: Inherits CORE + ASSURE + premium tasks (12-20 total)

## Development Patterns

### Custom Hook Usage
Key hooks for domain logic:
```typescript
useAuth()           // Authentication & user roles
useVisitSession()   // Visit workflow state with auto-save
useAutoSave()       // Debounced persistence (30-second intervals)
useIsMobile()       // Responsive breakpoints
```

### Error Handling Pattern
All service operations use centralized error handling:
```typescript
// Service methods wrapped with error handling
return errorHandler.withErrorHandling(async () => {
  // Database operation
}, 'operationName', { additionalData });
```

### Form Handling Standard
Uses React Hook Form + Zod validation:
```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: initialData
});
```

## Environment Configuration

### Required Environment Variables
Create `.env` file with Supabase configuration:
```env
VITE_SUPABASE_PROJECT_ID="your_project_id"
VITE_SUPABASE_PUBLISHABLE_KEY="your_public_key"  
VITE_SUPABASE_URL="your_supabase_url"
```

### Vite Configuration
- Server runs on port 8080 with IPv6 support
- Path aliases: `@/` maps to `./src/`
- React SWC plugin for fast refresh

## Key Business Logic

### Visit Workflow System
4-phase progression with auto-save:
1. **Pre-Visit**: Customer check-in, preparation
2. **Assessment**: System evaluation, device discovery
3. **Service Execution**: Task completion with integrated SOPs  
4. **Post-Visit**: Documentation, reporting, feedback

### Session Management
- 24-hour session expiration with automatic cleanup
- Auto-save every 30 seconds to prevent data loss
- Token-based authentication for visit sessions
- Recovery workflow for interrupted sessions

### SOP Content System
- Rich HTML content with clickable reference links [1], [2], etc.
- Carousel navigation with visual guide placeholders
- Step-by-step progression tracking
- Hyperlink integration with external documentation

## Integration Points

### Google Drive Integration
- OAuth2 authentication flow
- Automatic project folder creation per customer
- CSV data import from Google Sheets  
- Document storage for reports and customer files

### Building Automation Integration
- Tridium Niagara system compatibility
- CSV export processing and device inventory
- Network analysis and health monitoring

## Database Patterns

### Row Level Security (RLS)
Role-based access control at database level:
- **Admin**: Full system access
- **Technician**: Read/write access to assigned visits only
- **User**: Read-only access to owned customer data

### Audit Trail
Comprehensive change tracking in `ame_audit_logs` table with automatic triggers for all CRUD operations.

## Performance Considerations

### Frontend Optimizations
- TanStack React Query for efficient data fetching and caching
- Component-level code splitting for faster loading
- Debounced auto-save to prevent excessive API calls
- Local storage for temporary data persistence

### Database Optimizations  
- Normalized schema with proper indexing
- Service tier inheritance for efficient task queries
- Comprehensive RLS policies for security
- Edge functions for server-side processing

## Common Development Tasks

### Adding New Components
Follow the established component architecture patterns:
- Place in appropriate domain folder (`customers/`, `visit/`, etc.)
- Use shadcn/ui base components for consistency
- Implement error boundaries for resilient UI
- Follow mobile-first responsive design

### Extending the Service Layer
Add new methods to `AMEService` class:
- Wrap operations with `errorHandler.withErrorHandling()`
- Use proper TypeScript typing from `src/integrations/supabase/types.ts`
- Log operations for debugging and audit trail

### Database Schema Changes
- Create new Supabase migrations in `supabase/migrations/`
- Update TypeScript types with `supabase gen types typescript`
- Implement proper RLS policies for new tables
- Add audit triggers for change tracking

## Testing Strategy

### Component Testing
- Use React Testing Library for component tests
- Mock external dependencies (Supabase, services)
- Test user interactions and error states

### Integration Testing  
- Test complete user workflows (visit creation, task completion)
- Verify service layer integration with database
- Test error handling and recovery scenarios

## Deployment Notes

This is a local development version cleaned of Lovable.dev dependencies. For production deployment:

1. Run `npm run build` to create production bundle
2. Deploy `dist/` folder to static hosting service
3. Configure environment variables on hosting platform
4. Ensure Supabase project is properly configured with RLS policies

## Important Files to Reference

- `docs/TECHNICAL_ARCHITECTURE.md` - Detailed system architecture
- `docs/COMPONENT_ARCHITECTURE.md` - Component patterns and organization
- `docs/DATABASE_SCHEMA.md` - Database design and relationships
- `src/services/ameService.ts` - Central service layer
- `src/integrations/supabase/types.ts` - TypeScript database types

## Development Best Practices

- Always use the AMEService for database operations
- Implement proper error handling with user-friendly messages
- Use TypeScript types from Supabase integration
- Follow established component composition patterns
- Maintain responsive design with mobile-first approach
- Use TanStack React Query for server state management
- Implement proper loading and error states in components
