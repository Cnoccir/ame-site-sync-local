# AME Site Sync - Development Guide

## Changes Made to Create Local Version

This version has been cleaned from the original Lovable project to create a standalone local development environment:

### Removed Dependencies
- Removed `lovable-tagger` from devDependencies
- Cleaned up vite.config.ts to remove lovable-tagger import and usage
- Removed all lovable.dev references from README.md
- Updated HTML meta tags to remove lovable.dev references

### Updated Configuration
- Changed package name from `vite_react_shadcn_ts` to `ame-site-sync-local`
- Updated version to 1.0.0 and added description
- Removed Git remote origin to make project independent
- Created local assets structure in `public/images/`
- Updated image references to use local paths

### Project Structure
```
ame-site-sync-local/
├── public/
│   ├── images/           # Local image assets
│   ├── favicon.ico       # App icon
│   └── ...
├── src/
│   ├── components/       # React components
│   ├── ...
├── package.json          # Updated with new name and dependencies
├── README.md            # Updated documentation
└── DEVELOPMENT.md       # This file
```

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```
   Server runs on http://localhost:8080/

2. **Build for Production**
   ```bash
   npm run build
   ```
   Output will be in `dist/` directory

3. **Environment Variables**
   Configure your Supabase settings in `.env`:
   ```
   VITE_SUPABASE_PROJECT_ID="your_project_id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your_public_key"
   VITE_SUPABASE_URL="your_supabase_url"
   ```

## Testing

The project uses:
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui for components
- Supabase for backend services

## Deployment

This local version can be deployed to any static hosting service:
1. Run `npm run build`
2. Upload the `dist/` directory to your hosting provider
3. Configure environment variables on your hosting platform

## Key Features

- Building automation maintenance management
- Customer management system
- Task execution and SOP viewers
- Network analysis and reporting
- Responsive UI with dark/light theme support
