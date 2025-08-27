# AME Site Sync - Local Development Version

## Project Overview

This is a local development version of the AME Site Sync application, designed for building automation maintenance management. This project has been cleaned of external dependencies and can be run independently for testing and development.

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Development Setup

Follow these steps to set up the development environment:

```sh
# Step 1: Navigate to the project directory
cd ame-site-sync-local

# Step 2: Install the necessary dependencies
npm install

# Step 3: Start the development server
npm run dev

# Step 4: Build for production (optional)
npm run build
```

### Environment Configuration

Make sure to configure your environment variables in the `.env` file for Supabase integration.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

This is a local development version. For production deployment:

1. Run `npm run build` to create a production build
2. Deploy the `dist` folder to your preferred hosting service
3. Configure environment variables on your hosting platform

## Features

- Building automation maintenance management
- Customer management system
- Task execution and tracking
- Network analysis and reporting
- Supabase integration for data persistence
