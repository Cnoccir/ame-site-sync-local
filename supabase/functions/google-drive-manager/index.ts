import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
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
  accessToken: string
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

    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')

    console.log('Google Client ID exists:', !!clientId)
    console.log('Google Client Secret exists:', !!clientSecret)

    if (!clientId || !clientSecret) {
      console.error('Missing Google OAuth credentials')
      console.error('Available env vars:', Object.keys(Deno.env.toObject()).filter(key => key.includes('GOOGLE')))
      throw new Error('Google OAuth credentials not configured. Please add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET to Supabase secrets.')
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
    console.error('Error stack:', error.stack)
    console.error('Error details:', JSON.stringify(error))
    
    // Return more detailed error information
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
        type: error.name
      }),
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

  // OAuth exchange function stores tokens under 'google_oauth'
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
    
    // Throw error instead of creating mock data
    throw new Error(`Google Drive folder creation failed: ${error.message}`)
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
  const { customerName, customerData, parentFolderId, folderName, year, accessToken } = data

  console.log(`Creating structured project folder: ${folderName} in parent ${parentFolderId}`)
  console.log('Access token provided:', !!accessToken)
  console.log('Access token length:', accessToken?.length || 0)
  
  try {
    // Use the access token passed from the client
    if (!accessToken) {
      console.error('No access token provided')
      throw new Error('Access token is required for folder creation')
    }
    
    // Test access token first with a simple request
    console.log('Testing access token with Google Drive API...')
    const testResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('Access token test failed:', testResponse.status, errorText)
      throw new Error(`Invalid access token: ${testResponse.status} - ${errorText}`)
    }
    
    const userInfo = await testResponse.json()
    console.log('Access token valid for user:', userInfo.user?.emailAddress)
    
    // First, verify the parent folder exists and we have access
    let finalParentId = parentFolderId
    if (parentFolderId) {
      console.log('Verifying parent folder access:', parentFolderId)
      const checkParentResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${parentFolderId}?fields=id,name`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      
      if (!checkParentResponse.ok) {
        const errorText = await checkParentResponse.text()
        console.error('Parent folder not accessible:', checkParentResponse.status, errorText)
        
        // Try to find or create the year folder in the root of My Drive
        console.log('Creating year folder in root of My Drive as fallback')
        const yearFolderName = `AME Engineering ${year}`
        
        // Search for existing year folder
        const searchResponse = await fetch(`https://www.googleapis.com/drive/v3/files?` + new URLSearchParams({
          q: `name='${yearFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id,name)',
          pageSize: '1'
        }), {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          if (searchData.files && searchData.files.length > 0) {
            finalParentId = searchData.files[0].id
            console.log('Using existing year folder:', finalParentId)
          } else {
            // Create the year folder
            const createYearFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: yearFolderName,
                mimeType: 'application/vnd.google-apps.folder',
                // No parent means it goes to root of My Drive
              }),
            })
            
            if (createYearFolderResponse.ok) {
              const yearFolder = await createYearFolderResponse.json()
              finalParentId = yearFolder.id
              console.log('Created new year folder:', finalParentId)
            } else {
              // Last resort: use root
              finalParentId = null
              console.log('Using root of My Drive as fallback')
            }
          }
        } else {
          finalParentId = null
          console.log('Using root of My Drive as fallback')
        }
      } else {
        const parentData = await checkParentResponse.json()
        console.log('Parent folder verified:', parentData.name)
      }
    }
    
    // Create main project folder
    console.log('Creating main folder:', folderName, 'in parent:', finalParentId || 'root')
    const createFolderBody: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }
    
    // Only add parents if we have a valid parent ID
    if (finalParentId) {
      createFolderBody.parents = [finalParentId]
    }
    
    const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createFolderBody),
    })

    if (!createFolderResponse.ok) {
      const errorText = await createFolderResponse.text()
      console.error('Folder creation failed:', createFolderResponse.status, errorText)
      throw new Error(`Failed to create main folder: ${createFolderResponse.status} - ${errorText}`)
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
  '- **' + name + '**: For ' + getFolderDescription(key)
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
    throw error; // Don't fallback to mock data, let the error propagate
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
    
    // Throw error instead of returning mock data
    throw new Error(`Google Drive folder listing failed: ${error.message}`)
  }
}