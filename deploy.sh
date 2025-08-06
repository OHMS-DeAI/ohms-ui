#!/bin/bash

# OHMS UI Deployment Script for Internet Computer
set -e

echo "🚀 Starting OHMS UI deployment to ICP..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install dfx first."
    echo "Visit: https://internetcomputer.org/docs/current/developer-docs/setup/install/"
    exit 1
fi

# Check if user is authenticated
if ! dfx identity whoami &> /dev/null; then
    echo "❌ Not authenticated with dfx. Please run 'dfx identity new <name>' and 'dfx identity use <name>'"
    exit 1
fi

# Build the project
echo "📦 Building the project..."
npm run build

# Deploy to local network first (for testing)
echo "🌐 Deploying to local network..."
dfx deploy --network local

# Get canister IDs
echo "🔍 Getting canister IDs..."
OHMS_UI_CANISTER_ID=$(dfx canister id ohms_ui --network local)
echo "OHMS UI Canister ID: $OHMS_UI_CANISTER_ID"

# Deploy to IC mainnet
echo "🌍 Deploying to IC mainnet..."
dfx deploy --network ic

# Get production canister IDs
echo "🔍 Getting production canister IDs..."
PROD_OHMS_UI_CANISTER_ID=$(dfx canister id ohms_ui --network ic)
echo "Production OHMS UI Canister ID: $PROD_OHMS_UI_CANISTER_ID"

echo "✅ Deployment completed!"
echo "🌐 Local URL: http://localhost:4943/?canisterId=$OHMS_UI_CANISTER_ID"
echo "🌍 Production URL: https://$PROD_OHMS_UI_CANISTER_ID.ic0.app" 