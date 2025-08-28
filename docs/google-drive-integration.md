# Google Drive Integration Guide

## Overview

The AME Site Sync Google Drive integration provides seamless access to customer documents stored in Google Drive. This phase 7 implementation includes folder management, document indexing, and intelligent search capabilities.

## Features

- **Folder Management**: Link customer folders to their Google Drive locations
- **Document Indexing**: Index files for fast searching with metadata storage
- **Full-Text Search**: Search documents by content, name, and metadata
- **Admin Panel**: Configure and manage Google Drive settings
- **Year-Based Filtering**: Limit searches to recent files (last 4 years)
- **Progress Tracking**: Monitor indexing progress with real-time updates

## Prerequisites

### Google Cloud Console Setup

1. **Create a Google Cloud Project**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing project
   - Enable the Google Drive API

2. **Create OAuth 2.0 Credentials**
   - Go to "Credentials" in the API & Services section
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Select "Web application" as application type
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback` (for development)
     - `https://yourdomain.com/auth/google/callback` (for production)

3. **Create API Key (Optional)**
   - Click "Create Credentials" → "API Key"
   - Restrict the key to Google Drive API for security

### Required Scopes

The integration requires these Google Drive API scopes:

```javascript
const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.file'
];
```

## Installation & Configuration

### 1. Install Dependencies

```bash
npm install googleapis @google-cloud/storage dotenv
```

### 2. Environment Variables

Add these to your `.env.local` file:

```bash
# Google Drive API Configuration
GOOGLE_DRIVE_CLIENT_ID=your_oauth_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_oauth_client_secret
GOOGLE_DRIVE_API_KEY=your_api_key_optional
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Supabase Configuration (should already exist)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Migration

Run the database migration to create necessary tables:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually via Supabase Dashboard
# Upload the file: supabase/migrations/20240827_google_drive_integration.sql
```

### 4. Admin Configuration

1. Navigate to the **Admin Panel** → **Google Drive Settings**
2. Click **"Test Google Drive Connection"**
3. Complete OAuth flow to authorize access
4. Configure folder mappings for customers

## Usage

### Admin Panel Features

#### Configuration Tab
- **Test Connection**: Verify Google Drive API connectivity
- **OAuth Setup**: Complete authorization flow
- **API Status**: Check current authentication status

#### Folder Management Tab
- **Link Folders**: Associate customer accounts with Google Drive folders
- **View Mappings**: See all customer-folder associations
- **Remove Mappings**: Unlink folders when no longer needed

#### Indexing Status Tab
- **Start Indexing**: Begin indexing process for customer folders
- **Progress Tracking**: Real-time progress bars and file counts
- **Index Status**: View last indexed timestamps and file counts

### Customer Integration

The Google Drive integration automatically appears in customer profiles when folders are mapped:

- **Document Search**: Search within customer's drive folder
- **Recent Files**: Quick access to recently modified documents  
- **File Preview**: Thumbnail and metadata preview
- **Direct Access**: Links open files directly in Google Drive

## API Reference

### GoogleDriveService Methods

#### Configuration
```javascript
// Initialize service
const driveService = new GoogleDriveService();
await driveService.initializeFromSettings();

// Test connectivity
const isConnected = await driveService.testConnection();
```

#### Folder Management
```javascript
// Get customer folders
const folders = await driveService.getCustomerFolders(customerId);

// Link folder to customer
await driveService.linkCustomerFolder(customerId, folderId, folderName);

// Remove folder mapping
await driveService.removeCustomerFolder(customerId, folderId);
```

#### File Indexing
```javascript
// Index folder with progress tracking
await driveService.indexFolder(folderId, (progress) => {
  console.log(`Progress: ${progress.processed}/${progress.total}`);
});

// Search indexed files
const results = await driveService.searchFiles({
  query: 'maintenance report',
  customerId: 'uuid',
  yearFilter: 2023
});
```

### Database Functions

#### Full-Text Search
```sql
-- Search files with filtering
SELECT * FROM search_drive_files(
  'maintenance report',           -- search query
  ARRAY['folder_id_1'],          -- folder IDs filter
  ARRAY['application/pdf'],       -- file type filter  
  2023,                          -- year filter
  25                             -- max results
);
```

#### Customer Statistics
```sql
-- Get folder statistics for customer
SELECT * FROM get_customer_folder_stats('customer_uuid');
-- Returns: folder_count, total_files, last_indexed
```

## Security Considerations

### OAuth Token Management
- Refresh tokens are automatically managed
- Tokens are encrypted in the database
- Access tokens expire after 1 hour and refresh automatically

### Data Protection
- All sensitive settings marked as encrypted
- Row Level Security (RLS) enabled on all tables
- Admin-only access to system configuration

### File Access
- Read-only access to customer folders
- No modification or deletion capabilities
- Respects Google Drive sharing permissions

## Performance Optimization

### Indexing Strategy
- **Incremental Indexing**: Only index new/modified files
- **Batch Processing**: Process files in batches of 100
- **Year Filtering**: Limit to last 4 years to reduce dataset
- **Progress Tracking**: Real-time progress updates

### Search Performance
- **Full-text indexing** with PostgreSQL `tsvector`
- **GIN indexes** on search vectors and metadata
- **Relevance scoring** with `ts_rank`
- **Result limiting** with configurable max results

### Caching
```javascript
// File metadata caching (24 hours)
const cacheKey = `drive_file_${fileId}`;
const cachedFile = await cache.get(cacheKey);

if (!cachedFile) {
  const file = await drive.files.get({ fileId });
  await cache.set(cacheKey, file, { ttl: 86400 });
}
```

## Troubleshooting

### Common Issues

#### OAuth Authorization Failed
```
Error: invalid_grant - Token has been expired or revoked
```
**Solution**: Re-authorize through Admin Panel → Configuration → Test Connection

#### API Rate Limits
```
Error: Rate limit exceeded for Google Drive API
```
**Solution**: Implement exponential backoff and batch requests

#### Missing Permissions
```
Error: Insufficient permissions to access folder
```
**Solution**: Ensure OAuth scopes include `drive.readonly` and folder is shared

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG_GOOGLE_DRIVE=true
```

View logs in browser console or server logs for detailed API interactions.

### Health Checks

The system provides health check endpoints:

```bash
# Test Google Drive connectivity
GET /api/admin/google-drive/health

# Check indexing status
GET /api/admin/google-drive/indexing-status

# Validate configuration
GET /api/admin/google-drive/validate-config
```

## Monitoring & Maintenance

### Automated Cleanup
Database cleanup runs automatically to remove:
- Old indexed files (30+ days)
- Orphaned file records
- Expired cache entries

### Manual Maintenance
```sql
-- Cleanup old indexed files manually
SELECT cleanup_old_indexed_files(30); -- 30 days old

-- Reset indexing status for folder
UPDATE customer_drive_folders 
SET last_indexed = NULL 
WHERE folder_id = 'folder_id';
```

### Monitoring Metrics
- **Indexing Success Rate**: Track successful vs failed indexing operations
- **Search Performance**: Monitor search query response times
- **API Usage**: Track Google Drive API quota usage
- **Storage Usage**: Monitor database growth from indexed files

## Support

For technical support or questions about the Google Drive integration:

1. Check the troubleshooting section above
2. Review server logs for error details
3. Verify Google Cloud Console configuration
4. Contact the development team with specific error messages

---

**Version**: 1.0.0
**Last Updated**: August 2024
**Phase**: 7 - Google Drive Integration
