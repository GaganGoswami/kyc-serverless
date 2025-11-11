# Quick Start Guide

Get the KYC platform up and running in under 10 minutes.

## Prerequisites

Before you begin, ensure you have:

- ✅ **AWS Account** with appropriate permissions
- ✅ **AWS CLI** installed and configured
- ✅ **Node.js** 18+ and npm
- ✅ **Java** 21+ and Maven
- ✅ **AWS CDK CLI**: `npm install -g aws-cdk`

### Verify Prerequisites

```bash
# Check AWS CLI
aws --version
# Expected: aws-cli/2.x.x or higher

# Check Node.js
node --version
# Expected: v18.x.x or higher

# Check Java
java --version
# Expected: openjdk 21.x.x or higher

# Check Maven
mvn --version
# Expected: Apache Maven 3.x.x or higher

# Check CDK
cdk --version
# Expected: 2.x.x or higher
```

## One-Command Deployment

The fastest way to deploy everything:

```bash
# Clone the repository
git clone https://github.com/your-org/kyc-serverless
cd kyc-serverless

# Make deployment script executable
chmod +x deploy.sh

# Deploy everything (infrastructure, backend, frontend)
./deploy.sh
```

This script will:
1. Build Java Lambda functions
2. Deploy AWS infrastructure via CDK
3. Build React frontend
4. Deploy frontend to S3
5. Output all URLs and resource names

## Step-by-Step Deployment

If you prefer manual control, follow these steps:

### Step 1: Build Backend

```bash
cd backend
mvn clean package
cd ..
```

**What this does:**
- Compiles Java code
- Packages Lambda functions into JAR
- Creates `backend/target/kyc-agents-1.0.0.jar`

### Step 2: Bootstrap AWS CDK (First Time Only)

```bash
cd infrastructure
npm install
cdk bootstrap
cd ..
```

**What this does:**
- Installs CDK dependencies
- Creates CDK toolkit stack in your AWS account
- Sets up S3 bucket for CDK assets
- Creates IAM roles for deployments

### Step 3: Deploy Infrastructure

```bash
cd infrastructure
cdk deploy --require-approval never
cd ..
```

**What this does:**
- Creates all AWS resources:
  - S3 buckets (documents and UI)
  - DynamoDB table
  - Lambda functions (4 agents + API handler)
  - API Gateway REST API
  - EventBridge event bus
  - Step Functions state machine
  - CloudFront distribution
  - IAM roles and policies
  - CloudWatch log groups

**Expected output:**
```
✅  KycStack

Outputs:
KycStack.ApiUrl = https://abc123.execute-api.us-east-1.amazonaws.com/prod/
KycStack.DashboardURL = https://d123abc.cloudfront.net
KycStack.DocumentBucketName = kyc-documents-123456789-us-east-1
KycStack.UIBucketName = kyc-ui-123456789-us-east-1
KycStack.EventBusName = kyc-event-bus
KycStack.StateMachineArn = arn:aws:states:us-east-1:123456789:stateMachine:KycWorkflow
```

**Save these outputs!** You'll need them for the next steps.

### Step 4: Configure Frontend

Create environment configuration:

```bash
cd frontend
cat > .env << EOF
VITE_API_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod
EOF
```

Replace `YOUR_API_ID` and `YOUR_REGION` with values from CDK output.

### Step 5: Build Frontend

```bash
# Still in frontend directory
npm install
npm run build
```

**What this does:**
- Installs React dependencies
- Builds production-optimized static files
- Creates `frontend/dist/` directory

### Step 6: Deploy Frontend

```bash
# Get UI bucket name from CDK output
UI_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name KycStack \
  --query "Stacks[0].Outputs[?OutputKey=='UIBucketName'].OutputValue" \
  --output text)

# Deploy to S3
aws s3 sync dist/ s3://$UI_BUCKET

cd ..
```

## Verify Deployment

### 1. Check CloudFormation Stack

```bash
aws cloudformation describe-stacks --stack-name KycStack --query "Stacks[0].StackStatus"
```

Expected output: `"CREATE_COMPLETE"`

### 2. Check Lambda Functions

```bash
aws lambda list-functions --query "Functions[?contains(FunctionName, 'Agent')].FunctionName"
```

Expected output:
```json
[
    "DocumentValidationAgent",
    "IdentityVerificationAgent",
    "FraudDetectionAgent",
    "ComplianceReportingAgent"
]
```

### 3. Check API Gateway

```bash
API_URL=$(aws cloudformation describe-stacks \
  --stack-name KycStack \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

curl ${API_URL}kyc
```

Expected output: `[]` (empty array, no records yet)

### 4. Check Dashboard

```bash
DASHBOARD_URL=$(aws cloudformation describe-stacks \
  --stack-name KycStack \
  --query "Stacks[0].Outputs[?OutputKey=='DashboardURL'].OutputValue" \
  --output text)

echo "Dashboard URL: $DASHBOARD_URL"
```

Open the URL in your browser. You should see the KYC dashboard.

## Test the Platform

### Test 1: Upload a Document

1. Open the dashboard in your browser
2. Navigate to "Upload" page
3. Enter a customer ID (e.g., `test-customer-001`)
4. Select document type (e.g., `passport`)
5. Choose a file (PDF, JPG, or PNG)
6. Click "Upload Document"

### Test 2: Monitor Workflow

1. Navigate to "Dashboard" page
2. You should see your upload appear with status `VALIDATED`
3. Refresh the page (or wait 10 seconds for auto-refresh)
4. Watch the status change: VALIDATED → VERIFIED → COMPLETED

### Test 3: View Logs

1. Navigate to "Logs" page
2. You should see all events for your customer ID
3. Each event shows: timestamp, event type, status, scores

### Test 4: API Testing

```bash
# Get API URL from output
API_URL=$(aws cloudformation describe-stacks \
  --stack-name KycStack \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

# Request upload URL
curl -X POST ${API_URL}upload \
  -H "Content-Type: application/json" \
  -d '{"customerId":"test-123","documentType":"passport"}'

# Get KYC records
curl ${API_URL}kyc

# Get specific customer
curl ${API_URL}kyc/test-123
```

### Test 5: Check Step Functions

```bash
# Open Step Functions console
echo "https://console.aws.amazon.com/states/home?region=us-east-1#/statemachines"

# Or use CLI to list executions
aws stepfunctions list-executions \
  --state-machine-arn $(aws cloudformation describe-stacks \
    --stack-name KycStack \
    --query "Stacks[0].Outputs[?OutputKey=='StateMachineArn'].OutputValue" \
    --output text)
```

## Quick Reference

### Important URLs

```bash
# Get all outputs
aws cloudformation describe-stacks \
  --stack-name KycStack \
  --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" \
  --output table
```

### Important Resources

| Resource | How to Find |
|----------|-------------|
| Dashboard | CloudFormation Outputs → `DashboardURL` |
| API Gateway | CloudFormation Outputs → `ApiUrl` |
| Document Bucket | CloudFormation Outputs → `DocumentBucketName` |
| DynamoDB Table | Console → DynamoDB → Tables → `KYCRecords` |
| Lambda Functions | Console → Lambda → Functions (filter: "Agent") |
| Step Functions | Console → Step Functions → `KycWorkflow` |
| EventBridge | Console → EventBridge → `kyc-event-bus` |

### CloudWatch Logs

```bash
# Document Validation Agent logs
aws logs tail /aws/lambda/DocumentValidationAgent --follow

# Identity Verification Agent logs
aws logs tail /aws/lambda/IdentityVerificationAgent --follow

# Fraud Detection Agent logs
aws logs tail /aws/lambda/FraudDetectionAgent --follow

# Compliance Reporting Agent logs
aws logs tail /aws/lambda/ComplianceReportingAgent --follow

# Step Functions logs
aws logs tail /aws/states/KycWorkflow --follow
```

## Troubleshooting Quick Fixes

### Issue: CDK Deploy Fails

```bash
# Clear CDK cache and retry
cd infrastructure
rm -rf cdk.out node_modules
npm install
cdk synth
cdk deploy
```

### Issue: Frontend Not Loading

```bash
# Invalidate CloudFront cache
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Origins.Items[?contains(DomainName,'kyc-ui')]].Id" \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

### Issue: Lambda Build Fails

```bash
# Ensure Java 21 is active
java -version

# Clean rebuild
cd backend
mvn clean package -U
```

### Issue: API CORS Errors

Ensure CORS is properly configured in `infrastructure/lib/kyc-stack.ts`:

```typescript
defaultCorsPreflightOptions: {
  allowOrigins: apigateway.Cors.ALL_ORIGINS,
  allowMethods: apigateway.Cors.ALL_METHODS,
}
```

## Next Steps

Now that your platform is running:

1. **Explore the Dashboard** - Upload documents, monitor status
2. **Review Logs** - Check CloudWatch for detailed execution logs
3. **Understand Architecture** - Read [Architecture Overview](./01-architecture-overview.md)
4. **Customize Agents** - Modify Lambda functions for your needs
5. **Set Up Monitoring** - Configure CloudWatch alarms
6. **Security Hardening** - Review [Security & IAM](./14-security-iam.md)

## Cleanup

To remove all resources and avoid charges:

```bash
# One command cleanup
chmod +x destroy.sh
./destroy.sh

# Or manually
cd infrastructure
cdk destroy
```

⚠️ **Warning**: This will delete all data including uploaded documents and DynamoDB records.

## Getting Help

- **Documentation**: [Full Documentation](./README.md)
- **Troubleshooting**: [Troubleshooting Guide](./13-troubleshooting.md)
- **API Reference**: [API Documentation](./09-api-reference.md)
- **AWS Support**: [AWS Console](https://console.aws.amazon.com/support/)

## Estimated Deployment Time

- **Backend Build**: 2-3 minutes
- **CDK Bootstrap** (first time): 2-3 minutes
- **Infrastructure Deploy**: 5-8 minutes
- **Frontend Build**: 1-2 minutes
- **Frontend Deploy**: 1 minute
- **Total**: ~10-15 minutes

## Cost Estimate

With AWS Free Tier:
- **First 12 Months**: ~$1-2/month
- **After Free Tier**: ~$5-10/month (low usage)

See [Cost Analysis](./17-cost-analysis.md) for details.
