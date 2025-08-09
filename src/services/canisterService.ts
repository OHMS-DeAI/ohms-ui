import { Actor, HttpAgent } from '@dfinity/agent';

// Import the generated declarations
// These will be available after dfx generate
const isProdBuild = (import.meta as any).env?.PROD === true;
const runtimeHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : undefined;
const isMainnetHost = !!runtimeHost && (runtimeHost.endsWith('.icp0.io') || runtimeHost.endsWith('.ic0.app'));
const envNetwork = (import.meta as any).env?.VITE_DFX_NETWORK as string | undefined;
const network = isMainnetHost ? 'ic' : (envNetwork || (isProdBuild ? 'ic' : 'local'));
export const host = network === 'ic' ? 'https://ic0.app' : 'http://127.0.0.1:4943';

// Create an agent
export const agent = new HttpAgent({ host });
if (network !== 'ic') {
  // Fetch the root key for local development to validate certificates
  agent.fetchRootKey?.().catch(() => console.warn('fetchRootKey failed (local dev)'));
}

// Environment variables for canister IDs (no placeholders)
const fromEnv = (k: string): string => {
  const v = (import.meta as any).env?.[k] ?? (process as any).env?.[k];
  if (!v) {
    // Surface a clear error early in development; in prod this should never happen if built with .env.ic
    console.error(`Missing required env ${k}. Set it in .env.local for local or .env.ic for mainnet builds.`);
  }
  return v as string;
};

const OHMS_MODEL_CANISTER_ID = fromEnv('VITE_OHMS_MODEL_CANISTER_ID');
const OHMS_AGENT_CANISTER_ID = fromEnv('VITE_OHMS_AGENT_CANISTER_ID');
const OHMS_COORDINATOR_CANISTER_ID = fromEnv('VITE_OHMS_COORDINATOR_CANISTER_ID');
const OHMS_ECON_CANISTER_ID = fromEnv('VITE_OHMS_ECON_CANISTER_ID');

// Candid interface definitions - matching actual deployed interfaces
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

  const ModelMeta = IDL.Record({
    tokenizer_id: IDL.Text,
    vocab_size: IDL.Nat32,
    arch: IDL.Text,
    ctx_window: IDL.Nat32,
    license: IDL.Text,
    family: IDL.Text,
  });

  const ChunkData = IDL.Record({ data: IDL.Vec(IDL.Nat8), chunk_id: IDL.Text });
  
  const ModelUpload = IDL.Record({
    signature: IDL.Opt(IDL.Text),
    meta: ModelMeta,
    chunks: IDL.Vec(ChunkData),
    model_id: IDL.Text,
    manifest: ModelManifest,
  });

  const Result = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });

  return IDL.Service({
    health: IDL.Func([], [IDL.Text], ['query']),
    list_models: IDL.Func([IDL.Opt(ModelState)], [IDL.Vec(ModelManifest)], ['query']),
    get_manifest: IDL.Func([IDL.Text], [IDL.Opt(ModelManifest)], ['query']),
    get_chunk: IDL.Func([IDL.Text, IDL.Text], [IDL.Opt(IDL.Vec(IDL.Nat8))], ['query']),
    get_audit_log: IDL.Func([], [IDL.Vec(AuditEvent)], ['query']),
    // Additional methods from actual interface
    activate_model: IDL.Func([IDL.Text], [Result], []),
    add_authorized_uploader: IDL.Func([IDL.Text], [Result], []),
    deprecate_model: IDL.Func([IDL.Text], [Result], []),
    submit_model: IDL.Func([ModelUpload], [Result], []),
  });
};

const agentCanisterIdl = ({ IDL }: any) => {
  const DecodeParams = IDL.Record({
    max_tokens: IDL.Opt(IDL.Nat32),
    temperature: IDL.Opt(IDL.Float32),
    top_p: IDL.Opt(IDL.Float32),
    top_k: IDL.Opt(IDL.Nat32),
    repetition_penalty: IDL.Opt(IDL.Float32),
  });

  const InferenceRequest = IDL.Record({
    seed: IDL.Nat64,
    prompt: IDL.Text,
    decode_params: DecodeParams,
    msg_id: IDL.Text,
  });

  const InferenceResponse = IDL.Record({
    tokens: IDL.Vec(IDL.Text),
    generated_text: IDL.Text,
    inference_time_ms: IDL.Nat64,
    cache_hits: IDL.Nat32,
    cache_misses: IDL.Nat32,
  });

  const AgentConfig = IDL.Record({
    warm_set_target: IDL.Float32,
    prefetch_depth: IDL.Nat32,
    max_tokens: IDL.Nat32,
    concurrency_limit: IDL.Nat32,
    ttl_seconds: IDL.Nat64,
    model_repo_canister_id: IDL.Text,
  });

  const AgentHealth = IDL.Record({
    model_bound: IDL.Bool,
    cache_hit_rate: IDL.Float32,
    warm_set_utilization: IDL.Float32,
    queue_depth: IDL.Nat32,
    last_inference_timestamp: IDL.Nat64,
  });

  const ResultVoid = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });
  const ResultInference = IDL.Variant({ Ok: InferenceResponse, Err: IDL.Text });
  const ResultConfig = IDL.Variant({ Ok: AgentConfig, Err: IDL.Text });

  return IDL.Service({
    health: IDL.Func([], [AgentHealth], ['query']),
    bind_model: IDL.Func([IDL.Text], [ResultVoid], []),
    infer: IDL.Func([InferenceRequest], [ResultInference], []),
    set_config: IDL.Func([AgentConfig], [ResultVoid], []),
    get_config: IDL.Func([], [ResultConfig], ['query']),
  });
};

const coordinatorCanisterIdl = ({ IDL }: any) => {
  // Result variants matching the actual canister
  const Result = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  const Result_8 = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });

  // Types from actual ohms-coordinator.did
  const RoutingMode = IDL.Variant({ Unicast: IDL.Null, Broadcast: IDL.Null, Competition: IDL.Null });
  const AgentRegistration = IDL.Record({
    agent_id: IDL.Text,
    agent_principal: IDL.Text,
    canister_id: IDL.Text,
    capabilities: IDL.Vec(IDL.Text),
    model_id: IDL.Text,
    health_score: IDL.Float32,
    registered_at: IDL.Nat64,
    last_seen: IDL.Nat64,
  });
  const RouteRequest = IDL.Record({
    request_id: IDL.Text,
    requester: IDL.Text,
    capabilities_required: IDL.Vec(IDL.Text),
    payload: IDL.Vec(IDL.Nat8),
    routing_mode: RoutingMode,
  });
  const RouteResponse = IDL.Record({
    request_id: IDL.Text,
    selected_agents: IDL.Vec(IDL.Text),
    routing_time_ms: IDL.Nat64,
    selection_criteria: IDL.Text,
  });
  const CoordinatorHealth = IDL.Record({
    total_agents: IDL.Nat32,
    active_agents: IDL.Nat32,
    total_bounties: IDL.Nat32,
    active_bounties: IDL.Nat32,
    total_routes_processed: IDL.Nat64,
    average_routing_time_ms: IDL.Float64,
    dedup_cache_size: IDL.Nat32,
  });
  const RoutingStats = IDL.Record({
    agent_id: IDL.Text,
    total_requests: IDL.Nat64,
    success_rate: IDL.Float32,
    average_response_time_ms: IDL.Float64,
  });
  const SwarmTopology = IDL.Variant({ Mesh: IDL.Null, Hierarchical: IDL.Null, Ring: IDL.Null, Star: IDL.Null });
  const OrchestrationMode = IDL.Variant({ Parallel: IDL.Null, Sequential: IDL.Null, Adaptive: IDL.Null });
  const SwarmPolicy = IDL.Record({
    topology: SwarmTopology,
    mode: OrchestrationMode,
    top_k: IDL.Nat32,
    window_ms: IDL.Nat64,
  });

  const BountySpec = IDL.Record({
    title: IDL.Text,
    description: IDL.Text,
    required_capabilities: IDL.Vec(IDL.Text),
    max_participants: IDL.Nat32,
    deadline_timestamp: IDL.Nat64,
    escrow_amount: IDL.Nat64,
  });

  const BountyStatus = IDL.Variant({ Open: IDL.Null, InProgress: IDL.Null, Resolved: IDL.Null, Cancelled: IDL.Null, Expired: IDL.Null });
  const BountySubmission = IDL.Record({ 
    submission_id: IDL.Text, 
    bounty_id: IDL.Text, 
    agent_id: IDL.Text, 
    payload: IDL.Vec(IDL.Nat8), 
    submitted_at: IDL.Nat64, 
    evaluation_score: IDL.Opt(IDL.Float32) 
  });
  const Bounty = IDL.Record({ 
    bounty_id: IDL.Text, 
    spec: BountySpec, 
    creator: IDL.Text, 
    escrow_id: IDL.Text, 
    status: BountyStatus, 
    created_at: IDL.Nat64, 
    submissions: IDL.Vec(BountySubmission) 
  });
  
  const ResolutionType = IDL.Variant({ WinnerSelected: IDL.Null, NoWinner: IDL.Null, Cancelled: IDL.Null, Expired: IDL.Null });
  const BountyResolution = IDL.Record({
    bounty_id: IDL.Text,
    winner_id: IDL.Opt(IDL.Text),
    resolution_type: ResolutionType,
    resolved_at: IDL.Nat64,
    settlement_details: IDL.Text,
  });

  // Result variants
  const Result_1 = IDL.Variant({ Ok: AgentRegistration, Err: IDL.Text });
  const Result_2 = IDL.Variant({ Ok: RouteResponse, Err: IDL.Text });
  const Result_3 = IDL.Variant({ Ok: BountyResolution, Err: IDL.Text });
  const Result_4 = IDL.Variant({ Ok: Bounty, Err: IDL.Text });
  const Result_5 = IDL.Variant({ Ok: IDL.Vec(AgentRegistration), Err: IDL.Text });
  const Result_6 = IDL.Variant({ Ok: IDL.Vec(Bounty), Err: IDL.Text });
  const Result_7 = IDL.Variant({ Ok: IDL.Vec(RoutingStats), Err: IDL.Text });

  return IDL.Service({
    // Health & registry - matching actual interface
    health: IDL.Func([], [CoordinatorHealth], ['query']),
    list_agents: IDL.Func([], [Result_5], ['query']), // Returns Result, not plain Vec
    get_agent: IDL.Func([IDL.Text], [Result_1], ['query']),
    register_agent: IDL.Func([AgentRegistration], [Result], []),
    update_agent_health: IDL.Func([IDL.Text, IDL.Float32], [Result_8], []),

    // Routing
    route_request: IDL.Func([RouteRequest], [Result_2], []),
    route_best_result: IDL.Func([RouteRequest, IDL.Nat32, IDL.Nat64], [Result_2], []),
    get_routing_stats: IDL.Func([IDL.Opt(IDL.Text)], [Result_7], ['query']),

    // Bounties - matching actual interface
    open_bounty: IDL.Func([BountySpec, IDL.Text], [Result], []),
    get_bounty: IDL.Func([IDL.Text], [Result_4], ['query']),
    list_bounties: IDL.Func([], [Result_6], ['query']), // Returns Result, not plain Vec
    resolve_bounty: IDL.Func([IDL.Text, IDL.Opt(IDL.Text)], [Result_3], []),
    submit_result: IDL.Func([IDL.Text, IDL.Text, IDL.Vec(IDL.Nat8)], [Result], []),
    competition_summary: IDL.Func([IDL.Text], [IDL.Record({ 
      request_id: IDL.Text, 
      top_k: IDL.Nat32, 
      window_ms: IDL.Nat64, 
      winner_id: IDL.Opt(IDL.Text), 
      scores: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Float32)) 
    })], ['query']),

    // Swarm policy
    set_swarm_policy: IDL.Func([SwarmPolicy], [Result_8], []),
    get_swarm_policy: IDL.Func([], [SwarmPolicy], ['query']),
  });
};

const econCanisterIdl = ({ IDL }: any) => {
  const JobPriority = IDL.Variant({ Low: IDL.Null, Normal: IDL.Null, High: IDL.Null, Critical: IDL.Null })
  const JobSpec = IDL.Record({ job_id: IDL.Text, model_id: IDL.Text, estimated_tokens: IDL.Nat32, estimated_compute_cycles: IDL.Nat64, priority: JobPriority })
  const CostQuote = IDL.Record({ job_id: IDL.Text, estimated_cost: IDL.Nat64, base_cost: IDL.Nat64, priority_multiplier: IDL.Float32, protocol_fee: IDL.Nat64, quote_expires_at: IDL.Nat64, quote_id: IDL.Text })
  const EscrowStatus = IDL.Variant({ Pending: IDL.Null, Active: IDL.Null, Released: IDL.Null, Refunded: IDL.Null, Expired: IDL.Null })
  const EscrowAccount = IDL.Record({ escrow_id: IDL.Text, job_id: IDL.Text, principal_id: IDL.Text, amount: IDL.Nat64, status: EscrowStatus, created_at: IDL.Nat64, expires_at: IDL.Nat64 })
  const SettlementStatus = IDL.Variant({ Pending: IDL.Null, Completed: IDL.Null, Failed: IDL.Null, Disputed: IDL.Null })
  const FeesBreakdown = IDL.Record({ base_amount: IDL.Nat64, protocol_fee: IDL.Nat64, agent_fee: IDL.Nat64, total_amount: IDL.Nat64 })
  const Receipt = IDL.Record({ receipt_id: IDL.Text, job_id: IDL.Text, escrow_id: IDL.Text, agent_id: IDL.Text, actual_cost: IDL.Nat64, fees_breakdown: FeesBreakdown, settlement_status: SettlementStatus, created_at: IDL.Nat64, settled_at: IDL.Opt(IDL.Nat64) })
  const Balance = IDL.Record({ principal_id: IDL.Text, available_balance: IDL.Nat64, escrowed_balance: IDL.Nat64, total_earnings: IDL.Nat64, last_updated: IDL.Nat64 })
  const FeePolicy = IDL.Record({ protocol_fee_percentage: IDL.Float32, agent_fee_percentage: IDL.Float32, minimum_fee: IDL.Nat64, priority_multipliers: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Float32)), last_updated: IDL.Nat64 })
  const EconHealth = IDL.Record({ total_escrows: IDL.Nat32, active_escrows: IDL.Nat32, total_receipts: IDL.Nat32, pending_settlements: IDL.Nat32, total_volume: IDL.Nat64, protocol_fees_collected: IDL.Nat64, average_job_cost: IDL.Float64 })
  const ResultText = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text })
  const ResultQuote = IDL.Variant({ Ok: CostQuote, Err: IDL.Text })
  const ResultBalance = IDL.Variant({ Ok: Balance, Err: IDL.Text })
  const ResultEscrow = IDL.Variant({ Ok: EscrowAccount, Err: IDL.Text })
  const ResultReceipt = IDL.Variant({ Ok: Receipt, Err: IDL.Text })
  const ResultReceipts = IDL.Variant({ Ok: IDL.Vec(Receipt), Err: IDL.Text })
  const ResultUnit = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text })
  return IDL.Service({
    health: IDL.Func([], [EconHealth], ['query']),
    estimate: IDL.Func([JobSpec], [ResultQuote], ['query']),
    escrow: IDL.Func([IDL.Text, IDL.Nat64], [ResultText], []),
    get_balance: IDL.Func([IDL.Opt(IDL.Text)], [ResultBalance], ['query']),
    get_escrow: IDL.Func([IDL.Text], [ResultEscrow], ['query']),
    get_receipt: IDL.Func([IDL.Text], [ResultReceipt], ['query']),
    list_receipts: IDL.Func([IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat32)], [ResultReceipts], ['query']),
    policy: IDL.Func([], [FeePolicy], ['query']),
    refund_escrow: IDL.Func([IDL.Text], [ResultUnit], []),
    update_policy: IDL.Func([FeePolicy], [ResultUnit], []),
    deposit: IDL.Func([IDL.Nat64], [ResultUnit], []),
    withdraw: IDL.Func([IDL.Nat64], [ResultUnit], []),
    // Add settle method that was missing
    settle: IDL.Func([Receipt], [ResultText], []),
  })
}

// Export IDL for creating custom actors
export { modelCanisterIdl, agentCanisterIdl, coordinatorCanisterIdl, econCanisterIdl };

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

// Swarm helpers
export const setSwarmPolicy = async (policy: { topology: any; mode: any; top_k: number; window_ms: bigint; }) => {
  return coordinatorCanister.set_swarm_policy(policy);
};

export const getSwarmPolicy = async () => {
  return coordinatorCanister.get_swarm_policy();
};

export const routeBestResult = async (req: {
  request_id: string;
  requester: string;
  capabilities_required: string[];
  payload: Uint8Array;
  routing_mode: any;
}, topK: number, windowMs: bigint) => {
  return coordinatorCanister.route_best_result(req, topK, windowMs);
};

// Helpers
export const createAgentActor = (canisterId: string, agentOverride?: HttpAgent) => 
  Actor.createActor(agentCanisterIdl, { agent: agentOverride || agent, canisterId });

export const createCoordinatorActor = (agentOverride?: HttpAgent) =>
  Actor.createActor(coordinatorCanisterIdl, {
    agent: agentOverride || agent,
    canisterId: OHMS_COORDINATOR_CANISTER_ID,
  });

export const createModelActor = (agentOverride?: HttpAgent) =>
  Actor.createActor(modelCanisterIdl, {
    agent: agentOverride || agent,
    canisterId: OHMS_MODEL_CANISTER_ID,
  });

export const listAgents = async (agentOverride?: HttpAgent): Promise<any[]> => {
  const coordActor = agentOverride ? createCoordinatorActor(agentOverride) : coordinatorCanister;
  const res = await coordActor.list_agents() as { Ok?: any[]; Err?: string };
  // Handle Result type - check if Ok or Err
  if ('Ok' in res && res.Ok) {
    return res.Ok;
  } else {
    console.error('Failed to list agents:', res.Err);
    throw new Error(res.Err || 'Unknown error');
  }
};

export const listBounties = async (agentOverride?: HttpAgent): Promise<any[]> => {
  const coordActor = agentOverride ? createCoordinatorActor(agentOverride) : coordinatorCanister;
  const res = await coordActor.list_bounties() as { Ok?: any[]; Err?: string };
  // Handle Result type - check if Ok or Err  
  if ('Ok' in res && res.Ok) {
    return res.Ok;
  } else {
    console.error('Failed to list bounties:', res.Err);
    throw new Error(res.Err || 'Unknown error');
  }
};

export const listModels = async (state?: any, agentOverride?: HttpAgent): Promise<any[]> => {
  const modelActor = agentOverride ? createModelActor(agentOverride) : modelCanister;
  const res = await modelActor.list_models(state ? [state] : []);
  return res as any[];
};

export const openBounty = async (spec: any, escrowId: string): Promise<any> => {
  return coordinatorCanister.open_bounty(spec, escrowId);
};

// Dynamic actor creators (useful to attach a specific agent/identity)
export const createEconActor = (agentOverride?: HttpAgent) =>
  Actor.createActor(econCanisterIdl, {
    agent: agentOverride ?? agent,
    canisterId: OHMS_ECON_CANISTER_ID,
  });