# Google Drive OAuth Setup - Using Your Personal Account

## 🎯 **Overview**

Instead of a service account, we'll use your personal Google account `raymond@ame-inc.com` which already has access to all the company folders. This is simpler and more secure since you already have the necessary permissions.

## 🚀 **Step 1: Create Google OAuth Application**

### 1.1 Go to Google Cloud Console
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project: `AME-Site-Sync-OAuth`

### 1.2 Enable Google Drive API
```bash
1. Navigate to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click "ENABLE"
```

### 1.3 Configure OAuth Consent Screen
```bash
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "Internal" (if you have Google Workspace) or "External"
3. Fill in the required information:
   - App name: "AME Site Sync"
   - User support email: raymond@ame-inc.com
   - Developer contact: raymond@ame-inc.com
4. Add scopes:
   - https://www.googleapis.com/auth/drive.readonly
   - https://www.googleapis.com/auth/drive.metadata.readonly
5. Save and continue
```

### 1.4 Create OAuth Credentials
```bash
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Application type: "Web application"
4. Name: "AME Site Sync Web App"
5. Add Authorized redirect URIs:
   - http://localhost:8080/auth/google/callback
   - http://localhost:3000/auth/google/callback
   - https://your-production-domain.com/auth/google/callback
6. Click "CREATE"
7. Note down the Client ID and Client Secret
```

## 🔐 **Step 2: Get Your Refresh Token**

### 2.1 Install Google API Client (one-time setup)
Open PowerShell and run:
```powershell
# Install Python if you don't have it
# Then install the Google client library
pip install google-auth google-auth-oauthlib google-api-python-client
```

### 2.2 Create Token Generator Script
Create a file `get_refresh_token.py`:
```python
#!/usr/bin/env python3
from google_auth_oauthlib.flow import InstalledAppFlow
import json

# Your OAuth credentials from Google Cloud Console
CLIENT_ID = "your-client-id-here.googleusercontent.com"
CLIENT_SECRET = "your-client-secret-here"

# Scopes for Google Drive read access
SCOPES = [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly'
]

def get_refresh_token():
    # Create credentials for OAuth flow
    credentials_info = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token"
    }
    
    # Create the flow
    flow = InstalledAppFlow.from_client_config(
        {"installed": credentials_info}, 
        SCOPES
    )
    
    # Run the OAuth flow
    print("🔓 Starting OAuth flow...")
    print("📧 Make sure to sign in with: raymond@ame-inc.com")
    
    # This will open your browser for authorization
    creds = flow.run_local_server(port=0)
    
    print("✅ Success! Here are your tokens:")
    print(f"🔑 CLIENT_ID: {CLIENT_ID}")
    print(f"🔒 CLIENT_SECRET: {CLIENT_SECRET}")
    print(f"🔄 REFRESH_TOKEN: {creds.refresh_token}")
    print("\n📋 Add these to your Supabase environment variables!")
    
    return {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'refresh_token': creds.refresh_token
    }

if __name__ == '__main__':
    get_refresh_token()
```

### 2.3 Run the Script
```powershell
# Update the CLIENT_ID and CLIENT_SECRET in the script
# Then run:
python get_refresh_token.py
```

This will:
1. **Open your browser** 
2. **Prompt you to sign in** with `raymond@ame-inc.com`
3. **Ask for permissions** to read Google Drive
4. **Return your refresh token**

## ⚙️ **Step 3: Configure Supabase**

### 3.1 Add Environment Variables
In your Supabase project, add these secrets:

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **Edge Functions**
2. Add these secrets:

```bash
GOOGLE_CLIENT_ID = "your-client-id.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "your-client-secret"  
GOOGLE_REFRESH_TOKEN = "your-refresh-token-from-step-2"
```

### 3.2 Deploy Updated Edge Function
```bash
# Deploy the updated function
supabase functions deploy google-drive-scanner

# Or upload manually via Supabase Dashboard
```

### 3.3 Test Connection
1. Go to **Admin** → **Google Drive Integration**
2. Click **"Test Google Drive Connection"**
3. Should show: ✅ "Google Drive API connection successful"
4. Should show your email: `raymond@ame-inc.com`

## 🧪 **Step 4: Test the Integration**

### 4.1 Test Folder Access
```bash
1. Admin Panel → "Scan All Folders"
2. Should show counts for all your AME folders:
   - AME Software Site Backups: X folders
   - Engineering Project Master: X folders
   - _2021: X folders
   - _2022: X folders
   - etc.
```

### 4.2 Test Customer Discovery
```bash
1. Customers → "Add New Customer"
2. Enter: "New York Center Management"
3. Enter address: "123 Main St, New York, NY"
4. Should automatically search and find matching folders
```

## 🎉 **Benefits of This Approach**

### ✅ **Simpler Setup**
- No need to share folders with service account
- Uses your existing permissions
- Familiar OAuth flow

### ✅ **More Secure**
- Uses OAuth 2.0 industry standard
- Refresh tokens automatically get new access tokens
- Can revoke access anytime from your Google account

### ✅ **Better Maintenance**
- No service account keys to manage
- Uses your existing Google Workspace access
- Easier to troubleshoot (shows as your account in Drive activity)

## 🔧 **Troubleshooting**

### ❌ "Invalid client credentials"
**Solution:** Double-check CLIENT_ID and CLIENT_SECRET in Supabase

### ❌ "Invalid refresh token"
**Solution:** Re-run the `get_refresh_token.py` script to get a new token

### ❌ "Access denied"
**Solution:** Make sure you signed in with `raymond@ame-inc.com` during OAuth flow

### ❌ "Scope not authorized"
**Solution:** Make sure you added the Drive scopes in the OAuth consent screen

## 🔄 **Token Refresh**

The system automatically refreshes access tokens using the refresh token. Refresh tokens typically last indefinitely unless:
- You change your Google password
- You revoke the app's access
- 6 months of inactivity (for external apps)

If you need to refresh, just re-run the `get_refresh_token.py` script and update the Supabase secret.

## 📱 **Quick Setup Summary**

1. **Create Google OAuth app** (5 minutes)
2. **Run Python script** to get refresh token (2 minutes)  
3. **Add 3 secrets to Supabase** (1 minute)
4. **Deploy edge function** (1 minute)
5. **Test connection** (30 seconds)

**Total setup time: ~10 minutes** ⏱️

This approach is much simpler than service accounts and works immediately with your existing folder permissions! 🚀
