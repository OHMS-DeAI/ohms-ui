import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Balance {
  'available_balance' : bigint,
  'last_updated' : bigint,
  'principal_id' : string,
  'escrowed_balance' : bigint,
  'total_earnings' : bigint,
}
export interface CostQuote {
  'priority_multiplier' : number,
  'base_cost' : bigint,
  'job_id' : string,
  'quote_expires_at' : bigint,
  'quote_id' : string,
  'protocol_fee' : bigint,
  'estimated_cost' : bigint,
}
export interface EconHealth {
  'active_escrows' : number,
  'total_escrows' : number,
  'total_receipts' : number,
  'protocol_fees_collected' : bigint,
  'total_volume' : bigint,
  'average_job_cost' : number,
  'pending_settlements' : number,
}
export interface EscrowAccount {
  'status' : EscrowStatus,
  'created_at' : bigint,
  'job_id' : string,
  'principal_id' : string,
  'escrow_id' : string,
  'amount' : bigint,
  'expires_at' : bigint,
}
export type EscrowStatus = { 'Refunded' : null } |
  { 'Active' : null } |
  { 'Released' : null } |
  { 'Expired' : null } |
  { 'Pending' : null };
export interface FeePolicy {
  'minimum_fee' : bigint,
  'last_updated' : bigint,
  'protocol_fee_percentage' : number,
  'agent_fee_percentage' : number,
  'priority_multipliers' : Array<[string, number]>,
}
export interface FeesBreakdown {
  'total_amount' : bigint,
  'agent_fee' : bigint,
  'base_amount' : bigint,
  'protocol_fee' : bigint,
}
export type InferenceRate = { 'Premium' : null } |
  { 'Priority' : null } |
  { 'Standard' : null };
export type JobPriority = { 'Low' : null } |
  { 'High' : null } |
  { 'Normal' : null } |
  { 'Critical' : null };
export interface JobSpec {
  'estimated_compute_cycles' : bigint,
  'job_id' : string,
  'priority' : JobPriority,
  'model_id' : string,
  'estimated_tokens' : number,
}
export interface PaymentRequest {
  'created_at' : bigint,
  'amount_usd' : number,
  'subscription_tier' : string,
  'amount_icp_e8s' : bigint,
  'payment_id' : string,
  'expires_at' : bigint,
}
export interface PaymentStats {
  'total_volume_icp_e8s' : bigint,
  'failed_transactions' : number,
  'total_volume_usd' : number,
  'total_transactions' : number,
  'successful_transactions' : number,
}
export type PaymentStatus = { 'Failed' : null } |
  { 'Active' : null } |
  { 'Cancelled' : null } |
  { 'Pending' : null };
export interface PaymentTransaction {
  'amount_paid_e8s' : bigint,
  'icp_usd_rate' : number,
  'transaction_id' : string,
  'status' : string,
  'created_at' : bigint,
  'from_principal' : string,
  'payment_request' : PaymentRequest,
  'completed_at' : [] | [bigint],
}
export interface PaymentVerification {
  'transaction_id' : string,
  'verified' : boolean,
  'amount_verified' : bigint,
  'verification_time' : bigint,
}
export interface QuotaRemaining {
  'inferences_remaining' : number,
  'agents_remaining' : number,
  'tokens_remaining' : bigint,
}
export interface QuotaValidation {
  'allowed' : boolean,
  'remaining_quota' : [] | [QuotaRemaining],
  'reason' : [] | [string],
}
export interface Receipt {
  'receipt_id' : string,
  'settlement_status' : SettlementStatus,
  'created_at' : bigint,
  'agent_id' : string,
  'job_id' : string,
  'fees_breakdown' : FeesBreakdown,
  'escrow_id' : string,
  'actual_cost' : bigint,
  'settled_at' : [] | [bigint],
}
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : CostQuote } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : Balance } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : EscrowAccount } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : Receipt } |
  { 'Err' : string };
export type Result_5 = { 'Ok' : Array<Receipt> } |
  { 'Err' : string };
export type Result_6 = { 'Ok' : null } |
  { 'Err' : string };
export type Result_Float64 = { 'Ok' : number } |
  { 'Err' : string };
export type Result_Nat64 = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_PaymentRequest = { 'Ok' : PaymentRequest } |
  { 'Err' : string };
export type Result_PaymentTransaction = { 'Ok' : PaymentTransaction } |
  { 'Err' : string };
export type Result_PaymentVerification = { 'Ok' : PaymentVerification } |
  { 'Err' : string };
export type Result_QuotaValidation = { 'Ok' : QuotaValidation } |
  { 'Err' : string };
export type Result_UserSubscription = { 'Ok' : UserSubscription } |
  { 'Err' : string };
export type SettlementStatus = { 'Disputed' : null } |
  { 'Failed' : null } |
  { 'Completed' : null } |
  { 'Pending' : null };
export interface SubscriptionStats {
  'total_subscriptions' : number,
  'tier_distribution' : Array<[string, number]>,
  'total_monthly_revenue_usd' : number,
  'active_subscriptions' : number,
  'expired_subscriptions' : number,
  'pending_payments' : number,
}
export interface TierConfig {
  'features' : Array<string>,
  'monthly_agent_creations' : number,
  'name' : string,
  'monthly_fee_usd' : number,
  'max_agents' : number,
  'inference_rate' : InferenceRate,
  'token_limit' : bigint,
}
export interface UsageMetrics {
  'tokens_used_this_month' : bigint,
  'inferences_this_month' : number,
  'agents_created_this_month' : number,
  'last_reset_date' : bigint,
}
export interface UserSubscription {
  'updated_at' : bigint,
  'auto_renew' : boolean,
  'tier' : TierConfig,
  'current_usage' : UsageMetrics,
  'created_at' : bigint,
  'payment_status' : PaymentStatus,
  'principal_id' : string,
  'expires_at' : bigint,
  'started_at' : bigint,
}
export interface _SERVICE {
  'add_admin' : ActorMethod<[string], Result_6>,
  'cancel_subscription' : ActorMethod<[], Result_6>,
  'convert_usd_to_icp_e8s' : ActorMethod<[number], Result_Nat64>,
  'create_payment_request' : ActorMethod<[string], Result_PaymentRequest>,
  'create_subscription' : ActorMethod<
    [string, boolean],
    Result_UserSubscription
  >,
  'deposit' : ActorMethod<[bigint], Result_6>,
  'escrow' : ActorMethod<[string, bigint], Result>,
  'estimate' : ActorMethod<[JobSpec], Result_1>,
  'get_balance' : ActorMethod<[[] | [string]], Result_2>,
  'get_escrow' : ActorMethod<[string], Result_3>,
  'get_icp_usd_rate' : ActorMethod<[], Result_Float64>,
  'get_or_create_free_subscription' : ActorMethod<[], Result_UserSubscription>,
  'get_payment_stats' : ActorMethod<[], PaymentStats>,
  'get_payment_transaction' : ActorMethod<[string], [] | [PaymentTransaction]>,
  'get_receipt' : ActorMethod<[string], Result_4>,
  'get_subscription_stats' : ActorMethod<[], SubscriptionStats>,
  'get_subscription_tiers' : ActorMethod<[], Array<[string, TierConfig]>>,
  'get_user_subscription' : ActorMethod<
    [[] | [string]],
    [] | [UserSubscription]
  >,
  'get_user_usage' : ActorMethod<[[] | [string]], [] | [UsageMetrics]>,
  'health' : ActorMethod<[], EconHealth>,
  'is_admin' : ActorMethod<[], boolean>,
  'list_admins' : ActorMethod<[], Array<string>>,
  'list_all_payment_transactions' : ActorMethod<
    [[] | [number]],
    Array<PaymentTransaction>
  >,
  'list_all_subscriptions' : ActorMethod<[], Array<UserSubscription>>,
  'list_receipts' : ActorMethod<[[] | [string], [] | [number]], Result_5>,
  'list_user_payment_transactions' : ActorMethod<
    [[] | [number]],
    Array<PaymentTransaction>
  >,
  'policy' : ActorMethod<[], FeePolicy>,
  'process_subscription_payment' : ActorMethod<
    [PaymentRequest],
    Result_PaymentTransaction
  >,
  'refund_escrow' : ActorMethod<[string], Result_6>,
  'remove_admin' : ActorMethod<[string], Result_6>,
  'renew_subscription' : ActorMethod<[], Result_6>,
  'settle' : ActorMethod<[Receipt], Result>,
  'update_payment_status' : ActorMethod<[PaymentStatus], Result_6>,
  'update_policy' : ActorMethod<[FeePolicy], Result_6>,
  'validate_agent_creation_quota' : ActorMethod<[], Result_QuotaValidation>,
  'validate_token_usage_quota' : ActorMethod<[bigint], Result_QuotaValidation>,
  'verify_payment' : ActorMethod<[string], Result_PaymentVerification>,
  'withdraw' : ActorMethod<[bigint], Result_6>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
