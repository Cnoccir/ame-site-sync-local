import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the current user (must be authenticated)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Get current Google OAuth data from user metadata
    const googleOAuth = user.user_metadata?.google_oauth
    if (!googleOAuth || !googleOAuth.refresh_token) {
      throw new Error('No Google OAuth refresh token found. Please re-authenticate.')
    }

    // Get OAuth credentials from environment
    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Missing Google OAuth configuration')
    }

    // Refresh the access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: googleOAuth.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token refresh failed:', errorData)
      
      // If refresh token is invalid, user needs to re-authenticate
      if (tokenResponse.status === 400) {
        throw new Error('Refresh token expired. Please re-authenticate with Google.')
      }
      
      throw new Error(`Token refresh failed: ${tokenResponse.statusText}`)
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()

    // Update tokens in user metadata (preserve existing data)
    const updatedGoogleOAuth = {
      ...googleOAuth,
      access_token: tokens.access_token,
      expires_at: expiresAt,
      scope: tokens.scope || googleOAuth.scope,
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        google_oauth: updatedGoogleOAuth,
      },
    })

    if (updateError) {
      throw new Error(`Failed to update tokens: ${updateError.message}`)
    }

    console.log(`Successfully refreshed Google OAuth token for user ${user.email}`)

    return new Response(JSON.stringify({
      success: true,
      access_token: tokens.access_token,
      expires_at: expiresAt,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('OAuth refresh error:', error)

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      needs_reauth: error instanceof Error && error.message.includes('re-authenticate'),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
