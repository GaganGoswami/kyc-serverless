### CDK Bootstrap

> cdk Bootstrap
 ⏳  Bootstrapping environment aws://553424001208/us-east-1...
Trusted accounts for deployment: (none)
Trusted accounts for lookup: (none)
Using default execution policy of 'arn:aws:iam::aws:policy/AdministratorAccess'. Pass '--cloudformation-execution-policies' to customize.
CDKToolkit: creating CloudFormation changeset...
 ✅  Environment aws://553424001208/us-east-1 bootstrapped.

### CDK deployment
❯ cdk deploy
[WARNING] aws-cdk-lib.aws_dynamodb.TableOptions#pointInTimeRecovery is deprecated.
  use `pointInTimeRecoverySpecification` instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
  use `logGroup` instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
  use `logGroup` instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
  use `logGroup` instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_lambda.FunctionOptions#logRetention is deprecated.
  use `logGroup` instead
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_stepfunctions.StateMachineProps#definition is deprecated.
  use definitionBody: DefinitionBody.fromChainable()
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_stepfunctions.StateMachineProps#definition is deprecated.
  use definitionBody: DefinitionBody.fromChainable()
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_cloudfront_origins.S3Origin is deprecated.
  Use `S3BucketOrigin` or `S3StaticWebsiteOrigin` instead.
  This API will be removed in the next major release.
[WARNING] aws-cdk-lib.aws_cloudfront_origins.S3Origin#bind is deprecated.
  Use `S3BucketOrigin` or `S3StaticWebsiteOrigin` instead.
  This API will be removed in the next major release.

✨  Synthesis time: 3.78s

current credentials could not be used to assume 'arn:aws:iam::553424001208:role/cdk-hnb659fds-deploy-role-553424001208-us-east-1', but are for the right account. Proceeding anyway.
KycStack: start: Building KycStack/Custom::S3AutoDeleteObjectsCustomResourceProvider Code
KycStack: success: Built KycStack/Custom::S3AutoDeleteObjectsCustomResourceProvider Code
KycStack: start: Building DocumentValidationAgent/Code
KycStack: success: Built DocumentValidationAgent/Code
KycStack: start: Building LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/Code
KycStack: success: Built LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/Code
KycStack: start: Building KycStack Template
KycStack: success: Built KycStack Template
KycStack: start: Publishing KycStack Template (553424001208-us-east-1-5c038edd)
KycStack: start: Publishing KycStack/Custom::S3AutoDeleteObjectsCustomResourceProvider Code (553424001208-us-east-1-4e8b3f58)
KycStack: start: Publishing LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/Code (553424001208-us-east-1-5a7c5552)
KycStack: start: Publishing DocumentValidationAgent/Code (553424001208-us-east-1-a8dd9cd0)
current credentials could not be used to assume 'arn:aws:iam::553424001208:role/cdk-hnb659fds-file-publishing-role-553424001208-us-east-1', but are for the right account. Proceeding anyway.
current credentials could not be used to assume 'arn:aws:iam::553424001208:role/cdk-hnb659fds-file-publishing-role-553424001208-us-east-1', but are for the right account. Proceeding anyway.
current credentials could not be used to assume 'arn:aws:iam::553424001208:role/cdk-hnb659fds-file-publishing-role-553424001208-us-east-1', but are for the right account. Proceeding anyway.
current credentials could not be used to assume 'arn:aws:iam::553424001208:role/cdk-hnb659fds-file-publishing-role-553424001208-us-east-1', but are for the right account. Proceeding anyway.
KycStack: success: Published KycStack/Custom::S3AutoDeleteObjectsCustomResourceProvider Code (553424001208-us-east-1-4e8b3f58)
KycStack: success: Published KycStack Template (553424001208-us-east-1-5c038edd)
KycStack: success: Published LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/Code (553424001208-us-east-1-5a7c5552)
KycStack: success: Published DocumentValidationAgent/Code (553424001208-us-east-1-a8dd9cd0)
current credentials could not be used to assume 'arn:aws:iam::553424001208:role/cdk-hnb659fds-lookup-role-553424001208-us-east-1', but are for the right account. Proceeding anyway.
Lookup role arn:aws:iam::553424001208:role/cdk-hnb659fds-lookup-role-553424001208-us-east-1 was not assumed. Proceeding with default credentials.
Stack KycStack
IAM Statement Changes
┌───┬────────────────────────────────────────────────────────────────────────┬────────┬───────────────────────────────┬────────────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│   │ Resource                                                               │ Effect │ Action                        │ Principal                                                              │ Condition                                                                                                                  │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${ApiHandler.Arn}                                                      │ Allow  │ lambda:InvokeFunction         │ Service:apigateway.amazonaws.com                                       │ "ArnLike": {                                                                                                               │
│   │                                                                        │        │                               │                                                                        │   "AWS:SourceArn": "arn:aws:execute-api:us-east-1:553424001208:${KycApi}/${KycApiDeploymentStageprod315CE568}/GET/kyc"     │
│   │                                                                        │        │                               │                                                                        │ }                                                                                                                          │
│ + │ ${ApiHandler.Arn}                                                      │ Allow  │ lambda:InvokeFunction         │ Service:apigateway.amazonaws.com                                       │ "ArnLike": {                                                                                                               │
│   │                                                                        │        │                               │                                                                        │   "AWS:SourceArn": "arn:aws:execute-api:us-east-1:553424001208:${KycApi}/test-invoke-stage/GET/kyc"                        │
│   │                                                                        │        │                               │                                                                        │ }                                                                                                                          │
│ + │ ${ApiHandler.Arn}                                                      │ Allow  │ lambda:InvokeFunction         │ Service:apigateway.amazonaws.com                                       │ "ArnLike": {                                                                                                               │
│   │                                                                        │        │                               │                                                                        │   "AWS:SourceArn": "arn:aws:execute-api:us-east-1:553424001208:${KycApi}/${KycApiDeploymentStageprod315CE568}/GET/kyc/*"   │
│   │                                                                        │        │                               │                                                                        │ }                                                                                                                          │
│ + │ ${ApiHandler.Arn}                                                      │ Allow  │ lambda:InvokeFunction         │ Service:apigateway.amazonaws.com                                       │ "ArnLike": {                                                                                                               │
│   │                                                                        │        │                               │                                                                        │   "AWS:SourceArn": "arn:aws:execute-api:us-east-1:553424001208:${KycApi}/test-invoke-stage/GET/kyc/*"                      │
│   │                                                                        │        │                               │                                                                        │ }                                                                                                                          │
│ + │ ${ApiHandler.Arn}                                                      │ Allow  │ lambda:InvokeFunction         │ Service:apigateway.amazonaws.com                                       │ "ArnLike": {                                                                                                               │
│   │                                                                        │        │                               │                                                                        │   "AWS:SourceArn": "arn:aws:execute-api:us-east-1:553424001208:${KycApi}/${KycApiDeploymentStageprod315CE568}/POST/upload" │
│   │                                                                        │        │                               │                                                                        │ }                                                                                                                          │
│ + │ ${ApiHandler.Arn}                                                      │ Allow  │ lambda:InvokeFunction         │ Service:apigateway.amazonaws.com                                       │ "ArnLike": {                                                                                                               │
│   │                                                                        │        │                               │                                                                        │   "AWS:SourceArn": "arn:aws:execute-api:us-east-1:553424001208:${KycApi}/test-invoke-stage/POST/upload"                    │
│   │                                                                        │        │                               │                                                                        │ }                                                                                                                          │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${ApiHandler/ServiceRole.Arn}                                          │ Allow  │ sts:AssumeRole                │ Service:lambda.amazonaws.com                                           │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${BucketNotificationsHandler050a0587b7544547bf325f094a3db834/Role.Arn} │ Allow  │ sts:AssumeRole                │ Service:lambda.amazonaws.com                                           │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${ComplianceReportingAgent.Arn}                                        │ Allow  │ lambda:InvokeFunction         │ AWS:${KycStateMachine/Role}                                            │                                                                                                                            │
│   │ ${ComplianceReportingAgent.Arn}:*                                      │        │                               │                                                                        │                                                                                                                            │
│   │ ${DocumentValidationAgent.Arn}                                         │        │                               │                                                                        │                                                                                                                            │
│   │ ${DocumentValidationAgent.Arn}:*                                       │        │                               │                                                                        │                                                                                                                            │
│   │ ${FraudDetectionAgent.Arn}                                             │        │                               │                                                                        │                                                                                                                            │
│   │ ${FraudDetectionAgent.Arn}:*                                           │        │                               │                                                                        │                                                                                                                            │
│   │ ${IdentityVerificationAgent.Arn}                                       │        │                               │                                                                        │                                                                                                                            │
│   │ ${IdentityVerificationAgent.Arn}:*                                     │        │                               │                                                                        │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${Custom::S3AutoDeleteObjectsCustomResourceProvider/Role.Arn}          │ Allow  │ sts:AssumeRole                │ Service:lambda.amazonaws.com                                           │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${DocumentValidationAgent.Arn}                                         │ Allow  │ lambda:InvokeFunction         │ Service:s3.amazonaws.com                                               │ "ArnLike": {                                                                                                               │
│   │                                                                        │        │                               │                                                                        │   "AWS:SourceArn": "${KycDocumentBucket.Arn}"                                                                              │
│   │                                                                        │        │                               │                                                                        │ },                                                                                                                         │
│   │                                                                        │        │                               │                                                                        │ "StringEquals": {                                                                                                          │
│   │                                                                        │        │                               │                                                                        │   "AWS:SourceAccount": "553424001208"                                                                                      │
│   │                                                                        │        │                               │                                                                        │ }                                                                                                                          │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycDocumentBucket.Arn}                                               │ Allow  │ s3:PutBucketNotification      │ AWS:${BucketNotificationsHandler050a0587b7544547bf325f094a3db834/Role} │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycDocumentBucket.Arn}                                               │ Allow  │ s3:DeleteObject*              │ AWS:${Custom::S3AutoDeleteObjectsCustomResourceProvider/Role.Arn}      │                                                                                                                            │
│   │ ${KycDocumentBucket.Arn}/*                                             │        │ s3:GetBucket*                 │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:List*                      │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutBucketPolicy            │                                                                        │                                                                                                                            │
│ + │ ${KycDocumentBucket.Arn}                                               │ Allow  │ s3:Abort*                     │ AWS:${KycLambdaRole}                                                   │                                                                                                                            │
│   │ ${KycDocumentBucket.Arn}/*                                             │        │ s3:DeleteObject*              │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:GetBucket*                 │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:GetObject*                 │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:List*                      │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObject                  │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObjectLegalHold         │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObjectRetention         │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObjectTagging           │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObjectVersionTagging    │                                                                        │                                                                                                                            │
│ + │ ${KycDocumentBucket.Arn}                                               │ Allow  │ s3:Abort*                     │ AWS:${ApiHandler/ServiceRole}                                          │                                                                                                                            │
│   │ ${KycDocumentBucket.Arn}/*                                             │        │ s3:DeleteObject*              │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:GetBucket*                 │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:GetObject*                 │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:List*                      │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObject                  │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObjectLegalHold         │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObjectRetention         │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObjectTagging           │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutObjectVersionTagging    │                                                                        │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycEventBus.Arn}                                                     │ Allow  │ events:PutEvents              │ AWS:${KycLambdaRole}                                                   │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycLambdaRole.Arn}                                                   │ Allow  │ sts:AssumeRole                │ Service:lambda.amazonaws.com                                           │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycRecordsTable.Arn}                                                 │ Allow  │ dynamodb:BatchGetItem         │ AWS:${KycLambdaRole}                                                   │                                                                                                                            │
│   │ ${KycRecordsTable.Arn}/index/*                                         │        │ dynamodb:BatchWriteItem       │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:ConditionCheckItem   │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:DeleteItem           │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:DescribeTable        │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:GetItem              │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:GetRecords           │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:GetShardIterator     │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:PutItem              │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:Query                │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:Scan                 │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:UpdateItem           │                                                                        │                                                                                                                            │
│ + │ ${KycRecordsTable.Arn}                                                 │ Allow  │ dynamodb:BatchGetItem         │ AWS:${ApiHandler/ServiceRole}                                          │                                                                                                                            │
│   │ ${KycRecordsTable.Arn}/index/*                                         │        │ dynamodb:ConditionCheckItem   │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:DescribeTable        │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:GetItem              │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:GetRecords           │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:GetShardIterator     │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:Query                │                                                                        │                                                                                                                            │
│   │                                                                        │        │ dynamodb:Scan                 │                                                                        │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycStateMachine}                                                     │ Allow  │ states:StartExecution         │ AWS:${KycStateMachine/EventsRole}                                      │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycStateMachine/EventsRole.Arn}                                      │ Allow  │ sts:AssumeRole                │ Service:events.amazonaws.com                                           │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycStateMachine/Role.Arn}                                            │ Allow  │ sts:AssumeRole                │ Service:states.amazonaws.com                                           │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycUIBucket.Arn}                                                     │ Allow  │ s3:DeleteObject*              │ AWS:${Custom::S3AutoDeleteObjectsCustomResourceProvider/Role.Arn}      │                                                                                                                            │
│   │ ${KycUIBucket.Arn}/*                                                   │        │ s3:GetBucket*                 │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:List*                      │                                                                        │                                                                                                                            │
│   │                                                                        │        │ s3:PutBucketPolicy            │                                                                        │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycUIBucket.Arn}/*                                                   │ Allow  │ s3:GetObject                  │ CanonicalUser:${KycUIDistribution/Origin1/S3Origin.S3CanonicalUserId}  │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole.Arn}        │ Allow  │ sts:AssumeRole                │ Service:lambda.amazonaws.com                                           │                                                                                                                            │
├───┼────────────────────────────────────────────────────────────────────────┼────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ *                                                                      │ Allow  │ logs:DeleteRetentionPolicy    │ AWS:${LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole}        │                                                                                                                            │
│   │                                                                        │        │ logs:PutRetentionPolicy       │                                                                        │                                                                                                                            │
│ + │ *                                                                      │ Allow  │ logs:CreateLogDelivery        │ AWS:${KycStateMachine/Role}                                            │                                                                                                                            │
│   │                                                                        │        │ logs:DeleteLogDelivery        │                                                                        │                                                                                                                            │
│   │                                                                        │        │ logs:DescribeLogGroups        │                                                                        │                                                                                                                            │
│   │                                                                        │        │ logs:DescribeResourcePolicies │                                                                        │                                                                                                                            │
│   │                                                                        │        │ logs:GetLogDelivery           │                                                                        │                                                                                                                            │
│   │                                                                        │        │ logs:ListLogDeliveries        │                                                                        │                                                                                                                            │
│   │                                                                        │        │ logs:PutResourcePolicy        │                                                                        │                                                                                                                            │
│   │                                                                        │        │ logs:UpdateLogDelivery        │                                                                        │                                                                                                                            │
│   │                                                                        │        │ xray:GetSamplingRules         │                                                                        │                                                                                                                            │
│   │                                                                        │        │ xray:GetSamplingTargets       │                                                                        │                                                                                                                            │
│   │                                                                        │        │ xray:PutTelemetryRecords      │                                                                        │                                                                                                                            │
│   │                                                                        │        │ xray:PutTraceSegments         │                                                                        │                                                                                                                            │
└───┴────────────────────────────────────────────────────────────────────────┴────────┴───────────────────────────────┴────────────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
IAM Policy Changes
┌───┬────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────┐
│   │ Resource                                                           │ Managed Policy ARN                                                                           │
├───┼────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${ApiHandler/ServiceRole}                                          │ arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole               │
├───┼────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${BucketNotificationsHandler050a0587b7544547bf325f094a3db834/Role} │ arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole               │
├───┼────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${Custom::S3AutoDeleteObjectsCustomResourceProvider/Role}          │ {"Fn::Sub":"arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"} │
├───┼────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${KycLambdaRole}                                                   │ arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole               │
├───┼────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────┤
│ + │ ${LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8a/ServiceRole}        │ arn:${AWS::Partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole               │
└───┴────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────┘
(NOTE: There may be security-related changes not in this list. See https://github.com/aws/aws-cdk/issues/1299)


"--require-approval" is enabled and stack includes security-sensitive updates: 'Do you wish to deploy these changes' (y/n) 



(NOTE: There may be security-related changes not in this list. See https://github.com/aws/aws-cdk/issues/1299)


"--require-approval" is enabled and stack includes security-sensitive updates: 'Do you wish to deploy these changes' (y/n) y
KycStack: deploying... [1/1]
current credentials could not be used to assume 'arn:aws:iam::553424001208:role/cdk-hnb659fds-deploy-role-553424001208-us-east-1', but are for the right account. Proceeding anyway.
KycStack: creating CloudFormation changeset...

 ✅  KycStack

✨  Deployment time: 258.82s

Outputs:
KycStack.ApiUrl = https://ol5nqp7rw7.execute-api.us-east-1.amazonaws.com/prod/
KycStack.DashboardURL = https://d1kbrhpwmz7xug.cloudfront.net
KycStack.DocumentBucketName = kyc-documents-553424001208-us-east-1
KycStack.EventBusName = kyc-event-bus
KycStack.KycApiEndpoint8EB71ED4 = https://ol5nqp7rw7.execute-api.us-east-1.amazonaws.com/prod/
KycStack.StateMachineArn = arn:aws:states:us-east-1:553424001208:stateMachine:KycWorkflow
KycStack.UIBucketName = kyc-ui-553424001208-us-east-1
Stack ARN:
arn:aws:cloudformation:us-east-1:553424001208:stack/KycStack/8c5c1290-bf18-11f0-a63a-0affcfe3cb7d

✨  Total time: 261.97s





UI ->. Cloud ront access denied >>


Starting (2/3) Build frontend application


cd /Users/Gagan/Code/aws/kyc-serverless/frontend && npm install
Auto approved by rules cd, npm install

 Enable shell integration to improve command detection


npm run build
Auto approved by rule npm run build

 Enable shell integration to improve command detection

Starting (3/3) Deploy frontend to S3


aws s3 sync /Users/Gagan/Code/aws/kyc-serverless/frontend/dist s3://kyc-ui-553424001208-us-east-1 --delete






cd /Users/Gagan/Code/aws/kyc-serverless && aws cloudformation describe-stacks --stack-name KycStack --query 'Stacks[0].Outputs' --output json 2>/dev/null || echo "Stack not found or AWS CLI not configured"


