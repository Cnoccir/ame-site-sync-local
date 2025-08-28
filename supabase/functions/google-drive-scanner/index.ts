import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleAuth } from 'https://esm.sh/google-auth-library@9'
import { google } from 'https://esm.sh/googleapis@128'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CustomerFolderMatch {
  folderId: string;
  folderName: string;
  folderPath: string;
  webViewLink: string;
  matchScore: number;
  matchType: 'exact' | 'fuzzy' | 'contains' | 'alias';
  confidence: 'high' | 'medium' | 'low';
  parentFolder: string;
  yearFolder?: string;
  fileCount?: number;
  lastModified?: string;
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
    console.log(`🔍 Google Drive Scanner action: ${action}`)

    let result
    switch (action) {
      case 'scan_folder_for_customer':
        result = await scanFolderForCustomer(data)
        break
      case 'scan_all_folders':
        result = await scanAllFolders()
        break
      case 'test_connection':
        result = await testConnection()
        break
      default:
        throw new Error('Invalid action specified')
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Google Drive scanner error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/**
 * Initialize Google Drive API with OAuth credentials for raymond@ame-inc.com
 */
async function initializeGoogleDrive() {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN')
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials. Need GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN')
  }

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob' // For installed applications
  )

  // Set the refresh token
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  })

  const drive = google.drive({ version: 'v3', auth: oauth2Client })
  return { drive, auth: oauth2Client }
}

/**
 * Test Google Drive API connection
 */
async function testConnection(): Promise<any> {
  try {
    const { drive } = await initializeGoogleDrive()
    
    // Try to get info about the root drive
    const response = await drive.about.get({
      fields: 'user,storageQuota'
    })

    return {
      success: true,
      message: 'Google Drive API connection successful',
      user: response.data.user?.displayName,
      email: response.data.user?.emailAddress
    }
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      error: error
    }
  }
}

/**
 * Scan a specific folder for customer matches
 */
async function scanFolderForCustomer(params: {
  parentFolderId: string;
  folderType: string;
  searchVariants: string[];
}): Promise<{ matches: CustomerFolderMatch[] }> {
  
  const { parentFolderId, folderType, searchVariants } = params
  console.log(`📂 Scanning ${folderType} for variants:`, searchVariants)

  try {
    const { drive } = await initializeGoogleDrive()
    const matches: CustomerFolderMatch[] = []

    // Get all folders in the parent folder
    const response = await drive.files.list({
      q: `'${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id,name,webViewLink,modifiedTime,parents)',
      pageSize: 1000  // Get up to 1000 folders
    })

    const folders = response.data.files || []
    console.log(`Found ${folders.length} folders in ${folderType}`)

    // Check each folder against search variants
    for (const folder of folders) {
      for (const variant of searchVariants) {
        const matchScore = calculateMatchScore(variant, folder.name || '')
        
        if (matchScore >= 0.4) { // Only include matches above 40%
          const confidence = determineConfidence(matchScore)
          const matchType = determineMatchType(variant, folder.name || '', matchScore)
          
          // Get folder file count (optional, may be slow for large folders)
          let fileCount = 0
          try {
            const fileCountResponse = await drive.files.list({
              q: `'${folder.id}' in parents and trashed=false`,
              fields: 'files(id)',
              pageSize: 1
            })
            // This only gets the first page, so it's approximate
            fileCount = fileCountResponse.data.files?.length || 0
          } catch (error) {
            console.log('Could not get file count for folder:', folder.name)
          }

          matches.push({
            folderId: folder.id || '',
            folderName: folder.name || '',
            folderPath: `${folderType}/${folder.name}`,
            webViewLink: folder.webViewLink || '',
            matchScore,
            matchType,
            confidence,
            parentFolder: folderType,
            fileCount,
            lastModified: folder.modifiedTime || undefined
          })
          
          // Break after first match for this folder to avoid duplicates
          break
        }
      }
    }

    // If this is a year-based folder, also scan one level deeper
    if (folderType.includes('ENGINEERING_')) {
      for (const folder of folders) {
        try {
          const subFolderResponse = await drive.files.list({
            q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id,name,webViewLink,modifiedTime,parents)',
            pageSize: 500
          })

          const subFolders = subFolderResponse.data.files || []
          
          for (const subFolder of subFolders) {
            for (const variant of searchVariants) {
              const matchScore = calculateMatchScore(variant, subFolder.name || '')
              
              if (matchScore >= 0.4) {
                const confidence = determineConfidence(matchScore)
                const matchType = determineMatchType(variant, subFolder.name || '', matchScore)
                
                matches.push({
                  folderId: subFolder.id || '',
                  folderName: subFolder.name || '',
                  folderPath: `${folderType}/${folder.name}/${subFolder.name}`,
                  webViewLink: subFolder.webViewLink || '',
                  matchScore,
                  matchType,
                  confidence,
                  parentFolder: folderType,
                  yearFolder: folder.name,
                  lastModified: subFolder.modifiedTime || undefined
                })
                break
              }
            }
          }
        } catch (error) {
          console.log(`Could not scan subfolder ${folder.name}:`, error.message)
        }
      }
    }

    // Sort matches by score
    matches.sort((a, b) => b.matchScore - a.matchScore)
    
    console.log(`Found ${matches.length} matches in ${folderType}`)
    return { matches }

  } catch (error) {
    console.error(`Error scanning ${folderType}:`, error)
    throw error
  }
}

/**
 * Calculate match score between search term and folder name
 */
function calculateMatchScore(searchTerm: string, folderName: string): number {
  const search = searchTerm.toLowerCase().trim()
  const folder = folderName.toLowerCase().trim()
  
  // Exact match
  if (folder === search) return 1.0
  
  // Contains exact term
  if (folder.includes(search)) return 0.9
  
  // Word-based matching
  const searchWords = search.split(/\s+/)
  const folderWords = folder.split(/\s+/)
  
  let matchingWords = 0
  for (const searchWord of searchWords) {
    if (folderWords.some(fw => 
      fw.includes(searchWord) || 
      searchWord.includes(fw) ||
      fw.startsWith(searchWord) ||
      searchWord.startsWith(fw)
    )) {
      matchingWords++
    }
  }
  
  const wordMatchRatio = matchingWords / searchWords.length
  if (wordMatchRatio >= 0.8) return 0.8
  if (wordMatchRatio >= 0.6) return 0.6
  if (wordMatchRatio >= 0.4) return 0.4
  
  // Fuzzy character matching for abbreviations/acronyms
  if (searchWords.length === 1 && search.length <= 5) {
    // Check if search term might be an acronym
    const acronymMatch = folderWords.some(word => 
      word.toLowerCase().startsWith(search) || 
      extractAcronym(folderWords).toLowerCase().includes(search)
    )
    if (acronymMatch) return 0.7
  }
  
  // Basic character similarity
  return calculateSimilarity(search, folder)
}

/**
 * Extract acronym from words array
 */
function extractAcronym(words: string[]): string {
  return words.map(w => w.charAt(0).toUpperCase()).join('')
}

/**
 * Simple character similarity calculation
 */
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
  
  return Math.min(matches / longer.length, 0.3) // Cap at 0.3 for character similarity
}

/**
 * Determine confidence level based on match score
 */
function determineConfidence(matchScore: number): 'high' | 'medium' | 'low' {
  if (matchScore >= 0.8) return 'high'
  if (matchScore >= 0.6) return 'medium'
  return 'low'
}

/**
 * Determine match type based on how the match was found
 */
function determineMatchType(searchTerm: string, folderName: string, matchScore: number): 'exact' | 'fuzzy' | 'contains' | 'alias' {
  const search = searchTerm.toLowerCase().trim()
  const folder = folderName.toLowerCase().trim()
  
  if (folder === search) return 'exact'
  if (folder.includes(search) || search.includes(folder)) return 'contains'
  if (matchScore >= 0.7) return 'alias' // Likely abbreviation or alternate name
  return 'fuzzy'
}

/**
 * Scan all AME drive folders (admin function)
 */
async function scanAllFolders(): Promise<any> {
  // This would be used for initial indexing - returns folder structure overview
  try {
    const { drive } = await initializeGoogleDrive()
    
    const folderCounts = {}
    const amefolders = {
      'AME Software Site Backups': '0AA0zN0U9WLD6Uk9PVA',
      'Engineering Project Master': '0AHYT5lRT-50cUk9PVA',
      '_2021': '1maB0Nq9V4l05p63DXU9YEIUQlGvjVI0g',
      '_2022': '10uM5VcqEfBqDuHOi9of3Nj0gfGfxo2QU',
      '_2023': '1UjzlUQaleGSedk39ZYxQCTAUhu9TLBrM',
      '_2024': '1kh6bp8m80Lt-GyqBFY2fPMFmFZfhGyMy',
      '_2025': '17t5MFAl1Hr0iZgWfYbu2TJ-WckFZt41K',
      'Service Maintenance Site Remote Access': '0AEG566vw75FqUk9PVA'
    }

    for (const [folderName, folderId] of Object.entries(amefolders)) {
      try {
        const response = await drive.files.list({
          q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id,name)',
          pageSize: 1000
        })
        
        folderCounts[folderName] = response.data.files?.length || 0
        console.log(`${folderName}: ${folderCounts[folderName]} folders`)
      } catch (error) {
        folderCounts[folderName] = `Error: ${error.message}`
      }
    }

    return {
      success: true,
      message: 'Folder scan completed',
      folderCounts,
      totalFolders: Object.values(folderCounts).reduce((sum: number, count) => 
        typeof count === 'number' ? sum + count : sum, 0
      )
    }

  } catch (error) {
    return {
      success: false,
      message: `Scan failed: ${error.message}`,
      error
    }
  }
}
