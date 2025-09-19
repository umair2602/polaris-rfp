#!/bin/bash

# OIDC Setup Script for GitHub Actions
# This script sets up the OIDC provider and updates the IAM role trust policy

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

# Update the trust policy with the actual account ID
print_status "Updating IAM trust policy with account ID..."
sed "s/YOUR_ACCOUNT_ID/$AWS_ACCOUNT_ID/g" iam-trust-policy.json > iam-trust-policy-updated.json

# Create OIDC provider (if it doesn't exist)
print_status "Creating OIDC provider for GitHub Actions..."
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
  --client-id-list sts.amazonaws.com \
  --region $AWS_REGION || print_warning "OIDC provider may already exist"

# Update the IAM role trust policy
print_status "Updating IAM role trust policy..."
aws iam update-assume-role-policy \
  --role-name github-actions-role \
  --policy-document file://iam-trust-policy-updated.json \
  --region $AWS_REGION

# Clean up temporary file
rm iam-trust-policy-updated.json

print_status "OIDC setup completed successfully!"
echo ""
echo "✅ GitHub Actions OIDC provider created"
echo "✅ IAM role trust policy updated"
echo ""
echo "Next steps:"
echo "1. Add AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID to your GitHub repository secrets"
echo "2. Add GH_PERSONAL_TOKEN to your GitHub repository secrets"
echo "3. Push your code to trigger the deployment"
echo ""
echo "The IAM role 'github-actions-role' now trusts GitHub Actions from your repository."
