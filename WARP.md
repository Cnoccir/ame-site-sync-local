# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AME Site Sync is a field service management application for building automation maintenance technicians. The application supports a 4-phase visit workflow (Pre-Visit → Assessment → Service Execution → Post-Visit) with integrated SOPs, customer management, and real-time session tracking.

**Technology Stack:**
- React 18.3.1 + TypeScript 5.8.3
- Vite 5.4.19 (dev server, build tool)  
- Supabase 2.56.0 (PostgreSQL backend + Auth)
- shadcn/ui + Tailwind CSS 3.4.17
- TanStack React Query 5.83.0 (server state)
- React Router DOM 6.30.1
- React Hook Form 7.61.1 + Zod 3.25.76 (form validation)
- Lucide React 0.462.0 (icons)

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

```typescript path=src/services/ameService.ts start=null
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
│   ├── phases/           # PreVisitPhase, AssessmentPhase, ServiceExecutionPhase, PostVisitPhase
│   └── task-execution/   # IntegratedTaskCard, CarouselSOPViewer
├── assessment/            # Assessment tools and analysis
│   ├── TridiumDataImporter.tsx    # CSV import and validation
│   ├── TridiumSummaryGenerator.tsx # Network analysis summary
│   ├── NetworkSummaryGenerator.tsx # Device health monitoring
│   ├── SiteTree.tsx              # Network topology visualization
│   └── DeviceDetailsPanel.tsx    # Device-specific information display
├── dashboard/            # DashboardStats, RecentActivity
├── admin/                # CsvFileUpload, DataImportPanel
├── DeviceDetailsPanel.tsx # Advanced device information display
└── ToolManagement.tsx     # Tool inventory and selection system
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
```typescript path=src/hooks/ start=null
useAuth()           // Authentication & user roles - src/hooks/useAuth.ts
useVisitSession()   // Visit workflow state with auto-save - src/hooks/useVisitSession.ts
useAutoSave()       // Debounced persistence (30-second intervals) - src/hooks/useAutoSave.ts
useIsMobile()       // Responsive breakpoints - src/hooks/use-mobile.tsx
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
- Advanced CSV export processing and device inventory
- Comprehensive network analysis and health monitoring
- Multi-format support (N2, BACnet, Resource metrics, Platform details)
- Real-time network topology visualization
- Device-level health monitoring and status tracking
- Service tier-based health reporting (CORE/ASSURE/GUARDIAN)

### Tool Management System
- Comprehensive tool inventory and selection system
- Category-based tool organization with essential/recommended groupings
- Safety category classification (required/recommended/standard)
- Stock level tracking and minimum threshold alerts
- Dynamic tool recommendations based on service tiers
- Integration with visit workflow for pre-visit preparation

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

## Warp AI Integration Guide

### How Warp AI Can Best Assist with This Codebase

#### Common Development Workflows
```bash
# Quick component creation with proper structure
Warp: "Create a new customer management component following the project patterns"

# Database operations through service layer
Warp: "Add a new method to AMEService for handling tool assignments"

# Bug fixes with context awareness
Warp: "Fix the auto-save issue in the visit session management"
```

#### Project-Specific Patterns Warp Should Follow
- **Service Layer First**: Always route database operations through `AMEService`
- **Component Structure**: Place new components in appropriate domain folders (`src/components/domain/`)
- **Type Safety**: Use TypeScript types from `src/integrations/supabase/types.ts`
- **Error Handling**: Wrap operations with `errorHandler.withErrorHandling()`
- **Responsive Design**: Follow mobile-first approach with `useIsMobile()` hook

#### Key File Paths for Warp Reference
```typescript
// Service Layer
src/services/ameService.ts           // Central data access layer
src/utils/errorHandler.ts            // Error handling utilities

// Component Architecture  
src/components/ui/                   // shadcn/ui base components
src/components/visit/phases/         // Visit workflow phases
src/components/assessment/           // Assessment tools
src/hooks/                          // Custom React hooks

// Database Integration
src/integrations/supabase/types.ts   // Generated TypeScript types
src/integrations/supabase/client.ts  // Supabase client configuration

// Configuration
vite.config.ts                      // Build configuration
tailwind.config.js                  // Styling configuration
```

#### Common Warp AI Commands for This Project
```bash
# Development server management
Warp: "Start the dev server and check for any build errors"

# Component debugging
Warp: "Check the visit session state management for auto-save issues"

# Database schema updates
Warp: "Generate new TypeScript types after Supabase schema changes"

# Code quality
Warp: "Run linting and fix any TypeScript errors in the components folder"

# Git workflow
Warp: "Check git status and show recent changes to visit-related files"
```

#### Business Logic Context for Warp
When working with this codebase, Warp should understand:
- **4-Phase Visit Workflow**: Pre-Visit → Assessment → Service Execution → Post-Visit
- **Service Tiers**: CORE → ASSURE → GUARDIAN (hierarchical inheritance)
- **Session Management**: 24-hour sessions with 30-second auto-save
- **SOP Integration**: Rich HTML content with carousel navigation
- **Building Automation**: Tridium Niagara system compatibility

## Troubleshooting Common Issues

### Build & Development Issues

#### TypeScript Compilation Errors
```bash
# Check for type errors without building
npm run type-check

# Common fix: Regenerate Supabase types
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

#### Vite Dev Server Issues
```bash
# Clear Vite cache and restart
rm -rf node_modules/.vite
npm run dev

# If port 8080 is busy
lsof -ti:8080 | xargs kill -9
npm run dev
```

### Database & Service Layer Issues

#### Supabase Connection Problems
- Verify environment variables in `.env` file
- Check Supabase project status and RLS policies
- Ensure API keys have proper permissions

#### AMEService Error Handling
```typescript
// Always check error logs in browser console
// Common pattern for debugging service calls
try {
  const result = await AMEService.someMethod();
  console.log('Success:', result);
} catch (error) {
  console.error('AMEService Error:', error);
}
```

### Session Management Issues

#### Auto-save Not Working
- Check browser console for localStorage errors
- Verify session token is valid (24-hour expiration)
- Ensure `useAutoSave` hook is properly implemented

#### Visit Session Recovery
```typescript
// Check session status in browser DevTools > Application > Local Storage
// Key format: 'visit_session_[visitId]'
// Clear corrupted sessions: localStorage.removeItem('visit_session_[visitId]')
```

### Component & UI Issues

#### shadcn/ui Component Problems
```bash
# Reinstall specific component
npx shadcn-ui@latest add [component-name]

# Check for Tailwind CSS conflicts
npm run lint
```

#### Mobile Responsiveness Issues
- Use `useIsMobile()` hook for breakpoint detection
- Test with browser DevTools mobile simulation
- Verify Tailwind CSS mobile-first approach

### Git & Sync Issues

#### Repository Sync Problems
```bash
# Safe reset to origin (with stash)
npm run emergency-reset

# Check for uncommitted changes
npm run sync-status

# Manual sync recovery
git stash
git fetch origin
git reset --hard origin/main
git stash pop
```

### Performance Issues

#### Slow React Query Performance
- Check React Query DevTools for cache status
- Verify proper query key usage
- Review stale time and cache time settings

#### Bundle Size Issues
```bash
# Analyze bundle size
npm run build
# Check dist/ folder size

# Common fixes:
# - Implement code splitting
# - Remove unused dependencies
# - Optimize imports (avoid barrel exports)
```

### Environment-Specific Issues

#### Windows PowerShell Issues
- Use PowerShell Core (7+) instead of Windows PowerShell 5.1
- Enable execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

#### Node.js Version Compatibility
- Use Node.js 18.0.0 or higher
- Consider using nvm for version management

### Quick Diagnostic Commands
```bash
# Full health check
npm run sync-check
npm run type-check
npm run lint

# Clean restart
rm -rf node_modules package-lock.json
npm install
npm run safe-start
```

## Development Best Practices

- Always use the AMEService for database operations
- Implement proper error handling with user-friendly messages
- Use TypeScript types from Supabase integration
- Follow established component composition patterns
- Maintain responsive design with mobile-first approach
- Use TanStack React Query for server state management
- Implement proper loading and error states in components
