#!/bin/bash

# Test ECR Access Script
# This script tests if the github-actions-role has proper ECR permissions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

AWS_REGION="us-east-1"
ECR_REPOSITORY="polaris-backend"

print_status "Testing ECR access with github-actions-role..."

# Test 1: List repositories
print_status "Test 1: Listing ECR repositories..."
if aws ecr describe-repositories --region $AWS_REGION; then
    print_status "✅ ECR describe-repositories works"
else
    print_error "❌ ECR describe-repositories failed"
    exit 1
fi

# Test 2: Check specific repository
print_status "Test 2: Checking specific repository..."
if aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null; then
    print_status "✅ Repository $ECR_REPOSITORY exists"
else
    print_warning "⚠️  Repository $ECR_REPOSITORY does not exist, creating it..."
    if aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION; then
        print_status "✅ Repository $ECR_REPOSITORY created successfully"
    else
        print_error "❌ Failed to create repository $ECR_REPOSITORY"
        exit 1
    fi
fi

# Test 3: Get login token
print_status "Test 3: Getting ECR login token..."
if aws ecr get-login-password --region $AWS_REGION > /dev/null; then
    print_status "✅ ECR get-login-password works"
else
    print_error "❌ ECR get-login-password failed"
    exit 1
fi

# Test 4: Test Docker login
print_status "Test 4: Testing Docker login..."
if aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_REGION.dkr.ecr.$AWS_REGION.amazonaws.com; then
    print_status "✅ Docker login to ECR successful"
else
    print_error "❌ Docker login to ECR failed"
    exit 1
fi

print_status "🎉 All ECR tests passed! The github-actions-role has proper ECR permissions."
