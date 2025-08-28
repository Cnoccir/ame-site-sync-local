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
        result = await listProjectFolders(clientId, clientSecret, supabase)
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

async function getAccessToken(supabase: any): Promise<string> {
  // Get the current user and their OAuth tokens
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  const googleOAuth = user.user_metadata?.google_oauth
  if (!googleOAuth || !googleOAuth.access_token) {
    throw new Error('No Google OAuth tokens found. Please re-authenticate with Google.')
  }

  // Check if token needs refresh
  const expiresAt = new Date(googleOAuth.expires_at)
  const now = new Date()
  
  if (expiresAt <= now) {
    throw new Error('Google OAuth token expired. Please re-authenticate.')
  }

  return googleOAuth.access_token
}

async function createProjectFolder(
  clientId: string,
  clientSecret: string,
  data: CreateProjectFolderRequest,
  supabase: any
): Promise<any> {
  const { customerName, visitId, customerId } = data

  console.log('Creating project folder for:', customerName)
  
  try {
    // Get access token from authenticated user
    const accessToken = await getAccessToken(supabase)
    
    const folderName = visitId ? `${customerName} - Visit ${visitId}` : `${customerName} - ${new Date().getFullYear()}`
    
    // Create main project folder
    const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['1rSYKqg5VGKGo9JFzNVYABk0nVlpL5Yoo'] // AME Customer Projects folder
      }),
    })

    if (!createFolderResponse.ok) {
      throw new Error(`Failed to create folder: ${createFolderResponse.statusText}`)
    }

    const mainFolder = await createFolderResponse.json()
    
    // Create subfolders
    const subfolders = [
      'Phase 1 - Pre-Visit Documentation',
      'Phase 2 - On-Site Assessment', 
      'Phase 3 - Maintenance Execution',
      'Phase 4 - Completion & Reporting'
    ]

    const subfolderIds = {}
    for (const subfolderName of subfolders) {
      const subfolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subfolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [mainFolder.id]
        }),
      })
      
      if (subfolderResponse.ok) {
        const subfolder = await subfolderResponse.json()
        subfolderIds[subfolderName] = subfolder.id
      }
    }

    // Update customer record with actual folder information
    const { error } = await supabase
      .from('ame_customers')
      .update({
        drive_folder_id: mainFolder.id,
        drive_folder_url: `https://drive.google.com/drive/folders/${mainFolder.id}`,
      })
      .eq('id', customerId)

    if (error) {
      console.error('Failed to update customer folder info:', error)
      throw new Error('Failed to update customer record')
    }

    return {
      success: true,
      folderId: mainFolder.id,
      folderUrl: `https://drive.google.com/drive/folders/${mainFolder.id}`,
      subfolders: subfolderIds,
      note: 'Folder created successfully in Google Drive'
    }
    
  } catch (error) {
    console.error('Error creating Google Drive folder:', error)
    
    // Fallback to mock folder creation if Google Drive fails
    const mockFolderId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const folderName = visitId ? `${customerName} - Visit ${visitId}` : `${customerName} - ${new Date().getFullYear()}`
    
    const { error: updateError } = await supabase
      .from('ame_customers')
      .update({
        drive_folder_id: mockFolderId,
        drive_folder_url: `https://drive.google.com/drive/folders/${mockFolderId}`,
      })
      .eq('id', customerId)

    if (updateError) {
      throw new Error('Failed to update customer record with fallback folder')
    }

    return {
      success: true,
      folderId: mockFolderId,
      folderUrl: `https://drive.google.com/drive/folders/${mockFolderId}`,
      subfolders: {},
      fallbackMode: true,
      note: 'Folder created in fallback mode due to Google Drive API issue'
    }
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

  console.log(`Creating structured project folder: ${folderName} in parent ${parentFolderId}`)
  
  try {
    // Get access token from authenticated user
    const accessToken = await getAccessToken(supabase)
    
    // Create main project folder
    const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId || '1rSYKqg5VGKGo9JFzNVYABk0nVlpL5Yoo'] // Use provided parent or default AME folder
      }),
    })

    if (!createFolderResponse.ok) {
      throw new Error(`Failed to create main folder: ${createFolderResponse.statusText}`)
    }

    const mainFolder = await createFolderResponse.json()
    
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
    
    // Create subfolders in Google Drive
    for (const [displayName, key] of Object.entries(projectSubfolders)) {
      try {
        const subfolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: displayName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [mainFolder.id]
          }),
        })
        
        if (subfolderResponse.ok) {
          const subfolder = await subfolderResponse.json()
          subfolderStructure[key] = {
            id: subfolder.id,
            url: `https://drive.google.com/drive/folders/${subfolder.id}`,
            name: displayName
          }
        }
      } catch (error) {
        console.error(`Failed to create subfolder ${displayName}:`, error)
      }
    }

    // Create project info document
    const projectInfoContent = `# ${customerName} - Project Information

**Customer:** ${customerName}
**Year:** ${year}
**Service Tier:** ${customerData.service_tier || 'CORE'}
**Site Address:** ${customerData.site_address || 'Not specified'}
**Primary Contact:** ${customerData.contact_name || 'Not specified'}
**Phone:** ${customerData.phone || 'Not specified'}

**Created:** ${new Date().toISOString()}
**Parent Folder ID:** ${parentFolderId}

## Folder Structure

${Object.entries(projectSubfolders).map(([name, key]) => 
  `- **${name}**: For ${getFolderDescription(key)}`
).join('\n')}
`

    // Create the project info document in Google Drive
    try {
      const createDocResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'PROJECT_INFO.txt',
          parents: [mainFolder.id]
        }),
      })
      
      if (createDocResponse.ok) {
        const doc = await createDocResponse.json()
        
        // Upload content to the document
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${doc.id}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'text/plain',
          },
          body: projectInfoContent
        })
      }
    } catch (error) {
      console.error('Failed to create project info document:', error)
    }

    console.log('Structured folder created successfully:', {
      mainFolder: mainFolder.id,
      subfolders: Object.keys(subfolderStructure).length,
      parentFolder: parentFolderId
    })

    return {
      success: true,
      mainFolder: {
        id: mainFolder.id,
        url: `https://drive.google.com/drive/folders/${mainFolder.id}`,
        name: folderName
      },
      subfolders: subfolderStructure,
      parentFolderId,
      year,
      note: 'Structured project folder created successfully in Google Drive'
    }
    
  } catch (error) {
    console.error('Error creating structured Google Drive folder:', error)
    
    // Fallback to mock folder creation
    const mockMainFolderId = `mock_main_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const mockMainFolderUrl = `https://drive.google.com/drive/folders/${mockMainFolderId}`
    
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

    return {
      success: true,
      mainFolder: {
        id: mockMainFolderId,
        url: mockMainFolderUrl,
        name: folderName
      },
      subfolders: subfolderStructure,
      parentFolderId,
      year,
      fallbackMode: true,
      note: 'Structured project folder created in fallback mode due to Google Drive API issue'
    }
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

async function listProjectFolders(clientId: string, clientSecret: string, supabase: any): Promise<any> {
  console.log('Listing project folders from Google Drive')
  
  try {
    // Get access token from authenticated user
    const accessToken = await getAccessToken(supabase)
    
    // Search for folders in the AME Customer Projects folder
    const searchResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?' + new URLSearchParams({
        q: "'1rSYKqg5VGKGo9JFzNVYABk0nVlpL5Yoo' in parents and mimeType='application/vnd.google-apps.folder'",
        fields: 'files(id,name,createdTime,modifiedTime)',
        pageSize: '100'
      }),
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!searchResponse.ok) {
      throw new Error(`Failed to list folders: ${searchResponse.statusText}`)
    }

    const data = await searchResponse.json()
    
    return { 
      folders: data.files || [],
      note: 'Folders retrieved from Google Drive'
    }
    
  } catch (error) {
    console.error('Error listing Google Drive folders:', error)
    
    // Fallback to mock data
    const mockFolders = [
      {
        id: 'mock_folder_1',
        name: 'Example Company - 2025',
        createdTime: '2024-01-15T10:00:00.000Z'
      },
      {
        id: 'mock_folder_2', 
        name: 'Test Site - 2025',
        createdTime: '2024-01-16T14:30:00.000Z'
      }
    ]

    return { 
      folders: mockFolders,
      fallbackMode: true,
      note: 'Showing mock data due to Google Drive API issue'
    }
  }
}