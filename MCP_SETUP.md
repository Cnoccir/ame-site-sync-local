# Supabase MCP Setup

## Overview
This project now has Supabase Model Context Protocol (MCP) integration set up, allowing Claude/Warp to directly interact with your Supabase database through natural language.

## Configuration
The MCP server has been configured in `C:\Users\tech\AppData\Roaming\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "desktop-commander": {
      "command": "npx",
      "args": [
        "-y",
        "@wonderwhy-er/desktop-commander"
      ]
    },
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase"
      ],
      "env": {
        "SUPABASE_URL": "https://ncqwrabuujjgquakxrkw.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcXdyYWJ1dWpqZ3F1YWt4cmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5NDk3NDYsImV4cCI6MjA1ODUyNTc0Nn0.Emtb8PCT8jW_efAa7ZBukDXbHdjSDsndNHwhiijZhHU"
      }
    }
  }
}
```

## Installed Components
- **@supabase/mcp-server-supabase** (v0.4.5): Official Supabase MCP server
- **supabase CLI** (v2.39.2): Local development dependency

## What This Enables
With MCP set up, you can now:

1. **Query your database** using natural language through Claude
2. **Insert, update, and delete records** via conversational commands
3. **Analyze your data** by asking Claude to examine table structures and relationships
4. **Generate SQL queries** and have them executed automatically
5. **Manage database schema** through conversational interface

## Usage Examples
Once Warp/Claude restarts and picks up the new configuration, you can:

- "Show me all records from the buildings table"
- "Create a new maintenance request for building 123"
- "What's the schema of the equipment table?"
- "Update the status of work order 456 to completed"
- "How many open work orders are there by priority?"

## Environment Variables
The MCP server uses these environment variables (configured in the MCP config):
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your public/anon key for database access

## Database Schema
Your Supabase project includes tables for:
- Buildings management
- Equipment tracking
- Maintenance requests
- Work orders
- User management
- And more (as defined in your migration files)

## Next Steps
1. Restart Warp/Claude to pick up the new MCP configuration
2. Test the connection by asking Claude about your database
3. Explore the natural language database interaction capabilities

## Troubleshooting
If you encounter issues:
1. Check the MCP logs in: `C:\Users\tech\AppData\Local\warp\Warp\data\logs\mcp\`
2. Verify your Supabase connection using the CLI: `npx supabase status`
3. Test the MCP server manually with environment variables set

## Security Notes
- The anon key provides row-level security based on your Supabase policies
- MCP operations respect your existing database permissions
- Consider using service role key for admin operations if needed
