# Development Workflow Guide

## Overview
This guide prevents deploying untested changes to production by establishing a proper build-time environment separation and deployment gating.

## Environment Setup

### 1. Build-Time Environment Configuration
The frontend uses Vite environment variables for reliable environment separation:

**For Development (Replit/Local):**
Add to Replit Secrets:
- `VITE_API_BASE_URL` = `https://glow-api-lingering-queen-74b7.cloudflare-4up2f.workers.dev`

**For Production:**
- Uses fallback: `https://api.marketingstratgenerator.com` (default)

### 2. Wrangler Deployment Gating
```bash
# Default deploys to development (safe)
wrangler deploy --env dev

# Production requires explicit flag (gated)
wrangler deploy --env production
```

### 3. Testing Workflow

#### Step 1: Test in Replit Development
1. Add `VITE_API_BASE_URL` to Replit Secrets (development worker URL)
2. Make changes to `workers/worker.js`
3. Test using Replit preview (uses development worker)
4. Generate multiple marketing strategies to verify fixes
5. Check all report sections for proper formatting

#### Step 2: Deploy to Development Worker
Test the exact deployment:
```bash
wrangler deploy --env dev
```

#### Step 3: Deploy to Production
**Only after thorough testing:**
```bash
wrangler deploy --env production
```

## Development Checklist

Before deploying to production:
- [ ] `VITE_API_BASE_URL` set to development worker in Replit Secrets
- [ ] Changes tested in Replit development environment  
- [ ] Multiple test reports generated with different inputs
- [ ] All report sections checked for paragraph breaks
- [ ] British English verified throughout
- [ ] No console errors in browser
- [ ] SSL certificates working
- [ ] API response times reasonable (<45 seconds)
- [ ] Development worker deployment successful
- [ ] Production deployment uses explicit `--env production` flag

## Emergency Rollback

If production deployment breaks:
```bash
# Get previous version ID
wrangler deployments list

# Rollback to previous version  
wrangler rollback [VERSION_ID]
```

## Environment Variable Setup

**In Replit Secrets (for development):**
```
VITE_API_BASE_URL=https://glow-api-lingering-queen-74b7.cloudflare-4up2f.workers.dev
```

**For production builds:**
- Leave `VITE_API_BASE_URL` unset to use production fallback

## Files Modified for Development Workflow
- `src/App.jsx` - Build-time environment variables 
- `wrangler.toml` - Environment-specific deployment targets
- `DEVELOPMENT_WORKFLOW.md` - This guide

## Key Principles
1. **Build-time environment separation** - No runtime hostname detection
2. **Explicit production deployment** - Requires `--env production` flag
3. **Development-first testing** - Always test in dev before production
4. **Deployment gating** - Production is not the default target