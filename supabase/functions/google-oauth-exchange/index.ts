import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

interface TokenExchangeRequest {
  authorizationCode: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

interface UserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture?: string;
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

    const requestBody = await req.json()
    const authorizationCode = requestBody.authorizationCode || requestBody.code

    if (!authorizationCode) {
      throw new Error('Authorization code is required')
    }

    // Get OAuth credentials from environment
    const clientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')
    const redirectUri = Deno.env.get('GOOGLE_OAUTH_REDIRECT_URI')

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing Google OAuth configuration')
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('Token exchange failed:', errorData)
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`)
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info')
    }

    const userInfo: UserInfo = await userInfoResponse.json()

    // Test Drive API access
    const driveTestResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!driveTestResponse.ok) {
      throw new Error('Failed to access Google Drive API')
    }

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000)).toISOString()

    // Store tokens and user info in user metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        google_oauth: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          scope: tokens.scope,
          google_user_info: {
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            verified_email: userInfo.verified_email,
          },
        },
      },
    })

    if (updateError) {
      throw new Error(`Failed to store tokens: ${updateError.message}`)
    }

    console.log(`Successfully authenticated Google OAuth for user ${user.email} (Google: ${userInfo.email})`)

    return new Response(JSON.stringify({
      success: true,
      access_token: tokens.access_token,
      expires_at: expiresAt,
      user_info: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified_email: userInfo.verified_email,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('OAuth exchange error:', error)

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
