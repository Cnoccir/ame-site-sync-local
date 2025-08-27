# Technical Architecture Documentation

## System Architecture Overview

### High-Level Architecture Pattern
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   External      │
│   (React SPA)   │◄──►│   (Supabase)     │◄──►│   Integrations  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
│                                                │
├── React 18.3.1                               ├── Google Drive API
├── TypeScript                                  └── Building Automation
├── shadcn/ui + Tailwind                           (Tridium Niagara)
├── React Router
└── Vite Build System
```

## Frontend Architecture

### Component Hierarchy Structure
```
App
├── AuthenticationProvider
├── QueryClientProvider (TanStack React Query)
├── TooltipProvider
└── BrowserRouter
    └── Routes
        ├── /auth (public) → AuthPage
        └── ProtectedRoute → MainLayout
            ├── SidebarProvider
            ├── AppSidebar (navigation)
            ├── Header (context-aware)
            └── Outlet (page content)
                ├── Dashboard
                ├── Customers
                ├── Projects
                ├── Visit (with nested phases)
                ├── Admin
                └── Reports
```

### State Management Architecture

#### Service Layer Pattern
```typescript
AMEService (Centralized Data Access)
├── Authentication Methods
├── Customer Management
├── Visit Workflow Operations
├── Task & SOP Management
├── Session Management
└── Error Handling & Logging
```

#### Custom Hook Architecture
```typescript
Core Custom Hooks:
├── useAuth()           // Authentication & user roles
├── useVisitSession()   // Visit workflow state
├── useAutoSave()       // Debounced persistence
├── useIsMobile()       // Responsive breakpoints
└── useToast()          // User feedback system
```

#### Component State Strategy
- **Local State**: useState/useEffect for UI interactions
- **Server State**: TanStack React Query for caching
- **Session State**: Custom hooks with localStorage persistence
- **Global State**: Context only for UI providers (minimal usage)

## Backend Architecture (Supabase)

### Database Design Principles
1. **Normalized Structure**: Separate tables for different domains
2. **Service Tier Inheritance**: Hierarchical access model
3. **Audit Trail**: Complete change tracking
4. **Soft Deletes**: Data retention and recovery
5. **JSONB Fields**: Flexible metadata storage

### Core Database Tables
```sql
-- Customer Management
ame_customers              (customer data & service tiers)
ame_customers_normalized   (processed customer data)
customer_feedback          (post-visit feedback)

-- Visit Workflow
ame_visits                 (visit records & phases)
ame_visit_sessions         (real-time session tracking)
ame_visit_progress         (granular progress tracking)
assessment_steps           (structured assessment data)

-- Task & SOP System
ame_tasks_normalized       (standardized task library)
ame_sops_normalized        (rich SOP content with hyperlinks)
ame_task_categories        (task categorization)
ame_tools_normalized       (tool library & requirements)

-- System Management
ame_technicians           (technician profiles & assignments)
ame_audit_logs           (comprehensive audit trail)
device_inventory         (network device cataloging)
```

### Row Level Security (RLS) Policies
```sql
-- Role-based access control
Admin:    Full access to all tables
Technician: Read/write access to assigned visits only
User:     Read-only access to owned customer data
```

### Edge Functions Architecture
```javascript
// Serverless functions for complex operations
├── google-drive-manager     // Folder creation & management
├── google-drive-csv-proxy   // CORS-free CSV fetching
└── google-drive-auth        // OAuth2 authentication flow
```

## Data Flow Patterns

### Authentication Flow
```
User Login → Supabase Auth → useAuth Hook → RLS Policy Check → Role-Based Access
```

### Visit Workflow State Management
```
Visit Start → useVisitSession Hook → Auto-save (30s) → Session Persistence → Recovery Capability
```

### SOP Content Processing
```
Database (HTML + JSONB) → Rich Content Parser → Carousel Navigation → Progress Tracking
```

## Integration Architecture

### Google Drive Integration Pattern
```typescript
// OAuth2 Flow
User Authorization → Google OAuth2 → Access Token → Drive API Access

// File Operations
Project Creation → Folder Structure → CSV Import → Document Storage
```

### Building Automation Integration
```typescript
// Data Import Pipeline
Tridium CSV Export → Google Drive → CSV Parser → Database Import → Normalization
```

## Security Architecture

### Authentication & Authorization
- **Supabase Auth**: Email/password with session tokens
- **Role-Based Access**: Admin/Technician/User hierarchy
- **RLS Policies**: Database-level security enforcement
- **Session Management**: Automatic token refresh & cleanup

### Data Protection
- **Encrypted Storage**: Supabase handles encryption at rest
- **HTTPS Only**: All communications encrypted in transit
- **API Key Security**: Edge functions handle sensitive operations
- **Input Validation**: Zod schemas for all user inputs

## Performance Architecture

### Frontend Optimizations
```typescript
// Caching Strategy
TanStack React Query: Server state caching
Local Storage: Session persistence
Component Memoization: React.memo for expensive components

// Loading Strategy
Code Splitting: Route-based lazy loading
Image Optimization: Lazy loading with placeholders
Bundle Optimization: Tree shaking and module federation
```

### Backend Optimizations
```sql
-- Database Performance
Proper Indexing: All foreign keys and search columns
Query Optimization: Efficient joins and filtering
Connection Pooling: Supabase handles automatically
```

## Deployment Architecture

### Lovable Platform Integration
- **Development**: Web-based IDE with hot reloading
- **Version Control**: Automatic GitHub synchronization
- **Deployment**: One-click publish to production
- **Environment Management**: Seamless dev/prod separation

### Infrastructure Components
```
Frontend: Vite-built SPA on Lovable CDN
Backend: Supabase cloud infrastructure
Database: PostgreSQL with global distribution
Functions: Edge runtime for server-side logic
```

## Scalability Considerations

### Current Capacity
- **Users**: Designed for 50+ concurrent technicians
- **Data**: Normalized structure supports 10,000+ customers
- **Sessions**: Auto-cleanup prevents session bloat
- **Files**: Google Drive integration for unlimited storage

### Future Scaling Options
- **Database**: Supabase handles automatic scaling
- **Frontend**: CDN distribution for global access
- **Real-time**: WebSocket connections for live collaboration
- **API**: Rate limiting and caching for high load

## Error Handling & Monitoring

### Error Management Strategy
```typescript
// Centralized Error Handling
AMEService.withErrorHandling() // Service layer
ErrorBoundaries // React component level
Toast Notifications // User feedback
Logger Utility // Structured logging
```

### Monitoring & Observability
- **Supabase Dashboard**: Database performance metrics
- **Browser DevTools**: Frontend performance monitoring
- **Error Logs**: Centralized error collection
- **User Feedback**: Built-in feedback collection system

This architecture successfully balances rapid development capabilities with enterprise-level features, demonstrating how Lovable's platform can support sophisticated business applications while maintaining developer productivity.
