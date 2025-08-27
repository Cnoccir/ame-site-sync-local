# AME Maintenance System - Project Overview

## What We Built
A comprehensive field service management application for building automation maintenance technicians, built entirely on the Lovable platform using modern React patterns and Supabase backend.

## Core Business Domain
**Industry**: Building Automation System (BAS) Maintenance  
**Primary Users**: Field technicians performing preventive maintenance on Niagara-based building automation systems  
**Business Model**: Service tier-based maintenance contracts (CORE → ASSURE → GUARDIAN)

## Key Features Implemented

### 1. Customer Management System
- Complete customer database with site information and contacts
- Service tier classification with hierarchical access (CORE inherits to ASSURE, ASSURE to GUARDIAN)
- Google Drive integration for document storage and CSV imports
- Advanced filtering and search capabilities

### 2. 4-Phase Visit Workflow System
1. **Pre-Visit Phase**: Customer check-in and preparation
2. **Assessment Phase**: System evaluation and testing procedures
3. **Service Execution Phase**: Task completion with integrated SOPs
4. **Post-Visit Phase**: Documentation, reporting, and feedback collection

### 3. Interactive SOP (Standard Operating Procedures) System
- 13 comprehensive SOPs covering maintenance procedures
- Carousel-style navigation with visual guides
- Clickable reference links with external documentation
- Step-by-step progression tracking with completion status

### 4. Real-time Session Management
- Auto-save functionality with 30-second intervals
- Session persistence for interrupted workflows
- Offline resilience with local storage backup
- Recovery capabilities for network interruptions

### 5. Role-based Access Control
- **Admin**: Full system access, data management, configuration
- **Technician**: Field operations, visit execution, basic reporting
- **User**: Limited read access to assigned customer data

## Technical Architecture Summary

### Frontend Stack
- **React 18.3.1** with TypeScript for type safety
- **Vite 5.4.19** for fast development and building
- **shadcn/ui + Tailwind CSS** for modern, accessible UI components
- **React Router 6.30.1** for client-side routing with protection
- **React Hook Form + Zod** for form handling and validation

### Backend Stack
- **Supabase** as complete backend solution (PostgreSQL + Auth + Edge Functions)
- **30+ normalized database tables** with comprehensive relationships
- **Row Level Security (RLS)** for database-level access control
- **Google Drive API integration** for document management

### Key Architectural Decisions
1. **Service Layer Pattern**: Centralized data access via AMEService class
2. **Custom Hook Architecture**: Feature-specific hooks for state management
3. **Component Composition**: Reusable UI components with business logic separation
4. **Database-First Development**: Supabase schemas drive TypeScript types

## Business Logic Implementation

### Service Tier Inheritance System
```typescript
// Hierarchical access control
CORE: 5-8 tasks, basic maintenance
ASSURE: 8-12 tasks (includes CORE tasks)
GUARDIAN: 12-20 tasks (includes CORE + ASSURE tasks)
```

### Visit Session Management
- 24-hour session expiration with automatic cleanup
- Token-based authentication for visit sessions
- Auto-save mechanism preserves progress every 30 seconds
- Recovery workflow for interrupted sessions

### SOP Rich Content System
- HTML content parsing with clickable references [1], [2], etc.
- Hyperlink integration with external technical documentation
- Visual guide placeholders for site-specific screenshots
- Progress tracking with step completion status

## Data Model Highlights

### Core Entities
- `ame_customers`: Customer management with service tiers
- `ame_visits`: Visit workflow tracking with 4-phase system
- `ame_sops_normalized`: Rich SOP content with hyperlinks
- `ame_visit_sessions`: Real-time session management
- `ame_tasks_normalized`: Standardized task library

### Relationships
- **Service Tier Inheritance**: CORE → ASSURE → GUARDIAN
- **Visit Workflow**: Customer → Visit → Tasks → Progress
- **Session Management**: Visit → Session → Auto-save Data

## Integration Points

### Google Drive Integration
- Automatic project folder creation
- CSV data import from Google Sheets
- Document storage for customer files and reports
- OAuth2 authentication flow for secure access

### Supabase Edge Functions
- `google-drive-manager`: Folder and file management
- `google-drive-csv-proxy`: CORS-free CSV data fetching
- `google-drive-auth`: OAuth2 authentication handling

## Performance & Scalability Features

### Frontend Optimizations
- TanStack React Query for efficient data fetching and caching
- Debounced auto-save to prevent excessive API calls
- Component-level code splitting for faster loading
- Local storage for temporary data persistence

### Backend Optimizations
- Normalized database design for efficient queries
- RLS policies for security at the database level
- Comprehensive indexing for fast data retrieval
- Edge functions for server-side processing

## Current Deployment Status
- **Platform**: Lovable (lovable.dev)
- **Database**: Supabase (ncqwrabuujjgquakxrkw.supabase.co)
- **Domain**: Via Lovable publish feature
- **Environment**: Production-ready with development workflow support

## Success Metrics Achieved
1. **Standardization**: Consistent maintenance procedures across all technicians
2. **Compliance**: Service tier agreement adherence with audit trail
3. **Efficiency**: Reduced visit time through structured workflows
4. **Quality**: Interactive SOPs ensure proper procedure execution
5. **Scalability**: Role-based system supports growing technician teams

This project represents a sophisticated field service management solution that successfully bridges the gap between complex building automation systems and standardized maintenance procedures, built entirely within the rapid development environment of Lovable.
