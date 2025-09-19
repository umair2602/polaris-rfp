x#!/bin/bash

# Simple Deployment Script for Polaris RFP Proposal System
# This script handles both create and update operations cleanly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Configuration
AWS_REGION="us-east-1"
FRONTEND_STACK_NAME="polaris-frontend-stack"
BACKEND_STACK_NAME="polaris-backend-stack"
ECR_REPOSITORY="polaris-backend"
GITHUB_REPO="umair2602/polaris-rfp"

print_step "Starting Polaris RFP Deployment..."

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
print_status "Using AWS Region: $AWS_REGION"

# Function to deploy CloudFormation stack
deploy_stack() {
    local template_file=$1
    local stack_name=$2
    local parameters=$3
    
    print_step "Deploying $stack_name..."
    
    if aws cloudformation describe-stacks --stack-name $stack_name &> /dev/null; then
        print_status "Stack $stack_name exists, updating..."
        aws cloudformation deploy \
            --template-file $template_file \
            --stack-name $stack_name \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
            --parameter-overrides $parameters \
            --region $AWS_REGION
    else
        print_status "Stack $stack_name does not exist, creating..."
        aws cloudformation deploy \
            --template-file $template_file \
            --stack-name $stack_name \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
            --parameter-overrides $parameters \
            --region $AWS_REGION
    fi
    
    print_status "$stack_name deployed successfully!"
}

# Deploy Frontend Stack
print_step "Deploying Frontend (AWS Amplify)..."
deploy_stack \
    ".github/cloudformation/frontend-amplify.yml" \
    "$FRONTEND_STACK_NAME" \
    "RepositoryUrl=https://github.com/$GITHUB_REPO BranchName=main Environment=production GitHubToken=$GH_PERSONAL_TOKEN"

# Get Frontend URL
FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name $FRONTEND_STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

print_status "Frontend URL: $FRONTEND_URL"

# Create ECR repository if it doesn't exist
print_step "Setting up ECR repository..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION &> /dev/null || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# Build and push Docker image
print_step "Building and pushing Docker image..."
docker build -t $ECR_REPOSITORY:latest ./backend

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Tag and push image
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest

print_status "Docker image pushed successfully!"

# Deploy Backend Stack
print_step "Deploying Backend (AWS App Runner)..."
deploy_stack \
    ".github/cloudformation/backend-apprunner.yml" \
    "$BACKEND_STACK_NAME" \
    "ImageUri=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest Environment=production"

# Get Backend URL
BACKEND_URL=$(aws cloudformation describe-stacks \
    --stack-name $BACKEND_STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`AppRunnerServiceUrl`].OutputValue' \
    --output text \
    --region $AWS_REGION)

print_status "Backend URL: $BACKEND_URL"

# Update Frontend with Backend URL
print_step "Updating frontend environment variables..."
FRONTEND_APP_ID=$(aws cloudformation describe-stacks \
    --stack-name $FRONTEND_STACK_NAME \
    --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
    --output text \
    --region $AWS_REGION)

aws amplify update-app \
    --app-id $FRONTEND_APP_ID \
    --environment-variables API_BASE_URL=$BACKEND_URL \
    --region $AWS_REGION

# Trigger frontend rebuild
print_step "Triggering frontend rebuild..."
aws amplify start-job \
    --app-id $FRONTEND_APP_ID \
    --branch-name main \
    --job-type RELEASE \
    --region $AWS_REGION

print_status "Deployment completed successfully!"
echo ""
echo "🎉 Polaris RFP Proposal System is now deployed!"
echo ""
echo "📱 Frontend URL: $FRONTEND_URL"
echo "🔧 Backend URL: $BACKEND_URL"
echo ""
echo "The system will be available in a few minutes once the rebuild completes."
