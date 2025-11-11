# Required IAM Policies for User: dev-gagan

## Missing Permissions Identified

Based on the error messages, user `dev-gagan` (arn:aws:iam::553424001208:user/dev-gagan) is missing critical permissions for AWS CDK deployment.

## Error Analysis

1. **ECR Permission Missing**: `ecr:CreateRepository`
2. **SSM Permission Missing**: `ssm:PutParameter`
3. **General CDK Bootstrap permissions required**

## Required IAM Policies

### Option 1: Use AWS Managed Policies (Recommended for Development)

Attach these managed policies to user `dev-gagan`:

```bash
# Attach AdministratorAccess (full access - use for development only)
aws iam attach-user-policy \
  --user-name dev-gagan \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

**⚠️ WARNING**: AdministratorAccess grants full permissions. Only use in development/testing environments.

### Option 2: Minimal Required Permissions (Recommended for Production)

Create a custom policy with only required permissions:

#### Step 1: Create Policy File

```bash
cat > cdk-deployment-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CDKBootstrapPermissions",
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "ecr:*",
        "s3:*",
        "ssm:*",
        "iam:*",
        "lambda:*",
        "dynamodb:*",
        "events:*",
        "states:*",
        "apigateway:*",
        "logs:*",
        "cloudfront:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3AssetBucket",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:PutBucketVersioning",
        "s3:PutEncryptionConfiguration",
        "s3:PutLifecycleConfiguration",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::cdk-*",
        "arn:aws:s3:::cdk-*/*"
      ]
    },
    {
      "Sid": "ECRRepositories",
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DeleteRepository",
        "ecr:DescribeRepositories",
        "ecr:SetRepositoryPolicy",
        "ecr:GetLifecyclePolicy",
        "ecr:PutLifecyclePolicy",
        "ecr:GetRepositoryPolicy",
        "ecr:BatchGetImage",
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:GetDownloadUrlForLayer",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart"
      ],
      "Resource": "arn:aws:ecr:*:553424001208:repository/cdk-*"
    },
    {
      "Sid": "SSMParameters",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:PutParameter",
        "ssm:DeleteParameter",
        "ssm:DescribeParameters",
        "ssm:GetParameterHistory"
      ],
      "Resource": "arn:aws:ssm:*:553424001208:parameter/cdk-bootstrap/*"
    },
    {
      "Sid": "IAMRoles",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": [
        "arn:aws:iam::553424001208:role/cdk-*",
        "arn:aws:iam::553424001208:role/KycStack-*"
      ]
    },
    {
      "Sid": "CloudFormationStacks",
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:ValidateTemplate",
        "cloudformation:CreateChangeSet",
        "cloudformation:DescribeChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:DeleteChangeSet",
        "cloudformation:GetTemplateSummary"
      ],
      "Resource": [
        "arn:aws:cloudformation:*:553424001208:stack/CDKToolkit/*",
        "arn:aws:cloudformation:*:553424001208:stack/KycStack/*"
      ]
    },
    {
      "Sid": "LambdaFunctions",
      "Effect": "Allow",
      "Action": [
        "lambda:CreateFunction",
        "lambda:DeleteFunction",
        "lambda:GetFunction",
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:AddPermission",
        "lambda:RemovePermission",
        "lambda:InvokeFunction",
        "lambda:TagResource"
      ],
      "Resource": "arn:aws:lambda:*:553424001208:function:*"
    },
    {
      "Sid": "DynamoDBTables",
      "Effect": "Allow",
      "Action": [
        "dynamodb:CreateTable",
        "dynamodb:DeleteTable",
        "dynamodb:DescribeTable",
        "dynamodb:UpdateTable",
        "dynamodb:TagResource"
      ],
      "Resource": "arn:aws:dynamodb:*:553424001208:table/*"
    },
    {
      "Sid": "EventBridge",
      "Effect": "Allow",
      "Action": [
        "events:CreateEventBus",
        "events:DeleteEventBus",
        "events:DescribeEventBus",
        "events:PutRule",
        "events:DeleteRule",
        "events:PutTargets",
        "events:RemoveTargets",
        "events:TagResource"
      ],
      "Resource": "arn:aws:events:*:553424001208:*"
    },
    {
      "Sid": "StepFunctions",
      "Effect": "Allow",
      "Action": [
        "states:CreateStateMachine",
        "states:DeleteStateMachine",
        "states:DescribeStateMachine",
        "states:UpdateStateMachine",
        "states:TagResource"
      ],
      "Resource": "arn:aws:states:*:553424001208:stateMachine:*"
    },
    {
      "Sid": "APIGateway",
      "Effect": "Allow",
      "Action": [
        "apigateway:POST",
        "apigateway:PATCH",
        "apigateway:PUT",
        "apigateway:DELETE",
        "apigateway:GET"
      ],
      "Resource": "arn:aws:apigateway:*::/*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:TagLogGroup"
      ],
      "Resource": "arn:aws:logs:*:553424001208:log-group:*"
    },
    {
      "Sid": "CloudFront",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:DeleteDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:TagResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3KYCBuckets",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:PutBucketVersioning",
        "s3:PutEncryptionConfiguration",
        "s3:PutLifecycleConfiguration",
        "s3:PutBucketWebsite",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::kyc-*",
        "arn:aws:s3:::kyc-*/*"
      ]
    }
  ]
}
EOF
```

#### Step 2: Create and Attach Custom Policy

```bash
# Create the policy
aws iam create-policy \
  --policy-name CDKDeploymentPolicy \
  --policy-document file://cdk-deployment-policy.json \
  --description "Permissions required for AWS CDK deployment of KYC platform"

# Attach the policy to user dev-gagan
aws iam attach-user-policy \
  --user-name dev-gagan \
  --policy-arn arn:aws:iam::553424001208:policy/CDKDeploymentPolicy
```

### Option 3: Quick Fix for Immediate Errors

If you need to fix the immediate errors quickly:

```bash
# Create inline policy for immediate CDK bootstrap permissions
aws iam put-user-policy \
  --user-name dev-gagan \
  --policy-name CDKBootstrapQuickFix \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ecr:CreateRepository",
          "ecr:DescribeRepositories",
          "ecr:SetRepositoryPolicy",
          "ssm:PutParameter",
          "ssm:GetParameter",
          "cloudformation:*",
          "s3:*",
          "iam:*"
        ],
        "Resource": "*"
      }
    ]
  }'
```

## Verification Steps

After applying policies, verify permissions:

```bash
# Check attached policies
aws iam list-attached-user-policies --user-name dev-gagan

# Check inline policies
aws iam list-user-policies --user-name dev-gagan

# Test CDK bootstrap
cd infrastructure
cdk bootstrap
```

## Clean Up Failed Bootstrap (If Needed)

If CDKToolkit stack is in ROLLBACK_COMPLETE state:

```bash
# Delete the failed stack
aws cloudformation delete-stack --stack-name CDKToolkit

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name CDKToolkit

# Try bootstrap again
cdk bootstrap
```

## Summary of Missing Permissions

### Critical (Causing Current Errors):
- ✅ `ecr:CreateRepository` - Create ECR repositories for container assets
- ✅ `ssm:PutParameter` - Store CDK bootstrap version parameter

### Required for Full Deployment:
- CloudFormation (all operations)
- S3 (bucket creation and object operations)
- IAM (role creation and policy management)
- Lambda (function creation and configuration)
- DynamoDB (table creation)
- EventBridge (event bus and rules)
- Step Functions (state machine creation)
- API Gateway (REST API creation)
- CloudWatch Logs (log group creation)
- CloudFront (distribution creation)

## Recommended Action

**For Development Environment:**
```bash
aws iam attach-user-policy \
  --user-name dev-gagan \
  --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

**For Production Environment:**
Use Option 2 (custom policy) with minimal required permissions.

## After Policy Update

1. Wait 30-60 seconds for IAM policy propagation
2. Delete failed CDKToolkit stack if exists
3. Run `cdk bootstrap` again
4. Proceed with `cdk deploy`

## Security Best Practices

- ✅ Use least privilege principle
- ✅ Separate dev and production IAM users
- ✅ Enable MFA for privileged users
- ✅ Regularly audit and rotate credentials
- ✅ Use IAM roles for applications instead of users when possible
