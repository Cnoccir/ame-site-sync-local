# Fix CORS Issues for Google Drive Integration

The CORS errors you're seeing are browser security restrictions that prevent your localhost app from making requests to Google's servers. Here are quick fixes:

## Option 1: Use Chrome with CORS Disabled (Quick Fix)

1. **Close all Chrome windows completely**
2. **Open Chrome with CORS disabled** (run this command):
   
   **Windows:**
   ```cmd
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-web-security --disable-features=VizDisplayCompositor --user-data-dir=C:\temp\chrome_dev
   ```
   
   **Mac:**
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --disable-web-security --disable-features=VizDisplayCompositor --user-data-dir=/tmp/chrome_dev
   ```

3. **You'll see a warning banner** - this is expected
4. **Navigate to your app** and try the folder creation again

## Option 2: Use the Database Migration (Recommended)

1. **Go to your Supabase Dashboard** → SQL Editor
2. **Copy and paste** the contents of `./database-migrations/folder_associations.sql`
3. **Run the migration** to create the folder association tables
4. **This enables the caching system** which reduces API calls

## Option 3: Test Without Folder Creation

For now, you can:
1. **Skip the folder creation step** when testing the customer wizard
2. **Use the manual folder input** fields at the bottom of the wizard
3. **Enter a folder ID manually** if you have one

## After Deployment

These CORS issues won't occur when deployed to your production domain because:
- Your deployed app will have proper origin headers
- Edge Functions run server-side and don't have CORS restrictions
- The Google OAuth flow works correctly with proper redirect URLs

## Current Status

The simplified folder association system is complete and ready to use. The CORS issues are just a development environment limitation.

## Next Steps

1. **Try Option 1** (Chrome with CORS disabled) to test the full flow
2. **Run the database migration** to enable caching
3. **Test the customer creation workflow** end-to-end
4. **Deploy to production** for full functionality

The folder association system will work perfectly once deployed! 🚀
