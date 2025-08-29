# Production Environment Variables for AME-Site-Sync-OAuth

## Issue Description
When users authenticate on the published site, they see "ame-techassit" project instead of "AME-Site-Sync-OAuth" project. This indicates that the hosting platform is using incorrect Supabase environment variables.

## Current Local Configuration
The following variables are set in your local `.env` file:
```
VITE_SUPABASE_PROJECT_ID="ncqwrabuujjgquakxrkw"
VITE_SUPABASE_URL="https://ncqwrabuujjgquakxrkw.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcXdyYWJ1dWpqZ3F1YWt4cmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NDk3NDYsImV4cCI6MjA1ODUyNTc0Nn0.Emtb8PCT8jW_efAa7ZBukDXbHdjSDsndNHwhiijZhHU"
```

## Google OAuth Configuration
```
VITE_GOOGLE_OAUTH_CLIENT_ID=735781069629-s0jv1cpbcdrpm9qjip0bmjgsh8f4s7tb.apps.googleusercontent.com
VITE_GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8080/google/callback (for local dev)
```

## Required Action
You need to set these EXACT environment variables on your hosting platform (Vercel, Netlify, etc.):

### For Production Deployment:
```
VITE_SUPABASE_PROJECT_ID=ncqwrabuujjgquakxrkw
VITE_SUPABASE_URL=https://ncqwrabuujjgquakxrkw.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcXdyYWJ1dWpqZ3F1YWt4cmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NDk3NDYsImV4cCI6MjA1ODUyNTc0Nn0.Emtb8PCT8jW_efAa7ZBukDXbHdjSDsndNHwhiijZhHU

# Google OAuth for production (update redirect URI for your production domain)
VITE_GOOGLE_OAUTH_CLIENT_ID=735781069629-s0jv1cpbcdrpm9qjip0bmjgsh8f4s7tb.apps.googleusercontent.com
VITE_GOOGLE_OAUTH_REDIRECT_URI=https://your-production-domain.com/google/callback
```

## Project Details
- **Project Reference:** ncqwrabuujjgquakxrkw
- **Project URL:** https://ncqwrabuujjgquakxrkw.supabase.co
- **Expected Project Name:** AME-Site-Sync-OAuth

## Troubleshooting Steps:
1. Check your hosting platform's environment variables dashboard
2. Ensure the variables above are set EXACTLY as shown
3. Redeploy the application after updating environment variables
4. Test authentication to verify users see "AME-Site-Sync-OAuth" instead of "ame-techassit"

## Common Hosting Platforms:
- **Vercel:** Settings > Environment Variables
- **Netlify:** Site settings > Environment variables
- **GitHub Pages:** Repository settings > Secrets and variables > Actions
