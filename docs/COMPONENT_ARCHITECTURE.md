# Component Architecture Guide

## Component Organization Strategy

### Folder Structure Pattern
```
src/components/
├── ui/                    # shadcn/ui base components
├── layout/                # Application layout components
├── auth/                  # Authentication-related components
├── customers/             # Customer management components
├── visit/                 # Visit workflow components
│   ├── phases/           # Individual phase components
│   └── task-execution/   # Task execution with SOPs
├── dashboard/            # Dashboard-specific components
├── admin/                # Admin panel components
└── shared/               # Cross-cutting reusable components
```

## Core Component Patterns

### 1. Layout Components

#### MainLayout Pattern
```typescript
// Primary application layout wrapper
MainLayout
├── SidebarProvider       // Sidebar state management
├── AppSidebar           // Navigation sidebar
├── Header               // Context-aware page header
└── main → Outlet        // Page content area
```

#### Sidebar Architecture
```typescript
AppSidebar
├── SidebarHeader        // Logo and brand
├── SidebarContent       // Navigation items
│   ├── NavMain         // Primary navigation
│   ├── NavProjects     // Context-specific nav
│   └── NavSecondary    // Secondary actions
└── SidebarFooter       // User menu and settings
```

### 2. Visit Workflow Components

#### WorkflowDashboard (Main Controller)
```typescript
// Central workflow orchestration
WorkflowDashboard
├── WorkflowPhaseTracker  // Progress sidebar
├── CustomerInfoCard      // Customer context
└── Current Phase Component:
    ├── PreVisitPhase
    ├── AssessmentPhase
    ├── ServiceExecutionPhase
    └── PostVisitPhase
```

#### Phase Component Pattern
```typescript
// Consistent phase structure
PhaseComponent
├── PhaseHeader          // Phase title and progress
├── PhaseContent         // Phase-specific content
│   ├── InstructionsCard // Step-by-step guidance
│   ├── DataEntryForm   // Phase data collection
│   └── ActionButtons   // Phase completion controls
└── PhaseFooter         // Navigation and status
```

### 3. Task Execution Components

#### IntegratedTaskCard Architecture
```typescript
IntegratedTaskCard
├── TaskHeader
│   ├── TaskTitle
│   ├── TaskTimer
│   └── TaskStatus
├── TabsContainer
│   ├── Overview Tab     // Task description
│   ├── SOP Tab         // Integrated procedures
│   ├── Tools Tab       // Required tools
│   └── Notes Tab       // Task notes
└── TaskActions
    ├── CompleteButton
    ├── SkipButton
    └── IssueButton
```

#### CarouselSOPViewer (SOP Display)
```typescript
CarouselSOPViewer
├── CarouselHeader
│   ├── ProgressDots    // Step navigation
│   └── StepCounter     // Current step indicator
├── CarouselContent
│   ├── VisualGuide     // Screenshot placeholder
│   ├── StepInstructions // Rich content display
│   └── ReferenceLinks  // Clickable hyperlinks
└── CarouselNavigation
    ├── PreviousButton
    ├── NextButton
    └── KeyboardHandlers // Arrow key support
```

## Data Flow Patterns

### 1. Props vs Context Usage

#### Props for Direct Communication
```typescript
// Parent to child data flow
<TaskCard 
  task={task}
  onComplete={handleComplete}
  onSkip={handleSkip}
/>

// Child to parent callbacks
const handleComplete = (taskId: string, data: any) => {
  updateTaskProgress(taskId, data);
  moveToNextTask();
};
```

#### Context for Shared State (Minimal Usage)
```typescript
// Only for UI providers
<SidebarProvider>
<TooltipProvider>
<QueryClientProvider>
```

### 2. Custom Hook Integration

#### Component + Hook Pattern
```typescript
// Component focuses on rendering
function VisitDashboard({ customerId }: Props) {
  const { 
    sessionData, 
    currentPhase, 
    saveProgress,
    completePhase 
  } = useVisitSession(customerId);

  return (
    <WorkflowDashboard 
      sessionData={sessionData}
      currentPhase={currentPhase}
      onPhaseComplete={completePhase}
    />
  );
}
```

## Reusable Component Patterns

### 1. Data Display Components

#### CustomerCard Pattern
```typescript
CustomerCard
├── CardHeader
│   ├── CustomerName
│   ├── ServiceTierBadge
│   └── StatusIndicator
├── CardContent
│   ├── ContactInfo
│   ├── SiteDetails
│   └── LastVisitInfo
└── CardActions
    ├── EditButton
    ├── VisitButton
    └── MoreActions
```

#### DataTable Pattern (Advanced)
```typescript
DataTable<T>
├── TableHeader
│   ├── SearchInput
│   ├── FilterDropdowns
│   └── ColumnToggle
├── TableContent
│   ├── HeaderRow
│   ├── DataRows<T>
│   └── PaginationControls
└── TableFooter
    ├── RowCount
    └── ExportActions
```

### 2. Form Component Patterns

#### FormCard Wrapper
```typescript
FormCard
├── CardHeader
│   ├── FormTitle
│   └── FormDescription
├── CardContent
│   ├── FormFields[]
│   ├── ValidationErrors
│   └── HelpText
└── CardFooter
    ├── SaveButton
    ├── CancelButton
    └── FormStatus
```

#### Field Component Pattern
```typescript
FormField
├── Label           // Required/optional indicators
├── Input           // Form control
├── ErrorMessage    // Validation feedback
└── HelpText       // Additional guidance
```

## State Management in Components

### 1. Local Component State
```typescript
// UI-only state
const [isEditing, setIsEditing] = useState(false);
const [showDetails, setShowDetails] = useState(false);

// Form state (React Hook Form)
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues: initialData
});
```

### 2. Server State Integration
```typescript
// TanStack React Query integration
const { data: customers, isLoading } = useCustomers();
const updateCustomer = useUpdateCustomer();

const handleSave = async (data: CustomerData) => {
  try {
    await updateCustomer.mutateAsync({ id, data });
    toast({ title: "Success", description: "Customer updated" });
  } catch (error) {
    toast({ title: "Error", description: error.message });
  }
};
```

## Component Communication Strategies

### 1. Event Handling Patterns
```typescript
// Bubble up pattern
const handleTaskComplete = (taskId: string) => {
  onTaskComplete(taskId);  // Notify parent
  saveProgress();          // Update state
  showSuccessMessage();    // Update UI
};

// Event delegation
const handleCardAction = (action: string, id: string) => {
  switch (action) {
    case 'edit': openEditModal(id); break;
    case 'delete': confirmDelete(id); break;
    case 'duplicate': duplicateItem(id); break;
  }
};
```

### 2. Error Handling in Components
```typescript
// Component-level error boundaries
function TaskCard({ task }: Props) {
  return (
    <ErrorBoundary fallback={<TaskErrorFallback />}>
      <TaskContent task={task} />
    </ErrorBoundary>
  );
}

// Graceful error states
if (error) {
  return <ErrorCard message={error.message} onRetry={refetch} />;
}
```

## Styling and Theme Integration

### 1. Component Styling Strategy
```typescript
// Tailwind utility classes with design system
<Card className="border-card-border shadow-sm">
  <CardHeader className="text-ame-navy">
    <CardTitle className="text-lg font-semibold">
      {customer.name}
    </CardTitle>
  </CardHeader>
  <CardContent className="pt-4">
    <ServiceTierBadge tier={customer.serviceTier} />
  </CardContent>
</Card>
```

### 2. Responsive Component Design
```typescript
// Mobile-first responsive patterns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {customers.map(customer => (
    <CustomerCard key={customer.id} customer={customer} />
  ))}
</div>

// Mobile navigation adaptations
const { isMobile } = useIsMobile();
return isMobile ? <MobileNavigation /> : <DesktopSidebar />;
```

## Performance Optimization Patterns

### 1. Component Memoization
```typescript
// Expensive component memoization
const TaskList = memo(({ tasks }: Props) => {
  return (
    <>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </>
  );
});
```

### 2. Callback Optimization
```typescript
// Prevent unnecessary re-renders
const handleTaskUpdate = useCallback((taskId: string, data: any) => {
  updateTask(taskId, data);
}, [updateTask]);
```

This component architecture provides a scalable, maintainable foundation that balances the rapid development benefits of Lovable with enterprise-level architectural patterns.
