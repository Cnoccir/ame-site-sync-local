# Prompt 3: System Platform Detection & Network Analysis Completion

## Objective
Implement automatic system platform detection to address John's feedback about needing to know main system types (N4, FX, mixed ALC, EBI Honeywell, etc.). Complete the network analysis implementation that was mentioned as not fully implemented.

## Context
- John's feedback: "Need to know what main system is on site, N4, FX, a mix of ALC, EBI Honeywell, etc."
- Current NetworkTopologyService exists but is not fully implemented
- Network analysis section in Assessment phase needs completion
- System platform should be detected and tracked consistently

## Current Code to Examine/Modify
- `src/services/networkTopologyService.ts` - Complete implementation
- `src/components/assessment/NetworkAnalysisResults.tsx` - Enhance display
- `src/components/assessment/TridiumDataImporter.tsx` - Add platform detection
- `src/components/visit/phases/AssessmentPhase.tsx` - Integrate platform detection
- `src/types/tridium.ts` - Platform detection types

## Requirements

### 1. Platform Detection Database Schema
```sql
-- Add to customers table if not done in previous prompt
ALTER TABLE customers ADD COLUMN IF NOT EXISTS system_platform VARCHAR(50);
ALTER TABLE customers ADD COLUMN platform_version VARCHAR(20);
ALTER TABLE customers ADD COLUMN mixed_platforms JSONB;
ALTER TABLE customers ADD COLUMN platform_detected_at TIMESTAMP;
ALTER TABLE customers ADD COLUMN platform_detection_method VARCHAR(50);
ALTER TABLE customers ADD COLUMN platform_confidence_score DECIMAL(3,2);

-- Create platform detection history
CREATE TABLE platform_detection_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  visit_id UUID REFERENCES ame_visits(id),
  detected_platform VARCHAR(50),
  platform_version VARCHAR(20),
  mixed_platforms JSONB,
  detection_method VARCHAR(50), -- 'network_scan', 'file_analysis', 'manual_entry'
  confidence_score DECIMAL(3,2),
  device_count INTEGER,
  evidence JSONB, -- Store detection evidence
  detected_at TIMESTAMP DEFAULT NOW(),
  detected_by UUID REFERENCES auth.users(id)
);
```

### 2. Enhanced Platform Detection Types
Update `src/types/tridium.ts` and create platform detection types:
```typescript
export type SystemPlatform = 
  | 'Niagara-N4' 
  | 'Niagara-FX' 
  | 'Niagara-WEBs' 
  | 'JCI-FacilityExplorer'
  | 'Honeywell-WEBs'
  | 'ALC-Legacy'
  | 'EBI-Honeywell' 
  | 'Mixed-Platform'
  | 'Unknown';

export interface PlatformDetectionResult {
  primaryPlatform: SystemPlatform;
  platformVersion?: string;
  mixedPlatforms?: SystemPlatform[];
  detectionMethod: 'network_scan' | 'file_analysis' | 'manual_entry' | 'device_signatures';
  confidenceScore: number; // 0.0 to 1.0
  deviceCount: number;
  evidence: PlatformEvidence;
  detectedAt: Date;
}

export interface PlatformEvidence {
  deviceSignatures: DeviceSignature[];
  softwareVersions: string[];
  networkProtocols: string[];
  fileAnalysisResults?: FileAnalysisEvidence;
  userAgent?: string;
  manufacturerOIDs?: string[];
}

export interface DeviceSignature {
  deviceType: string;
  manufacturer: string;
  model?: string;
  firmwareVersion?: string;
  networkProtocol: string;
  count: number;
}
```

### 3. Complete NetworkTopologyService Implementation
Enhance `src/services/networkTopologyService.ts`:
```typescript
export class NetworkTopologyService {
  // Platform Detection Methods
  static async detectSystemPlatform(
    networkData?: any,
    uploadedFiles?: File[],
    manualHints?: string[]
  ): Promise<PlatformDetectionResult>;
  
  // Analyze uploaded Niagara files for platform signatures
  static async analyzeTridiumFiles(files: File[]): Promise<{
    platform: SystemPlatform;
    version: string;
    stationInfo: any;
    deviceInventory: DeviceInventory[];
    confidence: number;
  }>;
  
  // Network device scanning for platform detection
  static async scanNetworkDevices(ipRange: string): Promise<DeviceSignature[]>;
  
  // Analyze BACnet device signatures
  static async analyzeBACnetDevices(devices: any[]): Promise<{
    platform: SystemPlatform;
    evidence: DeviceSignature[];
    confidence: number;
  }>;
  
  // Complete network topology mapping
  static async mapNetworkTopology(platformData: PlatformDetectionResult): Promise<NetworkTopology>;
  
  // Enhanced device inventory with platform context
  static async generateDeviceInventory(
    platform: SystemPlatform,
    networkData: any
  ): Promise<EnhancedDeviceInventory>;
}

interface EnhancedDeviceInventory {
  supervisors: SupervisorDevice[];
  jaces: JaceDevice[];
  fieldControllers: FieldController[];
  ioModules: IOModule[];
  networkGateways: NetworkGateway[];
  platformStatistics: PlatformStatistics;
}

interface PlatformStatistics {
  totalDevices: number;
  devicesByProtocol: Record<string, number>;
  devicesByManufacturer: Record<string, number>;
  licenseUtilization: {
    used: number;
    available: number;
    percentage: number;
  };
  healthScore: number;
}
```

### 4. Platform Detection Component
Create `src/components/assessment/PlatformDetectionCard.tsx`:
```typescript
interface PlatformDetectionCardProps {
  customerId: string;
  visitId: string;
  onPlatformDetected: (result: PlatformDetectionResult) => void;
}

export const PlatformDetectionCard = ({ customerId, visitId, onPlatformDetected }: PlatformDetectionCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          System Platform Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto">Auto-Detect</TabsTrigger>
            <TabsTrigger value="files">File Analysis</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auto" className="space-y-4">
            <NetworkScannerComponent onScanComplete={handleNetworkScan} />
          </TabsContent>
          
          <TabsContent value="files" className="space-y-4">
            <FileUploader 
              accept=".dist,.backup,.csv,.xml"
              onFilesUploaded={handleFileAnalysis}
              description="Upload Niagara backup files, exports, or BACnet device lists"
            />
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <ManualPlatformEntry onPlatformSelected={handleManualEntry} />
          </TabsContent>
        </Tabs>
        
        {detectionResult && (
          <PlatformDetectionResults result={detectionResult} />
        )}
      </CardContent>
    </Card>
  );
};
```

### 5. Enhanced Assessment Phase Integration
Update `AssessmentPhase.tsx` to include platform detection as Step 1.5:
```typescript
// Add platform detection after customer check-in
const platformDetectionStep = {
  id: 1.5,
  title: "System Platform Detection",
  description: "Identify the primary building automation platform",
  component: (
    <PlatformDetectionCard
      customerId={customer.id}
      visitId={visitId}
      onPlatformDetected={handlePlatformDetected}
    />
  ),
  required: true,
  completionCriteria: "Platform identified with >80% confidence or manual confirmation"
};
```

### 6. Network Analysis Results Enhancement
Update `NetworkAnalysisResults.tsx`:
```typescript
export const NetworkAnalysisResults = ({ analysisData, platformResult }: Props) => {
  return (
    <div className="space-y-6">
      {/* Platform Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            System Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Primary Platform:</label>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="default">{platformResult.primaryPlatform}</Badge>
                <span className="text-sm text-muted-foreground">
                  v{platformResult.platformVersion}
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Detection Confidence:</label>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={platformResult.confidenceScore * 100} className="flex-1" />
                <span className="text-sm">{Math.round(platformResult.confidenceScore * 100)}%</span>
              </div>
            </div>
          </div>
          
          {platformResult.mixedPlatforms && platformResult.mixedPlatforms.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium">Mixed Platforms Detected:</label>
              <div className="flex gap-2 mt-1">
                {platformResult.mixedPlatforms.map(platform => (
                  <Badge key={platform} variant="secondary">{platform}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Device Inventory by Platform */}
      <PlatformSpecificDeviceInventory 
        platform={platformResult.primaryPlatform}
        devices={analysisData.devices}
      />
      
      {/* Network Health by Platform */}
      <PlatformSpecificHealthMetrics
        platform={platformResult.primaryPlatform}
        healthData={analysisData.health}
      />
    </div>
  );
};
```

### 7. Platform-Specific Tool & SOP Recommendations
Create service to recommend tools and SOPs based on detected platform:
```typescript
// src/services/platformIntelligenceService.ts
export class PlatformIntelligenceService {
  static async getRecommendedTools(
    platform: SystemPlatform,
    serviceTier: string
  ): Promise<ToolRecommendation[]>;
  
  static async getRelevantSOPs(
    platform: SystemPlatform,
    phase: string
  ): Promise<SOPRecommendation[]>;
  
  static async getPlatformSpecificChecklist(
    platform: SystemPlatform,
    serviceTier: string
  ): Promise<ChecklistItem[]>;
}
```

## Success Criteria
1. System platform is automatically detected with >80% accuracy for common platforms
2. Platform detection works with file uploads (.dist, .backup, exports)
3. Mixed platform scenarios are properly identified and documented
4. Platform information is prominently displayed throughout the visit workflow
5. Network analysis provides platform-specific insights and recommendations
6. Tool and SOP recommendations adapt based on detected platform

## Testing Requirements
1. Test detection accuracy with sample files from each platform type
2. Verify network scanning works across different network configurations
3. Test mixed platform detection scenarios
4. Ensure platform data persists and displays correctly
5. Validate tool/SOP recommendations align with platform type

## Integration Notes
- This addresses John's feedback about knowing system types upfront
- Platform detection should influence tool recommendations in Pre-Visit phase
- Detected platform should affect available tasks and SOPs in Service Execution
- Network analysis completion provides foundation for performance monitoring
- Platform intelligence improves visit efficiency and accuracy