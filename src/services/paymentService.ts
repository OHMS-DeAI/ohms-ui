import { HttpAgent } from '@dfinity/agent'
import { createEconActor } from './canisterService'

export interface PaymentRequest {
  subscription_tier: string
  amount_usd: number
  amount_icp_e8s: bigint
  user_principal: string
  payment_memo: string
}

export interface PaymentTransaction {
  id: string
  user_principal: string
  subscription_tier: string
  amount_usd: number
  amount_icp_e8s: bigint
  icp_block_index?: bigint
  status: PaymentTransactionStatus
  memo: string
  created_at: bigint
  completed_at?: bigint
  error_message?: string
}

export enum PaymentTransactionStatus {
  Pending = 'Pending',
  Processing = 'Processing', 
  Completed = 'Completed',
  Failed = 'Failed',
  Refunded = 'Refunded',
}

export interface PaymentVerification {
  verified: boolean
  transaction_id: string
  block_index?: bigint
  error_message?: string
}

export interface PaymentStats {
  total_transactions: number
  completed_transactions: number
  failed_transactions: number
  pending_transactions: number
  total_revenue_usd: number
  total_revenue_icp_e8s: bigint
}

export class PaymentService {
  constructor(private agent: HttpAgent) {}

  /**
   * Get current ICP/USD exchange rate
   */
  async getIcpUsdRate(): Promise<number> {
    try {
      const econActor = createEconActor(this.agent)
      const result = await econActor.get_icp_usd_rate()
      
      if ('Ok' in result) {
        return result.Ok
      } else {
        throw new Error(result.Err || 'Failed to get ICP/USD rate')
      }
    } catch (error) {
      console.error('Failed to get ICP/USD rate:', error)
      throw error
    }
  }

  /**
   * Convert USD amount to ICP e8s
   */
  async convertUsdToIcpE8s(amountUsd: number): Promise<bigint> {
    try {
      const econActor = createEconActor(this.agent)
      const result = await econActor.convert_usd_to_icp_e8s(amountUsd)
      
      if ('Ok' in result) {
        return BigInt(result.Ok)
      } else {
        throw new Error(result.Err || 'Failed to convert USD to ICP')
      }
    } catch (error) {
      console.error('Failed to convert USD to ICP:', error)
      throw error
    }
  }

  /**
   * Create payment request for subscription
   */
  async createPaymentRequest(subscriptionTier: string): Promise<PaymentRequest> {
    try {
      const econActor = createEconActor(this.agent)
      const result = await econActor.create_payment_request(subscriptionTier)
      
      if ('Ok' in result) {
        return {
          subscription_tier: result.Ok.subscription_tier,
          amount_usd: result.Ok.amount_usd,
          amount_icp_e8s: BigInt(result.Ok.amount_icp_e8s),
          user_principal: result.Ok.user_principal,
          payment_memo: result.Ok.payment_memo,
        }
      } else {
        throw new Error(result.Err || 'Failed to create payment request')
      }
    } catch (error) {
      console.error('Failed to create payment request:', error)
      throw error
    }
  }

  /**
   * Process subscription payment through ICP ledger
   */
  async processSubscriptionPayment(paymentRequest: PaymentRequest): Promise<PaymentTransaction> {
    try {
      const econActor = createEconActor(this.agent)
      const result = await econActor.process_subscription_payment({
        subscription_tier: paymentRequest.subscription_tier,
        amount_usd: paymentRequest.amount_usd,
        amount_icp_e8s: paymentRequest.amount_icp_e8s,
        user_principal: paymentRequest.user_principal,
        payment_memo: paymentRequest.payment_memo,
      })
      
      if ('Ok' in result) {
        return this.mapPaymentTransaction(result.Ok)
      } else {
        throw new Error(result.Err || 'Payment processing failed')
      }
    } catch (error) {
      console.error('Failed to process payment:', error)
      throw error
    }
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(transactionId: string): Promise<PaymentVerification> {
    try {
      const econActor = createEconActor(this.agent)
      const result = await econActor.verify_payment(transactionId)
      
      if ('Ok' in result) {
        return {
          verified: result.Ok.verified,
          transaction_id: result.Ok.transaction_id,
          block_index: result.Ok.block_index ? BigInt(result.Ok.block_index) : undefined,
          error_message: result.Ok.error_message,
        }
      } else {
        throw new Error(result.Err || 'Failed to verify payment')
      }
    } catch (error) {
      console.error('Failed to verify payment:', error)
      throw error
    }
  }

  /**
   * Get payment transaction details
   */
  async getPaymentTransaction(transactionId: string): Promise<PaymentTransaction | null> {
    try {
      const econActor = createEconActor(this.agent)
      const result = await econActor.get_payment_transaction(transactionId)
      
      if (result && result.length > 0) {
        return this.mapPaymentTransaction(result[0])
      }
      return null
    } catch (error) {
      console.error('Failed to get payment transaction:', error)
      return null
    }
  }

  /**
   * List user payment transactions
   */
  async listUserPaymentTransactions(limit: number = 10): Promise<PaymentTransaction[]> {
    try {
      const econActor = createEconActor(this.agent)
      const result = await econActor.list_user_payment_transactions([limit])
      
      return result.map(tx => this.mapPaymentTransaction(tx))
    } catch (error) {
      console.error('Failed to list payment transactions:', error)
      return []
    }
  }

  /**
   * Get payment statistics (admin only)
   */
  async getPaymentStats(): Promise<PaymentStats> {
    try {
      const econActor = createEconActor(this.agent)
      const result = await econActor.get_payment_stats()
      
      return {
        total_transactions: result.total_transactions,
        completed_transactions: result.completed_transactions,
        failed_transactions: result.failed_transactions,
        pending_transactions: result.pending_transactions,
        total_revenue_usd: result.total_revenue_usd,
        total_revenue_icp_e8s: BigInt(result.total_revenue_icp_e8s),
      }
    } catch (error) {
      console.error('Failed to get payment stats:', error)
      throw error
    }
  }

  /**
   * List all payment transactions (admin only)
   */
  async listAllPaymentTransactions(limit: number = 50): Promise<PaymentTransaction[]> {
    try {
      const econActor = createEconActor(this.agent)
      const result = await econActor.list_all_payment_transactions([limit])
      
      return result.map(tx => this.mapPaymentTransaction(tx))
    } catch (error) {
      console.error('Failed to list all payment transactions:', error)
      return []
    }
  }

  /**
   * Process subscription payment with user confirmation
   */
  async subscribeWithPayment(subscriptionTier: string): Promise<{
    success: boolean
    transaction?: PaymentTransaction
    error?: string
  }> {
    try {
      // Step 1: Create payment request
      const paymentRequest = await this.createPaymentRequest(subscriptionTier)
      
      // Step 2: Show user payment details and get confirmation
      const confirmed = await this.showPaymentConfirmation(paymentRequest)
      if (!confirmed) {
        return { success: false, error: 'Payment cancelled by user' }
      }

      // Step 3: Process payment
      const transaction = await this.processSubscriptionPayment(paymentRequest)
      
      // Step 4: Verify payment was successful
      if (transaction.status === PaymentTransactionStatus.Completed) {
        return { success: true, transaction }
      } else if (transaction.status === PaymentTransactionStatus.Failed) {
        return { 
          success: false, 
          error: transaction.error_message || 'Payment failed' 
        }
      } else {
        // Payment is processing, could implement polling here
        return { success: true, transaction }
      }
    } catch (error) {
      console.error('Subscription payment failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown payment error' 
      }
    }
  }

  /**
   * Show payment confirmation dialog to user
   */
  private async showPaymentConfirmation(paymentRequest: PaymentRequest): Promise<boolean> {
    const icpAmount = Number(paymentRequest.amount_icp_e8s) / 100_000_000
    const message = `Confirm payment for ${paymentRequest.subscription_tier} subscription:
    
Amount: $${paymentRequest.amount_usd} USD (≈ ${icpAmount.toFixed(4)} ICP)
Tier: ${paymentRequest.subscription_tier.charAt(0).toUpperCase() + paymentRequest.subscription_tier.slice(1)}

This will be charged to your OISY wallet.`

    return window.confirm(message)
  }

  /**
   * Map canister payment transaction to frontend type
   */
  private mapPaymentTransaction(tx: any): PaymentTransaction {
    return {
      id: tx.id,
      user_principal: tx.user_principal,
      subscription_tier: tx.subscription_tier,
      amount_usd: tx.amount_usd,
      amount_icp_e8s: BigInt(tx.amount_icp_e8s),
      icp_block_index: tx.icp_block_index ? BigInt(tx.icp_block_index) : undefined,
      status: tx.status as PaymentTransactionStatus,
      memo: tx.memo,
      created_at: BigInt(tx.created_at),
      completed_at: tx.completed_at ? BigInt(tx.completed_at) : undefined,
      error_message: tx.error_message,
    }
  }

  /**
   * Format ICP e8s amount to human readable format
   */
  static formatIcpAmount(e8s: bigint): string {
    const icp = Number(e8s) / 100_000_000
    return `${icp.toFixed(4)} ICP`
  }

  /**
   * Format transaction status for display
   */
  static formatTransactionStatus(status: PaymentTransactionStatus): string {
    switch (status) {
      case PaymentTransactionStatus.Pending:
        return 'Pending'
      case PaymentTransactionStatus.Processing:
        return 'Processing'
      case PaymentTransactionStatus.Completed:
        return 'Completed'
      case PaymentTransactionStatus.Failed:
        return 'Failed'
      case PaymentTransactionStatus.Refunded:
        return 'Refunded'
      default:
        return 'Unknown'
    }
  }

  /**
   * Get status color for UI display
   */
  static getStatusColor(status: PaymentTransactionStatus): string {
    switch (status) {
      case PaymentTransactionStatus.Completed:
        return 'text-green-500'
      case PaymentTransactionStatus.Failed:
        return 'text-red-500'
      case PaymentTransactionStatus.Processing:
        return 'text-yellow-500'
      case PaymentTransactionStatus.Pending:
        return 'text-blue-500'
      case PaymentTransactionStatus.Refunded:
        return 'text-orange-500'
      default:
        return 'text-gray-500'
    }
  }
}