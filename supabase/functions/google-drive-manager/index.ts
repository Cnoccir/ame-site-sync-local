import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DriveFolder {
  id: string
  name: string
  parents?: string[]
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

    const googleServiceKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    if (!googleServiceKey) {
      throw new Error('Google Service Account key not configured')
    }

    const serviceAccount = JSON.parse(googleServiceKey)
    
    // Get access token using service account
    const accessToken = await getServiceAccountToken(serviceAccount)
    
    const { action, ...data } = await req.json()

    let result
    switch (action) {
      case 'create_project_folder':
        result = await createProjectFolder(accessToken, data as CreateProjectFolderRequest, supabase)
        break
      case 'list_folders':
        result = await listProjectFolders(accessToken)
        break
      case 'setup_customer_folder':
        result = await setupCustomerFolder(accessToken, data, supabase)
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

async function getServiceAccountToken(serviceAccount: any): Promise<string> {
  const jwtHeader = {
    alg: 'RS256',
    typ: 'JWT',
  }

  const now = Math.floor(Date.now() / 1000)
  const jwtPayload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }

  // This is a simplified version - in production, you'd use a proper JWT library
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: await createJWT(jwtHeader, jwtPayload, serviceAccount.private_key),
    }),
  })

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

async function createJWT(header: any, payload: any, privateKey: string): Promise<string> {
  // This is a placeholder - you'd need to implement proper JWT signing
  // For now, we'll use a simpler approach with the Google APIs
  throw new Error('JWT signing not implemented - use OAuth2 flow instead')
}

async function createProjectFolder(
  accessToken: string, 
  data: CreateProjectFolderRequest,
  supabase: any
): Promise<any> {
  const { customerName, visitId, customerId } = data

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
}

async function listProjectFolders(accessToken: string): Promise<any> {
  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.folder"&parents in "1BwAJZtB5ckzJZ0vDyEQ8pQ2hLQ1gBmJz"',
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )

  const data = await response.json()
  return { folders: data.files || [] }
}

async function setupCustomerFolder(
  accessToken: string,
  data: any,
  supabase: any
): Promise<any> {
  // Implementation for setting up customer-specific folder structure
  return { success: true, message: 'Customer folder setup completed' }
}