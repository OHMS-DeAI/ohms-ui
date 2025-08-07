import { Actor, HttpAgent } from '@dfinity/agent';

// Import the generated declarations
// These will be available after dfx generate
const isDev = process.env.NODE_ENV !== 'production';

export const host = isDev ? 'http://127.0.0.1:4943' : 'https://ic0.app';

// Create an agent
export const agent = new HttpAgent({ 
  host,
  ...(isDev && { fetchRootKey: true })
});

// Environment variables for canister IDs
const OHMS_MODEL_CANISTER_ID = process.env.VITE_OHMS_MODEL_CANISTER_ID || 'lqy7q-dh777-77777-aaaaq-cai';
const OHMS_AGENT_CANISTER_ID = process.env.VITE_OHMS_AGENT_CANISTER_ID || 'll5dv-z7777-77777-aaaca-cai';
const OHMS_COORDINATOR_CANISTER_ID = process.env.VITE_OHMS_COORDINATOR_CANISTER_ID || 'lc6ij-px777-77777-aaadq-cai';
const OHMS_ECON_CANISTER_ID = process.env.VITE_OHMS_ECON_CANISTER_ID || 'kbsbp-3p777-77777-aaafa-cai';

// Candid interface definitions
const modelCanisterIdl = ({ IDL }: any) => {
  const AuditEventType = IDL.Variant({
    BadgeGrant: IDL.Null,
    ChunkAccess: IDL.Null,
    Activate: IDL.Null,
    Upload: IDL.Null,
    Deprecate: IDL.Null,
  });
  
  const AuditEvent = IDL.Record({
    actor: IDL.Text,
    timestamp: IDL.Nat64,
    details: IDL.Text,
    model_id: IDL.Text,
    event_type: AuditEventType,
  });

  const ModelState = IDL.Variant({
    Active: IDL.Null,
    Deprecated: IDL.Null,
    Pending: IDL.Null,
  });

  const ChunkInfo = IDL.Record({
    id: IDL.Text,
    sha256: IDL.Text,
    size: IDL.Nat64,
    offset: IDL.Nat64,
  });

  const ModelManifest = IDL.Record({
    activated_at: IDL.Opt(IDL.Nat64),
    version: IDL.Text,
    state: ModelState,
    digest: IDL.Text,
    chunks: IDL.Vec(ChunkInfo),
    model_id: IDL.Text,
    uploaded_at: IDL.Nat64,
  });

  return IDL.Service({
    health: IDL.Func([], [IDL.Text], ['query']),
    list_models: IDL.Func([IDL.Opt(ModelState)], [IDL.Vec(ModelManifest)], ['query']),
    get_manifest: IDL.Func([IDL.Text], [IDL.Opt(ModelManifest)], ['query']),
    get_audit_log: IDL.Func([], [IDL.Vec(AuditEvent)], ['query']),
  });
};

const agentCanisterIdl = ({ IDL }: any) => {
  const Result = IDL.Variant({
    Ok: IDL.Text,
    Err: IDL.Text,
  });

  const InferenceRequest = IDL.Record({
    prompt: IDL.Text,
    max_tokens: IDL.Opt(IDL.Nat32),
  });

  return IDL.Service({
    health: IDL.Func([], [IDL.Record({
      model_bound: IDL.Bool,
      queue_depth: IDL.Nat32,
      cache_hit_rate: IDL.Float32,
      warm_set_utilization: IDL.Float32,
      last_inference_timestamp: IDL.Nat64,
    })], ['query']),
    bind_model: IDL.Func([IDL.Text], [Result], []),
    infer: IDL.Func([InferenceRequest], [Result], []),
  });
};

const coordinatorCanisterIdl = ({ IDL }: any) => {
  const Result = IDL.Variant({
    Ok: IDL.Text,
    Err: IDL.Text,
  });

  const AgentInfo = IDL.Record({
    agent_id: IDL.Text,
    agent_principal: IDL.Principal,
    capabilities: IDL.Vec(IDL.Text),
    reputation: IDL.Nat64,
    last_heartbeat: IDL.Nat64,
    health_score: IDL.Float64,
  });

  const TaskRequest = IDL.Record({
    task_id: IDL.Text,
    agent_requirements: IDL.Vec(IDL.Text),
    routing_mode: IDL.Text,
    priority: IDL.Nat8,
  });

  return IDL.Service({
    health: IDL.Func([], [IDL.Record({
      total_agents: IDL.Nat32,
      active_agents: IDL.Nat32,
      total_bounties: IDL.Nat32,
      active_bounties: IDL.Nat32,
      total_routes_processed: IDL.Nat64,
      average_routing_time_ms: IDL.Float64,
      dedup_cache_size: IDL.Nat32,
    })], ['query']),
    list_agents: IDL.Func([], [IDL.Vec(AgentInfo)], ['query']),
    register_agent: IDL.Func([AgentInfo], [Result], []),
    route_task: IDL.Func([TaskRequest], [Result], []),
  });
};

const econCanisterIdl = ({ IDL }: any) => {
  const Result = IDL.Variant({
    Ok: IDL.Text,
    Err: IDL.Text,
  });

  const EscrowRequest = IDL.Record({
    amount: IDL.Nat64,
    recipient: IDL.Text,
    request_id: IDL.Text,
  });

  const Receipt = IDL.Record({
    receipt_id: IDL.Text,
    request_id: IDL.Text,
    amount: IDL.Nat64,
    status: IDL.Text,
    created_at: IDL.Nat64,
    settled_at: IDL.Opt(IDL.Nat64),
  });

  const Estimate = IDL.Record({
    base_cost: IDL.Nat64,
    priority_multiplier: IDL.Float64,
    protocol_fee: IDL.Nat64,
    total_cost: IDL.Nat64,
  });

  return IDL.Service({
    health: IDL.Func([], [IDL.Record({
      total_escrows: IDL.Nat32,
      active_escrows: IDL.Nat32,
      total_receipts: IDL.Nat32,
      pending_settlements: IDL.Nat32,
      total_volume: IDL.Nat64,
      protocol_fees_collected: IDL.Nat64,
      average_job_cost: IDL.Float64,
    })], ['query']),
    create_escrow: IDL.Func([EscrowRequest], [Result], []),
    get_estimate: IDL.Func([IDL.Text, IDL.Nat32], [Estimate], ['query']),
    list_receipts: IDL.Func([IDL.Text, IDL.Nat32], [IDL.Vec(Receipt)], ['query']),
  });
};

// Create actor instances
export const modelCanister = Actor.createActor(modelCanisterIdl, {
  agent,
  canisterId: OHMS_MODEL_CANISTER_ID,
});

export const agentCanister = Actor.createActor(agentCanisterIdl, {
  agent,
  canisterId: OHMS_AGENT_CANISTER_ID,
});

export const coordinatorCanister = Actor.createActor(coordinatorCanisterIdl, {
  agent,
  canisterId: OHMS_COORDINATOR_CANISTER_ID,
});

export const econCanister = Actor.createActor(econCanisterIdl, {
  agent,
  canisterId: OHMS_ECON_CANISTER_ID,
});

// Utility functions
export const getCanisterIds = () => ({
  model: OHMS_MODEL_CANISTER_ID,
  agent: OHMS_AGENT_CANISTER_ID,
  coordinator: OHMS_COORDINATOR_CANISTER_ID,
  econ: OHMS_ECON_CANISTER_ID,
});

// Health check for all canisters
export const healthCheck = async () => {
  try {
    const [modelHealth, agentHealth, coordinatorHealth, econHealth] = await Promise.allSettled([
      modelCanister.health(),
      agentCanister.health(),
      coordinatorCanister.health(),
      econCanister.health(),
    ]);

    return {
      model: modelHealth.status === 'fulfilled' ? modelHealth.value : 'Error',
      agent: agentHealth.status === 'fulfilled' ? agentHealth.value : 'Error',
      coordinator: coordinatorHealth.status === 'fulfilled' ? coordinatorHealth.value : 'Error',
      econ: econHealth.status === 'fulfilled' ? econHealth.value : 'Error',
    };
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};