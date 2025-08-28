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
  parentFolderType: string
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
      case 'search_customer_folders':
        result = await searchCustomerFolders(supabase, data.customerName, data.siteAddress)
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
    // Check if user is authenticated and has Google OAuth tokens
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        connected: false,
        message: 'User not authenticated'
      }
    }

    const googleOAuth = user.user_metadata?.google_oauth
    if (!googleOAuth || !googleOAuth.access_token) {
      return {
        connected: false,
        message: 'Google OAuth not configured'
      }
    }

    // Check if token is still valid (not expired)
    const now = new Date()
    const expiresAt = new Date(googleOAuth.expires_at)
    
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
        email: googleOAuth.google_user_info?.email,
        name: googleOAuth.google_user_info?.name
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

async function searchCustomerFolders(
  supabase: any,
  customerName: string,
  siteAddress?: string
): Promise<any> {
  console.log(`Searching Google Drive for folders matching: ${customerName}`)
  
  try {
    // Get access token from authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const googleOAuth = user.user_metadata?.google_oauth
    if (!googleOAuth || !googleOAuth.access_token) {
      throw new Error('No Google OAuth tokens found. Please re-authenticate with Google.')
    }

    const accessToken = googleOAuth.access_token
    const startTime = Date.now()
    
    // Search for folders containing the customer name
    const searchQueries = [
      `name contains '${customerName}'`,
      `name contains '${customerName.split(' ')[0]}'`, // First word search
      `fullText contains '${customerName}'`
    ]
    
    let allResults = []
    
    for (const query of searchQueries) {
      try {
        const searchResponse = await fetch(
          'https://www.googleapis.com/drive/v3/files?' + new URLSearchParams({
            q: `${query} and mimeType='application/vnd.google-apps.folder'`,
            fields: 'files(id,name,parents,createdTime,modifiedTime,webViewLink)',
            pageSize: '50'
          }),
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )

        if (searchResponse.ok) {
          const data = await searchResponse.json()
          allResults.push(...(data.files || []))
        }
      } catch (error) {
        console.error(`Search query failed: ${query}`, error)
      }
    }
    
    // Remove duplicates and process results
    const uniqueResults = allResults.filter((folder, index, self) => 
      index === self.findIndex((f) => f.id === folder.id)
    )
    
    // Score and rank results
    const scoredResults = uniqueResults.map(folder => {
      const name = folder.name.toLowerCase()
      const searchTerm = customerName.toLowerCase()
      
      let matchScore = 0
      let matchType = 'partial'
      let confidence = 'low'
      
      if (name === searchTerm) {
        matchScore = 1.0
        matchType = 'exact'
        confidence = 'high'
      } else if (name.includes(searchTerm)) {
        matchScore = 0.8
        matchType = 'contains'
        confidence = 'medium'
      } else if (searchTerm.split(' ').some(word => name.includes(word))) {
        matchScore = 0.6
        matchType = 'fuzzy'
        confidence = 'medium'
      } else {
        matchScore = 0.3
        confidence = 'low'
      }
      
      return {
        folderId: folder.id,
        folderName: folder.name,
        folderPath: `/Drive/${folder.name}`,
        webViewLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
        matchScore,
        matchType,
        confidence,
        parentFolder: 'Google Drive',
        parentFolderType: 'DRIVE_ROOT',
        lastModified: folder.modifiedTime,
        createdDate: folder.createdTime
      }
    }).sort((a, b) => b.matchScore - a.matchScore)
    
    const searchDuration = Date.now() - startTime
    
    // Generate recommendations
    let recommendedActions = null
    if (scoredResults.length > 0) {
      const primaryFolder = scoredResults[0]
      const alternativeFolders = scoredResults.slice(1, 4)
      
      recommendedActions = {
        action: primaryFolder.confidence === 'high' ? 'use_existing' : 'create_new',
        primaryFolder,
        alternativeFolders,
        reason: primaryFolder.confidence === 'high' 
          ? `Found a high-confidence match for "${customerName}". This appears to be the correct project folder.`
          : `Found ${scoredResults.length} potential matches, but none are high confidence. Consider creating a new structured folder.`
      }
    } else {
      recommendedActions = {
        action: 'create_new',
        reason: `No existing folders found for "${customerName}". Recommend creating a new structured project folder.`
      }
    }
    
    return {
      existingFolders: scoredResults,
      recommendedActions,
      searchDuration,
      totalFoldersScanned: uniqueResults.length
    }
    
  } catch (error) {
    console.error('Google Drive search failed:', error)
    
    // Fallback to mock results when API fails
    const mockResults = [
      {
        folderId: 'mock_fallback',
        folderName: `${customerName} (Fallback)`,
        folderPath: `/Fallback/${customerName}`,
        webViewLink: `https://drive.google.com/drive/folders/mock_fallback`,
        matchScore: 0.5,
        matchType: 'fallback',
        confidence: 'low',
        parentFolder: 'Fallback Mode',
        parentFolderType: 'FALLBACK',
        lastModified: new Date().toISOString()
      }
    ]
    
    return {
      existingFolders: mockResults,
      recommendedActions: {
        action: 'create_new',
        reason: 'Google Drive search is temporarily unavailable. Recommend creating a new folder when service is restored.'
      },
      searchDuration: 100,
      totalFoldersScanned: 0,
      fallbackMode: true
    }
  }
}

async function scanFolderForCustomer(
  supabase: any, 
  { parentFolderId, folderType, searchVariants }: ScanFolderRequest
): Promise<{ matches: CustomerFolderMatch[] }> {
  try {
    console.log(`🔍 Scanning ${folderType} folder for customer variants:`, searchVariants)

    // Get access token from authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User not authenticated:', userError?.message)
      return { matches: [] }
    }

    const googleOAuth = user.user_metadata?.google_oauth
    if (!googleOAuth || !googleOAuth.access_token) {
      console.error('No Google OAuth tokens found')
      return { matches: [] }
    }

    let accessToken = googleOAuth.access_token

    // Check if token needs refresh
    const now = new Date()
    const expiresAt = new Date(googleOAuth.expires_at)

    if (expiresAt <= now) {
      console.error('Token expired')
      return { matches: [] }
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
            parentFolderType: folderType,
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