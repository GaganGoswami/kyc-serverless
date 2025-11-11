#!/bin/bash

# AWS Serverless KYC Platform - Teardown Script
# This script destroys all AWS resources created by the platform

set -e

echo "🗑️  Destroying AWS Serverless KYC Platform"
echo "=========================================="

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  WARNING: This will delete all resources and data!${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Teardown cancelled."
    exit 0
fi

echo -e "\n${YELLOW}Destroying infrastructure...${NC}"
cd infrastructure
cdk destroy --force
cd ..

echo -e "\n✅ All resources destroyed"
echo "Note: Some resources like CloudWatch logs may be retained based on retention policies."
