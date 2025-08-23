import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const fileId = url.searchParams.get('fileId')
    
    if (!fileId) {
      return new Response(
        JSON.stringify({ error: 'Missing fileId parameter' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Use the direct Google Drive download URL
    const driveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    
    console.log(`Downloading CSV from: ${driveUrl}`)
    
    // Fetch the CSV data from Google Drive
    const response = await fetch(driveUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CSV-Proxy/1.0)',
      },
    })

    if (!response.ok) {
      console.error(`Google Drive API returned ${response.status}: ${response.statusText}`)
      return new Response(
        JSON.stringify({ 
          error: `Failed to download file: ${response.status} ${response.statusText}` 
        }), 
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const csvData = await response.text()
    
    console.log(`Successfully downloaded ${csvData.length} characters of CSV data`)
    
    return new Response(csvData, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
      },
    })

  } catch (error) {
    console.error('Error in google-drive-csv-proxy:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})