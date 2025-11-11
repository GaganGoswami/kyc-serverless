# AWS Serverless KYC Platform

An event-driven, agent-based Know Your Customer (KYC) verification system built entirely on AWS serverless services.

## 🏗️ Architecture

This platform uses:
- **AWS Lambda** - 4 autonomous agents (DocumentValidation, IdentityVerification, FraudDetection, ComplianceReporting)
- **EventBridge** - Event bus for inter-agent communication
- **Step Functions** - Workflow orchestration
- **DynamoDB** - KYC records and audit logs
- **S3** - Document storage and UI hosting
- **API Gateway** - REST API for frontend
- **CloudFront** - CDN for React dashboard
- **CloudWatch** - Logging and monitoring

## 📁 Project Structure

```
kyc-serverless/
├── infrastructure/          # AWS CDK infrastructure code
│   ├── bin/                # CDK app entry point
│   ├── lib/                # Stack definitions
│   └── statemachine/       # Step Functions definitions
├── backend/                # Java Lambda functions
│   └── src/main/java/      # Agent implementations
├── frontend/               # React + Vite dashboard
│   └── src/                # UI components and pages
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- AWS CLI configured with credentials
- Node.js 18+ and npm
- Java 17+ and Maven
- AWS CDK CLI (`npm install -g aws-cdk`)

### 1. Deploy Infrastructure

```bash
cd infrastructure
npm install
cdk bootstrap  # First time only
cdk deploy
```

### 2. Build & Deploy Lambda Functions

```bash
cd backend
mvn clean package
# Functions deployed automatically via CDK
```

### 3. Deploy Frontend

```bash
cd frontend
npm install
npm run build
aws s3 sync dist/ s3://$(aws cloudformation describe-stacks --stack-name KycStack --query "Stacks[0].Outputs[?OutputKey=='UIBucketName'].OutputValue" --output text)
```

### 4. Access Dashboard

Get the CloudFront URL:
```bash
aws cloudformation describe-stacks --stack-name KycStack --query "Stacks[0].Outputs[?OutputKey=='DashboardURL'].OutputValue" --output text
```

## 🔄 KYC Workflow

1. User uploads document via React UI → S3
2. S3 trigger invokes **DocumentValidationAgent**
3. Agent validates document and emits `Document.Validated` event
4. Step Function orchestrates remaining agents sequentially:
   - **IdentityVerificationAgent** → verifies identity
   - **FraudDetectionAgent** → checks for fraud indicators
   - **ComplianceReportingAgent** → generates compliance report
5. Final status stored in DynamoDB
6. UI polls API Gateway for real-time updates

## 🧪 Testing

### Test Document Upload
```bash
# Get pre-signed upload URL
curl -X POST https://<api-gateway-url>/upload \
  -H "Content-Type: application/json" \
  -d '{"customerId":"test-123","documentType":"passport"}'

# Upload file using pre-signed URL
curl -X PUT "<presigned-url>" --upload-file ./test-document.pdf
```

### View KYC Status
```bash
curl https://<api-gateway-url>/kyc/test-123
```

## 📊 Monitoring

- **CloudWatch Logs**: `/aws/lambda/DocumentValidationAgent`, etc.
- **Step Functions Console**: View workflow executions
- **DynamoDB**: Query `KYCRecords` table
- **EventBridge**: Monitor event bus metrics

## 💰 Cost Optimization (Free Tier Friendly)

- Lambda: 1M requests/month free
- DynamoDB: 25 GB storage + 25 RCU/WCU free
- S3: 5 GB storage free
- CloudFront: 1 TB data transfer out free (12 months)
- API Gateway: 1M requests free (12 months)

## 🔐 Security

- IAM roles with least privilege
- S3 bucket encryption enabled
- API Gateway with API key authentication
- CloudWatch Logs encryption
- VPC endpoints (optional for enhanced security)

## 🧩 Extension Ideas

- Integrate Amazon Bedrock for AI-powered document analysis
- Add AWS Rekognition for facial recognition
- Implement AWS Textract for document OCR
- Use Amazon Cognito for user authentication
- Add AWS X-Ray for distributed tracing
- Enable EventBridge Schema Registry for type safety

## 📝 License

MIT
