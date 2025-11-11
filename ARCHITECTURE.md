# Architecture Documentation

## System Overview

The AWS Serverless KYC Platform is an event-driven, agent-based system that automates Know Your Customer (KYC) verification workflows using AWS serverless services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Dashboard (CloudFront)                 │
│                    Upload │ View Status │ Monitor Logs              │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       │ REST API
                       ▼
               ┌───────────────┐
               │  API Gateway  │
               └───────┬───────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Lambda (API Handler)       │
        │  • Get KYC Records           │
        │  • Generate Upload URLs      │
        │  • Query Status              │
        └──────────┬───────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   DynamoDB      │◄────────────────┐
         │  (KYC Records)  │                 │
         └─────────────────┘                 │
                                             │
┌────────────────────────────────────────────┼──────────────┐
│                   Event Flow                │              │
└────────────────────────────────────────────┼──────────────┘
                                             │
    User Upload                              │
        │                                    │
        ▼                                    │
    ┌───────┐                                │
    │  S3   │ trigger                        │
    │(Docs) │────────┐                       │
    └───────┘        │                       │
                     ▼                       │
            ┌─────────────────────┐          │
            │ DocumentValidation  │          │
            │      Agent          │──────────┤
            │  (Lambda)           │          │
            └──────────┬──────────┘          │
                       │                     │
                       │ publishes           │
                       ▼                     │
               ┌──────────────┐              │
               │ EventBridge  │              │
               │  Event Bus   │              │
               └──────┬───────┘              │
                      │                      │
                      │ triggers             │
                      ▼                      │
           ┌────────────────────┐            │
           │  Step Functions    │            │
           │   (Orchestrator)   │            │
           └─────────┬──────────┘            │
                     │                       │
         ┌───────────┼───────────┐           │
         │           │           │           │
         ▼           ▼           ▼           │
    ┌────────┐  ┌────────┐  ┌────────┐      │
    │Identity│  │ Fraud  │  │Complnce│      │
    │Verify  │  │Detect  │  │Report  │      │
    │Agent   │  │Agent   │  │Agent   │      │
    └────┬───┘  └────┬───┘  └────┬───┘      │
         │           │           │           │
         └───────────┴───────────┴───────────┘
                     │
                     │ stores results
                     ▼
               ┌──────────────┐
               │  DynamoDB    │
               │ & S3 Reports │
               └──────────────┘
```

## Components

### 1. Frontend (React + Vite)

**Technologies:**
- React 18
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)
- React Router

**Features:**
- Document upload interface
- Real-time status dashboard
- Event log viewer
- Dark mode support

**Hosting:**
- S3 static website
- CloudFront CDN
- HTTPS enabled

### 2. API Gateway

**Endpoints:**
- `POST /upload` - Generate presigned S3 upload URL
- `GET /kyc` - List all KYC records (with status filter)
- `GET /kyc/{customerId}` - Get customer-specific records

**Features:**
- CORS enabled
- Request/response logging
- Throttling and rate limiting
- API key authentication (optional)

### 3. Lambda Functions (Java 17)

#### a) DocumentValidationAgent
**Trigger:** S3 ObjectCreated event
**Purpose:** Validate uploaded documents
**Actions:**
- Check file format and size
- Extract metadata
- Calculate validation score
- Store results in DynamoDB
- Publish `Document.Validated` event

#### b) IdentityVerificationAgent
**Trigger:** Step Functions task
**Purpose:** Verify customer identity
**Actions:**
- Extract document information
- Cross-reference with databases
- Calculate verification score
- Update DynamoDB
- Publish `Identity.Verified` event

#### c) FraudDetectionAgent
**Trigger:** Step Functions task
**Purpose:** Detect fraud indicators
**Actions:**
- Analyze document tampering
- Check fraud databases
- Calculate risk score
- Update DynamoDB
- Publish `Fraud.Checked` event

#### d) ComplianceReportingAgent
**Trigger:** Step Functions task
**Purpose:** Generate compliance reports
**Actions:**
- Aggregate verification results
- Generate comprehensive report
- Store report in S3
- Update final KYC status
- Publish `KYC.Completed` event

### 4. EventBridge

**Event Bus:** `kyc-event-bus`

**Event Types:**
- `Document.Uploaded`
- `Document.Validated`
- `Identity.Verified`
- `Fraud.Checked`
- `KYC.Completed`

**Event Pattern:**
```json
{
  "source": ["kyc.validation", "kyc.verification", "kyc.fraud", "kyc.compliance"],
  "detail-type": ["Document.Validated", "Identity.Verified", ...]
}
```

### 5. Step Functions

**State Machine:** `KycWorkflow`

**States:**
1. DocumentValidation → validates input
2. IdentityVerification → verifies identity
3. FraudDetection → checks for fraud
4. ComplianceReporting → generates report
5. Error handling for each state

**Features:**
- Retry logic with exponential backoff
- Error catching and handling
- Workflow visualization
- Execution history tracking

### 6. DynamoDB

**Table:** `KYCRecords`

**Schema:**
```
Partition Key: customerId (string)
Sort Key: eventType (string)
Attributes:
  - kycStatus (enum)
  - documentUrl (string)
  - verificationScore (number)
  - fraudScore (number)
  - lastUpdated (timestamp)
  - metadata (string)
```

**GSI:** `KycStatusIndex`
- Partition Key: `kycStatus`
- Sort Key: `lastUpdated`

**Features:**
- On-demand billing
- Point-in-time recovery
- Encryption at rest
- DynamoDB Streams enabled

### 7. S3 Buckets

#### Documents Bucket
**Name:** `kyc-documents-{account}-{region}`
**Purpose:** Store customer documents and reports
**Structure:**
```
/uploads/{customerId}/{timestamp}-{documentType}
/reports/{customerId}/compliance-report-{timestamp}.txt
```
**Features:**
- Versioning enabled
- Server-side encryption
- Lifecycle policies (90-day expiration)
- Event notifications to Lambda

#### UI Bucket
**Name:** `kyc-ui-{account}-{region}`
**Purpose:** Host React application
**Features:**
- Static website hosting
- CloudFront origin
- Block public access (CloudFront OAI)

### 8. CloudFront

**Distribution:** KYC Dashboard CDN
**Origin:** S3 UI bucket
**Features:**
- HTTPS redirect
- Caching optimization
- SPA routing (404 → index.html)
- Global edge locations

## Data Flow

### Upload Flow
1. User uploads document via UI
2. Frontend requests presigned URL from API Gateway
3. Lambda generates S3 presigned URL
4. Frontend uploads directly to S3
5. S3 triggers DocumentValidationAgent
6. Agent validates and publishes event
7. EventBridge triggers Step Functions
8. Workflow executes remaining agents sequentially
9. Results stored in DynamoDB
10. UI polls API for status updates

### Query Flow
1. User views dashboard
2. Frontend calls API Gateway
3. Lambda queries DynamoDB
4. Results returned to frontend
5. UI displays status cards and tables

## Security Architecture

### IAM Roles
- Lambda execution role (least privilege)
- API Gateway invocation role
- Step Functions execution role
- CloudFront OAI for S3 access

### Encryption
- S3: Server-side encryption (SSE-S3)
- DynamoDB: AWS managed encryption
- Transit: HTTPS/TLS only

### Access Control
- S3 buckets: Block public access
- API Gateway: CORS restrictions
- Lambda: VPC optional (not required for Free Tier)

## Event Schema

### KYC Event Structure
```typescript
{
  customerId: string
  eventType: string
  kycStatus: 'PENDING' | 'VALIDATED' | 'VERIFIED' | 'COMPLETED' | 'FAILED' | 'FRAUD_DETECTED'
  documentUrl?: string
  verificationScore?: number
  fraudScore?: number
  lastUpdated: string (ISO timestamp)
  metadata?: string
}
```

## Monitoring & Observability

### CloudWatch Logs
- Lambda function logs (7-day retention)
- API Gateway access logs
- Step Functions execution logs

### Metrics
- Lambda invocations, errors, duration
- API Gateway requests, latency, errors
- DynamoDB read/write capacity
- Step Functions executions, failures

### Alarms (Optional)
- Lambda error rate > 5%
- API Gateway 5xx errors
- Step Functions failed executions

## Scalability

### Auto-scaling
- Lambda: Automatic (1000 concurrent executions default)
- DynamoDB: On-demand auto-scaling
- API Gateway: Throttling limits

### Performance
- Lambda cold start: ~2-3s (Java 17)
- API response time: <500ms
- S3 upload: Direct from browser (no Lambda overhead)
- Step Functions: Parallel execution where possible

## Cost Breakdown

### Monthly Estimates (Light Usage)
- Lambda: Free (1M requests free tier)
- DynamoDB: Free (25GB + 25 RCU/WCU)
- S3: ~$0.50 (20GB storage)
- CloudFront: Free (1TB transfer, 12 months)
- API Gateway: Free (1M requests, 12 months)
- Step Functions: ~$1.00 (4000 state transitions)
- **Total: ~$1.50/month** (after 12-month free tier)

## Extension Points

### Future Enhancements
1. **Amazon Textract** - OCR for document data extraction
2. **Amazon Rekognition** - Facial recognition and liveness detection
3. **Amazon Bedrock** - AI-powered document analysis
4. **AWS Cognito** - User authentication
5. **AWS AppSync** - GraphQL API for real-time updates
6. **AWS X-Ray** - Distributed tracing
7. **EventBridge Schema Registry** - Type-safe events
8. **Amazon SQS** - Dead letter queues for failed events

## Compliance & Best Practices

- **GDPR**: Data retention policies, right to deletion
- **PCI DSS**: Secure document handling
- **HIPAA**: Encryption at rest and in transit (if applicable)
- **Well-Architected Framework**: Operational excellence, security, reliability, performance, cost optimization
