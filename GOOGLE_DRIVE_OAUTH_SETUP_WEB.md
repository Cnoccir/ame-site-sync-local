# Google Drive OAuth Setup Guide (Web Application)

This guide explains how to set up Google OAuth 2.0 authentication for the AME Site Sync Local web application to access Google Drive folders.

## Prerequisites

- Access to Google Cloud Console
- Admin access to your Supabase project
- Google account with access to the required AME Inc. Google Drive folders

## Step 1: Create Google Cloud Project & OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google Drive API:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Drive API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Name: "AME Site Sync Local"
   
5. Configure authorized redirect URIs:
   ```
   http://localhost:8080/google/callback
   https://pm.ame-techassist.com/google/callback
   ```

6. Save the credentials and note down:
   - Client ID
   - Client Secret

## Step 2: Configure Supabase Environment Variables

Add these secrets in your Supabase project dashboard under "Settings" → "API" → "Environment Variables":

```
GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/google/callback
```

For production, update the redirect URI:
```
GOOGLE_OAUTH_REDIRECT_URI=https://pm.ame-techassist.com/google/callback
```

## Step 3: Deploy Supabase Edge Functions

Deploy the OAuth-related edge functions:

```bash
# Deploy OAuth token exchange function
supabase functions deploy google-oauth-exchange

# Deploy OAuth token refresh function  
supabase functions deploy google-oauth-refresh

# Deploy updated Google Drive scanner function
supabase functions deploy google-drive-scanner
```

## Step 4: Configure Frontend Environment

Add these variables to your `.env.local` file:

```
VITE_GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
VITE_GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/google/callback
```

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Admin panel → Google OAuth tab

3. Click "Authenticate with Google"

4. You should be redirected to Google's OAuth consent screen

5. After authorization, you'll be redirected back to your app with success confirmation

6. Test Drive access using the "Test Drive Access" button

## OAuth Flow Architecture

### Frontend (React)
- `GoogleOAuthService` manages the OAuth flow
- `GoogleCallback` component handles OAuth callback
- OAuth test panel in Admin section for testing

### Backend (Supabase Edge Functions)
- `google-oauth-exchange` - exchanges authorization code for tokens
- `google-oauth-refresh` - refreshes expired access tokens
- `google-drive-scanner` - uses OAuth tokens to access Drive API

### Token Storage
- Access tokens stored in user metadata in Supabase Auth
- Refresh tokens securely stored for automatic token renewal
- Tokens automatically refreshed when expired

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure the redirect URI in Google Cloud Console exactly matches your app's callback URL
- Check both development and production URLs are configured

### "unauthorized_client" Error  
- Verify the client ID and secret are correctly set in Supabase environment variables
- Ensure the OAuth consent screen is configured in Google Cloud Console

### "access_denied" Error
- The user cancelled the OAuth flow or doesn't have access to required Drive folders
- Ensure the Google account has access to AME Inc. shared drives

### Token Refresh Issues
- Check that refresh tokens are being stored properly
- Verify the `google-oauth-refresh` edge function is deployed

### Drive API Access Issues
- Ensure Google Drive API is enabled in Google Cloud Console
- Check that OAuth scopes include `https://www.googleapis.com/auth/drive.readonly`
- Verify the authenticated user has access to the target folders

## OAuth Scopes Used

The application requests these OAuth scopes:
- `https://www.googleapis.com/auth/drive.readonly` - Read access to Google Drive
- `https://www.googleapis.com/auth/userinfo.profile` - User profile information
- `https://www.googleapis.com/auth/userinfo.email` - User email address

## Security Notes

- Client secrets are stored securely in Supabase environment variables
- Access tokens are stored in user metadata and expire after 1 hour
- Refresh tokens enable automatic token renewal without re-authentication
- All OAuth flows happen server-side through Supabase Edge Functions

## Next Steps

Once OAuth is working:
1. Test the intelligent folder discovery in the customer form
2. Verify that folder scanning works with your specific Drive folder structure
3. Configure any additional OAuth scopes if needed for your use case
