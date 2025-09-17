# PM Guidance Tool - Visual Design Specifications

## 🎨 Brand Identity & Color System

### Primary Brand Colors
```css
/* AME Controls Professional Palette */
--ame-primary-blue: #2563eb;      /* Primary brand blue */
--ame-dark-blue: #1d4ed8;         /* Darker accent blue */
--ame-light-blue: #3b82f6;        /* Light blue for backgrounds */
--ame-navy: #1e3a8a;              /* Deep navy for headers */

/* Professional Grays */
--ame-gray-900: #111827;          /* Primary text */
--ame-gray-700: #374151;          /* Secondary text */
--ame-gray-500: #6b7280;          /* Tertiary text */
--ame-gray-200: #e5e7eb;          /* Light borders */
--ame-gray-100: #f3f4f6;          /* Background gray */
--ame-gray-50: #f9fafb;           /* Lightest background */

/* Status Colors */
--ame-success: #10b981;           /* Green for completed/healthy */
--ame-warning: #f59e0b;           /* Orange for warnings */
--ame-error: #ef4444;             /* Red for errors/critical */
--ame-info: #06b6d4;              /* Cyan for informational */

/* Background Colors */
--ame-white: #ffffff;             /* Pure white */
--ame-off-white: #fefefe;         /* Slightly off-white */
```

### Typography System
```css
/* Primary Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px - Captions, labels */
--text-sm: 0.875rem;    /* 14px - Small text, metadata */
--text-base: 1rem;      /* 16px - Body text */
--text-lg: 1.125rem;    /* 18px - Large body text */
--text-xl: 1.25rem;     /* 20px - Subheadings */
--text-2xl: 1.5rem;     /* 24px - Section headers */
--text-3xl: 1.875rem;   /* 30px - Page headers */
--text-4xl: 2.25rem;    /* 36px - Display headers */

/* Font Weights */
--font-normal: 400;     /* Body text */
--font-medium: 500;     /* Emphasized text */
--font-semibold: 600;   /* Subheadings */
--font-bold: 700;       /* Headings */
--font-extrabold: 800;  /* Display text */
```

## 📄 PDF Report Visual Design

### Page Layout Specifications (8.5" × 11")
```css
/* PDF Page Dimensions */
page-width: 612pt;      /* 8.5 inches */
page-height: 792pt;     /* 11 inches */

/* Margins */
margin-top: 72pt;       /* 1 inch */
margin-bottom: 72pt;    /* 1 inch */
margin-left: 54pt;      /* 0.75 inch */
margin-right: 54pt;     /* 0.75 inch */

/* Content Area */
content-width: 504pt;   /* 7 inches */
content-height: 648pt;  /* 9 inches */
```

### Header Design Template
```
┌─────────────────────────────────────────────────────────────┐
│  [AME LOGO]                    PREVENTIVE MAINTENANCE      │
│                                     SERVICE REPORT         │
├─────────────────────────────────────────────────────────────┤
│  Customer: [Name]              │  Date: [MM/DD/YYYY]       │
│  Site: [Address]               │  Tech: [Name]             │
│  Service Tier: [CORE/ASSURE]   │  Job #: [Number]          │
└─────────────────────────────────────────────────────────────┘
```

### Page Templates

#### Executive Summary Page
```
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTIVE SUMMARY                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ System Health Dashboard ─────────────────────────────┐  │
│  │  Overall Health: ████████░░ 85% GOOD                  │  │
│  │  Tasks Completed: 8/8 ✓                               │  │
│  │  Issues Resolved: 3                                   │  │
│  │  Time on Site: 2.5 hours                              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Key Findings ──────────────────────────────────────────┐  │
│  │  • JACE performance within normal limits               │  │
│  │  • 3 critical alarms resolved                          │  │
│  │  • Temperature sensor calibrated in Zone 2             │  │
│  │  • Network communication 100% operational              │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Recommendations ─────────────────────────────────────────┐  │
│  │  • Schedule valve actuator replacement (AHU-1)         │  │
│  │  • Consider upgrading to Niagara 4.12 for security    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### System Overview Page
```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTEM OVERVIEW                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Platform: Niagara 4.11 on JACE-8000                      │
│  Total Devices: 45 BACnet + 12 N2 Legacy                  │
│  Total Points: 1,247                                       │
│  Network: Customer LAN (192.168.1.x)                      │
│                                                             │
│  ┌─ Performance Metrics ──────────────────────────────────┐  │
│  │                                                         │  │
│  │  CPU Usage     Memory Usage    Device Status           │  │
│  │  ┌─────┐       ┌─────┐        ┌─────────────┐          │  │
│  │  │ 23% │       │ 67% │        │ 45 Online   │          │  │
│  │  │█░░░░│       │████░│        │  0 Offline  │          │  │
│  │  └─────┘       └─────┘        └─────────────┘          │  │
│  │   GOOD          GOOD           EXCELLENT               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Device Inventory ─────────────────────────────────────┐  │
│  │ Device Name    │ Type        │ Status  │ Last Seen    │  │
│  │ ───────────────│─────────────│─────────│──────────────│  │
│  │ JACE-8000-Main │ Supervisor  │ Online  │ Just Now     │  │
│  │ AHU-1-Controller│ VAV         │ Online  │ 2 min ago    │  │
│  │ FCU-101        │ Fan Coil    │ Online  │ 1 min ago    │  │
│  │ FCU-102        │ Fan Coil    │ Online  │ 30 sec ago   │  │
│  │ ...            │ ...         │ ...     │ ...          │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Chart and Table Styling

#### Performance Gauge Design
```css
/* Circular gauge for CPU/Memory */
.performance-gauge {
  width: 120px;
  height: 120px;
  position: relative;
}

.gauge-background {
  stroke: #e5e7eb;
  stroke-width: 8;
  fill: none;
}

.gauge-progress {
  stroke: #10b981; /* Green for good */
  stroke-width: 8;
  fill: none;
  stroke-linecap: round;
}

.gauge-text {
  font-size: 24px;
  font-weight: 600;
  text-anchor: middle;
  fill: #111827;
}
```

#### Professional Table Styling
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #d1d5db;
  background: white;
}

.table-header {
  background: #f3f4f6;
  border-bottom: 2px solid #d1d5db;
}

.table-header th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.table-row:nth-child(even) {
  background: #f9fafb;
}

.table-cell {
  padding: 10px 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #111827;
  font-size: 14px;
}

.status-online {
  color: #10b981;
  font-weight: 500;
}

.status-offline {
  color: #ef4444;
  font-weight: 500;
}

.status-warning {
  color: #f59e0b;
  font-weight: 500;
}
```

#### Bar Chart Styling
```css
.bar-chart {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.bar-chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 16px;
}

.chart-bar {
  fill: #3b82f6;
}

.chart-bar:hover {
  fill: #2563eb;
}

.chart-axis {
  stroke: #6b7280;
  stroke-width: 1;
}

.chart-label {
  fill: #374151;
  font-size: 12px;
}
```

## 🖥️ Application UI Components

### Phase Navigation Design
```
┌─────────────────────────────────────────────────────────────┐
│  ●━━━━━━━━━━━━━━━○━━━━━━━━━━━━━━━○━━━━━━━━━━━━━━━○            │
│  1. Site Intelligence    2. System Discovery                │
│     ████████░░░░ 25%        3. Service Activities           │
│                             4. Documentation                │
└─────────────────────────────────────────────────────────────┘
```

### Task Card Design
```css
.task-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  margin-bottom: 12px;
  overflow: hidden;
}

.task-header {
  padding: 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-title {
  font-weight: 600;
  color: #111827;
  font-size: 16px;
}

.task-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
}

.task-checkbox.completed {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.sop-reference {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
```

### File Upload Component
```css
.upload-zone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  background: #fafafa;
  transition: all 0.2s ease;
}

.upload-zone.dragover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #6b7280;
  margin: 0 auto 16px;
}

.upload-text {
  color: #374151;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.upload-subtext {
  color: #6b7280;
  font-size: 14px;
}
```

## 📊 Data Visualization Guidelines

### System Health Indicators
```
Health Score Ranges:
90-100%: EXCELLENT (Green - #10b981)
75-89%:  GOOD (Blue - #3b82f6)  
60-74%:  FAIR (Orange - #f59e0b)
0-59%:   POOR (Red - #ef4444)
```

### Device Status Icons
```css
.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

.status-online {
  background: #d1fae5;
  color: #065f46;
}

.status-offline {
  background: #fee2e2;
  color: #991b1b;
}

.status-warning {
  background: #fef3c7;
  color: #92400e;
}
```

### Chart Color Palette
```css
/* Primary Chart Colors */
--chart-blue: #3b82f6;
--chart-green: #10b981;
--chart-orange: #f59e0b;
--chart-red: #ef4444;
--chart-purple: #8b5cf6;
--chart-cyan: #06b6d4;

/* Background and Grid Colors */
--chart-background: #ffffff;
--chart-grid: #f3f4f6;
--chart-text: #374151;
--chart-axis: #6b7280;
```

## 🎯 Brand Assets & Icons

### Logo Usage
- **Primary Logo**: AME Controls logo in navy blue (#1e3a8a)
- **Minimum Size**: 120px width for digital, 1 inch for print
- **Clear Space**: Logo height × 0.5 on all sides
- **Background**: Use on white or light gray only

### Icon System
- **Line Style**: 2px stroke weight, rounded caps
- **Size**: 24px default, scale proportionally
- **Color**: Use gray-600 (#4b5563) for neutral icons
- **Interactive**: Use primary blue (#2563eb) for clickable icons

### Professional Photography Guidelines
- **Equipment Photos**: Clean, well-lit, neutral backgrounds
- **Issue Documentation**: Clear focus on problem area
- **Before/After**: Consistent angles and lighting
- **File Size**: Optimize to <500KB for PDF inclusion

## 📱 Responsive Design Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 640px) {  /* sm */
  /* Small tablets, large phones */
}

@media (min-width: 768px) {  /* md */
  /* Tablets */
}

@media (min-width: 1024px) { /* lg */
  /* Laptops, primary target */
}

@media (min-width: 1280px) { /* xl */
  /* Desktops */
}

@media (min-width: 1536px) { /* 2xl */
  /* Large desktops */
}
```

## 🖨️ Print Optimization

### PDF-Specific Styling
```css
@media print, (print) {
  /* Ensure proper margins */
  @page {
    margin: 1in 0.75in;
    size: letter;
  }
  
  /* Avoid page breaks in content */
  .avoid-break {
    page-break-inside: avoid;
  }
  
  /* Force page breaks */
  .page-break {
    page-break-before: always;
  }
  
  /* Hide interactive elements */
  .no-print {
    display: none !important;
  }
  
  /* Optimize colors for printing */
  .print-optimize {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
}
```

### Print-Safe Colors
```css
/* Colors that work well in both screen and print */
--print-black: #000000;
--print-dark-gray: #333333;
--print-medium-gray: #666666;
--print-light-gray: #cccccc;
--print-blue: #0066cc;
--print-green: #008000;
--print-red: #cc0000;
```

---

**These design specifications ensure consistency and professionalism across all components of the PM Guidance Tool. Reference this document when implementing any visual elements to maintain brand cohesion and user experience quality.**