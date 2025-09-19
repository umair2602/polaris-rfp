#!/bin/bash

# Delete Backend Stack Script
# This script deletes the failed backend stack so it can be recreated

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
BACKEND_STACK_NAME="polaris-backend-stack"

print_status "Deleting failed backend stack..."

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $BACKEND_STACK_NAME --region $AWS_REGION &> /dev/null; then
    print_status "Stack $BACKEND_STACK_NAME exists, deleting..."
    aws cloudformation delete-stack --stack-name $BACKEND_STACK_NAME --region $AWS_REGION
    
    print_status "Waiting for stack deletion to complete..."
    aws cloudformation wait stack-delete-complete --stack-name $BACKEND_STACK_NAME --region $AWS_REGION
    
    print_status "✅ Stack deleted successfully!"
else
    print_warning "Stack $BACKEND_STACK_NAME does not exist"
fi

print_status "You can now redeploy the backend stack."
