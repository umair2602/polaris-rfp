# AWS Deployment Guide

This guide explains how to deploy the Polaris RFP Proposal System to AWS using GitHub Actions and CloudFormation.

## Architecture Overview

- **Frontend**: Next.js app deployed to AWS Amplify
- **Backend**: Node.js API deployed to AWS App Runner
- **CI/CD**: GitHub Actions with CloudFormation templates
- **Container Registry**: Amazon ECR for backend images

## Prerequisites

1. AWS Account with appropriate permissions
2. GitHub repository with the `github-actions-role` IAM role
3. AWS CLI configured locally (for initial setup)

## Setup Instructions

### 1. Configure AWS IAM Role and OIDC Provider

**Step 1: Create OIDC Provider (if not already exists)**
```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --client-id-list sts.amazonaws.com
```

**Step 2: Update IAM Role Trust Policy**

The `github-actions-role` in your AWS account needs to be updated with the trust policy from `iam-trust-policy.json`:

```bash
# Update the trust policy
aws iam update-assume-role-policy \
  --role-name github-actions-role \
  --policy-document file://iam-trust-policy.json
```

**Required IAM Permissions for the Role:**
The `github-actions-role` needs the following permissions:
- CloudFormation (full access)
- Amplify (full access) 
- App Runner (full access)
- ECR (full access)
- IAM (for role creation)
- CloudWatch Logs (full access)

### 2. Update Configuration Files

1. **Update GitHub Actions workflow** (`.github/workflows/deploy.yml`):
   - Replace `YOUR_ACCOUNT_ID` with your AWS account ID
   - Update repository URLs if needed

2. **Update CloudFormation templates**:
   - Replace `YOUR_ORG/YOUR_REPO` in `frontend-amplify.yml`
   - Update domain names in `frontend-amplify.yml` if using custom domains

3. **Environment Variables**:
   - Copy `environment.example` to `.env` and fill in your values
   - Add secrets to GitHub repository settings:
     - `GH_PERSONAL_TOKEN` (for Amplify access)
     - `OPENAI_API_KEY` (if using AI features)
     - `JWT_SECRET` (generate a secure secret)

### 3. Deploy Infrastructure

The deployment happens automatically when you push to the main branch, but you can also deploy manually:

```bash
# Deploy frontend stack
aws cloudformation deploy \
  --template-file .github/cloudformation/frontend-amplify.yml \
  --stack-name polaris-frontend-stack \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    RepositoryUrl=https://github.com/YOUR_ORG/YOUR_REPO \
    BranchName=main \
    Environment=production

# Deploy backend stack (after building and pushing Docker image)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker build -t polaris-backend ./backend
docker tag polaris-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/polaris-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/polaris-backend:latest

aws cloudformation deploy \
  --template-file .github/cloudformation/backend-apprunner.yml \
  --stack-name polaris-backend-stack \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    ImageUri=YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/polaris-backend:latest \
    Environment=production
```

## Deployment Process

1. **Push to main branch** triggers GitHub Actions
2. **Frontend deployment**:
   - Creates/updates Amplify app
   - Builds and deploys Next.js app
   - Configures custom domain (if specified)
3. **Backend deployment**:
   - Builds Docker image
   - Pushes to ECR
   - Creates/updates App Runner service
4. **Environment sync**:
   - Updates frontend with backend URL
   - Triggers frontend rebuild

## Monitoring and Logs

- **Frontend logs**: Available in AWS Amplify console
- **Backend logs**: Available in CloudWatch Logs (`/aws/apprunner/polaris-backend-production`)
- **Application metrics**: Available in CloudWatch

## Custom Domain Setup

To use a custom domain:

1. Update `frontend-amplify.yml` with your domain
2. Configure DNS records as instructed by Amplify
3. SSL certificates are automatically managed by AWS

## Troubleshooting

### Common Issues

1. **Permission denied**: Check IAM role trust policy
2. **Build failures**: Check environment variables and dependencies
3. **CORS errors**: Verify frontend URL in backend CORS configuration
4. **Image pull errors**: Ensure ECR repository exists and image is pushed

### Useful Commands

```bash
# Check CloudFormation stack status
aws cloudformation describe-stacks --stack-name polaris-frontend-stack
aws cloudformation describe-stacks --stack-name polaris-backend-stack

# View App Runner service status
aws apprunner describe-service --service-arn YOUR_SERVICE_ARN

# Check Amplify app status
aws amplify get-app --app-id YOUR_APP_ID
```

## Cost Optimization

- **App Runner**: Configure auto-scaling to minimize costs
- **Amplify**: Uses pay-per-request pricing
- **CloudWatch**: Set log retention policies
- **ECR**: Configure lifecycle policies for image cleanup

## Security Considerations

- All traffic uses HTTPS
- IAM roles follow least privilege principle
- Environment variables are encrypted
- Security groups restrict access appropriately
- Regular security updates via GitHub Dependabot
