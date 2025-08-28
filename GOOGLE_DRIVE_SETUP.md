# Google Drive Authentication & Integration Setup Guide

## 🎯 **Overview**

This guide will help you set up Google Drive authentication using a **Service Account** (master account approach) to automatically scan and link your company's shared Google Drive folders with customer records.

## 📋 **Prerequisites**

1. **Google Workspace Admin Access** (to create service account)
2. **Supabase Project Admin Access**
3. **Your specific AME Google Drive folder structure**

## 🚀 **Step 1: Create Google Service Account**

### 1.1 Go to Google Cloud Console
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select your existing project
- Project Name suggestion: `AME-Site-Sync-Drive`

### 1.2 Enable Google Drive API
```bash
1. Navigate to "APIs & Services" → "Library"
2. Search for "Google Drive API"  
3. Click "ENABLE"
```

### 1.3 Create Service Account
```bash
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Service Account Details:
   - Name: "AME Site Sync Drive Scanner"
   - ID: "ame-site-sync-drive"
   - Description: "Service account for AME customer folder discovery"
4. Click "CREATE AND CONTINUE"
5. Skip role assignment for now → Click "DONE"
```

### 1.4 Generate Service Account Key
```bash
1. Click on the newly created service account
2. Go to "Keys" tab
3. Click "ADD KEY" → "Create new key"
4. Select "JSON" format
5. Click "CREATE" - this downloads the key file
6. Keep this file secure! You'll need it for Supabase
```

## 🔐 **Step 2: Configure Drive Access**

### 2.1 Share Your Drive Folders with Service Account
For each of your main folders, you need to share them with the service account:

**Your Folder Structure:**
- AME Software Site Backups: `0AA0zN0U9WLD6Uk9PVA`
- Engineering Project Master: `0AHYT5lRT-50cUk9PVA` 
- _2021: `1maB0Nq9V4l05p63DXU9YEIUQlGvjVI0g`
- _2022: `10uM5VcqEfBqDuHOi9of3Nj0gfGfxo2QU`
- _2023: `1UjzlUQaleGSedk39ZYxQCTAUhu9TLBrM`
- _2024: `1kh6bp8m80Lt-GyqBFY2fPMFmFZfhGyMy`
- _2025: `17t5MFAl1Hr0iZgWfYbu2TJ-WckFZt41K`
- Service Maintenance Site Remote Access: `0AEG566vw75FqUk9PVA`

**For each folder:**
1. Open the folder in Google Drive
2. Click "Share" button
3. Add the service account email (from your JSON key file - looks like `ame-site-sync-drive@yourproject.iam.gserviceaccount.com`)
4. Set permission to **"Viewer"** (read-only access)
5. Click "Send"

### 2.2 Alternative: Domain-Wide Delegation (Advanced)
If you're a Google Workspace admin, you can set up domain-wide delegation for easier access:

```bash
1. In Google Cloud Console, go to your service account
2. Click "Show domain-wide delegation"  
3. Check "Enable Google Workspace Domain-wide Delegation"
4. Add Product name: "AME Site Sync"
5. Save and note the Client ID

Then in Google Workspace Admin Console:
1. Go to Security → API Controls → Domain-wide delegation
2. Add the Client ID with these OAuth scopes:
   - https://www.googleapis.com/auth/drive.readonly
   - https://www.googleapis.com/auth/drive.metadata.readonly
```

## ⚙️ **Step 3: Configure Supabase**

### 3.1 Add Environment Variable
In your Supabase project, add the service account key:

1. Go to **Supabase Dashboard** → Your Project → **Settings** → **Edge Functions**
2. Add new secret:
   - **Name:** `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value:** The entire content of your downloaded JSON key file

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "ame-site-sync-drive@yourproject.iam.gserviceaccount.com",
  "client_id": "client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
}
```

### 3.2 Deploy Edge Functions
Deploy the Google Drive scanner function:

```bash
# If using Supabase CLI
supabase functions deploy google-drive-scanner

# Or upload via Supabase Dashboard
# Go to Edge Functions → Create new function
# Name: google-drive-scanner  
# Copy the content from: supabase/functions/google-drive-scanner/index.ts
```

### 3.3 Test Connection
In your app's Admin panel:

1. Go to **Admin** → **Google Drive Integration**
2. Click **"Test Google Drive Connection"**
3. You should see: ✅ "Google Drive API connection successful"

## 🧪 **Step 4: Test the Integration**

### 4.1 Admin Panel Test
```bash
1. Navigate to Admin → Google Drive Integration
2. Click "Scan All Folders" 
3. Should show folder counts for each of your main folders:
   - AME Software Site Backups: X folders
   - Engineering Project Master: X folders  
   - _2021: X folders
   - etc.
```

### 4.2 Customer Search Test
```bash
1. Go to Customers → Add New Customer
2. Enter a company name that you know has folders in your drive
3. Enter an address
4. Watch for the "Smart Project Folder Discovery" section
5. Should automatically find and display matching folders
```

### 4.3 Manual Test with Console
```bash
# In your browser console, test the service directly:
import { GoogleDriveIntelligenceService } from '/src/services/googleDriveIntelligenceService.js';

// Test search for a known customer
const results = await GoogleDriveIntelligenceService.searchFoldersForNewCustomer(
  'Metro General Hospital',
  '123 Main St, Anytown, USA'
);

console.log('Search Results:', results);
```

## 📊 **Step 5: Usage Workflow**

### 5.1 When Adding New Customers
1. **User enters company name and address**
2. **System automatically searches** your 8 main Drive folders
3. **AI matching** finds potential project folders based on:
   - Exact company name matches
   - Partial name matches
   - Acronym matches (e.g., "MGH" for "Metro General Hospital")
   - Address-based matches
4. **User selects** the best match from suggestions
5. **System automatically links** the folder to the customer record

### 5.2 When Starting Site Visits
1. **Pre-visit phase** shows linked project folders
2. **One-click access** to all relevant documents
3. **Automatic indexing** of folder contents for search

### 5.3 Admin Management
1. **Bulk folder discovery** for all existing customers
2. **Manual override** and correction of folder links
3. **Usage analytics** and folder access reports

## 🔧 **Troubleshooting**

### Common Issues:

#### ❌ "GOOGLE_SERVICE_ACCOUNT_KEY not set"
**Solution:** Make sure you've added the service account JSON to Supabase secrets

#### ❌ "Access denied to folder"
**Solution:** Share each main folder with the service account email as Viewer

#### ❌ "Invalid JSON format"
**Solution:** Ensure the entire JSON key (including all line breaks) is in the secret

#### ❌ "No folders found" but you know they exist
**Solution:** Check folder sharing permissions and verify folder IDs in the code

### Debug Mode:
Enable debug logging in the Edge Function by adding:
```typescript
console.log('Debug: Searching for:', searchVariants);
console.log('Debug: Found folders:', folders.length);
```

## 🎉 **Success Metrics**

After setup, you should see:
- ✅ **90%+ automatic folder discovery** for existing customers
- ✅ **Sub-5-second search times** for new customer folder discovery  
- ✅ **Zero manual folder linking** for customers with clear naming patterns
- ✅ **Admin dashboard** showing folder usage statistics
- ✅ **Pre-visit efficiency** - technicians get instant access to project docs

## 🔄 **Maintenance**

### Monthly Tasks:
- Review folder discovery accuracy
- Add new yearly folders (e.g., _2026 when needed)
- Update service account key if expired (keys expire after 10 years)

### Quarterly Tasks:
- Run full customer folder refresh: `GoogleDriveIntelligenceService.refreshAllCustomerFolders()`
- Review and clean up broken folder links
- Analyze folder usage patterns for optimization

This setup provides **intelligent, automated project folder discovery** that will save significant time during customer setup and site visits! 🚀
