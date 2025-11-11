# Architecture Overview

## Table of Contents
- [System Overview](#system-overview)
- [Architecture Diagrams](#architecture-diagrams)
- [Component Details](#component-details)
- [Event Flow](#event-flow)
- [Design Principles](#design-principles)

## System Overview

The AWS Serverless KYC Platform is an **event-driven, agent-based system** that automates Know Your Customer (KYC) verification workflows. It leverages AWS serverless services to provide a scalable, cost-effective, and maintainable solution for document verification and identity management.

### Key Characteristics

- **Event-Driven**: All components communicate asynchronously via EventBridge
- **Serverless**: No servers to manage; AWS handles infrastructure
- **Agent-Based**: Four specialized Lambda functions handle specific KYC tasks
- **Decoupled**: Components are loosely coupled for better maintainability
- **Scalable**: Auto-scales based on demand
- **Observable**: Complete logging and monitoring via CloudWatch

## Architecture Diagrams

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React Dashboard<br/>CloudFront + S3]
    end
    
    subgraph "API Layer"
        APIGW[API Gateway<br/>REST API]
        APILambda[API Handler<br/>Lambda]
    end
    
    subgraph "Storage Layer"
        S3Docs[S3 Documents<br/>Bucket]
        DDB[(DynamoDB<br/>KYC Records)]
    end
    
    subgraph "Event Processing"
        EB[EventBridge<br/>Event Bus]
        SF[Step Functions<br/>Orchestrator]
    end
    
    subgraph "Agent Layer"
        DocAgent[Document<br/>Validation<br/>Agent]
        IdAgent[Identity<br/>Verification<br/>Agent]
        FraudAgent[Fraud<br/>Detection<br/>Agent]
        CompAgent[Compliance<br/>Reporting<br/>Agent]
    end
    
    subgraph "Observability"
        CW[CloudWatch<br/>Logs & Metrics]
    end
    
    UI -->|HTTPS| APIGW
    APIGW --> APILambda
    APILambda -->|Query| DDB
    APILambda -->|Generate URL| S3Docs
    UI -->|Upload Direct| S3Docs
    
    S3Docs -->|ObjectCreated| DocAgent
    DocAgent -->|Event| EB
    DocAgent -->|Store| DDB
    
    EB -->|Trigger| SF
    SF -->|Invoke| IdAgent
    SF -->|Invoke| FraudAgent
    SF -->|Invoke| CompAgent
    
    IdAgent -->|Store| DDB
    FraudAgent -->|Store| DDB
    CompAgent -->|Store| DDB
    CompAgent -->|Report| S3Docs
    
    DocAgent -.->|Logs| CW
    IdAgent -.->|Logs| CW
    FraudAgent -.->|Logs| CW
    CompAgent -.->|Logs| CW
    SF -.->|Traces| CW
    
    style UI fill:#e1f5ff
    style APIGW fill:#fff4e6
    style EB fill:#f3e5f5
    style SF fill:#e8f5e9
    style DocAgent fill:#fff9c4
    style IdAgent fill:#fff9c4
    style FraudAgent fill:#fff9c4
    style CompAgent fill:#fff9c4
```

### KYC Workflow Sequence

```mermaid
sequenceDiagram
    participant User
    participant UI as React Dashboard
    participant API as API Gateway
    participant S3 as S3 Bucket
    participant DocAgent as Document Validation
    participant EB as EventBridge
    participant SF as Step Functions
    participant IdAgent as Identity Verification
    participant FraudAgent as Fraud Detection
    participant CompAgent as Compliance Reporting
    participant DDB as DynamoDB
    
    User->>UI: Upload Document
    UI->>API: Request Upload URL
    API->>S3: Generate Presigned URL
    S3-->>API: Return URL
    API-->>UI: Return URL
    UI->>S3: Upload File Direct
    S3-->>UI: Upload Success
    
    Note over S3,DocAgent: S3 Event Trigger
    S3->>DocAgent: ObjectCreated Event
    DocAgent->>DocAgent: Validate Document
    DocAgent->>DDB: Store Validation Result
    DocAgent->>EB: Publish Document.Validated
    
    Note over EB,SF: EventBridge Trigger
    EB->>SF: Start Workflow
    
    SF->>IdAgent: Invoke Identity Check
    IdAgent->>IdAgent: Verify Identity
    IdAgent->>DDB: Store Verification Result
    IdAgent-->>SF: Return Result
    
    SF->>FraudAgent: Invoke Fraud Check
    FraudAgent->>FraudAgent: Detect Fraud
    FraudAgent->>DDB: Store Fraud Result
    FraudAgent-->>SF: Return Result
    
    SF->>CompAgent: Invoke Compliance
    CompAgent->>CompAgent: Generate Report
    CompAgent->>S3: Store Report
    CompAgent->>DDB: Store Final Status
    CompAgent-->>SF: Return Result
    
    SF-->>EB: Workflow Complete
    
    User->>UI: Check Status
    UI->>API: Query KYC Records
    API->>DDB: Get Records
    DDB-->>API: Return Data
    API-->>UI: Return Records
    UI-->>User: Display Status
```

### Event-Driven Architecture

```mermaid
graph LR
    subgraph "Event Sources"
        S3[S3 Upload]
        API[API Request]
    end
    
    subgraph "Event Bus"
        EB[EventBridge<br/>kyc-event-bus]
    end
    
    subgraph "Event Types"
        E1[Document.Validated]
        E2[Identity.Verified]
        E3[Fraud.Checked]
        E4[KYC.Completed]
    end
    
    subgraph "Event Consumers"
        SF[Step Functions]
        Lambda[Lambda Functions]
        CW[CloudWatch Rules]
    end
    
    S3 -->|S3Event| Lambda
    Lambda -->|Publish| E1
    E1 --> EB
    EB --> SF
    
    SF -->|Invoke| Lambda
    Lambda -->|Publish| E2
    Lambda -->|Publish| E3
    Lambda -->|Publish| E4
    
    E2 --> EB
    E3 --> EB
    E4 --> EB
    
    EB --> CW
    
    style EB fill:#f3e5f5
    style E1 fill:#e8f5e9
    style E2 fill:#e8f5e9
    style E3 fill:#e8f5e9
    style E4 fill:#e8f5e9
```

### Data Flow Architecture

```mermaid
flowchart TD
    Start([User Uploads Document]) --> Upload[Upload to S3]
    Upload --> Trigger[S3 Triggers Lambda]
    
    Trigger --> DocVal{Document<br/>Validation}
    DocVal -->|Valid| DDB1[(Store Result)]
    DocVal -->|Invalid| Fail1[Mark Failed]
    
    DDB1 --> Event1[Publish Event]
    Event1 --> StepFn[Step Functions<br/>Workflow Start]
    
    StepFn --> IdVerify{Identity<br/>Verification}
    IdVerify -->|Verified| DDB2[(Store Result)]
    IdVerify -->|Failed| Fail2[Mark Failed]
    
    DDB2 --> FraudCheck{Fraud<br/>Detection}
    FraudCheck -->|Clean| DDB3[(Store Result)]
    FraudCheck -->|Fraud| Fail3[Mark Fraud]
    
    DDB3 --> Compliance[Compliance<br/>Reporting]
    Compliance --> Report[Generate Report]
    Report --> S3Report[Store in S3]
    S3Report --> DDB4[(Final Status)]
    
    DDB4 --> Complete([KYC Complete])
    Fail1 --> Complete
    Fail2 --> Complete
    Fail3 --> Complete
    
    Complete --> Dashboard[Dashboard<br/>Display]
    
    style DocVal fill:#fff9c4
    style IdVerify fill:#fff9c4
    style FraudCheck fill:#fff9c4
    style Compliance fill:#fff9c4
    style DDB1 fill:#e1f5ff
    style DDB2 fill:#e1f5ff
    style DDB3 fill:#e1f5ff
    style DDB4 fill:#e1f5ff
```

### Infrastructure Architecture

```mermaid
graph TB
    subgraph "Edge Layer - CloudFront"
        CF[CloudFront<br/>Distribution]
    end
    
    subgraph "Presentation Layer"
        S3UI[S3 Bucket<br/>Static Website]
    end
    
    subgraph "API Layer"
        APIGW[API Gateway<br/>REST API]
        APIFunc[Lambda<br/>API Handler]
    end
    
    subgraph "Application Layer"
        Agent1[Lambda<br/>Doc Validation]
        Agent2[Lambda<br/>Identity Verify]
        Agent3[Lambda<br/>Fraud Detection]
        Agent4[Lambda<br/>Compliance Report]
    end
    
    subgraph "Orchestration Layer"
        EB[EventBridge<br/>Event Bus]
        SF[Step Functions<br/>State Machine]
    end
    
    subgraph "Data Layer"
        DDB[(DynamoDB<br/>Tables)]
        S3Data[S3 Bucket<br/>Documents]
    end
    
    subgraph "Observability Layer"
        CWL[CloudWatch<br/>Logs]
        CWM[CloudWatch<br/>Metrics]
        CWA[CloudWatch<br/>Alarms]
    end
    
    CF --> S3UI
    CF --> APIGW
    APIGW --> APIFunc
    
    APIFunc --> DDB
    APIFunc --> S3Data
    
    S3Data --> Agent1
    Agent1 --> EB
    EB --> SF
    
    SF --> Agent2
    SF --> Agent3
    SF --> Agent4
    
    Agent1 --> DDB
    Agent2 --> DDB
    Agent3 --> DDB
    Agent4 --> DDB
    Agent4 --> S3Data
    
    Agent1 -.-> CWL
    Agent2 -.-> CWL
    Agent3 -.-> CWL
    Agent4 -.-> CWL
    APIFunc -.-> CWL
    
    CWL -.-> CWM
    CWM -.-> CWA
    
    style CF fill:#ff9800
    style S3UI fill:#e1f5ff
    style APIGW fill:#fff4e6
    style Agent1 fill:#fff9c4
    style Agent2 fill:#fff9c4
    style Agent3 fill:#fff9c4
    style Agent4 fill:#fff9c4
    style EB fill:#f3e5f5
    style SF fill:#e8f5e9
    style DDB fill:#bbdefb
    style S3Data fill:#e1f5ff
```

## Component Details

### 1. Frontend Layer

**React Dashboard** (Hosted on CloudFront + S3)
- **Purpose**: User interface for document uploads and status monitoring
- **Technology**: React 18, TypeScript, TailwindCSS, Vite
- **Features**:
  - Document upload interface
  - Real-time status dashboard
  - Event log viewer
  - Dark mode support
- **Hosting**: S3 static website with CloudFront CDN
- **Performance**: Global edge caching, HTTPS redirect

### 2. API Layer

**API Gateway** (REST API)
- **Purpose**: Expose backend functionality to frontend
- **Endpoints**:
  - `POST /upload` - Generate presigned S3 upload URL
  - `GET /kyc` - List all KYC records
  - `GET /kyc/{customerId}` - Get specific customer records
- **Features**:
  - CORS enabled for cross-origin requests
  - Request/response logging
  - Throttling and rate limiting
  - CloudWatch metrics

**API Handler Lambda**
- **Purpose**: Process API requests and interact with AWS services
- **Runtime**: Node.js 18
- **Operations**:
  - Query DynamoDB for KYC records
  - Generate S3 presigned upload URLs
  - Return formatted responses

### 3. Agent Layer (Lambda Functions)

#### Document Validation Agent
- **Runtime**: Java 21
- **Trigger**: S3 ObjectCreated event
- **Responsibilities**:
  - Validate file format (PDF, JPEG, PNG)
  - Check file size limits
  - Extract metadata
  - Calculate validation score
  - Publish `Document.Validated` event

#### Identity Verification Agent
- **Runtime**: Java 21
- **Trigger**: Step Functions invocation
- **Responsibilities**:
  - Extract document information
  - Cross-reference with databases
  - Validate personal information
  - Calculate verification score
  - Publish `Identity.Verified` event

#### Fraud Detection Agent
- **Runtime**: Java 21
- **Trigger**: Step Functions invocation
- **Responsibilities**:
  - Analyze document for tampering
  - Check fraud databases
  - Detect suspicious patterns
  - Calculate risk score
  - Publish `Fraud.Checked` event

#### Compliance Reporting Agent
- **Runtime**: Java 21
- **Trigger**: Step Functions invocation
- **Responsibilities**:
  - Aggregate all verification results
  - Generate comprehensive report
  - Store report in S3
  - Update final KYC status
  - Publish `KYC.Completed` event

### 4. Orchestration Layer

**EventBridge Event Bus**
- **Name**: `kyc-event-bus`
- **Purpose**: Central event routing and communication
- **Event Types**:
  - `Document.Validated`
  - `Identity.Verified`
  - `Fraud.Checked`
  - `KYC.Completed`
- **Rules**: Trigger Step Functions on `Document.Validated`

**Step Functions State Machine**
- **Name**: `KycWorkflow`
- **Purpose**: Orchestrate multi-step KYC process
- **States**:
  1. Document Validation (check if valid)
  2. Identity Verification (check if verified)
  3. Fraud Detection (check for fraud)
  4. Compliance Reporting (generate final report)
- **Features**:
  - Retry logic with exponential backoff
  - Error catching and handling
  - Workflow visualization
  - Execution history

### 5. Data Layer

**DynamoDB Table** (`KYCRecords`)
- **Schema**:
  - Partition Key: `customerId` (String)
  - Sort Key: `eventType` (String)
- **Attributes**:
  - `kycStatus`: PENDING | VALIDATED | VERIFIED | COMPLETED | FAILED | FRAUD_DETECTED
  - `documentUrl`: S3 URL of document
  - `verificationScore`: Numeric score (0-1)
  - `fraudScore`: Risk score (0-1)
  - `lastUpdated`: ISO timestamp
  - `metadata`: Additional information
- **GSI**: `KycStatusIndex` (for querying by status)
- **Features**:
  - On-demand billing
  - Point-in-time recovery
  - Encryption at rest
  - DynamoDB Streams

**S3 Buckets**

1. **Documents Bucket** (`kyc-documents-*`)
   - Purpose: Store customer documents and reports
   - Structure:
     - `/uploads/{customerId}/{timestamp}-{documentType}`
     - `/reports/{customerId}/compliance-report-{timestamp}.txt`
   - Features:
     - Versioning enabled
     - Server-side encryption (SSE-S3)
     - Lifecycle policies (90-day expiration)
     - CORS enabled

2. **UI Bucket** (`kyc-ui-*`)
   - Purpose: Host React application
   - Features:
     - Static website hosting
     - CloudFront origin access identity
     - Block public access

### 6. Observability Layer

**CloudWatch Logs**
- Lambda function logs (7-day retention)
- API Gateway access logs
- Step Functions execution logs

**CloudWatch Metrics**
- Lambda invocations, errors, duration
- API Gateway requests, latency, errors
- DynamoDB read/write capacity
- Step Functions executions, failures

**CloudWatch Alarms** (Optional)
- Lambda error rate > 5%
- API Gateway 5xx errors
- Step Functions failed executions

## Event Flow

### 1. Document Upload Flow
```
User → React UI → API Gateway → Lambda (presigned URL) → S3 Direct Upload
```

### 2. Validation Flow
```
S3 Upload → Document Validation Agent → DynamoDB → EventBridge
```

### 3. Orchestration Flow
```
EventBridge → Step Functions → [Identity → Fraud → Compliance] → DynamoDB
```

### 4. Query Flow
```
User → React UI → API Gateway → Lambda → DynamoDB → React UI
```

## Design Principles

### 1. Event-Driven Architecture
- **Loose Coupling**: Components don't directly call each other
- **Asynchronous**: Non-blocking communication
- **Scalable**: Each component scales independently
- **Resilient**: Failures don't cascade

### 2. Serverless First
- **No Infrastructure Management**: AWS handles servers
- **Auto-Scaling**: Scales with demand
- **Pay-per-Use**: Only pay for execution time
- **High Availability**: Multi-AZ by default

### 3. Security by Design
- **Encryption**: At rest and in transit
- **Least Privilege**: Minimal IAM permissions
- **Private**: No unnecessary public endpoints
- **Auditable**: Complete logging

### 4. Observable
- **Logging**: All operations logged to CloudWatch
- **Metrics**: Key performance indicators tracked
- **Tracing**: Step Functions provide workflow visibility
- **Alarms**: Proactive issue detection

### 5. Cost-Optimized
- **Serverless**: No idle resource costs
- **On-Demand**: DynamoDB scales automatically
- **Free Tier**: Designed to stay within AWS free tier
- **Lifecycle Policies**: Automatic data cleanup

## Scalability

### Horizontal Scaling
- **Lambda**: Up to 1000 concurrent executions (default)
- **API Gateway**: Handles 10,000 requests/second
- **DynamoDB**: Unlimited read/write capacity with on-demand
- **S3**: Unlimited storage and requests

### Performance Targets
- **API Response**: < 500ms
- **Document Validation**: < 5 seconds
- **Full KYC Process**: < 30 seconds
- **Dashboard Load**: < 2 seconds

## Availability & Reliability

### High Availability
- **Multi-AZ**: All services deployed across multiple availability zones
- **CloudFront**: Global edge network (216+ points of presence)
- **S3**: 99.999999999% durability
- **DynamoDB**: 99.99% availability SLA

### Fault Tolerance
- **Retries**: Automatic retries with exponential backoff
- **Error Handling**: Graceful degradation
- **Circuit Breakers**: Step Functions prevent cascading failures
- **Dead Letter Queues**: Failed events captured for analysis

## Next Steps

- [Quick Start Guide](./02-quick-start.md) - Deploy the platform
- [Infrastructure Guide](./04-infrastructure.md) - Detailed AWS resources
- [Backend Services](./07-backend-services.md) - Lambda agent details
- [API Reference](./09-api-reference.md) - API endpoint documentation
