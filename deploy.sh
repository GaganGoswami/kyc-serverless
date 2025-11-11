#!/bin/bash

# AWS Serverless KYC Platform - Deployment Script
# This script deploys the complete serverless KYC platform to AWS

set -e  # Exit on error

echo "🚀 Starting AWS Serverless KYC Platform Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v mvn &> /dev/null; then
    echo -e "${RED}❌ Maven not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v cdk &> /dev/null; then
    echo -e "${RED}❌ AWS CDK not found. Installing...${NC}"
    npm install -g aws-cdk
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Step 1: Build Java Lambda functions
echo -e "\n${YELLOW}Step 1: Building Java Lambda functions...${NC}"
cd backend
mvn clean package
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Java Lambda functions built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build Java Lambda functions${NC}"
    exit 1
fi
cd ..

# Step 2: Install CDK dependencies
echo -e "\n${YELLOW}Step 2: Installing CDK dependencies...${NC}"
cd infrastructure
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ CDK dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install CDK dependencies${NC}"
    exit 1
fi

# Step 3: Bootstrap CDK (if first time)
echo -e "\n${YELLOW}Step 3: Checking CDK bootstrap status...${NC}"
cdk bootstrap
echo -e "${GREEN}✅ CDK bootstrap complete${NC}"

# Step 4: Deploy infrastructure
echo -e "\n${YELLOW}Step 4: Deploying infrastructure to AWS...${NC}"
cdk deploy --require-approval never --outputs-file ../outputs.json
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
else
    echo -e "${RED}❌ Failed to deploy infrastructure${NC}"
    exit 1
fi
cd ..

# Step 5: Extract outputs
echo -e "\n${YELLOW}Step 5: Extracting deployment outputs...${NC}"
if [ -f outputs.json ]; then
    API_URL=$(jq -r '.KycStack.ApiUrl' outputs.json)
    DASHBOARD_URL=$(jq -r '.KycStack.DashboardURL' outputs.json)
    UI_BUCKET=$(jq -r '.KycStack.UIBucketName' outputs.json)
    
    echo -e "${GREEN}✅ Outputs extracted${NC}"
    echo "API URL: $API_URL"
    echo "UI Bucket: $UI_BUCKET"
else
    echo -e "${RED}❌ outputs.json not found${NC}"
    exit 1
fi

# Step 6: Build React frontend
echo -e "\n${YELLOW}Step 6: Building React frontend...${NC}"
cd frontend

# Create .env file with API URL
echo "VITE_API_URL=$API_URL" > .env

npm install
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ React frontend built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build React frontend${NC}"
    exit 1
fi

# Step 7: Deploy frontend to S3
echo -e "\n${YELLOW}Step 7: Deploying frontend to S3...${NC}"
aws s3 sync dist/ "s3://$UI_BUCKET" --delete
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployed to S3${NC}"
else
    echo -e "${RED}❌ Failed to deploy frontend${NC}"
    exit 1
fi
cd ..

# Final summary
echo -e "\n${GREEN}=================================================="
echo "🎉 Deployment Complete!"
echo "==================================================${NC}"
echo ""
echo "📊 Dashboard URL: $DASHBOARD_URL"
echo "🔌 API Endpoint: $API_URL"
echo ""
echo "Next steps:"
echo "1. Open the dashboard URL in your browser"
echo "2. Upload a KYC document to test the workflow"
echo "3. Monitor the Step Functions execution in AWS Console"
echo "4. Check CloudWatch Logs for agent activity"
echo ""
echo -e "${YELLOW}Note: It may take a few minutes for CloudFront to fully propagate.${NC}"
