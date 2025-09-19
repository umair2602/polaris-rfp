#!/bin/bash

# AWS Setup Script for Polaris RFP Proposal System
# This script helps set up the initial AWS infrastructure

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
print_status "Using AWS Account ID: $AWS_ACCOUNT_ID"

# Get current region
AWS_REGION=$(aws configure get region)
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-east-1"
    print_warning "No region configured, using default: $AWS_REGION"
fi

print_status "Using AWS Region: $AWS_REGION"

# Check if GitHub repository URL is provided
if [ -z "$1" ]; then
    print_error "Please provide your GitHub repository URL as an argument."
    echo "Usage: $0 <github-repo-url>"
    echo "Example: $0 https://github.com/your-org/your-repo"
    exit 1
fi

GITHUB_REPO_URL=$1
print_status "Using GitHub Repository: $GITHUB_REPO_URL"

# Create ECR repository
print_status "Creating ECR repository..."
aws ecr create-repository --repository-name polaris-backend --region $AWS_REGION || print_warning "ECR repository may already exist"

# Deploy frontend stack
print_status "Deploying frontend stack..."
aws cloudformation deploy \
    --template-file .github/cloudformation/frontend-amplify.yml \
    --stack-name polaris-frontend-stack \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        RepositoryUrl=$GITHUB_REPO_URL \
        BranchName=main \
        Environment=production \
        GitHubToken=$GH_PERSONAL_TOKEN \
    --region $AWS_REGION

# Get frontend outputs
FRONTEND_APP_ID=$(aws cloudformation describe-stacks \
    --stack-name polaris-frontend-stack \
    --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
    --output text \
    --region $AWS_REGION)

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name polaris-frontend-stack \
    --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

print_status "Frontend deployed successfully!"
print_status "Amplify App ID: $FRONTEND_APP_ID"
print_status "Frontend URL: $FRONTEND_URL"

# Build and push initial Docker image
print_status "Building and pushing initial Docker image..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

docker build -t polaris-backend:latest ./backend
docker tag polaris-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/polaris-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/polaris-backend:latest

# Deploy backend stack
print_status "Deploying backend stack..."
aws cloudformation deploy \
    --template-file .github/cloudformation/backend-apprunner.yml \
    --stack-name polaris-backend-stack \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        ImageUri=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/polaris-backend:latest \
        Environment=production \
    --region $AWS_REGION

# Get backend outputs
BACKEND_URL=$(aws cloudformation describe-stacks \
    --stack-name polaris-backend-stack \
    --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

print_status "Backend deployed successfully!"
print_status "Backend URL: $BACKEND_URL"

# Update frontend with backend URL
print_status "Updating frontend environment variables..."
aws amplify update-app \
    --app-id $FRONTEND_APP_ID \
    --environment-variables API_BASE_URL=$BACKEND_URL \
    --region $AWS_REGION

# Trigger frontend rebuild
print_status "Triggering frontend rebuild..."
aws amplify start-job \
    --app-id $FRONTEND_APP_ID \
    --branch-name main \
    --job-type RELEASE \
    --region $AWS_REGION

print_status "Setup completed successfully!"
echo ""
echo "🎉 Your Polaris RFP Proposal System is now deployed!"
echo ""
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL: $BACKEND_URL"
echo ""
echo "Next steps:"
echo "1. Add the following secrets to your GitHub repository:"
echo "   - AWS_ACCOUNT_ID: $AWS_ACCOUNT_ID"
echo "   - GH_PERSONAL_TOKEN: (your GitHub personal access token)"
echo "2. Update the IAM role trust policy as described in DEPLOYMENT.md"
echo "3. Push your code to the main branch to trigger automatic deployments"
echo ""
echo "For more information, see DEPLOYMENT.md"
