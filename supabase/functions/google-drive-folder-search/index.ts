import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScanFolderRequest {
  parentFolderId: string
  folderType: string
  searchVariants: string[]
}

interface CustomerFolderMatch {
  folderId: string
  folderName: string
  folderPath: string
  webViewLink: string
  matchScore: number
  matchType: 'exact' | 'fuzzy' | 'contains' | 'alias'
  confidence: 'high' | 'medium' | 'low'
  parentFolder: string
  yearFolder?: string
  fileCount?: number
  lastModified?: string
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

    const { action, ...data } = await req.json()

    let result
    switch (action) {
      case 'scan_folder_for_customer':
        result = await scanFolderForCustomer(supabase, data as ScanFolderRequest)
        break
      case 'check_oauth_status':
        result = await checkOAuthStatus(supabase)
        break
      default:
        throw new Error('Invalid action specified')
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Google Drive folder search error:', error)
    
    // Return a graceful error response that won't break the client
    const errorResponse = {
      matches: [],
      error: 'Service temporarily unavailable',
      detail: error.message,
      timestamp: new Date().toISOString()
    }
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 200, // Return 200 instead of 400 to avoid fetch errors
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function checkOAuthStatus(supabase: any): Promise<any> {
  try {
    // Check if we have OAuth credentials stored
    const { data: oauthData, error } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error || !oauthData) {
      return {
        connected: false,
        message: 'Google OAuth not configured'
      }
    }

    // Check if token is still valid (not expired)
    const now = new Date()
    const expiresAt = new Date(oauthData.expires_at)
    
    if (expiresAt <= now) {
      return {
        connected: false,
        message: 'OAuth token expired, refresh required'
      }
    }

    return {
      connected: true,
      message: 'Google Drive access confirmed',
      user: {
        email: oauthData.user_email,
        name: oauthData.user_name
      }
    }

  } catch (error) {
    console.error('Error checking OAuth status:', error)
    return {
      connected: false,
      message: 'Error checking OAuth status'
    }
  }
}

async function scanFolderForCustomer(
  supabase: any, 
  { parentFolderId, folderType, searchVariants }: ScanFolderRequest
): Promise<{ matches: CustomerFolderMatch[] }> {
  try {
    console.log(`🔍 Scanning ${folderType} folder for customer variants:`, searchVariants)

    // Get valid OAuth token
    const { data: oauthData, error: oauthError } = await supabase
      .from('google_oauth_tokens')
      .select('*')
      .eq('is_active', true)
      .single()

    if (oauthError || !oauthData) {
      console.error('OAuth setup required:', oauthError?.message)
      // Return empty results instead of throwing error
      return { matches: [] }
    }

    // Check if token needs refresh
    const now = new Date()
    const expiresAt = new Date(oauthData.expires_at)
    let accessToken = oauthData.access_token

    if (expiresAt <= now) {
      // Token expired, try to refresh
      try {
        accessToken = await refreshAccessToken(supabase, oauthData)
      } catch (error) {
        console.error('Token refresh failed:', error)
        // Return empty results if refresh fails
        return { matches: [] }
      }
    }

    // Search for folders in the parent folder
    const folders = await listFoldersInParent(accessToken, parentFolderId)
    
    // Find matches based on search variants
    const matches: CustomerFolderMatch[] = []
    
    for (const folder of folders) {
      for (const variant of searchVariants) {
        const matchScore = calculateMatchScore(variant, folder.name)
        
        if (matchScore > 0.3) { // Only include decent matches
          const confidence = getConfidenceLevel(matchScore)
          const matchType = getMatchType(variant, folder.name, matchScore)
          
          matches.push({
            folderId: folder.id,
            folderName: folder.name,
            folderPath: `${folderType}/${folder.name}`,
            webViewLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
            matchScore,
            matchType,
            confidence,
            parentFolder: folderType,
            lastModified: folder.modifiedTime,
            fileCount: 0 // We'll skip file counting for performance
          })
        }
      }
    }

    // Remove duplicates and sort by score
    const uniqueMatches = removeDuplicateMatches(matches)
      .sort((a, b) => b.matchScore - a.matchScore)

    console.log(`📊 Found ${uniqueMatches.length} matches in ${folderType}`)

    return { matches: uniqueMatches }

  } catch (error) {
    console.error(`Failed to scan ${folderType}:`, error)
    return { matches: [] }
  }
}

async function refreshAccessToken(supabase: any, oauthData: any): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: oauthData.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh access token')
  }

  const tokenData = await response.json()
  const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

  // Update the token in the database
  await supabase
    .from('google_oauth_tokens')
    .update({
      access_token: tokenData.access_token,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', oauthData.id)

  return tokenData.access_token
}

async function listFoldersInParent(accessToken: string, parentFolderId: string): Promise<any[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder'&fields=files(id,name,webViewLink,modifiedTime)&pageSize=1000`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Drive API error:', response.status, errorText)
      throw new Error(`Google Drive API error: ${response.status}`)
    }

    const data = await response.json()
    return data.files || []

  } catch (error) {
    console.error('Error listing folders:', error)
    throw error
  }
}

function calculateMatchScore(searchTerm: string, folderName: string): number {
  const search = searchTerm.toLowerCase().trim()
  const folder = folderName.toLowerCase().trim()
  
  // Exact match
  if (folder === search) return 1.0
  
  // Contains exact term
  if (folder.includes(search)) return 0.9
  
  // Word boundary match
  const searchWords = search.split(/\s+/)
  const folderWords = folder.split(/\s+/)
  
  let matchingWords = 0
  for (const searchWord of searchWords) {
    if (folderWords.some(fw => fw.includes(searchWord))) {
      matchingWords++
    }
  }
  
  const wordMatchRatio = matchingWords / searchWords.length
  if (wordMatchRatio >= 0.8) return 0.8
  if (wordMatchRatio >= 0.6) return 0.6
  if (wordMatchRatio >= 0.4) return 0.4
  
  // Character similarity
  return calculateSimilarity(search, folder)
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  let matches = 0
  for (let i = 0; i < shorter.length; i++) {
    if (longer.includes(shorter[i])) {
      matches++
    }
  }
  
  return matches / longer.length
}

function getConfidenceLevel(matchScore: number): 'high' | 'medium' | 'low' {
  if (matchScore >= 0.8) return 'high'
  if (matchScore >= 0.5) return 'medium'
  return 'low'
}

function getMatchType(searchTerm: string, folderName: string, matchScore: number): 'exact' | 'fuzzy' | 'contains' | 'alias' {
  const search = searchTerm.toLowerCase().trim()
  const folder = folderName.toLowerCase().trim()
  
  if (folder === search) return 'exact'
  if (folder.includes(search)) return 'contains'
  if (matchScore >= 0.7) return 'alias'
  return 'fuzzy'
}

function removeDuplicateMatches(matches: CustomerFolderMatch[]): CustomerFolderMatch[] {
  const seen = new Set<string>()
  return matches.filter(match => {
    const key = `${match.folderId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
