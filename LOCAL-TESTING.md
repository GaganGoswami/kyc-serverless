# Local Development & Testing Guide (macOS)

This guide walks you through running and testing the KYC platform on your local macOS machine.

## Prerequisites

### Required Software

1. **Node.js 18+**
   ```bash
   node --version  # Should be 18.0.0 or higher
   ```
   Install via Homebrew: `brew install node`

2. **Java 17+**
   ```bash
   java -version  # Should be 17 or higher
   ```
   Install via Homebrew: `brew install openjdk@17`

3. **Maven**
   ```bash
   mvn -version
   ```
   Install via Homebrew: `brew install maven`

4. **AWS CLI**
   ```bash
   aws --version
   ```
   Install via Homebrew: `brew install awscli`
   Configure: `aws configure`

5. **AWS SAM CLI** (for local Lambda testing)
   ```bash
   sam --version
   ```
   Install via Homebrew: `brew install aws-sam-cli`

6. **Docker Desktop** (for SAM local testing)
   Download from: https://www.docker.com/products/docker-desktop

## Local Development Setup

### 1. Frontend Development (React Dashboard)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create local environment file
cat > .env.local << EOF
VITE_API_URL=http://localhost:3001
EOF

# Start development server with hot reload
npm run dev
```

The dashboard will be available at: **http://localhost:3000**

#### Frontend Features Available Locally:
- ✅ Dashboard UI (mock data mode)
- ✅ Upload page UI
- ✅ Logs viewer UI
- ✅ Dark/Light mode
- ⚠️ API calls will fail until backend is running

### 2. Mock Backend API (Quick Testing)

For quick frontend testing without AWS, create a simple mock server:

```bash
# Navigate to frontend directory
cd frontend

# Create mock server file
cat > mock-server.js << 'EOF'
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Mock KYC records
const mockRecords = [
  {
    customerId: 'customer-001',
    eventType: 'Document.Validated',
    kycStatus: 'VALIDATED',
    documentUrl: 's3://bucket/doc1.pdf',
    verificationScore: 0.95,
    lastUpdated: new Date().toISOString(),
    metadata: 'Document validated successfully'
  },
  {
    customerId: 'customer-002',
    eventType: 'Identity.Verified',
    kycStatus: 'VERIFIED',
    documentUrl: 's3://bucket/doc2.pdf',
    verificationScore: 0.88,
    lastUpdated: new Date().toISOString(),
    metadata: 'Identity verified'
  }
];

app.get('/kyc', (req, res) => {
  res.json(mockRecords);
});

app.get('/kyc/:customerId', (req, res) => {
  const records = mockRecords.filter(r => r.customerId === req.params.customerId);
  res.json(records);
});

app.post('/upload', (req, res) => {
  res.json({
    uploadUrl: 'https://mock-presigned-url.s3.amazonaws.com',
    key: `uploads/${req.body.customerId}/${Date.now()}.pdf`
  });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Mock API running on http://localhost:${PORT}`));
EOF

# Install express and cors
npm install express cors

# Run mock server
node mock-server.js
```

Now your frontend can communicate with the mock backend!

### 3. Local Lambda Testing with SAM

#### Build Java Lambda Functions

```bash
# Navigate to backend directory
cd backend

# Build Lambda package
mvn clean package

# Verify JAR was created
ls -lh target/kyc-agents.jar
```

#### Create SAM Template for Local Testing

```bash
# Navigate to project root
cd ..

# Create local SAM template
cat > template-local.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    Runtime: java17
    MemorySize: 512
    Environment:
      Variables:
        TABLE_NAME: KYCRecords
        EVENT_BUS_NAME: kyc-event-bus
        DOCUMENT_BUCKET: kyc-documents-local

Resources:
  DocumentValidationAgent:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/target/kyc-agents.jar
      Handler: com.kyc.agents.DocumentValidationAgent::handleRequest

  IdentityVerificationAgent:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/target/kyc-agents.jar
      Handler: com.kyc.agents.IdentityVerificationAgent::handleRequest

  FraudDetectionAgent:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/target/kyc-agents.jar
      Handler: com.kyc.agents.FraudDetectionAgent::handleRequest

  ComplianceReportingAgent:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: backend/target/kyc-agents.jar
      Handler: com.kyc.agents.ComplianceReportingAgent::handleRequest
EOF
```

#### Test Lambda Functions Locally

```bash
# Create test event
cat > events/document-validation-event.json << 'EOF'
{
  "customerId": "test-customer-123",
  "documentUrl": "s3://test-bucket/documents/test.pdf"
}
EOF

# Invoke DocumentValidationAgent locally
sam local invoke DocumentValidationAgent -e events/document-validation-event.json

# Start local API Gateway (if needed)
sam local start-api
```

### 4. Local DynamoDB (DynamoDB Local)

```bash
# Run DynamoDB Local via Docker
docker run -d -p 8000:8000 --name dynamodb-local amazon/dynamodb-local

# Create local table
aws dynamodb create-table \
  --table-name KYCRecords \
  --attribute-definitions \
    AttributeName=customerId,AttributeType=S \
    AttributeName=eventType,AttributeType=S \
  --key-schema \
    AttributeName=customerId,KeyType=HASH \
    AttributeName=eventType,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000

# Verify table creation
aws dynamodb list-tables --endpoint-url http://localhost:8000

# Insert test data
aws dynamodb put-item \
  --table-name KYCRecords \
  --item '{"customerId":{"S":"test-123"},"eventType":{"S":"Document.Validated"},"kycStatus":{"S":"VALIDATED"},"lastUpdated":{"S":"2025-11-11T10:00:00Z"}}' \
  --endpoint-url http://localhost:8000

# Query data
aws dynamodb query \
  --table-name KYCRecords \
  --key-condition-expression "customerId = :id" \
  --expression-attribute-values '{":id":{"S":"test-123"}}' \
  --endpoint-url http://localhost:8000
```

### 5. Local S3 (LocalStack)

```bash
# Run LocalStack via Docker
docker run -d -p 4566:4566 --name localstack localstack/localstack

# Create local S3 bucket
aws s3 mb s3://kyc-documents-local --endpoint-url http://localhost:4566

# Upload test file
echo "Test document" > test-document.txt
aws s3 cp test-document.txt s3://kyc-documents-local/uploads/test/ --endpoint-url http://localhost:4566

# List objects
aws s3 ls s3://kyc-documents-local/uploads/ --recursive --endpoint-url http://localhost:4566
```

## Complete Local Testing Workflow

### Option 1: Frontend Only (Mock Backend)

```bash
# Terminal 1: Run mock API server
cd frontend
node mock-server.js

# Terminal 2: Run React dev server
cd frontend
npm run dev

# Open browser: http://localhost:3000
```

### Option 2: Full Stack Local (with AWS Services)

```bash
# Terminal 1: Start LocalStack (S3, DynamoDB)
docker run -p 4566:4566 -p 8000:8000 localstack/localstack

# Terminal 2: Start SAM local API
sam local start-api --port 3001

# Terminal 3: Run React dev server
cd frontend
npm run dev

# Open browser: http://localhost:3000
```

## Testing Scenarios

### Test 1: UI Component Testing

```bash
cd frontend
npm run dev

# Test manually:
# 1. Visit http://localhost:3000
# 2. Check dashboard loads
# 3. Navigate to Upload page
# 4. Navigate to Logs page
# 5. Toggle dark/light mode
```

### Test 2: API Integration Testing

```bash
# With mock server running on port 3001
curl http://localhost:3001/kyc
curl http://localhost:3001/kyc/customer-001
curl -X POST http://localhost:3001/upload \
  -H "Content-Type: application/json" \
  -d '{"customerId":"test-123","documentType":"passport"}'
```

### Test 3: Lambda Function Testing

```bash
# Test DocumentValidationAgent
sam local invoke DocumentValidationAgent \
  -e events/document-validation-event.json

# Test with Docker logs
sam local invoke DocumentValidationAgent \
  -e events/document-validation-event.json \
  --log-file lambda-logs.txt
```

### Test 4: DynamoDB Operations

```bash
# Insert record
aws dynamodb put-item \
  --table-name KYCRecords \
  --item file://test-data/kyc-record.json \
  --endpoint-url http://localhost:8000

# Query records
aws dynamodb scan \
  --table-name KYCRecords \
  --endpoint-url http://localhost:8000
```

## Debugging Tips

### Frontend Debugging

```bash
# Check console logs in browser DevTools
# Enable React DevTools extension
# Use browser network tab to inspect API calls

# Check Vite dev server logs
cd frontend
npm run dev -- --debug
```

### Backend Debugging

```bash
# Enable verbose SAM logging
sam local invoke DocumentValidationAgent \
  -e events/test-event.json \
  --debug

# Check Lambda logs
tail -f lambda-logs.txt

# Debug Java with remote debugging
sam local invoke DocumentValidationAgent \
  -e events/test-event.json \
  -d 5858

# Attach Java debugger to port 5858
```

### Common Issues

#### Issue 1: Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>
```

#### Issue 2: Docker Not Running
```bash
# Check Docker status
docker ps

# Start Docker Desktop
open -a Docker
```

#### Issue 3: Java Version Mismatch
```bash
# Switch Java version (if using jenv)
jenv versions
jenv local 17

# Or set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

## Environment Variables

### Frontend (.env.local)
```bash
VITE_API_URL=http://localhost:3001
```

### Lambda Functions (local)
```bash
export TABLE_NAME=KYCRecords
export EVENT_BUS_NAME=kyc-event-bus
export DOCUMENT_BUCKET=kyc-documents-local
export AWS_ENDPOINT_URL=http://localhost:4566
```

## Hot Reload & Live Development

### Frontend Hot Reload (Automatic)
```bash
cd frontend
npm run dev
# Edit any file in src/ - changes reflect immediately
```

### Backend Hot Reload (Manual)
```bash
cd backend

# Watch for changes and rebuild
mvn compile -DskipTests

# Or use Maven wrapper with continuous build
mvn compile -DskipTests -o
```

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
brew install httpd

# Test API endpoint
ab -n 1000 -c 10 http://localhost:3001/kyc

# Test with POST request
ab -n 100 -c 5 -p test-data/upload-request.json \
  -T application/json \
  http://localhost:3001/upload
```

## Clean Up Local Resources

```bash
# Stop and remove Docker containers
docker stop localstack dynamodb-local
docker rm localstack dynamodb-local

# Clear node_modules (if needed)
cd frontend
rm -rf node_modules
npm install

# Clean Maven build
cd backend
mvn clean
```

## Next Steps

Once local testing is complete:
1. ✅ Verify all UI components work
2. ✅ Test API integration end-to-end
3. ✅ Validate Lambda function logic
4. ✅ Deploy to AWS: `./deploy.sh`
5. ✅ Test in AWS environment

## Useful Commands Cheat Sheet

```bash
# Frontend
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Backend
mvn clean package        # Build Lambda JAR
mvn test                 # Run tests
mvn compile              # Quick compile

# SAM
sam local invoke         # Invoke Lambda locally
sam local start-api      # Start local API Gateway
sam build                # Build SAM application

# Docker
docker ps                # List running containers
docker logs <container>  # View container logs
docker stop <container>  # Stop container

# AWS Local
aws dynamodb scan --table-name KYCRecords --endpoint-url http://localhost:8000
aws s3 ls s3://kyc-documents-local --endpoint-url http://localhost:4566
```

## Support

For issues or questions:
- Check logs: Browser console, Terminal output, Docker logs
- Review ARCHITECTURE.md for system design
- Check DEPLOYMENT.md for AWS-specific guidance
