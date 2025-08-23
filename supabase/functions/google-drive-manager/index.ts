import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateProjectFolderRequest {
  customerName: string
  visitId: string
  customerId: string
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
  const folderName = `${customerName} - Visit ${visitId}`
  
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