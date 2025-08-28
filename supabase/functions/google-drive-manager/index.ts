import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateProjectFolderRequest {
  customerName: string
  visitId?: string
  customerId: string
}

interface CreateStructuredProjectFolderRequest {
  customerName: string
  customerData: {
    customer_id?: string
    site_address?: string
    service_tier?: string
    contact_name?: string
    phone?: string
  }
  parentFolderId: string
  folderName: string
  year: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

    console.log('Google Client ID exists:', !!clientId)
    console.log('Google Client Secret exists:', !!clientSecret)

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Supabase secrets.')
    }

    const { action, ...data } = await req.json()

    let result
    switch (action) {
      case 'test_connection':
        result = await testConnection(clientId, clientSecret)
        break
      case 'create_project_folder':
        result = await createProjectFolder(clientId, clientSecret, data as CreateProjectFolderRequest, supabase)
        break
      case 'create_structured_project_folder':
        result = await createStructuredProjectFolder(clientId, clientSecret, data as CreateStructuredProjectFolderRequest, supabase)
        break
      case 'list_folders':
        result = await listProjectFolders(clientId, clientSecret)
        break
      default:
        throw new Error('Invalid action specified')
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Google Drive manager error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function testConnection(clientId: string, clientSecret: string): Promise<any> {
  // In development, we'll simulate the connection test
  console.log('Testing Google Drive connection (development mode)')
  
  return {
    success: true,
    message: 'Google OAuth credentials are configured (Development Mode)',
    clientIdPrefix: clientId.substring(0, 10) + '...',
    hasSecret: !!clientSecret,
    developmentMode: true,
    note: 'In development, Google OAuth2 requires proper redirect URLs. Use deployment for full functionality.'
  }
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  // For development, we'll use a mock token or skip the actual API calls
  // In production, you'll need to implement proper OAuth2 flow
  
  // For now, let's simulate the Google Drive API calls
  console.log('Simulating Google Drive API access with client credentials')
  
  // Return a mock token for development
  // In production, implement proper OAuth2 flow with redirect URLs
  throw new Error('Google Drive integration requires proper OAuth2 flow. For development, we can simulate folder creation without actual Google Drive API calls.')
}

async function createProjectFolder(
  clientId: string,
  clientSecret: string,
  data: CreateProjectFolderRequest,
  supabase: any
): Promise<any> {
  const { customerName, visitId, customerId } = data

  console.log('Creating project folder (development mode):', customerName)
  
  // In development, simulate folder creation
  const mockFolderId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const folderName = visitId ? `${customerName} - Visit ${visitId}` : `${customerName} - ${new Date().getFullYear()}`
  
  // Simulate the folder structure
  const subfolders = [
    'Phase 1 - Pre-Visit Documentation',
    'Phase 2 - On-Site Assessment', 
    'Phase 3 - Maintenance Execution',
    'Phase 4 - Completion & Reporting'
  ]

  const subfolderIds = {}
  subfolders.forEach(subfolderName => {
    subfolderIds[subfolderName] = `mock_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })

  // Update customer record with simulated folder information
  const { error } = await supabase
    .from('ame_customers')
    .update({
      drive_folder_id: mockFolderId,
      drive_folder_url: `https://drive.google.com/drive/folders/${mockFolderId}`,
    })
    .eq('id', customerId)

  if (error) {
    console.error('Failed to update customer folder info:', error)
    throw new Error('Failed to update customer record')
  }

  return {
    success: true,
    folderId: mockFolderId,
    folderUrl: `https://drive.google.com/drive/folders/${mockFolderId}`,
    subfolders: subfolderIds,
    developmentMode: true,
    note: 'Folder created in development mode. Deploy to production for actual Google Drive integration.'
  }
}

/**
 * Create a structured project folder with proper AME subfolder organization
 */
async function createStructuredProjectFolder(
  clientId: string,
  clientSecret: string,
  data: CreateStructuredProjectFolderRequest,
  supabase: any
): Promise<any> {
  const { customerName, customerData, parentFolderId, folderName, year } = data

  console.log(`Creating structured project folder (development mode): ${folderName} in parent ${parentFolderId}`)
  
  // In development, simulate structured folder creation
  const mockMainFolderId = `mock_main_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const mockMainFolderUrl = `https://drive.google.com/drive/folders/${mockMainFolderId}`
  
  // Define AME standard project subfolders
  const projectSubfolders = {
    'Site Backups': 'backups',
    'Project Documentation': 'projectDocs',
    'Site Photos & Media': 'sitePhotos',
    'Maintenance Records': 'maintenance',
    'Reports & Analytics': 'reports',
    'Client Correspondence': 'correspondence'
  }

  const subfolderStructure = {}
  Object.entries(projectSubfolders).forEach(([displayName, key]) => {
    const subfolderId = `mock_${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    subfolderStructure[key] = {
      id: subfolderId,
      url: `https://drive.google.com/drive/folders/${subfolderId}`,
      name: displayName
    }
  })

  // Create a project info document in the main folder (simulated)
  const projectInfoDoc = {
    id: `mock_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: 'PROJECT_INFO.md',
    content: `# ${customerName} - Project Information\n\n` +
             `**Customer:** ${customerName}\n` +
             `**Year:** ${year}\n` +
             `**Service Tier:** ${customerData.service_tier || 'CORE'}\n` +
             `**Site Address:** ${customerData.site_address || 'Not specified'}\n` +
             `**Primary Contact:** ${customerData.contact_name || 'Not specified'}\n` +
             `**Phone:** ${customerData.phone || 'Not specified'}\n\n` +
             `**Created:** ${new Date().toISOString()}\n` +
             `**Parent Folder ID:** ${parentFolderId}\n\n` +
             `## Folder Structure\n\n` +
             Object.entries(projectSubfolders).map(([name, key]) => 
               `- **${name}**: For ${getFolderDescription(key)}`
             ).join('\n')
  }

  console.log('Simulated folder structure created:', {
    mainFolder: mockMainFolderId,
    subfolders: Object.keys(subfolderStructure).length,
    parentFolder: parentFolderId
  })

  return {
    success: true,
    mainFolder: {
      id: mockMainFolderId,
      url: mockMainFolderUrl,
      name: folderName
    },
    subfolders: subfolderStructure,
    projectInfo: projectInfoDoc,
    parentFolderId,
    year,
    developmentMode: true,
    note: `Structured project folder created in development mode. ` +
          `In production, this would create the actual folder structure in Google Drive folder ${parentFolderId}.`
  }
}

/**
 * Get description for each subfolder type
 */
function getFolderDescription(folderKey: string): string {
  const descriptions = {
    backups: 'site configuration backups and system snapshots',
    projectDocs: 'project plans, specifications, and documentation',
    sitePhotos: 'site photos, videos, and visual documentation',
    maintenance: 'maintenance logs, service records, and schedules',
    reports: 'system reports, analytics, and performance data',
    correspondence: 'client emails, communications, and meeting notes'
  }
  return descriptions[folderKey] || 'project files and documents'
}

async function listProjectFolders(clientId: string, clientSecret: string): Promise<any> {
  console.log('Listing project folders (development mode)')
  
  // In development, return mock folder data
  const mockFolders = [
    {
      id: 'mock_folder_1',
      name: 'Example Company - Visit V001',
      createdTime: '2024-01-15T10:00:00.000Z'
    },
    {
      id: 'mock_folder_2', 
      name: 'Test Site - Visit V002',
      createdTime: '2024-01-16T14:30:00.000Z'
    }
  ]

  return { 
    folders: mockFolders,
    developmentMode: true,
    note: 'Showing mock data in development mode. Deploy to production for actual Google Drive folders.'
  }
}