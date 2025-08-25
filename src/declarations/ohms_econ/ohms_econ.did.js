export const idlFactory = ({ IDL }) => {
  const Result_6 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const Result_Nat64 = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text });
  const PaymentRequest = IDL.Record({
    'created_at' : IDL.Nat64,
    'amount_usd' : IDL.Nat32,
    'subscription_tier' : IDL.Text,
    'amount_icp_e8s' : IDL.Nat64,
    'payment_id' : IDL.Text,
    'expires_at' : IDL.Nat64,
  });
  const Result_PaymentRequest = IDL.Variant({
    'Ok' : PaymentRequest,
    'Err' : IDL.Text,
  });
  const InferenceRate = IDL.Variant({
    'Premium' : IDL.Null,
    'Priority' : IDL.Null,
    'Standard' : IDL.Null,
  });
  const TierConfig = IDL.Record({
    'features' : IDL.Vec(IDL.Text),
    'monthly_agent_creations' : IDL.Nat32,
    'name' : IDL.Text,
    'monthly_fee_usd' : IDL.Nat32,
    'max_agents' : IDL.Nat32,
    'inference_rate' : InferenceRate,
    'token_limit' : IDL.Nat64,
  });
  const UsageMetrics = IDL.Record({
    'tokens_used_this_month' : IDL.Nat64,
    'inferences_this_month' : IDL.Nat32,
    'agents_created_this_month' : IDL.Nat32,
    'last_reset_date' : IDL.Nat64,
  });
  const PaymentStatus = IDL.Variant({
    'Failed' : IDL.Null,
    'Active' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const UserSubscription = IDL.Record({
    'updated_at' : IDL.Nat64,
    'auto_renew' : IDL.Bool,
    'tier' : TierConfig,
    'current_usage' : UsageMetrics,
    'created_at' : IDL.Nat64,
    'payment_status' : PaymentStatus,
    'principal_id' : IDL.Text,
    'expires_at' : IDL.Nat64,
    'started_at' : IDL.Nat64,
  });
  const Result_UserSubscription = IDL.Variant({
    'Ok' : UserSubscription,
    'Err' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const JobPriority = IDL.Variant({
    'Low' : IDL.Null,
    'High' : IDL.Null,
    'Normal' : IDL.Null,
    'Critical' : IDL.Null,
  });
  const JobSpec = IDL.Record({
    'estimated_compute_cycles' : IDL.Nat64,
    'job_id' : IDL.Text,
    'priority' : JobPriority,
    'model_id' : IDL.Text,
    'estimated_tokens' : IDL.Nat32,
  });
  const CostQuote = IDL.Record({
    'priority_multiplier' : IDL.Float32,
    'base_cost' : IDL.Nat64,
    'job_id' : IDL.Text,
    'quote_expires_at' : IDL.Nat64,
    'quote_id' : IDL.Text,
    'protocol_fee' : IDL.Nat64,
    'estimated_cost' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'Ok' : CostQuote, 'Err' : IDL.Text });
  const Balance = IDL.Record({
    'available_balance' : IDL.Nat64,
    'last_updated' : IDL.Nat64,
    'principal_id' : IDL.Text,
    'escrowed_balance' : IDL.Nat64,
    'total_earnings' : IDL.Nat64,
  });
  const Result_2 = IDL.Variant({ 'Ok' : Balance, 'Err' : IDL.Text });
  const EscrowStatus = IDL.Variant({
    'Refunded' : IDL.Null,
    'Active' : IDL.Null,
    'Released' : IDL.Null,
    'Expired' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const EscrowAccount = IDL.Record({
    'status' : EscrowStatus,
    'created_at' : IDL.Nat64,
    'job_id' : IDL.Text,
    'principal_id' : IDL.Text,
    'escrow_id' : IDL.Text,
    'amount' : IDL.Nat64,
    'expires_at' : IDL.Nat64,
  });
  const Result_3 = IDL.Variant({ 'Ok' : EscrowAccount, 'Err' : IDL.Text });
  const Result_Float64 = IDL.Variant({ 'Ok' : IDL.Float64, 'Err' : IDL.Text });
  const PaymentStats = IDL.Record({
    'total_volume_icp_e8s' : IDL.Nat64,
    'failed_transactions' : IDL.Nat32,
    'total_volume_usd' : IDL.Nat32,
    'total_transactions' : IDL.Nat32,
    'successful_transactions' : IDL.Nat32,
  });
  const PaymentTransaction = IDL.Record({
    'amount_paid_e8s' : IDL.Nat64,
    'icp_usd_rate' : IDL.Float64,
    'transaction_id' : IDL.Text,
    'status' : IDL.Text,
    'created_at' : IDL.Nat64,
    'from_principal' : IDL.Text,
    'payment_request' : PaymentRequest,
    'completed_at' : IDL.Opt(IDL.Nat64),
  });
  const SettlementStatus = IDL.Variant({
    'Disputed' : IDL.Null,
    'Failed' : IDL.Null,
    'Completed' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const FeesBreakdown = IDL.Record({
    'total_amount' : IDL.Nat64,
    'agent_fee' : IDL.Nat64,
    'base_amount' : IDL.Nat64,
    'protocol_fee' : IDL.Nat64,
  });
  const Receipt = IDL.Record({
    'receipt_id' : IDL.Text,
    'settlement_status' : SettlementStatus,
    'created_at' : IDL.Nat64,
    'agent_id' : IDL.Text,
    'job_id' : IDL.Text,
    'fees_breakdown' : FeesBreakdown,
    'escrow_id' : IDL.Text,
    'actual_cost' : IDL.Nat64,
    'settled_at' : IDL.Opt(IDL.Nat64),
  });
  const Result_4 = IDL.Variant({ 'Ok' : Receipt, 'Err' : IDL.Text });
  const SubscriptionStats = IDL.Record({
    'total_subscriptions' : IDL.Nat32,
    'tier_distribution' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat32)),
    'total_monthly_revenue_usd' : IDL.Nat32,
    'active_subscriptions' : IDL.Nat32,
    'expired_subscriptions' : IDL.Nat32,
    'pending_payments' : IDL.Nat32,
  });
  const EconHealth = IDL.Record({
    'active_escrows' : IDL.Nat32,
    'total_escrows' : IDL.Nat32,
    'total_receipts' : IDL.Nat32,
    'protocol_fees_collected' : IDL.Nat64,
    'total_volume' : IDL.Nat64,
    'average_job_cost' : IDL.Float64,
    'pending_settlements' : IDL.Nat32,
  });
  const Result_5 = IDL.Variant({ 'Ok' : IDL.Vec(Receipt), 'Err' : IDL.Text });
  const FeePolicy = IDL.Record({
    'minimum_fee' : IDL.Nat64,
    'last_updated' : IDL.Nat64,
    'protocol_fee_percentage' : IDL.Float32,
    'agent_fee_percentage' : IDL.Float32,
    'priority_multipliers' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Float32)),
  });
  const Result_PaymentTransaction = IDL.Variant({
    'Ok' : PaymentTransaction,
    'Err' : IDL.Text,
  });
  const QuotaRemaining = IDL.Record({
    'inferences_remaining' : IDL.Nat32,
    'agents_remaining' : IDL.Nat32,
    'tokens_remaining' : IDL.Nat64,
  });
  const QuotaValidation = IDL.Record({
    'allowed' : IDL.Bool,
    'remaining_quota' : IDL.Opt(QuotaRemaining),
    'reason' : IDL.Opt(IDL.Text),
  });
  const Result_QuotaValidation = IDL.Variant({
    'Ok' : QuotaValidation,
    'Err' : IDL.Text,
  });
  const PaymentVerification = IDL.Record({
    'transaction_id' : IDL.Text,
    'verified' : IDL.Bool,
    'amount_verified' : IDL.Nat64,
    'verification_time' : IDL.Nat64,
  });
  const Result_PaymentVerification = IDL.Variant({
    'Ok' : PaymentVerification,
    'Err' : IDL.Text,
  });
  return IDL.Service({
    'add_admin' : IDL.Func([IDL.Text], [Result_6], []),
    'cancel_subscription' : IDL.Func([], [Result_6], []),
    'convert_usd_to_icp_e8s' : IDL.Func([IDL.Nat32], [Result_Nat64], []),
    'create_payment_request' : IDL.Func(
        [IDL.Text],
        [Result_PaymentRequest],
        [],
      ),
    'create_subscription' : IDL.Func(
        [IDL.Text, IDL.Bool],
        [Result_UserSubscription],
        [],
      ),
    'deposit' : IDL.Func([IDL.Nat64], [Result_6], []),
    'escrow' : IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    'estimate' : IDL.Func([JobSpec], [Result_1], ['query']),
    'get_balance' : IDL.Func([IDL.Opt(IDL.Text)], [Result_2], ['query']),
    'get_escrow' : IDL.Func([IDL.Text], [Result_3], ['query']),
    'get_icp_usd_rate' : IDL.Func([], [Result_Float64], ['query']),
    'get_or_create_free_subscription' : IDL.Func(
        [],
        [Result_UserSubscription],
        [],
      ),
    'get_payment_stats' : IDL.Func([], [PaymentStats], ['query']),
    'get_payment_transaction' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(PaymentTransaction)],
        ['query'],
      ),
    'get_receipt' : IDL.Func([IDL.Text], [Result_4], ['query']),
    'get_subscription_stats' : IDL.Func([], [SubscriptionStats], ['query']),
    'get_subscription_tiers' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, TierConfig))],
        ['query'],
      ),
    'get_user_subscription' : IDL.Func(
        [IDL.Opt(IDL.Text)],
        [IDL.Opt(UserSubscription)],
        ['query'],
      ),
    'get_user_usage' : IDL.Func(
        [IDL.Opt(IDL.Text)],
        [IDL.Opt(UsageMetrics)],
        ['query'],
      ),
    'health' : IDL.Func([], [EconHealth], ['query']),
    'is_admin' : IDL.Func([], [IDL.Bool], ['query']),
    'list_admins' : IDL.Func([], [IDL.Vec(IDL.Text)], ['query']),
    'list_all_payment_transactions' : IDL.Func(
        [IDL.Opt(IDL.Nat32)],
        [IDL.Vec(PaymentTransaction)],
        ['query'],
      ),
    'list_all_subscriptions' : IDL.Func(
        [],
        [IDL.Vec(UserSubscription)],
        ['query'],
      ),
    'list_receipts' : IDL.Func(
        [IDL.Opt(IDL.Text), IDL.Opt(IDL.Nat32)],
        [Result_5],
        ['query'],
      ),
    'list_user_payment_transactions' : IDL.Func(
        [IDL.Opt(IDL.Nat32)],
        [IDL.Vec(PaymentTransaction)],
        ['query'],
      ),
    'policy' : IDL.Func([], [FeePolicy], ['query']),
    'process_subscription_payment' : IDL.Func(
        [PaymentRequest],
        [Result_PaymentTransaction],
        [],
      ),
    'refund_escrow' : IDL.Func([IDL.Text], [Result_6], []),
    'remove_admin' : IDL.Func([IDL.Text], [Result_6], []),
    'renew_subscription' : IDL.Func([], [Result_6], []),
    'settle' : IDL.Func([Receipt], [Result], []),
    'update_payment_status' : IDL.Func([PaymentStatus], [Result_6], []),
    'update_policy' : IDL.Func([FeePolicy], [Result_6], []),
    'validate_agent_creation_quota' : IDL.Func(
        [],
        [Result_QuotaValidation],
        [],
      ),
    'validate_token_usage_quota' : IDL.Func(
        [IDL.Nat64],
        [Result_QuotaValidation],
        [],
      ),
    'verify_payment' : IDL.Func([IDL.Text], [Result_PaymentVerification], []),
    'withdraw' : IDL.Func([IDL.Nat64], [Result_6], []),
  });
};
export const init = ({ IDL }) => { return []; };
