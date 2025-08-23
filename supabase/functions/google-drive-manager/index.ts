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
  // Simple test to validate credentials exist
  return {
    success: true,
    message: 'Google OAuth credentials are configured',
    clientIdPrefix: clientId.substring(0, 10) + '...',
    hasSecret: !!clientSecret
  }
}

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  // For service account access, we need a different approach
  // This is a simplified version - you'll need to implement proper OAuth2 flow
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://www.googleapis.com/auth/drive',
    }),
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    console.error('Token request failed:', error)
    throw new Error('Failed to get access token. Please verify your Google OAuth2 credentials.')
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

async function createProjectFolder(
  clientId: string,
  clientSecret: string,
  data: CreateProjectFolderRequest,
  supabase: any
): Promise<any> {
  const { customerName, visitId, customerId } = data

  try {
    const accessToken = await getAccessToken(clientId, clientSecret)

    // Create main project folder
    const folderName = `${customerName} - Visit ${visitId}`
    const folderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['1BwAJZtB5ckzJZ0vDyEQ8pQ2hLQ1gBmJz'], // Root AME folder
      }),
    })

    if (!folderResponse.ok) {
      const error = await folderResponse.text()
      throw new Error(`Failed to create folder: ${error}`)
    }

    const folder = await folderResponse.json()

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
          parents: [folder.id],
        }),
      })
      
      const subfolder = await subfolderResponse.json()
      subfolderIds[subfolderName] = subfolder.id
    }

    // Update customer record with folder information
    const { error } = await supabase
      .from('ame_customers')
      .update({
        drive_folder_id: folder.id,
        drive_folder_url: `https://drive.google.com/drive/folders/${folder.id}`,
      })
      .eq('id', customerId)

    if (error) {
      console.error('Failed to update customer folder info:', error)
    }

    return {
      success: true,
      folderId: folder.id,
      folderUrl: `https://drive.google.com/drive/folders/${folder.id}`,
      subfolders: subfolderIds,
    }

  } catch (error) {
    console.error('Error creating project folder:', error)
    throw new Error(`Failed to create project folder: ${error.message}`)
  }
}

async function listProjectFolders(clientId: string, clientSecret: string): Promise<any> {
  try {
    const accessToken = await getAccessToken(clientId, clientSecret)
    
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.folder"&parents in "1BwAJZtB5ckzJZ0vDyEQ8pQ2hLQ1gBmJz"',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to list folders: ${error}`)
    }

    const data = await response.json()
    return { folders: data.files || [] }

  } catch (error) {
    console.error('Error listing folders:', error)
    throw new Error(`Failed to list folders: ${error.message}`)
  }
}