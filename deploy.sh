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

# Prepare env for mainnet build from backend canister_ids.json
echo "🧩 Preparing .env.ic from backend canister_ids.json..."
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

MODEL_ID=$(jq -r .ohms_model.ic ../ohms-model/canister_ids.json)
AGENT_ID=$(jq -r .ohms_agent.ic ../ohms-agent/canister_ids.json)
COORD_ID=$(jq -r .ohms_coordinator.ic ../ohms-coordinator/canister_ids.json)
ECON_ID=$(jq -r .ohms_econ.ic ../ohms-econ/canister_ids.json)

if [ -z "$MODEL_ID" ] || [ -z "$AGENT_ID" ] || [ -z "$COORD_ID" ] || [ -z "$ECON_ID" ]; then
  echo "❌ Missing one or more IC canister IDs. Ensure each backend has canister_ids.json with an 'ic' entry."
  exit 1
fi

cat > .env.ic <<EOF
VITE_DFX_NETWORK=ic
VITE_OHMS_MODEL_CANISTER_ID=$MODEL_ID
VITE_OHMS_AGENT_CANISTER_ID=$AGENT_ID
VITE_OHMS_COORDINATOR_CANISTER_ID=$COORD_ID
VITE_OHMS_ECON_CANISTER_ID=$ECON_ID
${VITE_SYSADMINS:+VITE_SYSADMINS=$VITE_SYSADMINS}
${VITE_SUBSCRIPTION_PAYEE:+VITE_SUBSCRIPTION_PAYEE=$VITE_SUBSCRIPTION_PAYEE}
EOF

# Export .env.ic into the environment so Vite injects all VITE_* vars
echo "📦 Building the project (pnpm, mainnet env)..."
set -a
source ./.env.ic
set +a
pnpm build

# Optional: local deploy preview step removed for CI-friendly prod deploy

# Deploy to IC mainnet
echo "🌍 Deploying to IC mainnet..."
# Keep env exported so the dfx-triggered build also sees VITE_* vars
set -a
source ./.env.ic
set +a
dfx deploy --network ic

echo "🔍 Getting production canister ID..."
PROD_OHMS_UI_CANISTER_ID=$(dfx canister id ohms_ui --network ic)
echo "Production OHMS UI Canister ID: $PROD_OHMS_UI_CANISTER_ID"

echo "✅ Deployment completed!"
echo "🌍 Production URL: https://$PROD_OHMS_UI_CANISTER_ID.icp0.io/"