# Deployment Guide

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Node.js** 18+ and npm
4. **Java** 17+ and Maven
5. **AWS CDK CLI** (`npm install -g aws-cdk`)

## Quick Start

### 1. One-Command Deployment

```bash
chmod +x deploy.sh
./deploy.sh
```

This script will:
- Build Java Lambda functions
- Deploy AWS infrastructure
- Build and deploy React frontend
- Output all necessary URLs

### 2. Manual Deployment

#### Step 1: Build Backend

```bash
cd backend
mvn clean package
cd ..
```

#### Step 2: Deploy Infrastructure

```bash
cd infrastructure
npm install
cdk bootstrap  # First time only
cdk deploy
cd ..
```

#### Step 3: Build & Deploy Frontend

```bash
cd frontend

# Update .env with your API Gateway URL
echo "VITE_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod" > .env

npm install
npm run build

# Get bucket name from CDK outputs
aws s3 sync dist/ s3://your-ui-bucket-name
cd ..
```

## Configuration

### API Gateway URL

After CDK deployment, update the frontend configuration:

```bash
# frontend/.env
VITE_API_URL=https://your-api-gateway-url/prod
```

### AWS Region

Default region is `us-east-1`. To change:

```typescript
// infrastructure/bin/kyc-app.ts
region: 'your-preferred-region'
```

## Testing

### Test Document Upload

```bash
# Get presigned upload URL
curl -X POST https://your-api-url/prod/upload \
  -H "Content-Type: application/json" \
  -d '{"customerId":"test-123","documentType":"passport"}'

# Upload file
curl -X PUT "presigned-url" --upload-file ./document.pdf
```

### Test API Endpoints

```bash
# Get all KYC records
curl https://your-api-url/prod/kyc

# Get specific customer records
curl https://your-api-url/prod/kyc/customer-123
```

## Monitoring

### CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/DocumentValidationAgent --follow
aws logs tail /aws/lambda/IdentityVerificationAgent --follow
aws logs tail /aws/lambda/FraudDetectionAgent --follow
aws logs tail /aws/lambda/ComplianceReportingAgent --follow
```

### Step Functions

1. Open AWS Console → Step Functions
2. Find `KycWorkflow` state machine
3. View executions and workflow visualizations

### DynamoDB

```bash
# Query KYC records
aws dynamodb query \
  --table-name KYCRecords \
  --key-condition-expression "customerId = :id" \
  --expression-attribute-values '{":id":{"S":"customer-123"}}'
```

## Troubleshooting

### Lambda Build Fails

```bash
# Ensure Java 17 is installed
java -version

# Clean and rebuild
cd backend
mvn clean package -U
```

### CDK Deploy Fails

```bash
# Update CDK
npm install -g aws-cdk@latest

# Clear CDK cache
rm -rf cdk.out
cdk synth
cdk deploy
```

### Frontend Not Loading

```bash
# Check CloudFront distribution status
aws cloudfront list-distributions

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### API Gateway CORS Issues

Ensure CORS is enabled in `infrastructure/lib/kyc-stack.ts`:

```typescript
defaultCorsPreflightOptions: {
  allowOrigins: apigateway.Cors.ALL_ORIGINS,
  allowMethods: apigateway.Cors.ALL_METHODS,
}
```

## Cleanup

### Destroy All Resources

```bash
chmod +x destroy.sh
./destroy.sh
```

Or manually:

```bash
cd infrastructure
cdk destroy
```

## Cost Optimization

### Free Tier Usage
- Lambda: 1M requests/month free
- DynamoDB: 25 GB + 25 RCU/WCU free
- S3: 5 GB storage free
- CloudFront: 1 TB transfer (12 months)

### Reduce Costs
1. Use DynamoDB On-Demand billing
2. Enable S3 lifecycle policies
3. Set CloudWatch log retention to 7 days
4. Use Lambda reserved concurrency limits

## Security Best Practices

1. **Enable encryption** on all S3 buckets (already configured)
2. **Use API Gateway API keys** for production
3. **Enable CloudTrail** for audit logging
4. **Set up AWS WAF** for API Gateway
5. **Use AWS Secrets Manager** for sensitive data
6. **Enable VPC endpoints** for Lambda (optional)

## Performance Tuning

### Lambda Optimization
```typescript
// Increase memory for better performance
memorySize: 1024,
timeout: cdk.Duration.seconds(60),
```

### DynamoDB Optimization
```typescript
// Use provisioned capacity for predictable workloads
billingMode: dynamodb.BillingMode.PROVISIONED,
readCapacity: 5,
writeCapacity: 5,
```

## Development

### Local Testing

```bash
# Run frontend locally
cd frontend
npm run dev
# Open http://localhost:3000

# Test Lambda locally (requires SAM CLI)
sam local invoke DocumentValidationAgent -e events/sample-event.json
```

### Hot Reload

```bash
# CDK watch mode
cd infrastructure
cdk watch

# Frontend dev server
cd frontend
npm run dev
```
