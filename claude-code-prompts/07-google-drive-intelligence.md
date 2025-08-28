# Prompt 7: Intelligent Google Drive Integration & Project Folder Discovery

## Objective
Create a Supabase Edge Function that intelligently scans Google Drive using the Google API to automatically match customer names with their project folders, eliminating manual folder URL entry and providing seamless access to project documentation during the Pre-Visit phase.

## Context
- System is hosted on Loveable.dev with Supabase backend
- Customer data is now real (from Prompt 6) and can be used for intelligent matching
- Project folders exist in Google Drive with naming patterns that can be matched to customers
- Pre-Visit phase currently requires manual project folder URL entry
- Need automatic discovery and linking of project folders to customers

## Architecture Overview

### Components
1. **Supabase Edge Function** - Google Drive scanning and indexing
2. **Google Drive API Integration** - Folder search and metadata extraction
3. **Intelligent Name Matching** - Fuzzy matching between customer names and folder names
4. **Project Folder Database** - Indexed folder structure with metadata
5. **Enhanced Pre-Visit UI** - Automatic folder suggestions and links

## Requirements

### 1. Supabase Edge Function Setup
Create `supabase/functions/google-drive-scanner/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface GoogleDriveConfig {
  serviceAccountEmail: string;
  privateKey: string;
  driveRootFolderId?: string; // Optional: scan specific root folder
  allowedDomains: string[];   // Restrict to specific Google Workspace domains
}

interface ProjectFolder {
  id: string;
  name: string;
  parentId: string;
  path: string;
  webViewLink: string;
  modifiedTime: string;
  fileCount: number;
  hasDrawings: boolean;
  hasSubmittals: boolean;
  hasSOPs: boolean;
  matchedCustomers: CustomerMatch[];
}

interface CustomerMatch {
  customerId: string;
  customerName: string;
  matchScore: number;
  matchType: 'exact' | 'fuzzy' | 'alias';
  confidence: number;
}

const googleDriveScanner = async (req: Request): Promise<Response> => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action, customerId, scanDepth = 3 } = await req.json();
    
    switch (action) {
      case 'scan_all_folders':
        return await scanAllProjectFolders(supabase);
      case 'find_customer_folder':
        return await findCustomerFolder(supabase, customerId);
      case 'index_folder_contents':
        return await indexFolderContents(supabase, req.body);
      case 'refresh_customer_matches':
        return await refreshCustomerMatches(supabase);
      default:
        return new Response('Invalid action', { status: 400 });
    }
  } catch (error) {
    console.error('Google Drive Scanner Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Main folder scanning function
async function scanAllProjectFolders(supabase: any): Promise<Response> {
  const googleAuth = await authenticateGoogleDrive();
  const folders = await recursiveFolderScan(googleAuth, null, 0, 3);
  
  // Process and match folders with customers
  const processedFolders = await Promise.all(
    folders.map(folder => processProjectFolder(folder, supabase))
  );
  
  // Store in database
  await storeProjectFolders(supabase, processedFolders);
  
  return new Response(JSON.stringify({
    success: true,
    foldersFound: processedFolders.length,
    customersMatched: processedFolders.filter(f => f.matchedCustomers.length > 0).length
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Intelligent customer folder matching
async function findCustomerFolder(supabase: any, customerId: string): Promise<Response> {
  // Get customer details
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();
    
  if (error) throw error;
  
  // Search for folders matching customer name variants
  const nameVariants = generateCustomerNameVariants(customer);
  const googleAuth = await authenticateGoogleDrive();
  
  const potentialFolders = await Promise.all(
    nameVariants.map(variant => searchGoogleDriveByName(googleAuth, variant))
  );
  
  // Flatten and score matches
  const allMatches = potentialFolders.flat();
  const scoredMatches = allMatches.map(folder => ({
    ...folder,
    matchScore: calculateMatchScore(customer.company_name, folder.name),
    confidence: calculateMatchConfidence(customer, folder)
  })).sort((a, b) => b.matchScore - a.matchScore);
  
  return new Response(JSON.stringify({
    customer: customer.company_name,
    potentialMatches: scoredMatches.slice(0, 10), // Top 10 matches
    bestMatch: scoredMatches[0] || null
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

serve(googleDriveScanner);
```

### 2. Google Drive API Integration Service
Create `src/services/googleDriveIntegrationService.ts`:
```typescript
export class GoogleDriveIntegrationService {
  // Trigger folder scan for all customers
  static async scanAllProjectFolders(): Promise<ScanResult> {
    const { data, error } = await supabase.functions.invoke('google-drive-scanner', {
      body: { action: 'scan_all_folders' }
    });
    
    if (error) throw error;
    return data;
  }
  
  // Find project folder for specific customer
  static async findProjectFolder(customerId: string): Promise<ProjectFolderMatch[]> {
    const { data, error } = await supabase.functions.invoke('google-drive-scanner', {
      body: { action: 'find_customer_folder', customerId }
    });
    
    if (error) throw error;
    return data.potentialMatches;
  }
  
  // Get cached project folder matches for customer
  static async getCustomerProjectFolders(customerId: string): Promise<ProjectFolderData[]> {
    const { data, error } = await supabase
      .from('customer_project_folders')
      .select(`
        *,
        project_folders(*)
      `)
      .eq('customer_id', customerId)
      .gte('match_score', 0.7) // Only high-confidence matches
      .order('match_score', { ascending: false });
      
    if (error) throw error;
    return data;
  }
  
  // Update customer project folder association
  static async associateProjectFolder(
    customerId: string, 
    folderId: string, 
    isConfirmed: boolean = false
  ): Promise<void> {
    const { error } = await supabase
      .from('customer_project_folders')
      .upsert({
        customer_id: customerId,
        folder_id: folderId,
        is_confirmed: isConfirmed,
        confirmed_at: isConfirmed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
  }
  
  // Generate intelligent folder suggestions
  static async getProjectFolderSuggestions(customerName: string): Promise<FolderSuggestion[]> {
    // Use fuzzy matching to find similar folder names
    const { data, error } = await supabase
      .rpc('fuzzy_match_folders', { 
        customer_name: customerName,
        threshold: 0.6
      });
      
    if (error) throw error;
    return data;
  }
}
```

### 3. Enhanced Database Schema
```sql
-- Create project folders index table
CREATE TABLE project_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_drive_id VARCHAR(255) UNIQUE NOT NULL,
  folder_name VARCHAR(500) NOT NULL,
  folder_path TEXT,
  parent_folder_id VARCHAR(255),
  web_view_link TEXT,
  
  -- Folder analysis
  file_count INTEGER DEFAULT 0,
  has_drawings BOOLEAN DEFAULT FALSE,
  has_submittals BOOLEAN DEFAULT FALSE,
  has_sops BOOLEAN DEFAULT FALSE,
  has_floor_plans BOOLEAN DEFAULT FALSE,
  has_network_diagrams BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  last_scanned_at TIMESTAMP DEFAULT NOW(),
  google_modified_time TIMESTAMP,
  folder_size_bytes BIGINT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create customer project folder associations
CREATE TABLE customer_project_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES project_folders(id) ON DELETE CASCADE,
  
  -- Match scoring
  match_score DECIMAL(3,2), -- 0.0 to 1.0
  match_type VARCHAR(20), -- 'exact', 'fuzzy', 'manual', 'alias'
  confidence_level VARCHAR(20), -- 'high', 'medium', 'low'
  
  -- Confirmation
  is_confirmed BOOLEAN DEFAULT FALSE,
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(customer_id, folder_id)
);

-- Create folder content index for quick searching
CREATE TABLE folder_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES project_folders(id) ON DELETE CASCADE,
  file_name VARCHAR(500),
  file_type VARCHAR(50),
  file_category VARCHAR(100), -- 'drawing', 'submittal', 'sop', 'floor_plan', etc.
  google_file_id VARCHAR(255),
  file_size_bytes BIGINT,
  web_view_link TEXT,
  last_modified TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create fuzzy matching function for customer names
CREATE OR REPLACE FUNCTION fuzzy_match_folders(customer_name TEXT, threshold DECIMAL DEFAULT 0.6)
RETURNS TABLE (
  folder_id UUID,
  folder_name VARCHAR(500),
  match_score DECIMAL,
  web_view_link TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pf.id,
    pf.folder_name,
    similarity(customer_name, pf.folder_name) as match_score,
    pf.web_view_link
  FROM project_folders pf
  WHERE similarity(customer_name, pf.folder_name) >= threshold
  ORDER BY similarity(customer_name, pf.folder_name) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Enable fuzzy string matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_project_folders_name_trgm ON project_folders USING gin (folder_name gin_trgm_ops);
```

### 4. Enhanced Pre-Visit Phase Component
Update `PreVisitPhase.tsx` with intelligent project folder discovery:

```typescript
// Enhanced Project Folder Section
const ProjectFolderDiscoverySection = ({ customer }: Props) => {
  const [folderSuggestions, setFolderSuggestions] = useState<FolderSuggestion[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<ProjectFolderData | null>(null);
  const [scanningFolders, setScanningFolders] = useState(false);
  
  useEffect(() => {
    loadProjectFolderSuggestions();
  }, [customer.id]);
  
  const loadProjectFolderSuggestions = async () => {
    try {
      const suggestions = await GoogleDriveIntegrationService.getCustomerProjectFolders(customer.id);
      setFolderSuggestions(suggestions);
      
      // If no cached suggestions, trigger a fresh search
      if (suggestions.length === 0) {
        searchForProjectFolders();
      }
    } catch (error) {
      console.error('Failed to load folder suggestions:', error);
    }
  };
  
  const searchForProjectFolders = async () => {
    setScanningFolders(true);
    try {
      const matches = await GoogleDriveIntegrationService.findProjectFolder(customer.id);
      setFolderSuggestions(matches);
    } catch (error) {
      console.error('Failed to search for folders:', error);
      toast({
        title: 'Folder Search Failed',
        description: 'Unable to search for project folders. Please enter manually.',
        variant: 'destructive'
      });
    } finally {
      setScanningFolders(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          Project Folder Discovery
          {scanningFolders && <Spinner className="w-4 h-4" />}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatically discovered project folders for {customer.company_name}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {folderSuggestions.length > 0 ? (
          <>
            <div className="space-y-2">
              <Label>Suggested Project Folders:</Label>
              {folderSuggestions.map(suggestion => (
                <ProjectFolderCard
                  key={suggestion.id}
                  folder={suggestion}
                  isSelected={selectedFolder?.id === suggestion.id}
                  onSelect={() => setSelectedFolder(suggestion)}
                  onConfirm={() => confirmProjectFolder(suggestion)}
                />
              ))}
            </div>
            
            {selectedFolder && (
              <ProjectFolderPreview folder={selectedFolder} />
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <FolderSearch className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              No project folders found for {customer.company_name}
            </p>
            <Button onClick={searchForProjectFolders} disabled={scanningFolders}>
              {scanningFolders ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Google Drive
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProjectFolderCard = ({ folder, isSelected, onSelect, onConfirm }: Props) => {
  return (
    <div className={cn(
      "border rounded-lg p-3 cursor-pointer transition-colors",
      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
    )} onClick={onSelect}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium">{folder.folder_name}</h4>
            <Badge variant={getConfidenceBadgeVariant(folder.confidence_level)}>
              {Math.round(folder.match_score * 100)}% match
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1">
            {folder.folder_path}
          </p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {folder.file_count} files
            </span>
            {folder.has_drawings && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                Drawings
              </span>
            )}
            {folder.has_submittals && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-3 h-3" />
                Submittals
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              window.open(folder.web_view_link, '_blank');
            }}
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
          
          {!folder.is_confirmed && (
            <Button
              variant="outline"
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
            >
              Confirm
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 5. Admin Interface for Drive Management
```typescript
// src/components/admin/GoogleDriveManagement.tsx
export const GoogleDriveManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Drive Integration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage Google Drive scanning and customer folder associations
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="scan">
            <TabsList>
              <TabsTrigger value="scan">Folder Scanning</TabsTrigger>
              <TabsTrigger value="matches">Customer Matches</TabsTrigger>
              <TabsTrigger value="settings">Drive Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="scan">
              <FolderScanningPanel />
            </TabsContent>
            
            <TabsContent value="matches">
              <CustomerMatchesPanel />
            </TabsContent>
            
            <TabsContent value="settings">
              <DriveSettingsPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
```

## Success Criteria
1. Edge function successfully authenticates with Google Drive API
2. Folder scanning discovers and indexes project folders automatically  
3. Customer name matching works with high accuracy (>80% for exact matches)
4. Pre-Visit phase shows relevant project folders automatically
5. Manual confirmation and override capabilities work
6. Folder content analysis identifies drawings, submittals, SOPs
7. Performance is acceptable for real-time folder discovery

## Security Considerations
- Service account credentials stored securely in Supabase secrets
- Row-level security on all folder-related tables
- Rate limiting on Google Drive API calls
- Access control for admin folder management functions

This enhancement would make your Pre-Visit phase incredibly powerful by automatically finding and linking project documentation without any manual effort!