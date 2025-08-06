# OHMS UI - Internet Computer Deployment

This guide explains how to deploy the OHMS UI to the Internet Computer (ICP).

## Prerequisites

1. **Install dfx**: The Internet Computer SDK
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

2. **Create and configure dfx identity**:
   ```bash
   dfx identity new my-identity
   dfx identity use my-identity
   ```

3. **Get ICP tokens** (for mainnet deployment):
   - Visit [cycles.ic0.app](https://cycles.ic0.app) to get free cycles
   - Or transfer ICP to your identity for cycles

## Local Development

1. **Start local replica**:
   ```bash
   dfx start --clean
   ```

2. **Build and deploy locally**:
   ```bash
   npm run dfx:build
   dfx deploy --network local
   ```

3. **Access the application**:
   - Get canister ID: `dfx canister id ohms_ui --network local`
   - Visit: `http://localhost:4943/?canisterId=<CANISTER_ID>`

## Production Deployment

### Option 1: Using the deployment script
```bash
./deploy.sh
```

### Option 2: Manual deployment
```bash
# Build the project
npm run build

# Deploy to IC mainnet
dfx deploy --network ic

# Get the canister ID
dfx canister id ohms_ui --network ic
```

### Access your deployed application
- URL: `https://<CANISTER_ID>.ic0.app`
- Replace `<CANISTER_ID>` with your actual canister ID

## Environment Variables

Create a `.env` file in the project root with:

```env
# Network configuration
VITE_DFX_NETWORK=ic

# Canister IDs (populate after deployment)
VITE_OHMS_MODEL_CANISTER_ID=<your_model_canister_id>
VITE_OHMS_AGENT_CANISTER_ID=<your_agent_canister_id>
VITE_OHMS_COORDINATOR_CANISTER_ID=<your_coordinator_canister_id>
VITE_OHMS_ECON_CANISTER_ID=<your_econ_canister_id>
```

## Useful Commands

```bash
# Start local replica
dfx start --clean

# Stop local replica
dfx stop

# Deploy to local network
dfx deploy --network local

# Deploy to IC mainnet
dfx deploy --network ic

# Get canister ID
dfx canister id ohms_ui --network <local|ic>

# Check canister status
dfx canister status ohms_ui --network <local|ic>

# Upgrade canister
dfx deploy --upgrade-unchanged --network <local|ic>
```

## Troubleshooting

1. **"dfx not found"**: Install dfx using the command above
2. **Authentication errors**: Create and use a dfx identity
3. **Insufficient cycles**: Get free cycles from [cycles.ic0.app](https://cycles.ic0.app)
4. **Build errors**: Ensure all dependencies are installed with `npm install`

## Architecture

The UI is deployed as an "assets" canister type, which serves static files (HTML, CSS, JS) directly from the Internet Computer. This provides:

- **Decentralized hosting**: No traditional servers needed
- **Global distribution**: Content served from IC nodes worldwide
- **Tamper-proof**: Content is stored on the blockchain
- **Fast access**: CDN-like performance through IC's global network 