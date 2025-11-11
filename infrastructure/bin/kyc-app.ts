#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { KycStack } from '../lib/kyc-stack';

const app = new cdk.App();

new KycStack(app, 'KycStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'Serverless Agent-Driven KYC Verification Platform',
});

app.synth();
