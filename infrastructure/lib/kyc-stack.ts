import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class KycStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ========================================
    // S3 Buckets
    // ========================================
    
    // Document storage bucket
    const documentBucket = new s3.Bucket(this, 'KycDocumentBucket', {
      bucketName: `kyc-documents-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          exposedHeaders: [
            'ETag',
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
          ],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // UI hosting bucket
    const uiBucket = new s3.Bucket(this, 'KycUIBucket', {
      bucketName: `kyc-ui-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ========================================
    // DynamoDB Table
    // ========================================
    
    const kycTable = new dynamodb.Table(this, 'KycRecordsTable', {
      tableName: 'KYCRecords',
      partitionKey: {
        name: 'customerId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'eventType',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // GSI for querying by status
    kycTable.addGlobalSecondaryIndex({
      indexName: 'KycStatusIndex',
      partitionKey: {
        name: 'kycStatus',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'lastUpdated',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // ========================================
    // EventBridge Event Bus
    // ========================================
    
    const kycEventBus = new events.EventBus(this, 'KycEventBus', {
      eventBusName: 'kyc-event-bus',
    });

    // ========================================
    // Lambda Functions (Java Agents)
    // ========================================
    
    const lambdaRole = new iam.Role(this, 'KycLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant permissions
    documentBucket.grantReadWrite(lambdaRole);
    kycTable.grantReadWriteData(lambdaRole);
    kycEventBus.grantPutEventsTo(lambdaRole);

    const commonLambdaProps = {
      runtime: lambda.Runtime.JAVA_21,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      role: lambdaRole,
      environment: {
        TABLE_NAME: kycTable.tableName,
        EVENT_BUS_NAME: kycEventBus.eventBusName,
        DOCUMENT_BUCKET: documentBucket.bucketName,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    };

    // Document Validation Agent
    const documentValidationAgent = new lambda.Function(this, 'DocumentValidationAgent', {
      ...commonLambdaProps,
      functionName: 'DocumentValidationAgent',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/target/kyc-agents-1.0.0.jar')),
      handler: 'com.kyc.agents.DocumentValidationAgent::handleRequest',
      description: 'Validates uploaded KYC documents',
    });

    // Identity Verification Agent
    const identityVerificationAgent = new lambda.Function(this, 'IdentityVerificationAgent', {
      ...commonLambdaProps,
      functionName: 'IdentityVerificationAgent',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/target/kyc-agents-1.0.0.jar')),
      handler: 'com.kyc.agents.IdentityVerificationAgent::handleRequest',
      description: 'Verifies customer identity',
    });

    // Fraud Detection Agent
    const fraudDetectionAgent = new lambda.Function(this, 'FraudDetectionAgent', {
      ...commonLambdaProps,
      functionName: 'FraudDetectionAgent',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/target/kyc-agents-1.0.0.jar')),
      handler: 'com.kyc.agents.FraudDetectionAgent::handleRequest',
      description: 'Detects potential fraud indicators',
    });

    // Compliance Reporting Agent
    const complianceReportingAgent = new lambda.Function(this, 'ComplianceReportingAgent', {
      ...commonLambdaProps,
      functionName: 'ComplianceReportingAgent',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/target/kyc-agents-1.0.0.jar')),
      handler: 'com.kyc.agents.ComplianceReportingAgent::handleRequest',
      description: 'Generates compliance reports',
    });

    // S3 trigger for Document Validation
    documentValidationAgent.addEventSource(
      new cdk.aws_lambda_event_sources.S3EventSource(documentBucket, {
        events: [s3.EventType.OBJECT_CREATED],
        filters: [{ prefix: 'uploads/' }],
      })
    );

    // ========================================
    // Step Functions State Machine
    // ========================================
    
    const documentValidationTask = new tasks.LambdaInvoke(this, 'DocumentValidationTask', {
      lambdaFunction: documentValidationAgent,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const identityVerificationTask = new tasks.LambdaInvoke(this, 'IdentityVerificationTask', {
      lambdaFunction: identityVerificationAgent,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const fraudDetectionTask = new tasks.LambdaInvoke(this, 'FraudDetectionTask', {
      lambdaFunction: fraudDetectionAgent,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const complianceReportingTask = new tasks.LambdaInvoke(this, 'ComplianceReportingTask', {
      lambdaFunction: complianceReportingAgent,
      outputPath: '$.Payload',
      retryOnServiceExceptions: true,
    });

    const definition = documentValidationTask
      .next(identityVerificationTask)
      .next(fraudDetectionTask)
      .next(complianceReportingTask);

    const kycStateMachine = new sfn.StateMachine(this, 'KycStateMachine', {
      stateMachineName: 'KycWorkflow',
      definition,
      timeout: cdk.Duration.minutes(5),
      tracingEnabled: true,
      logs: {
        destination: new logs.LogGroup(this, 'KycStateMachineLogs', {
          retention: logs.RetentionDays.ONE_WEEK,
        }),
        level: sfn.LogLevel.ALL,
      },
    });

    // EventBridge rule to trigger Step Functions
    new events.Rule(this, 'DocumentValidatedRule', {
      eventBus: kycEventBus,
      eventPattern: {
        detailType: ['Document.Validated'],
        source: ['kyc.validation'],
      },
      targets: [new targets.SfnStateMachine(kycStateMachine)],
    });

    // ========================================
    // API Gateway
    // ========================================
    
    // Create CloudWatch Logs role for API Gateway (account-level setting)
    const apiGatewayCloudWatchRole = new iam.Role(this, 'ApiGatewayCloudWatchRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonAPIGatewayPushToCloudWatchLogs'),
      ],
    });

    // Set the CloudWatch Logs role for API Gateway account settings
    const cfnAccount = new apigateway.CfnAccount(this, 'ApiGatewayAccount', {
      cloudWatchRoleArn: apiGatewayCloudWatchRole.roleArn,
    });
    
    const api = new apigateway.RestApi(this, 'KycApi', {
      restApiName: 'KYC Service API',
      description: 'API for KYC platform',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Api-Key', 'Authorization'],
      },
    });

    // Ensure the account settings are configured before deploying the stage
    api.node.addDependency(cfnAccount);

    // API Lambda handlers
    const apiHandler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
        const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

        const client = new DynamoDBClient({});
        const ddbDocClient = DynamoDBDocumentClient.from(client);
        const s3Client = new S3Client({});

        const corsHeaders = {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key,Authorization',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        };

        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          const path = event.path || event.rawPath || '';
          const method = event.httpMethod || event.requestContext?.http?.method;
          
          try {
            // Get KYC records for specific customer
            if (method === 'GET' && path.startsWith('/kyc/')) {
              const pathParts = path.split('/').filter(p => p);
              const customerId = pathParts[1];
              console.log('Querying customer:', customerId);
              
              const result = await ddbDocClient.send(new QueryCommand({
                TableName: process.env.TABLE_NAME,
                KeyConditionExpression: 'customerId = :id',
                ExpressionAttributeValues: { ':id': customerId },
                ScanIndexForward: false,
                Limit: 100,
              }));
              
              console.log('Query result items:', result.Items?.length || 0);
              return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(result.Items || []),
              };
            }
            
            // List all KYC records
            if (method === 'GET' && path === '/kyc') {
              console.log('Scanning all KYC records');
              
              const result = await ddbDocClient.send(new ScanCommand({
                TableName: process.env.TABLE_NAME,
                Limit: 100,
              }));
              
              console.log('Scan result items:', result.Items?.length || 0);
              return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(result.Items || []),
              };
            }
            
            // Generate presigned upload URL
            if (method === 'POST' && path === '/upload') {
              const body = JSON.parse(event.body || '{}');
              const { customerId, documentType } = body;
              console.log('Generating presigned URL for customer:', customerId, 'documentType:', documentType);
              
              if (!customerId) {
                return {
                  statusCode: 400,
                  headers: corsHeaders,
                  body: JSON.stringify({ message: 'customerId is required' }),
                };
              }
              
              const key = \`uploads/\${customerId}/\${Date.now()}-\${documentType || 'document'}\`;
              const command = new PutObjectCommand({
                Bucket: process.env.DOCUMENT_BUCKET,
                Key: key,
                ContentType: 'application/octet-stream',
              });
              
              const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
              
              return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ uploadUrl: presignedUrl, key }),
              };
            }
            
            console.log('No route matched for path:', path, 'method:', method);
            return {
              statusCode: 404,
              headers: corsHeaders,
              body: JSON.stringify({ message: 'Not Found', path, method }),
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: corsHeaders,
              body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
            };
          }
        };
      `),
      environment: {
        TABLE_NAME: kycTable.tableName,
        DOCUMENT_BUCKET: documentBucket.bucketName,
      },
      timeout: cdk.Duration.seconds(10),
    });

    kycTable.grantReadData(apiHandler);
    documentBucket.grantReadWrite(apiHandler);

    // API endpoints
    const kycResource = api.root.addResource('kyc');
    kycResource.addMethod('GET', new apigateway.LambdaIntegration(apiHandler));
    
    const kycIdResource = kycResource.addResource('{customerId}');
    kycIdResource.addMethod('GET', new apigateway.LambdaIntegration(apiHandler));
    
    const uploadResource = api.root.addResource('upload');
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(apiHandler));

    // ========================================
    // CloudFront Distribution for UI
    // ========================================
    
    const distribution = new cloudfront.Distribution(this, 'KycUIDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(uiBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    // ========================================
    // Outputs
    // ========================================
    
    new cdk.CfnOutput(this, 'DocumentBucketName', {
      value: documentBucket.bucketName,
      description: 'S3 bucket for KYC documents',
    });

    new cdk.CfnOutput(this, 'UIBucketName', {
      value: uiBucket.bucketName,
      description: 'S3 bucket for UI hosting',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'CloudFront URL for dashboard',
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: kycStateMachine.stateMachineArn,
      description: 'Step Functions state machine ARN',
    });

    new cdk.CfnOutput(this, 'EventBusName', {
      value: kycEventBus.eventBusName,
      description: 'EventBridge event bus name',
    });
  }
}
