import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
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

    const { code } = await req.json()
    
    if (!code) {
      throw new Error('Authorization code is required')
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-auth`

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured')
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Token exchange failed:', error)
      throw new Error('Failed to exchange authorization code')
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // Get user profile to identify the admin
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    const profile = await profileResponse.json()
    console.log('Google Drive authorized for:', profile.email)

    // Store tokens securely (in a real app, encrypt these)
    const { error: storeError } = await supabase
      .from('admin_events')
      .insert({
        action: 'google_drive_authorized',
        metadata: {
          user_email: profile.email,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        }
      })

    if (storeError) {
      console.error('Failed to store auth event:', storeError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Google Drive authorized successfully',
        user: profile.email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Google Drive auth error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Authentication failed' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})