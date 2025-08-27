# Database Configuration Options

## Current Setup
The local version is connected to the **LIVE PRODUCTION DATABASE**:
- URL: https://ncqwrabuujjgquakxrkw.supabase.co
- All changes made locally will affect live data

## Safe Testing Options

### Option 1: Create a Development Database (Recommended)
1. Create a new Supabase project for development
2. Export schema from production database
3. Import schema to development database
4. Update `.env` file with development database credentials

### Option 2: Use Environment Variables for Database Switching
Update `src/integrations/supabase/client.ts` to use environment variables:

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

Then create different `.env` files:
- `.env.development` - for local testing
- `.env.production` - for production use

### Option 3: Local Supabase Instance
Set up a local Supabase instance using Docker:
1. Install Supabase CLI
2. Run `supabase init`
3. Run `supabase start`
4. Update environment variables to point to localhost

## Current Risk Level: HIGH
⚠️ **WARNING**: Any data modifications in the local app will immediately affect the production database.

## Recommendations:
1. **For Development**: Create a separate Supabase project
2. **For Testing**: Use test data or a staging environment
3. **For Production**: Keep current configuration
