#!/bin/bash

# OHMS 2.0 Production Deployment Script
# Deploys II v2 + Stripe integrated application to mainnet

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Configuration
NETWORK=${NETWORK:-"ic"}  # ic for mainnet, local for local testing
BUILD_ENV=${BUILD_ENV:-"production"}
DFX_IDENTITY=${DFX_IDENTITY:-"default"}

# Check if we're deploying to mainnet
if [ "$NETWORK" = "ic" ]; then
    log_warning "🚨 MAINNET DEPLOYMENT - This will deploy to Internet Computer mainnet!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Deployment cancelled."
        exit 0
    fi
fi

log_header "OHMS 2.0 Production Deployment - II v2 + Stripe Integration"

# Check prerequisites
log_info "Checking prerequisites..."

# Check if DFX is installed
if ! command -v dfx &> /dev/null; then
    log_error "DFX is not installed. Please install DFX first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    log_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

log_success "Prerequisites check passed"

# Check DFX identity
log_info "Checking DFX identity..."
CURRENT_IDENTITY=$(dfx identity whoami)
log_info "Current DFX identity: $CURRENT_IDENTITY"

if [ "$NETWORK" = "ic" ] && [ "$CURRENT_IDENTITY" = "anonymous" ]; then
    log_error "Cannot deploy to mainnet with anonymous identity. Please set up a proper identity."
    exit 1
fi

# Check wallet balance for mainnet deployment
if [ "$NETWORK" = "ic" ]; then
    log_info "Checking wallet balance..."
    BALANCE=$(dfx wallet --network ic balance 2>/dev/null || echo "0")
    log_info "Wallet balance: $BALANCE"
fi

# Environment validation
log_header "Environment Validation"

# Check for required environment variables
check_env_var() {
    local var_name=$1
    local var_value=${!var_name}
    local required=${2:-true}
    
    if [ "$required" = true ] && [ -z "$var_value" ]; then
        log_error "Required environment variable $var_name is not set"
        return 1
    elif [ -n "$var_value" ]; then
        # Mask sensitive values
        if [[ $var_name == *"SECRET"* ]] || [[ $var_name == *"KEY"* ]]; then
            local masked_value="${var_value:0:8}..."
            log_success "$var_name: $masked_value"
        else
            log_success "$var_name: $var_value"
        fi
    else
        log_warning "$var_name: Not set (optional)"
    fi
}

# Check critical environment variables
ENV_CHECK_FAILED=false

# Internet Identity v2 Configuration
check_env_var "VITE_II_HOST" || ENV_CHECK_FAILED=true
check_env_var "VITE_II_CANISTER_ID" || ENV_CHECK_FAILED=true

# Stripe Configuration (critical for production)
if [ "$BUILD_ENV" = "production" ]; then
    check_env_var "VITE_STRIPE_PUBLISHABLE_KEY" || ENV_CHECK_FAILED=true
    
    # Validate that it's a production key
    if [[ "$VITE_STRIPE_PUBLISHABLE_KEY" == pk_test_* ]]; then
        log_error "VITE_STRIPE_PUBLISHABLE_KEY appears to be a test key (pk_test_). Production requires pk_live_ key."
        ENV_CHECK_FAILED=true
    fi
fi

# API Configuration
check_env_var "VITE_API_BASE_URL" || ENV_CHECK_FAILED=true
check_env_var "VITE_ICP_USD_RATE_API" false

# Admin Configuration
check_env_var "VITE_ADMIN_PRINCIPALS" false

if [ "$ENV_CHECK_FAILED" = true ]; then
    log_error "Environment validation failed. Please set required environment variables."
    exit 1
fi

log_success "Environment validation passed"

# Security checks
log_header "Security Validation"

log_info "Running security audit..."
cd "$(dirname "$0")"

# Check if security audit file exists and run it
if [ -f "src/security/security-audit.ts" ]; then
    log_info "Running security audit..."
    npx tsx src/security/security-audit.ts || {
        log_warning "Security audit found issues. Review the output above."
        read -p "Continue with deployment despite security warnings? (yes/no): " -r
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            log_info "Deployment cancelled due to security concerns."
            exit 1
        fi
    }
else
    log_warning "Security audit script not found. Proceeding without security validation."
fi

# Install dependencies
log_header "Installing Dependencies"
log_info "Installing Node.js dependencies..."
pnpm install --frozen-lockfile

log_success "Dependencies installed"

# Run tests
log_header "Running Tests"
log_info "Running integration tests..."

# Run the comprehensive test suite
if npm run test:all; then
    log_success "All tests passed"
else
    log_error "Tests failed. Please fix failing tests before deployment."
    read -p "Continue with deployment despite test failures? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Deployment cancelled due to test failures."
        exit 1
    fi
fi

# Build the application
log_header "Building Application"
log_info "Building OHMS UI for $BUILD_ENV environment..."

# Set build-specific environment variables
export NODE_ENV=production
export VITE_BUILD_ENV=$BUILD_ENV
export VITE_BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export VITE_APP_VERSION=$(node -p "require('./package.json').version")

# Build the application
npm run build

if [ $? -eq 0 ]; then
    log_success "Build completed successfully"
else
    log_error "Build failed"
    exit 1
fi

# Validate build output
log_info "Validating build output..."
if [ ! -d "dist" ]; then
    log_error "Build output directory 'dist' not found"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    log_error "Build output 'dist/index.html' not found"
    exit 1
fi

log_success "Build validation passed"

# Deploy to Internet Computer
log_header "Deploying to Internet Computer"

# Start local replica if not mainnet
if [ "$NETWORK" != "ic" ]; then
    log_info "Starting local replica..."
    dfx start --clean --background
    log_success "Local replica started"
fi

# Deploy backend canisters first
log_info "Deploying backend canisters..."

# Deploy each canister
CANISTERS=("ohms_econ" "ohms_coordinator" "ohms_agent" "ohms_model")

for canister in "${CANISTERS[@]}"; do
    log_info "Deploying $canister..."
    if dfx deploy $canister --network $NETWORK --with-cycles 1000000000000; then
        log_success "$canister deployed successfully"
    else
        log_error "Failed to deploy $canister"
        exit 1
    fi
done

# Deploy frontend canister
log_info "Deploying OHMS UI frontend..."
if dfx deploy ohms_ui --network $NETWORK; then
    log_success "Frontend deployed successfully"
else
    log_error "Failed to deploy frontend"
    exit 1
fi

# Get canister URLs
log_header "Deployment Complete"

if [ "$NETWORK" = "ic" ]; then
    # Mainnet URLs
    UI_CANISTER_ID=$(dfx canister --network ic id ohms_ui)
    FRONTEND_URL="https://$UI_CANISTER_ID.icp0.io"
    
    log_success "🎉 OHMS 2.0 deployed to mainnet!"
    log_info "Frontend URL: $FRONTEND_URL"
    log_info "Canister ID: $UI_CANISTER_ID"
else
    # Local URLs
    UI_CANISTER_ID=$(dfx canister id ohms_ui)
    FRONTEND_URL="http://localhost:4943?canisterId=$UI_CANISTER_ID"
    
    log_success "🎉 OHMS 2.0 deployed locally!"
    log_info "Frontend URL: $FRONTEND_URL"
    log_info "Canister ID: $UI_CANISTER_ID"
fi

# Display all canister IDs
echo ""
log_info "Canister IDs:"
for canister in "${CANISTERS[@]}" "ohms_ui"; do
    CANISTER_ID=$(dfx canister --network $NETWORK id $canister 2>/dev/null || echo "Not deployed")
    echo "  $canister: $CANISTER_ID"
done

# Post-deployment verification
log_header "Post-Deployment Verification"

log_info "Waiting for canister to be ready..."
sleep 10

# Test if the frontend is accessible
log_info "Testing frontend accessibility..."
if curl -s -f "$FRONTEND_URL" > /dev/null; then
    log_success "Frontend is accessible"
else
    log_warning "Frontend may not be immediately accessible. Please wait a few minutes."
fi

# Security reminders for production
if [ "$NETWORK" = "ic" ]; then
    log_header "🔒 Security Reminders"
    log_warning "Post-deployment security checklist:"
    echo "  □ Verify all environment variables are production values"
    echo "  □ Test authentication flow with real Google accounts"
    echo "  □ Test payment processing with real Stripe account"
    echo "  □ Verify market data is updating correctly"
    echo "  □ Check admin access controls"
    echo "  □ Monitor error logs and metrics"
    echo "  □ Set up production monitoring and alerting"
    echo "  □ Update DNS records if using custom domain"
fi

# Final success message
echo ""
log_success "✨ OHMS 2.0 II v2 + Stripe Integration Deployment Complete! ✨"
echo ""
log_info "Next steps:"
echo "  1. Test the complete user journey"
echo "  2. Verify payment processing"
echo "  3. Check admin functionality"
echo "  4. Monitor system health"
echo ""
log_info "Frontend URL: $FRONTEND_URL"
echo ""

# Save deployment info
DEPLOYMENT_INFO=$(cat <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "network": "$NETWORK",
  "environment": "$BUILD_ENV",
  "version": "$VITE_APP_VERSION",
  "frontendUrl": "$FRONTEND_URL",
  "canisterIds": {
EOF

for canister in "${CANISTERS[@]}" "ohms_ui"; do
    CANISTER_ID=$(dfx canister --network $NETWORK id $canister 2>/dev/null || echo "null")
    DEPLOYMENT_INFO="$DEPLOYMENT_INFO    \"$canister\": \"$CANISTER_ID\","
done

DEPLOYMENT_INFO="${DEPLOYMENT_INFO%,}
  }
}"

echo "$DEPLOYMENT_INFO" > deployment-info.json
log_info "Deployment information saved to deployment-info.json"

exit 0