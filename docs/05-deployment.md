# Frontend Deployment Guide

Complete guide for deploying and updating the KYC platform React frontend.

## Table of Contents
- [Quick Deployment](#quick-deployment)
- [Deployment Script](#deployment-script)
- [Manual Deployment](#manual-deployment)
- [CloudFront Cache Management](#cloudfront-cache-management)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## Quick Deployment

### Using the Deployment Script (Recommended)

The easiest way to deploy frontend changes:

```bash
# From project root
./deploy-frontend.sh
```

**This single command:**
- ✅ Builds the React application with Vite
- ✅ Uploads all files to S3 bucket
- ✅ Invalidates CloudFront cache automatically
- ✅ Waits for cache invalidation to complete
- ✅ Provides status updates throughout the process

**Expected output:**
```
🚀 Starting Frontend Deployment...
📦 Configuration:
   S3 Bucket: kyc-ui-553424001208-us-east-1
   CloudFront: d1kbrhpwmz7xug.cloudfront.net
   Distribution ID: EF9DJW72HHEHE

1️⃣  Building Frontend...
✓ Build complete

2️⃣  Uploading to S3...
✓ Upload complete

3️⃣  Invalidating CloudFront cache...
✓ Invalidation created: IB3XMVIG5G1SQQVTL4U3EZ333H
⏳ CloudFront cache invalidation in progress (takes 30-60 seconds)...

Waiting for invalidation to complete...
✓ CloudFront cache invalidated successfully!

🎉 Deployment Complete!

Access your application:
   🌐 CloudFront URL: https://d1kbrhpwmz7xug.cloudfront.net
```

### First Time Setup

If deploying for the first time:

```bash
# 1. Make the script executable
chmod +x deploy-frontend.sh

# 2. Update the script with your bucket and CloudFront details (if needed)
# Edit deploy-frontend.sh and set:
#   FRONTEND_BUCKET="your-bucket-name"
#   CLOUDFRONT_DIST_ID="your-cloudfront-domain"

# 3. Deploy
./deploy-frontend.sh
```

## Deployment Script

### Script Contents

The `deploy-frontend.sh` script performs the following steps:

```bash
#!/bin/bash
# 1. Configuration validation
# 2. Frontend build (npm run build)
# 3. S3 upload (aws s3 sync)
# 4. CloudFront invalidation (aws cloudfront create-invalidation)
# 5. Wait for invalidation completion
# 6. Success confirmation
```

### Script Configuration

The script automatically detects your resources, but you can override:

```bash
# Edit deploy-frontend.sh
FRONTEND_BUCKET="kyc-ui-553424001208-us-east-1"  # Your S3 bucket
CLOUDFRONT_DIST_ID="d1kbrhpwmz7xug.cloudfront.net"  # Your CloudFront domain
```

### Script Features

- ✅ **Color-coded output** for easy reading
- ✅ **Error handling** - stops on any failure
- ✅ **Progress indicators** for each step
- ✅ **Automatic resource detection** from AWS
- ✅ **Cache invalidation wait** - ensures fresh content

## Manual Deployment

If you prefer step-by-step control:

### Step 1: Build Frontend

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Build production bundle
npm run build
```

**Output:**
```
vite v5.4.21 building for production...
✓ 1766 modules transformed.
dist/index.html                   0.46 kB │ gzip:  0.30 kB
dist/assets/index-CGt399ql.css   23.57 kB │ gzip:  4.80 kB
dist/assets/index-B5faLFdb.js   301.51 kB │ gzip: 93.59 kB
✓ built in 1.37s
```

### Step 2: Upload to S3

```bash
# Get bucket name from CloudFormation
UI_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name KycStack \
  --query "Stacks[0].Outputs[?OutputKey=='UIBucketName'].OutputValue" \
  --output text)

# Or use direct bucket name
UI_BUCKET="kyc-ui-553424001208-us-east-1"

# Upload files (--delete removes old files)
aws s3 sync dist/ s3://$UI_BUCKET/ --delete
```

### Step 3: Get CloudFront Distribution ID

```bash
# Method 1: From CloudFormation outputs
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name KycStack \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text)

# Method 2: Find by S3 origin
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[0].DomainName=='${UI_BUCKET}.s3.amazonaws.com'].Id" \
  --output text)

# Method 3: Find by CloudFront domain
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?DomainName=='d1kbrhpwmz7xug.cloudfront.net'].Id" \
  --output text)

echo "Distribution ID: $DISTRIBUTION_ID"
```

### Step 4: Invalidate CloudFront Cache

```bash
# Create invalidation
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "Invalidation created: $INVALIDATION_ID"

# Wait for completion (optional but recommended)
aws cloudfront wait invalidation-completed \
  --distribution-id $DISTRIBUTION_ID \
  --id $INVALIDATION_ID

echo "✅ Cache invalidated successfully!"
```

### Step 5: Verify Deployment

```bash
# Get CloudFront URL
CLOUDFRONT_URL=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Id=='${DISTRIBUTION_ID}'].DomainName" \
  --output text)

echo "Access your app at: https://${CLOUDFRONT_URL}"
```

## CloudFront Cache Management

### Why Cache Invalidation is Important

CloudFront caches your content at edge locations for 24 hours by default. Without invalidation:
- Users see **old content** even after deploying
- Changes can take **up to 24 hours** to appear
- Browser refresh doesn't help (cached at CDN level)

### Invalidation Paths

```bash
# Invalidate everything (recommended for deployments)
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Invalidate specific files only
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/index.html" "/assets/*"

# Invalidate specific path
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/customer/*"
```

### Check Invalidation Status

```bash
# List recent invalidations
aws cloudfront list-invalidations \
  --distribution-id $DISTRIBUTION_ID

# Get specific invalidation details
aws cloudfront get-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --id $INVALIDATION_ID
```

### Invalidation Cost

- **First 1,000 paths/month**: FREE
- **Additional paths**: $0.005 per path
- **Our deployment**: 1 invalidation (/* path) = FREE

💡 **Tip**: Use `/*` instead of multiple specific paths to save costs

## Troubleshooting

### Problem: Still Seeing Old Content After Deployment

**Cause**: CloudFront cache not invalidated or browser cache

**Solution 1: Run deployment script again**
```bash
./deploy-frontend.sh
```

**Solution 2: Manual invalidation**
```bash
# Create new invalidation
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

# Wait for completion
aws cloudfront wait invalidation-completed \
  --distribution-id $DISTRIBUTION_ID \
  --id $(aws cloudfront list-invalidations --distribution-id $DISTRIBUTION_ID --query 'InvalidationList.Items[0].Id' --output text)
```

**Solution 3: Browser hard refresh**
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- **Alternative**: Open in incognito/private window

### Problem: Build Fails

**Error**: `Command failed: vite build`

**Solution**:
```bash
cd frontend

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

### Problem: S3 Upload Permission Denied

**Error**: `Access Denied` when syncing to S3

**Solution**:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify bucket exists
aws s3 ls s3://kyc-ui-553424001208-us-east-1

# Check IAM permissions
aws iam get-user

# Ensure you have these permissions:
# - s3:PutObject
# - s3:DeleteObject
# - s3:ListBucket
```

### Problem: CloudFront Distribution Not Found

**Error**: Empty result when querying distribution

**Solution**:
```bash
# List all distributions
aws cloudfront list-distributions --output table

# Find your distribution manually
# Look for origin matching: kyc-ui-*.s3.amazonaws.com

# Set distribution ID manually
DISTRIBUTION_ID="EF9DJW72HHEHE"  # Replace with your ID
```

### Problem: Deployment Script Not Executable

**Error**: `Permission denied: ./deploy-frontend.sh`

**Solution**:
```bash
chmod +x deploy-frontend.sh
```

### Problem: API URL Not Updated

**Error**: Frontend shows "Failed to fetch" or connects to wrong API

**Solution**:
```bash
cd frontend

# Update .env file with correct API URL
API_URL=$(aws cloudformation describe-stacks \
  --stack-name KycStack \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

echo "VITE_API_URL=${API_URL}" > .env

# Rebuild and redeploy
npm run build
cd ..
./deploy-frontend.sh
```

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy Frontend
        run: |
          chmod +x deploy-frontend.sh
          ./deploy-frontend.sh
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
deploy-frontend:
  stage: deploy
  image: node:20
  before_script:
    - apt-get update && apt-get install -y awscli
  script:
    - chmod +x deploy-frontend.sh
    - ./deploy-frontend.sh
  only:
    - main
    - changes:
      - frontend/**
```

### AWS CodePipeline

```bash
# Create buildspec.yml in project root
cat > buildspec.yml << EOF
version: 0.2

phases:
  install:
    runtime-versions:
      nodejs: 20
  build:
    commands:
      - chmod +x deploy-frontend.sh
      - ./deploy-frontend.sh

artifacts:
  files:
    - frontend/dist/**/*
EOF
```

## Development Workflow

### Local Development

```bash
cd frontend

# Start dev server with hot reload
npm run dev

# Access at http://localhost:5173
```

### Test Before Deploying

```bash
# Build and test locally
cd frontend
npm run build
npm run preview  # Preview production build

# Access at http://localhost:4173
```

### Deployment Checklist

Before deploying to production:

- [ ] Test locally with `npm run dev`
- [ ] Build successfully with `npm run build`
- [ ] Preview production build with `npm run preview`
- [ ] Check API endpoint configuration in `.env`
- [ ] Verify AWS credentials: `aws sts get-caller-identity`
- [ ] Run deployment script: `./deploy-frontend.sh`
- [ ] Wait for CloudFront invalidation to complete
- [ ] Test in browser (hard refresh)
- [ ] Test on mobile devices
- [ ] Check browser console for errors

## Best Practices

### 1. Always Invalidate Cache

```bash
# After EVERY deployment
./deploy-frontend.sh  # This handles it automatically
```

### 2. Use Environment Variables

```bash
# frontend/.env
VITE_API_URL=https://your-api.execute-api.us-east-1.amazonaws.com/prod

# Access in code:
const apiUrl = import.meta.env.VITE_API_URL;
```

### 3. Version Your Builds

```bash
# Add version to build
echo "export const APP_VERSION = '$(date +%Y%m%d-%H%M%S)';" > frontend/src/version.ts
npm run build
```

### 4. Monitor Deployments

```bash
# Check recent invalidations
aws cloudfront list-invalidations \
  --distribution-id $DISTRIBUTION_ID \
  --max-items 5

# Check S3 sync results
aws s3 ls s3://$UI_BUCKET/ --recursive --human-readable
```

### 5. Backup Before Deployment

```bash
# Download current version from S3
aws s3 sync s3://$UI_BUCKET/ ./backup-$(date +%Y%m%d-%H%M%S)/ 
```

## Quick Reference

### Essential Commands

```bash
# Deploy everything
./deploy-frontend.sh

# Build only
cd frontend && npm run build

# Upload only
aws s3 sync frontend/dist/ s3://kyc-ui-553424001208-us-east-1/ --delete

# Invalidate only
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# Check status
aws cloudfront list-invalidations --distribution-id $DISTRIBUTION_ID
```

### Resource URLs

```bash
# Get all URLs
echo "S3 Bucket: http://kyc-ui-553424001208-us-east-1.s3-website-us-east-1.amazonaws.com"
echo "CloudFront: https://d1kbrhpwmz7xug.cloudfront.net"
```

## Next Steps

- [API Reference](./09-api-reference.md) - API documentation
- [Operating Manual](./11-operating-manual.md) - Day-to-day operations
- [Troubleshooting](./13-troubleshooting.md) - Common issues and solutions
- [Security Guide](./14-security-iam.md) - Security best practices

---

**Last Updated**: November 11, 2025  
**Version**: 1.0
