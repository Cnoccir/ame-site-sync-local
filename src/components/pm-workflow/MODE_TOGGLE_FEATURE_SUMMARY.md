# ✅ ENGINE ONLY / SUPERVISOR MULTI-SITE TOGGLE FEATURE

## 🎯 What's New

The Tridium Import Wizard now includes a **clear system type toggle** that allows users to choose between **Engine Only** and **Supervisor Multi-Site** modes, with pre-configured file structures for each.

## 🔧 New Features

### **1. System Type Toggle**
Located in the left sidebar header, users can now select:

- **🖥️ Supervisor Multi-Site**: For systems with a central Supervisor managing multiple remote JACEs
- **⚙️ Engine Only**: For standalone JACE controllers without a supervisor
- **🔄 Auto**: Automatically detects system type based on uploaded file names

### **2. Pre-Configured File Structures**

#### **Supervisor Multi-Site Mode**
```
📁 Supervisor Multi-Site System
├── 📄 Platform Details (SupervisorPlatformDetails.txt)
├── 📊 Resource Export (SupervisorNiagaraResourceExport.csv)
└── 🌐 Niagara Network
    └── 📋 Network Export (SupervisorNiagaraNetExport.csv)
        └── [Auto-discovered JACEs will appear here]
```

#### **Engine Only Mode**
```
📁 Engine Only System
├── 📄 Platform Details (PlatformDetails.txt)
├── 📊 Resource Export (ResourceExport.csv)
└── 🌐 Field Networks
    ├── 📡 BACnet Export (BacnetExport.csv)
    └── 📡 N2 Export (N2Export.csv)
```

### **3. Mode-Specific Guidance**

Each mode now displays **clear upload instructions**:

#### **Supervisor Multi-Site Instructions:**
1. SupervisorPlatformDetails.txt
2. SupervisorNiagaraResourceExport.csv
3. SupervisorNiagaraNetExport.csv (discovers JACEs)
4. Individual JACE exports for each discovered site

#### **Engine Only Instructions:**
1. PlatformDetails.txt (JACE platform info)
2. ResourceExport.csv (performance metrics)
3. BacnetExport.csv (BACnet device inventory)
4. N2Export.csv (N2 device inventory)

### **4. Smart Auto-Detection**

In **Auto mode**, the system automatically switches to the appropriate mode based on file names:
- Files containing "Supervisor" → **Supervisor Multi-Site**
- Files containing "JACE" or device exports → **Engine Only**

### **5. Enhanced File Assignment**

The system now intelligently assigns files to the correct tree locations based on:
- **Selected mode** (manual selection)
- **File naming patterns** (auto-detection)
- **Flexible naming support** (accepts various common naming conventions)

## 🎨 User Experience Improvements

### **Visual Clarity**
- **Clear mode buttons** with icons (Server, CPU, Auto)
- **Mode descriptions** explaining each option
- **Step-by-step upload guidance** for each mode
- **Color-coded alerts** with specific instructions

### **Simplified Workflow**
- **No more guessing** about system architecture
- **Pre-structured trees** for each mode
- **Flexible file naming** acceptance
- **Clear visual feedback** on upload progress

### **Professional Interface**
- **Consistent with Niagara Workbench** visual style
- **Intuitive navigation** between modes
- **Real-time progress tracking**
- **Mode-specific help text**

## 🔄 How to Use

### **Method 1: Manual Selection**
1. Navigate to PM Workflow → Phase 2 → Discovery Tab
2. In the left sidebar, select your system type:
   - **Supervisor Multi-Site** for multi-JACE systems
   - **Engine Only** for standalone JACEs
3. Follow the mode-specific upload order
4. Upload files to the pre-configured tree structure

### **Method 2: Auto-Detection**
1. Keep **Auto** mode selected (default)
2. Upload any Tridium export file
3. System automatically detects and switches to appropriate mode
4. Continue uploading remaining files

## 📋 File Naming Flexibility

The system now accepts various naming conventions:

### **Supervisor Mode:**
- `SupervisorPlatformDetails.txt` or `PlatformDetails.txt`
- `SupervisorNiagaraResourceExport.csv` or `NiagaraResourceExport.csv`
- `SupervisorNiagaraNetExport.csv` or `NiagaraNetExport.csv`

### **Engine Only Mode:**
- `JacePlatformDetails.txt` or `PlatformDetails.txt`
- `JaceResourceExport.csv` or `ResourceExport.csv`
- `JaceBacnetExport.csv` or `BacnetExport.csv`
- `JaceN2Export.csv`, `N2Export.csv`, or `Jace1_N2xport.csv`

## ✅ Technical Implementation

- **TypeScript**: Full type safety with new mode interfaces
- **React State Management**: Efficient mode switching and tree updates
- **File Processing**: Enhanced auto-assignment logic
- **UI/UX**: Professional, intuitive interface design
- **Backwards Compatibility**: Existing functionality preserved

## 🎯 Result

Users now have **complete control** over their import workflow with:
- **Clear system type selection**
- **Pre-configured file structures**
- **Step-by-step guidance**
- **Flexible file naming support**
- **Professional visual interface**

The toggle makes the import process **significantly simpler** and more **user-friendly** while maintaining the powerful file tracking and data management capabilities.