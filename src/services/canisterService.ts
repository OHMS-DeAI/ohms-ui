import { Actor, HttpAgent } from '@dfinity/agent';
import { HOST as RESOLVED_HOST, NETWORK, getCanisterIdsFromEnv } from '../config/network'

// Centralized host/network resolution
export const host = RESOLVED_HOST;

// Create an agent
export const agent = new HttpAgent({ host });
if (NETWORK !== 'ic') {
  // Fetch the root key for local development to validate certificates
  agent.fetchRootKey?.().catch(() => console.warn('fetchRootKey failed (local dev)'));
}

// Canister IDs from env via network config
const { ohms_model: OHMS_MODEL_CANISTER_ID, ohms_agent: OHMS_AGENT_CANISTER_ID, ohms_coordinator: OHMS_COORDINATOR_CANISTER_ID, ohms_econ: OHMS_ECON_CANISTER_ID } = getCanisterIdsFromEnv()

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
  
  // Agent creation types
  const AgentCreationRequest = IDL.Record({
    instruction: IDL.Text,
    agent_count: IDL.Opt(IDL.Nat32),
    capabilities: IDL.Opt(IDL.Vec(IDL.Text)),
    priority: IDL.Opt(IDL.Text),
  });
  
  const AgentCreationResult = IDL.Record({
    agent_id: IDL.Text,
    status: IDL.Text,
    capabilities: IDL.Vec(IDL.Text),
    estimated_completion: IDL.Opt(IDL.Nat64),
  });
  
  const ResultAgentCreation = IDL.Variant({ Ok: AgentCreationResult, Err: IDL.Text });

  return IDL.Service({
    health: IDL.Func([], [AgentHealth], ['query']),
    bind_model: IDL.Func([IDL.Text], [ResultVoid], []),
    infer: IDL.Func([InferenceRequest], [ResultInference], []),
    set_config: IDL.Func([AgentConfig], [ResultVoid], []),
    get_config: IDL.Func([], [ResultConfig], ['query']),
    create_agent_from_instruction: IDL.Func([AgentCreationRequest], [ResultAgentCreation], []),
  });
};

const coordinatorCanisterIdl = ({ IDL }: any) => {
  // Result variants matching the actual canister
  const Result = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text });
  const Result_8 = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text });

  // OHMS 2.0 Types from actual ohms-coordinator.did
  const RoutingMode = IDL.Variant({ Unicast: IDL.Null, Broadcast: IDL.Null, AgentSpawning: IDL.Null });
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
    total_agent_creations: IDL.Nat32,
    active_instructions: IDL.Nat32,
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

  // OHMS 2.0 Agent Spawning Types
  const InstructionRequest = IDL.Record({
    request_id: IDL.Text,
    user_principal: IDL.Text,
    instructions: IDL.Text,
    agent_count: IDL.Opt(IDL.Nat32),
    capabilities_required: IDL.Vec(IDL.Text),
    priority: IDL.Text,
    created_at: IDL.Nat64,
  });

  const AgentCreationStatus = IDL.Variant({ 
    Pending: IDL.Null, 
    InProgress: IDL.Null, 
    Completed: IDL.Null, 
    Failed: IDL.Null 
  });

  const AgentCreationResult = IDL.Record({
    request_id: IDL.Text,
    agent_ids: IDL.Vec(IDL.Text),
    status: AgentCreationStatus,
    created_at: IDL.Nat64,
    completed_at: IDL.Opt(IDL.Nat64),
    error_message: IDL.Opt(IDL.Text),
  });

  const AgentSpec = IDL.Record({
    agent_id: IDL.Text,
    capabilities: IDL.Vec(IDL.Text),
    behavior_rules: IDL.Vec(IDL.Text),
    coordination_network: IDL.Opt(IDL.Text),
  });

  const InstructionAnalysisResult = IDL.Record({
    request_id: IDL.Text,
    estimated_agents: IDL.Nat32,
    required_capabilities: IDL.Vec(IDL.Text),
    complexity_score: IDL.Float32,
    estimated_duration: IDL.Nat64,
    coordination_needs: IDL.Vec(IDL.Text),
  });

  const QuotaCheckResult = IDL.Record({
    allowed: IDL.Bool,
    remaining_quota: IDL.Opt(IDL.Record({
      agents_remaining: IDL.Nat32,
      tokens_remaining: IDL.Nat64,
      inferences_remaining: IDL.Nat32,
    })),
    reason: IDL.Opt(IDL.Text),
  });

  // OHMS 2.0 Economics Integration Types
  const UserSubscription = IDL.Record({
    principal_id: IDL.Text,
    tier: IDL.Record({
      name: IDL.Text,
      monthly_fee_usd: IDL.Nat32,
      max_agents: IDL.Nat32,
      monthly_agent_creations: IDL.Nat32,
      token_limit: IDL.Nat64,
      inference_rate: IDL.Variant({ Standard: IDL.Null, Priority: IDL.Null, Premium: IDL.Null }),
      features: IDL.Vec(IDL.Text),
    }),
    started_at: IDL.Nat64,
    expires_at: IDL.Nat64,
    auto_renew: IDL.Bool,
    current_usage: IDL.Record({
      agents_created_this_month: IDL.Nat32,
      tokens_used_this_month: IDL.Nat64,
      inferences_this_month: IDL.Nat32,
      last_reset_date: IDL.Nat64,
    }),
    payment_status: IDL.Variant({ Active: IDL.Null, Pending: IDL.Null, Failed: IDL.Null, Cancelled: IDL.Null }),
    created_at: IDL.Nat64,
    updated_at: IDL.Nat64,
  });

  const EconHealth = IDL.Record({
    total_escrows: IDL.Nat32,
    active_escrows: IDL.Nat32,
    total_receipts: IDL.Nat32,
    pending_settlements: IDL.Nat32,
    total_volume: IDL.Nat64,
    protocol_fees_collected: IDL.Nat64,
    average_job_cost: IDL.Float64,
  });

  const QuotaValidation = IDL.Record({
    allowed: IDL.Bool,
    reason: IDL.Opt(IDL.Text),
    remaining_quota: IDL.Opt(IDL.Record({
      agents_remaining: IDL.Nat32,
      tokens_remaining: IDL.Nat64,
      inferences_remaining: IDL.Nat32,
    })),
  });

  // Result variants
  const Result_1 = IDL.Variant({ Ok: AgentRegistration, Err: IDL.Text });
  const Result_2 = IDL.Variant({ Ok: RouteResponse, Err: IDL.Text });
  const Result_5 = IDL.Variant({ Ok: IDL.Vec(AgentRegistration), Err: IDL.Text });
  const Result_7 = IDL.Variant({ Ok: IDL.Vec(RoutingStats), Err: IDL.Text });
  const Result_InstructionAnalysis = IDL.Variant({ Ok: InstructionAnalysisResult, Err: IDL.Text });
  const Result_AgentCreation = IDL.Variant({ Ok: AgentCreationResult, Err: IDL.Text });
  const Result_QuotaCheck = IDL.Variant({ Ok: QuotaCheckResult, Err: IDL.Text });
  const Result_UserSubscription = IDL.Variant({ Ok: UserSubscription, Err: IDL.Text });
  const Result_EconHealth = IDL.Variant({ Ok: EconHealth, Err: IDL.Text });
  const Result_QuotaValidation = IDL.Variant({ Ok: QuotaValidation, Err: IDL.Text });

  return IDL.Service({
    // Health & registry - matching actual interface
    health: IDL.Func([], [CoordinatorHealth], ['query']),
    list_agents: IDL.Func([], [Result_5], ['query']),
    get_agent: IDL.Func([IDL.Text], [Result_1], ['query']),
    register_agent: IDL.Func([AgentRegistration], [Result], []),
    update_agent_health: IDL.Func([IDL.Text, IDL.Float32], [Result_8], []),

    // Routing
    route_request: IDL.Func([RouteRequest], [Result_2], []),
    route_best_result: IDL.Func([RouteRequest, IDL.Nat32, IDL.Nat64], [Result_2], []),
    get_routing_stats: IDL.Func([IDL.Opt(IDL.Text)], [Result_7], ['query']),

    // OHMS 2.0 Agent Spawning APIs
    create_agents_from_instructions: IDL.Func([IDL.Text, IDL.Opt(IDL.Nat32), IDL.Vec(IDL.Text), IDL.Text], [Result_AgentCreation], []),
    get_agent_creation_status: IDL.Func([IDL.Text], [Result_AgentCreation], ['query']),
    get_user_quota_status: IDL.Func([], [Result_QuotaCheck], []),
    list_user_agents: IDL.Func([], [Result_5], ['query']),
    list_instruction_requests: IDL.Func([], [IDL.Vec(InstructionRequest)], ['query']),
    get_instruction_analysis: IDL.Func([IDL.Text], [Result_InstructionAnalysis], ['query']),
    update_agent_status: IDL.Func([IDL.Text, IDL.Text], [Result_8], []),
    get_agent_spawning_metrics: IDL.Func([], [IDL.Record({
      total_creations: IDL.Nat32,
      successful_creations: IDL.Nat32,
      failed_creations: IDL.Nat32,
      average_creation_time_ms: IDL.Float64,
    })], ['query']),
    get_coordination_networks: IDL.Func([], [IDL.Vec(IDL.Record({
      network_id: IDL.Text,
      agent_count: IDL.Nat32,
      coordination_type: IDL.Text,
      created_at: IDL.Nat64,
    }))], ['query']),

    // OHMS 2.0 Subscription Management
    upgrade_subscription_tier: IDL.Func([IDL.Text], [Result_UserSubscription], []),
    get_subscription_tier_info: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Record({
      name: IDL.Text,
      monthly_fee_usd: IDL.Nat32,
      max_agents: IDL.Nat32,
      monthly_agent_creations: IDL.Nat32,
      token_limit: IDL.Nat64,
      inference_rate: IDL.Variant({ Standard: IDL.Null, Priority: IDL.Null, Premium: IDL.Null }),
      features: IDL.Vec(IDL.Text),
    })))], ['query']),

    // OHMS 2.0 Economics Integration
    get_economics_health: IDL.Func([], [Result_EconHealth], []),
    validate_token_usage_quota: IDL.Func([IDL.Nat64], [Result_QuotaValidation], []),

    // Swarm policy
    set_swarm_policy: IDL.Func([SwarmPolicy], [Result_8], []),
    get_swarm_policy: IDL.Func([], [SwarmPolicy], ['query']),
  });
};

const econCanisterIdl = ({ IDL }: any) => {
  // Core economics types
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
  
  // Subscription types
  const InferenceRate = IDL.Variant({ Standard: IDL.Null, Priority: IDL.Null, Premium: IDL.Null })
  const TierConfig = IDL.Record({ name: IDL.Text, monthly_fee_usd: IDL.Nat32, max_agents: IDL.Nat32, monthly_agent_creations: IDL.Nat32, token_limit: IDL.Nat64, inference_rate: InferenceRate, features: IDL.Vec(IDL.Text) })
  const PaymentStatus = IDL.Variant({ Active: IDL.Null, Pending: IDL.Null, Failed: IDL.Null, Cancelled: IDL.Null })
  const UsageMetrics = IDL.Record({ agents_created_this_month: IDL.Nat32, tokens_used_this_month: IDL.Nat64, inferences_this_month: IDL.Nat32, last_reset_date: IDL.Nat64 })
  const UserSubscription = IDL.Record({ principal_id: IDL.Text, tier: TierConfig, started_at: IDL.Nat64, expires_at: IDL.Nat64, auto_renew: IDL.Bool, current_usage: UsageMetrics, payment_status: PaymentStatus, created_at: IDL.Nat64, updated_at: IDL.Nat64 })
  const QuotaRemaining = IDL.Record({ agents_remaining: IDL.Nat32, tokens_remaining: IDL.Nat64, inferences_remaining: IDL.Nat32 })
  const QuotaValidation = IDL.Record({ allowed: IDL.Bool, reason: IDL.Opt(IDL.Text), remaining_quota: IDL.Opt(QuotaRemaining) })
  const SubscriptionStats = IDL.Record({ total_subscriptions: IDL.Nat32, active_subscriptions: IDL.Nat32, expired_subscriptions: IDL.Nat32, pending_payments: IDL.Nat32, tier_distribution: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat32)), total_monthly_revenue_usd: IDL.Nat32 })
  
  // Payment types
  const PaymentRequest = IDL.Record({ payment_id: IDL.Text, subscription_tier: IDL.Text, amount_usd: IDL.Nat32, amount_icp_e8s: IDL.Nat64, expires_at: IDL.Nat64, created_at: IDL.Nat64 })
  const PaymentTransaction = IDL.Record({ transaction_id: IDL.Text, payment_request: PaymentRequest, from_principal: IDL.Text, amount_paid_e8s: IDL.Nat64, icp_usd_rate: IDL.Float64, status: IDL.Text, created_at: IDL.Nat64, completed_at: IDL.Opt(IDL.Nat64) })
  const PaymentVerification = IDL.Record({ verified: IDL.Bool, transaction_id: IDL.Text, amount_verified: IDL.Nat64, verification_time: IDL.Nat64 })
  const PaymentStats = IDL.Record({ total_transactions: IDL.Nat32, successful_transactions: IDL.Nat32, failed_transactions: IDL.Nat32, total_volume_icp_e8s: IDL.Nat64, total_volume_usd: IDL.Nat32 })
  
  // Result types
  const ResultText = IDL.Variant({ Ok: IDL.Text, Err: IDL.Text })
  const ResultQuote = IDL.Variant({ Ok: CostQuote, Err: IDL.Text })
  const ResultBalance = IDL.Variant({ Ok: Balance, Err: IDL.Text })
  const ResultEscrow = IDL.Variant({ Ok: EscrowAccount, Err: IDL.Text })
  const ResultReceipt = IDL.Variant({ Ok: Receipt, Err: IDL.Text })
  const ResultReceipts = IDL.Variant({ Ok: IDL.Vec(Receipt), Err: IDL.Text })
  const ResultUnit = IDL.Variant({ Ok: IDL.Null, Err: IDL.Text })
  const ResultUserSubscription = IDL.Variant({ Ok: UserSubscription, Err: IDL.Text })
  const ResultQuotaValidation = IDL.Variant({ Ok: QuotaValidation, Err: IDL.Text })
  const ResultPaymentRequest = IDL.Variant({ Ok: PaymentRequest, Err: IDL.Text })
  const ResultPaymentTransaction = IDL.Variant({ Ok: PaymentTransaction, Err: IDL.Text })
  const ResultPaymentVerification = IDL.Variant({ Ok: PaymentVerification, Err: IDL.Text })
  const ResultFloat64 = IDL.Variant({ Ok: IDL.Float64, Err: IDL.Text })
  const ResultNat64 = IDL.Variant({ Ok: IDL.Nat64, Err: IDL.Text })
  return IDL.Service({
    // Core economics APIs
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
    settle: IDL.Func([Receipt], [ResultText], []),
    
    // Admin role APIs
    is_admin: IDL.Func([], [IDL.Bool], ['query']),
    list_admins: IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    add_admin: IDL.Func([IDL.Text], [ResultUnit], []),
    remove_admin: IDL.Func([IDL.Text], [ResultUnit], []),
    
    // Subscription APIs
    create_subscription: IDL.Func([IDL.Text, IDL.Bool], [ResultUserSubscription], []),
    get_user_subscription: IDL.Func([IDL.Opt(IDL.Text)], [IDL.Opt(UserSubscription)], ['query']),
    get_or_create_free_subscription: IDL.Func([], [ResultUserSubscription], []),
    update_payment_status: IDL.Func([PaymentStatus], [ResultUnit], []),
    validate_agent_creation_quota: IDL.Func([], [ResultQuotaValidation], []),
    validate_token_usage_quota: IDL.Func([IDL.Nat64], [ResultQuotaValidation], []),
    get_user_usage: IDL.Func([IDL.Opt(IDL.Text)], [IDL.Opt(UsageMetrics)], ['query']),
    cancel_subscription: IDL.Func([], [ResultUnit], []),
    renew_subscription: IDL.Func([], [ResultUnit], []),
    
    // Admin subscription APIs
    get_subscription_tiers: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, TierConfig))], ['query']),
    list_all_subscriptions: IDL.Func([], [IDL.Vec(UserSubscription)], ['query']),
    get_subscription_stats: IDL.Func([], [SubscriptionStats], ['query']),
    
    // Payment APIs
    create_payment_request: IDL.Func([IDL.Text], [ResultPaymentRequest], []),
    process_subscription_payment: IDL.Func([PaymentRequest], [ResultPaymentTransaction], []),
    verify_payment: IDL.Func([IDL.Text], [ResultPaymentVerification], []),
    get_payment_transaction: IDL.Func([IDL.Text], [IDL.Opt(PaymentTransaction)], ['query']),
    list_user_payment_transactions: IDL.Func([IDL.Opt(IDL.Nat32)], [IDL.Vec(PaymentTransaction)], ['query']),
    get_icp_usd_rate: IDL.Func([], [ResultFloat64], ['query']),
    convert_usd_to_icp_e8s: IDL.Func([IDL.Nat32], [ResultNat64], []),
    
    // Admin payment APIs
    get_payment_stats: IDL.Func([], [PaymentStats], ['query']),
    list_all_payment_transactions: IDL.Func([IDL.Opt(IDL.Nat32)], [IDL.Vec(PaymentTransaction)], ['query']),
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
export const createAgentActor = (agentOverride?: HttpAgent, canisterId?: string) =>
  Actor.createActor(agentCanisterIdl, {
    agent: agentOverride || agent,
    canisterId: canisterId || OHMS_AGENT_CANISTER_ID
  });

export const createCoordinatorActor = (agentOverride?: HttpAgent, canisterId?: string) =>
  Actor.createActor(coordinatorCanisterIdl, {
    agent: agentOverride || agent,
    canisterId: canisterId || OHMS_COORDINATOR_CANISTER_ID,
  });

export const createModelActor = (agentOverride?: HttpAgent, canisterId?: string) =>
  Actor.createActor(modelCanisterIdl, {
    agent: agentOverride || agent,
    canisterId: canisterId || OHMS_MODEL_CANISTER_ID,
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

// OHMS 2.0 Agent Spawning Functions
export const createAgentsFromInstructions = async (
  instructions: string, 
  agentCount?: number, 
  capabilities: string[] = [], 
  priority: string = 'normal'
): Promise<any> => {
  return coordinatorCanister.create_agents_from_instructions(instructions, agentCount ? [agentCount] : [], capabilities, priority);
};

export const getAgentCreationStatus = async (requestId: string): Promise<any> => {
  return coordinatorCanister.get_agent_creation_status(requestId);
};

export const getUserQuotaStatus = async (): Promise<any> => {
  return coordinatorCanister.get_user_quota_status();
};

export const listUserAgents = async (agentOverride?: HttpAgent): Promise<any[]> => {
  const coordActor = agentOverride ? createCoordinatorActor(agentOverride) : coordinatorCanister;
  const res = await coordActor.list_user_agents() as { Ok?: any[]; Err?: string };
  if ('Ok' in res && res.Ok) {
    return res.Ok;
  } else {
    console.error('Failed to list user agents:', res.Err);
    throw new Error(res.Err || 'Unknown error');
  }
};

export const listInstructionRequests = async (): Promise<any[]> => {
  const result = await coordinatorCanister.list_instruction_requests();
  return result as any[];
};

export const getInstructionAnalysis = async (requestId: string): Promise<any> => {
  return coordinatorCanister.get_instruction_analysis(requestId);
};

export const updateAgentStatus = async (agentId: string, status: string): Promise<any> => {
  return coordinatorCanister.update_agent_status(agentId, status);
};

export const getAgentSpawningMetrics = async (): Promise<any> => {
  return coordinatorCanister.get_agent_spawning_metrics();
};

export const getCoordinationNetworks = async (): Promise<any[]> => {
  const result = await coordinatorCanister.get_coordination_networks();
  return result as any[];
};

// OHMS 2.0 Subscription Management Functions
export const upgradeSubscriptionTier = async (tierName: string): Promise<any> => {
  return coordinatorCanister.upgrade_subscription_tier(tierName);
};

export const getSubscriptionTierInfo = async (): Promise<any[]> => {
  const result = await coordinatorCanister.get_subscription_tier_info();
  return result as any[];
};

// OHMS 2.0 Economics Integration Functions
export const getEconomicsHealth = async (): Promise<any> => {
  return coordinatorCanister.get_economics_health();
};

export const validateTokenUsageQuota = async (tokens: bigint): Promise<any> => {
  return coordinatorCanister.validate_token_usage_quota(tokens);
};

export const listModels = async (state?: any, agentOverride?: HttpAgent): Promise<any[]> => {
  const modelActor = agentOverride ? createModelActor(agentOverride) : modelCanister;
  const res = await modelActor.list_models(state ? [state] : []);
  return res as any[];
};

// Dynamic actor creators (useful to attach a specific agent/identity)
export const createEconActor = (agentOverride?: HttpAgent, canisterId?: string) =>
  Actor.createActor(econCanisterIdl, {
    agent: agentOverride ?? agent,
    canisterId: canisterId || OHMS_ECON_CANISTER_ID,
  });