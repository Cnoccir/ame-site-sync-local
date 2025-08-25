# Lovable ↔ Local Development Sync Workflow

## Document Purpose
This document provides AI/LLM assistants and developers with comprehensive procedures for safely managing code synchronization between Lovable web development environment, GitHub repository, and local development machine.

## Project Context
- **Project**: AME Maintenance System
- **Architecture**: React 18.3.1 + TypeScript + Supabase backend
- **Repository**: GitHub with automatic Lovable integration
- **Local Path**: `C:\Users\tech\Projects\ame-site-sync-local`
- **Sync Method**: GitHub acts as central source of truth

## Synchronization Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Lovable Web   │◄──►│     GitHub       │◄──►│  Local Machine │
│   (Live Dev)    │    │  (Source Truth)  │    │ (Your Coding)   │
│                 │    │                  │    │                 │
│ - AI Prompting  │    │ - Version Control│    │ - IDE Development│
│ - Live Preview  │    │ - Merge Conflicts│    │ - Local Testing  │
│ - Auto Deploy   │    │ - Change History │    │ - Advanced Debug │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

**Key Principle**: GitHub is the single source of truth. Both Lovable and Local are interfaces to edit the same codebase.

## CRITICAL RISK SCENARIOS

### Risk Level: CRITICAL 🚨

#### 1. Simultaneous File Editing
**Scenario**: Developer editing file locally while AI modifies same file in Lovable
**Consequence**: Merge conflicts, lost changes, corrupted code
**Prevention**: Follow workflow patterns below

#### 2. Force Push Operations
**Command**: `git push --force origin main`
**Consequence**: Permanently destroys Lovable changes
**Rule**: NEVER use force push on main branch

#### 3. Database Schema Drift
**Scenario**: Supabase changes in Lovable UI while local has migration files
**Consequence**: Production vs development database inconsistency
**Prevention**: Coordinate database changes through single channel

#### 4. Abandoned Git Integration  
**Scenario**: Deleting .git folder or breaking GitHub connection
**Consequence**: Complete loss of synchronization capability
**Rule**: Preserve Git integration at all costs

## DEVELOPMENT WORKFLOW PATTERNS

### Pattern 1: Local-First Development
**Best For**: Complex logic, debugging, multiple file changes, testing

#### Step 1: Morning Sync Protocol
```bash
# Navigate to project directory
cd C:\Users\tech\Projects\ame-site-sync-local

# Check current status
git status

# Stash any uncommitted work
git stash push -m "WIP: $(date)"

# Pull latest changes from Lovable
git pull origin main

# Restore work in progress  
git stash pop

# Verify project builds
npm run dev
```

#### Step 2: Feature Branch Creation
```bash
# Create descriptive feature branch
git checkout -b fix/service-execution-phase-button
# OR
git checkout -b feature/assessment-validation-logic
# OR  
git checkout -b refactor/task-card-ui-improvements
```

#### Step 3: Development Cycle
```bash
# Make changes locally
# Test thoroughly with npm run dev
# Commit frequently with descriptive messages

git add src/components/visit/phases/ServiceExecutionPhase.tsx
git commit -m "Fix: ServiceExecutionPhase Complete Phase button logic

- Updated disabled condition to handle zero tasks scenario
- Allow phase completion when no tasks available  
- Resolves critical UX evaluation blocker issue
- Tested with multiple service tier scenarios"

# Push feature branch
git push origin fix/service-execution-phase-button
```

#### Step 4: Integration to Main
```bash
# Switch to main branch
git checkout main

# Ensure main is up to date
git pull origin main

# Merge feature branch
git merge fix/service-execution-phase-button

# Push to trigger Lovable sync
git push origin main

# Clean up feature branch
git branch -d fix/service-execution-phase-button
git push origin --delete fix/service-execution-phase-button
```

### Pattern 2: Lovable-First Development  
**Best For**: AI-assisted development, rapid prototyping, UI styling, new feature generation

#### When to Use Lovable Direct:
- Quick styling adjustments with AI assistance
- Generating new components with AI prompts
- Testing different UI approaches rapidly
- Creating boilerplate code structures
- Fixing simple bugs with AI guidance

#### Post-Lovable Sync Protocol:
```bash
# After making changes in Lovable interface
cd C:\Users\tech\Projects\ame-site-sync-local

# Pull Lovable changes to local
git pull origin main

# Update dependencies if package.json changed
npm install

# Test locally to verify changes work
npm run dev

# Run type checking
npm run type-check

# Run build to ensure production compatibility
npm run build
```

## CONFLICT RESOLUTION PROCEDURES

### Scenario 1: Merge Conflicts During Git Pull

```bash
# Attempting to pull latest changes
git pull origin main

# Output shows conflicts:
# CONFLICT (content): Merge conflict in src/components/visit/phases/ServiceExecutionPhase.tsx
# Automatic merge failed; fix conflicts and then commit the result.

# Open conflicted file in editor
code src/components/visit/phases/ServiceExecutionPhase.tsx

# Look for conflict markers and resolve:
# <<<<<<< HEAD
# // Your local changes
# const canCompletePhase = stats.total === 0 || stats.completed > 0;
# =======
# // Lovable changes
# disabled={stats.completed === 0 && stats.total > 0}
# >>>>>>> origin/main

# Choose best solution or combine approaches
# Save file with resolved conflicts

# Stage resolved file
git add src/components/visit/phases/ServiceExecutionPhase.tsx

# Commit resolution
git commit -m "Resolve merge conflict: ServiceExecutionPhase completion logic

Combined local optimization with Lovable UI improvements
Maintains zero-task completion capability while preserving AI enhancements"
```

### Scenario 2: Stash Conflicts During Pop

```bash
# Work in progress conflicts with pulled changes
git stash pop

# If conflicts occur:
# Resolve conflicts in affected files
# Stage resolved files
git add .

# Commit resolved changes
git commit -m "Integrate WIP with latest Lovable changes"

# Clear stash
git stash drop
```

### Scenario 3: Complex Multi-File Conflicts

```bash
# For extensive conflicts, use interactive rebase
git rebase -i origin/main

# OR reset and reapply changes selectively
git diff HEAD~1 > my-changes.patch
git reset --hard origin/main
git apply my-changes.patch --reject
# Manually resolve .rej files
```

## DATABASE SYNCHRONIZATION PROCEDURES

### Supabase Schema Management

#### Detecting Schema Changes
```bash
# If using Supabase CLI locally
supabase db diff --use-migra

# Generate migration from remote changes  
supabase migration new schema_sync_$(date +%Y%m%d)

# Apply to remote database
supabase db push
```

#### Database Consistency Verification
```typescript
// Add to local development routine
const verifyDatabaseSchema = async () => {
  try {
    const { data: tables } = await supabase.rpc('get_table_info');
    console.log('Database schema check:', {
      timestamp: new Date().toISOString(),
      tableCount: tables?.length || 0,
      tables: tables?.map(t => t.table_name) || []
    });
  } catch (error) {
    console.error('Database schema verification failed:', error);
  }
};

// Call during development startup
verifyDatabaseSchema();
```

## AUTOMATION AND SAFETY MEASURES

### Git Hooks Configuration

#### Pre-Commit Hook
Create file: `.git/hooks/pre-commit`
```bash
#!/bin/sh
# Pre-commit safety checks

echo "Running pre-commit checks..."

# Check if ahead of origin/main
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null)
BASE=$(git merge-base @ @{u} 2>/dev/null)

if [ "$REMOTE" != "" ] && [ "$LOCAL" != "$REMOTE" ] && [ "$LOCAL" != "$BASE" ]; then
    echo "⚠️  Warning: You have unpushed commits. Consider syncing with Lovable before major changes."
fi

# Run type checking
echo "Checking TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Fix before committing."
    exit 1
fi

# Run build test
echo "Testing build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Fix before committing."
    exit 1
fi

echo "✅ Pre-commit checks passed."
```

#### Package.json Scripts Enhancement
```json
{
  "scripts": {
    "dev": "git fetch origin --quiet && vite",
    "sync-check": "git fetch origin && git status",
    "safe-start": "git pull origin main --ff-only && npm install && npm run dev",
    "sync-status": "git log --oneline origin/main..HEAD && git log --oneline HEAD..origin/main",
    "emergency-reset": "git stash push -m 'Emergency stash' && git reset --hard origin/main"
  }
}
```

## DAILY WORKFLOW PROCEDURES

### Session Start Protocol
```bash
# 1. Navigate to project
cd C:\Users\tech\Projects\ame-site-sync-local

# 2. Check synchronization status
git fetch origin
git status
git log --oneline -5

# 3. Sync with latest changes
git pull origin main --ff-only

# 4. Update dependencies if needed
npm install

# 5. Start development
npm run dev

# 6. Verify application loads correctly
# Open http://localhost:5173 and test key functionality
```

### During Development
```bash
# Commit frequently with descriptive messages
git add src/components/visit/phases/ServiceExecutionPhase.tsx
git commit -m "Fix: Complete Phase button logic for zero tasks scenario

- Updated completion validation to allow progression when no tasks
- Maintains existing functionality for standard task flows  
- Addresses critical UX blocker from evaluation report"

# Push regularly to prevent large conflicts
git push origin main
```

### Session End Protocol
```bash
# 1. Ensure all work is committed
git status
# Output should show: "working tree clean"

# 2. Push any remaining commits
git push origin main

# 3. Verify Lovable has synced changes
# Check Lovable interface for latest commits

# 4. Clean up completed feature branches
git branch -d completed-feature-branch-name
```

## EMERGENCY RECOVERY PROCEDURES

### Recovery Scenario 1: Accidentally Override Lovable Changes

```bash
# 1. Don't panic - Git preserves all history
git reflog
# Look for: commit-hash HEAD@{1}: pull: Merge made by the 'recursive' strategy

# 2. Reset to state before your changes
git reset --hard HEAD~1

# 3. Pull latest Lovable changes
git pull origin main

# 4. Cherry-pick your changes back
git cherry-pick <your-commit-hash>

# 5. Resolve any conflicts and commit
```

### Recovery Scenario 2: Corrupted Working Directory

```bash
# 1. Stash any valuable uncommitted changes
git stash push -m "Emergency backup $(date)"

# 2. Reset to known good state
git reset --hard origin/main

# 3. Clean untracked files
git clean -fd

# 4. Restore from stash if needed
git stash list
git stash pop stash@{0}
```

### Recovery Scenario 3: Lost Lovable Sync Connection

```bash
# 1. Verify GitHub integration in Lovable settings
# 2. Re-establish connection if broken
# 3. Force sync from GitHub to Lovable
# 4. Verify changes appear in Lovable interface

# If connection cannot be restored:
# 1. Export local changes to patch file
git diff HEAD~5 > recent-changes.patch

# 2. Create new Lovable project with GitHub integration
# 3. Apply patches to new project
git apply recent-changes.patch
```

## BEST PRACTICES CHECKLIST

### Daily Workflow ✅
- [ ] Start session with `git pull origin main`
- [ ] Commit frequently with descriptive messages
- [ ] Push regularly to prevent conflicts
- [ ] Test locally after each pull from Lovable
- [ ] End session with clean working directory

### Change Management ✅
- [ ] Use feature branches for significant changes
- [ ] Coordinate database changes between environments
- [ ] Test builds before pushing to main
- [ ] Resolve conflicts immediately when they occur
- [ ] Document complex merge resolutions

### Safety Protocols ✅
- [ ] Never use `git push --force` on main branch
- [ ] Preserve GitHub integration at all costs
- [ ] Keep regular backups of important work
- [ ] Maintain sync between package dependencies
- [ ] Verify application functionality after syncs

### Communication ✅
- [ ] Use descriptive commit messages for AI context
- [ ] Document unusual procedures in commit messages
- [ ] Note breaking changes in commit descriptions
- [ ] Explain complex conflict resolutions
- [ ] Reference related issues or PR numbers

## TROUBLESHOOTING GUIDE

### Common Issues and Solutions

#### Issue: "Your branch is ahead of origin/main"
```bash
# Solution: Push commits to sync with Lovable
git push origin main
```

#### Issue: "Your branch is behind origin/main"
```bash
# Solution: Pull latest Lovable changes
git pull origin main
```

#### Issue: "divergent branches"
```bash
# Solution: Merge or rebase
git pull origin main --no-rebase  # Merge approach
# OR
git pull origin main --rebase     # Rebase approach (cleaner history)
```

#### Issue: "Please commit your changes or stash them"
```bash
# Solution: Stash and pull
git stash push -m "WIP before sync"
git pull origin main
git stash pop
```

#### Issue: Build fails after Lovable sync
```bash
# Solution: Check for dependency changes
npm install
npm run dev

# If still fails, check for TypeScript errors
npm run type-check
```

## AI ASSISTANT GUIDANCE

### When Providing Development Assistance

#### Always Consider:
1. Current sync status with Lovable
2. Potential for merge conflicts
3. Impact on other developers
4. Database schema implications
5. Testing requirements after changes

#### Recommend Safe Patterns:
1. Pull before making changes
2. Use feature branches for complex work
3. Test locally before pushing
4. Commit frequently with good messages
5. Coordinate major changes

#### Warning Signs to Flag:
1. Requests for force push operations
2. Simultaneous multi-environment editing
3. Database changes without coordination
4. Large refactors without branching strategy
5. Ignoring merge conflicts

This document serves as the definitive guide for managing the complex but powerful workflow of combining Lovable's AI-powered development with traditional local development practices.