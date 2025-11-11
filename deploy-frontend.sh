#!/bin/bash

# Frontend Deployment Script for KYC Platform
# This script builds and deploys the React frontend to S3 and invalidates CloudFront cache

set -e

echo "🚀 Starting Frontend Deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_BUCKET="kyc-ui-553424001208-us-east-1"
CLOUDFRONT_DIST_ID="d1kbrhpwmz7xug.cloudfront.net"

# Extract CloudFront ID from domain
CLOUDFRONT_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?DomainName=='${CLOUDFRONT_DIST_ID}'].Id" --output text)

if [ -z "$CLOUDFRONT_ID" ]; then
    echo "${YELLOW}⚠️  Could not find CloudFront distribution ID, trying alternative method...${NC}"
    CLOUDFRONT_ID=$(aws cloudfront list-distributions --query "DistributionList.Items[?Origins.Items[0].DomainName=='${FRONTEND_BUCKET}.s3.amazonaws.com'].Id" --output text)
fi

echo "${BLUE}📦 Configuration:${NC}"
echo "   S3 Bucket: $FRONTEND_BUCKET"
echo "   CloudFront: $CLOUDFRONT_DIST_ID"
echo "   Distribution ID: $CLOUDFRONT_ID"
echo ""

# Step 1: Build Frontend
echo "${BLUE}1️⃣  Building Frontend...${NC}"
cd frontend
npm run build
cd ..
echo "${GREEN}✓ Build complete${NC}"
echo ""

# Step 2: Upload to S3
echo "${BLUE}2️⃣  Uploading to S3...${NC}"
aws s3 sync frontend/dist/ s3://${FRONTEND_BUCKET}/ --delete
echo "${GREEN}✓ Upload complete${NC}"
echo ""

# Step 3: Invalidate CloudFront Cache
if [ ! -z "$CLOUDFRONT_ID" ]; then
    echo "${BLUE}3️⃣  Invalidating CloudFront cache...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "${GREEN}✓ Invalidation created: $INVALIDATION_ID${NC}"
    echo "${YELLOW}⏳ CloudFront cache invalidation in progress (takes 30-60 seconds)...${NC}"
    echo ""
    
    # Wait for invalidation to complete
    echo "${BLUE}Waiting for invalidation to complete...${NC}"
    aws cloudfront wait invalidation-completed \
        --distribution-id $CLOUDFRONT_ID \
        --id $INVALIDATION_ID
    
    echo "${GREEN}✓ CloudFront cache invalidated successfully!${NC}"
else
    echo "${YELLOW}⚠️  CloudFront distribution ID not found, skipping cache invalidation${NC}"
    echo "${YELLOW}   You may need to wait for the cache to expire or invalidate manually${NC}"
fi

echo ""
echo "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "${BLUE}Access your application:${NC}"
echo "   🌐 CloudFront URL: https://${CLOUDFRONT_DIST_ID}"
echo "   📦 S3 Direct URL: http://${FRONTEND_BUCKET}.s3-website-us-east-1.amazonaws.com"
echo ""
echo "${YELLOW}Note: If you still see old content, wait 1-2 minutes or do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)${NC}"
