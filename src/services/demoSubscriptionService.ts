/**
 * OHMS 2.0 Demo Subscription Management Service
 * 
 * Provides local subscription management for demo version:
 * - Free Plan: Rate-limited usage
 * - Basic Plan: 1-month free offer with timer
 * - Admin cycle management
 * - No Stripe integration required
 */

import type { GoogleAccountInfo } from './internetIdentityService'

// Demo Subscription Plans
export enum DemoSubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic'
}

export interface DemoSubscriptionInfo {
  plan: DemoSubscriptionPlan
  name: string
  description: string
  features: string[]
  rateLimits: {
    modelsPerMonth: number
    computeHours: number
    apiCallsPerMinute: number
    maxConcurrentRequests: number
  }
  isActive: boolean
  expiresAt?: Date // For basic plan free offer
  createdAt: Date
  lastUsed?: Date
}

export interface UserSubscription {
  userId: string
  googleAccount: GoogleAccountInfo
  subscription: DemoSubscriptionInfo
  usage: {
    modelsUsedThisMonth: number
    computeHoursUsed: number
    apiCallsToday: number
    lastResetDate: Date
  }
  adminNotes?: string
}

export interface AdminCycleManagement {
  totalCyclesAllocated: number
  cyclesUsedToday: number
  cyclesUsedThisMonth: number
  averageCyclesPerUser: number
  activeUsers: number
  lastUpdated: Date
}

export interface RateLimitStatus {
  isLimited: boolean
  remainingRequests: number
  resetTime: Date
  limitType: 'api_calls' | 'models' | 'compute_hours'
}

class DemoSubscriptionService {
  private subscriptions: Map<string, UserSubscription> = new Map()
  private rateLimitTracker: Map<string, Map<string, number>> = new Map()
  private adminCycles: AdminCycleManagement = {
    totalCyclesAllocated: 1000000000, // 1B cycles allocated by admin
    cyclesUsedToday: 0,
    cyclesUsedThisMonth: 0,
    averageCyclesPerUser: 10000,
    activeUsers: 0,
    lastUpdated: new Date()
  }

  // Storage key for persistence
  private readonly STORAGE_KEY = 'ohms_demo_subscriptions'
  private readonly ADMIN_CYCLES_KEY = 'ohms_admin_cycles'
  private readonly RATE_LIMIT_KEY = 'ohms_rate_limits'

  constructor() {
    this.loadFromStorage()
    this.startCleanupTimer()
  }

  /**
   * Get available subscription plans
   */
  public getAvailablePlans(): Record<DemoSubscriptionPlan, DemoSubscriptionInfo> {
    return {
      [DemoSubscriptionPlan.FREE]: {
        plan: DemoSubscriptionPlan.FREE,
        name: 'Free Plan',
        description: 'Perfect for trying out OHMS with basic AI model access',
        features: [
          '5 AI models per month',
          '10 compute hours',
          '50 API calls per minute',
          'Community support',
          'Basic model catalog access'
        ],
        rateLimits: {
          modelsPerMonth: 5,
          computeHours: 10,
          apiCallsPerMinute: 50,
          maxConcurrentRequests: 2
        },
        isActive: true,
        createdAt: new Date()
      },
      [DemoSubscriptionPlan.BASIC]: {
        plan: DemoSubscriptionPlan.BASIC,
        name: 'Basic Plan',
        description: '1-month free offer - No credit card required!',
        features: [
          '50 AI models per month',
          '100 compute hours',
          '500 API calls per minute',
          'Priority support',
          'Full model catalog access',
          'Advanced analytics',
          'Export capabilities'
        ],
        rateLimits: {
          modelsPerMonth: 50,
          computeHours: 100,
          apiCallsPerMinute: 500,
          maxConcurrentRequests: 10
        },
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date()
      }
    }
  }

  /**
   * Create or get user subscription
   */
  public async createOrGetSubscription(
    userId: string, 
    googleAccount: GoogleAccountInfo, 
    plan: DemoSubscriptionPlan = DemoSubscriptionPlan.FREE
  ): Promise<UserSubscription> {
    let subscription = this.subscriptions.get(userId)
    
    if (!subscription) {
      const planInfo = this.getAvailablePlans()[plan]
      
      subscription = {
        userId,
        googleAccount,
        subscription: { ...planInfo },
        usage: {
          modelsUsedThisMonth: 0,
          computeHoursUsed: 0,
          apiCallsToday: 0,
          lastResetDate: new Date()
        }
      }
      
      this.subscriptions.set(userId, subscription)
      this.saveToStorage()
      
      // Update admin cycles
      this.adminCycles.activeUsers = this.subscriptions.size
      this.adminCycles.lastUpdated = new Date()
      this.saveAdminCyclesToStorage()
      
      // Removed console log
    }
    
    return subscription
  }

  /**
   * Get user subscription
   */
  public getUserSubscription(userId: string): UserSubscription | null {
    return this.subscriptions.get(userId) || null
  }

  /**
   * Upgrade user to basic plan (1-month free)
   */
  public async upgradeToBasic(userId: string): Promise<UserSubscription> {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) {
      throw new Error('User subscription not found')
    }

    const basicPlan = this.getAvailablePlans()[DemoSubscriptionPlan.BASIC]
    
    // Set 1-month free offer expiration
    basicPlan.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    
    subscription.subscription = basicPlan
    subscription.adminNotes = `Upgraded to Basic Plan - 1 Month Free Offer until ${basicPlan.expiresAt.toLocaleDateString()}`
    
    this.subscriptions.set(userId, subscription)
    this.saveToStorage()
    
    // Removed console log
    
    return subscription
  }

  /**
   * Check rate limiting for user
   */
  public checkRateLimit(userId: string, operation: 'api_call' | 'model_usage' | 'compute_hour'): RateLimitStatus {
    const subscription = this.getUserSubscription(userId)
    if (!subscription) {
      return {
        isLimited: true,
        remainingRequests: 0,
        resetTime: new Date(Date.now() + 60 * 60 * 1000),
        limitType: 'api_calls'
      }
    }

    const now = new Date()
    const resetTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour reset
    
    // Check if basic plan has expired
    if (subscription.subscription.plan === DemoSubscriptionPlan.BASIC && 
        subscription.subscription.expiresAt && 
        now > subscription.subscription.expiresAt) {
      // Auto-downgrade to free plan
      this.downgradeToFree(userId)
      return this.checkRateLimit(userId, operation) // Recheck with free plan limits
    }

    const limits = subscription.subscription.rateLimits
    
    switch (operation) {
      case 'api_call':
        const apiCallsUsed = this.getApiCallsUsedToday(userId)
        const apiLimit = limits.apiCallsPerMinute * 60 * 24 // Daily limit
        return {
          isLimited: apiCallsUsed >= apiLimit,
          remainingRequests: Math.max(0, apiLimit - apiCallsUsed),
          resetTime,
          limitType: 'api_calls'
        }
        
      case 'model_usage':
        const modelsUsed = subscription.usage.modelsUsedThisMonth
        return {
          isLimited: modelsUsed >= limits.modelsPerMonth,
          remainingRequests: Math.max(0, limits.modelsPerMonth - modelsUsed),
          resetTime: this.getNextMonthReset(),
          limitType: 'models'
        }
        
      case 'compute_hour':
        const computeUsed = subscription.usage.computeHoursUsed
        return {
          isLimited: computeUsed >= limits.computeHours,
          remainingRequests: Math.max(0, limits.computeHours - computeUsed),
          resetTime: this.getNextMonthReset(),
          limitType: 'compute_hours'
        }
        
      default:
        return {
          isLimited: false,
          remainingRequests: 1000,
          resetTime,
          limitType: 'api_calls'
        }
    }
  }

  /**
   * Record usage for billing and rate limiting
   */
  public recordUsage(userId: string, operation: 'api_call' | 'model_usage' | 'compute_hour', amount: number = 1): void {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) return

    const now = new Date()
    
    // Reset monthly counters if needed
    if (this.isNewMonth(subscription.usage.lastResetDate)) {
      subscription.usage.modelsUsedThisMonth = 0
      subscription.usage.computeHoursUsed = 0
      subscription.usage.lastResetDate = now
    }

    // Record usage
    switch (operation) {
      case 'api_call':
        subscription.usage.apiCallsToday += amount
        this.recordApiCall(userId)
        break
      case 'model_usage':
        subscription.usage.modelsUsedThisMonth += amount
        break
      case 'compute_hour':
        subscription.usage.computeHoursUsed += amount
        break
    }

    subscription.subscription.lastUsed = now
    this.subscriptions.set(userId, subscription)
    
    // Update admin cycles usage
    this.adminCycles.cyclesUsedToday += amount * 1000 // Estimate cycles per operation
    this.adminCycles.cyclesUsedThisMonth += amount * 1000
    this.adminCycles.lastUpdated = now
    
    this.saveToStorage()
    this.saveAdminCyclesToStorage()
  }

  /**
   * Get basic plan time remaining
   */
  public getBasicPlanTimeRemaining(userId: string): { days: number; hours: number; minutes: number; expired: boolean } | null {
    const subscription = this.getUserSubscription(userId)
    if (!subscription || subscription.subscription.plan !== DemoSubscriptionPlan.BASIC || !subscription.subscription.expiresAt) {
      return null
    }

    const now = new Date()
    const expiresAt = subscription.subscription.expiresAt
    
    if (now >= expiresAt) {
      return { days: 0, hours: 0, minutes: 0, expired: true }
    }

    const diffMs = expiresAt.getTime() - now.getTime()
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000))

    return { days, hours, minutes, expired: false }
  }

  /**
   * Admin: Get cycle management dashboard data
   */
  public getAdminCycleManagement(): AdminCycleManagement {
    // Update real-time stats
    this.adminCycles.activeUsers = this.subscriptions.size
    this.adminCycles.averageCyclesPerUser = this.adminCycles.activeUsers > 0 
      ? this.adminCycles.cyclesUsedThisMonth / this.adminCycles.activeUsers 
      : 0
    
    return { ...this.adminCycles }
  }

  /**
   * Admin: Allocate more cycles
   */
  public allocateAdminCycles(additionalCycles: number, adminNote: string): void {
    this.adminCycles.totalCyclesAllocated += additionalCycles
    this.adminCycles.lastUpdated = new Date()
    
    // Removed console log
    // Removed console log
    
    this.saveAdminCyclesToStorage()
  }

  /**
   * Admin: Get all user subscriptions
   */
  public getAllUserSubscriptions(): UserSubscription[] {
    return Array.from(this.subscriptions.values())
  }

  /**
   * Admin: Force plan change for user
   */
  public adminChangePlan(userId: string, newPlan: DemoSubscriptionPlan, adminNote?: string): UserSubscription | null {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) return null

    const planInfo = this.getAvailablePlans()[newPlan]
    subscription.subscription = { ...planInfo }
    subscription.adminNotes = adminNote || `Admin changed plan to ${newPlan}`
    
    this.subscriptions.set(userId, subscription)
    this.saveToStorage()
    
    // Removed console log
    
    return subscription
  }

  // Private helper methods
  private downgradeToFree(userId: string): void {
    const subscription = this.subscriptions.get(userId)
    if (!subscription) return

    const freePlan = this.getAvailablePlans()[DemoSubscriptionPlan.FREE]
    subscription.subscription = freePlan
    subscription.adminNotes = 'Auto-downgraded to Free Plan after Basic Plan expired'
    
    this.subscriptions.set(userId, subscription)
    this.saveToStorage()
    
    // Removed console log
  }

  private getApiCallsUsedToday(userId: string): number {
    const today = new Date().toDateString()
    const userLimits = this.rateLimitTracker.get(userId) || new Map()
    return userLimits.get(today) || 0
  }

  private recordApiCall(userId: string): void {
    const today = new Date().toDateString()
    
    if (!this.rateLimitTracker.has(userId)) {
      this.rateLimitTracker.set(userId, new Map())
    }
    
    const userLimits = this.rateLimitTracker.get(userId)!
    const currentCount = userLimits.get(today) || 0
    userLimits.set(today, currentCount + 1)
    
    // Clean up old entries (keep only last 7 days)
    this.cleanupOldRateLimitEntries(userLimits)
  }

  private cleanupOldRateLimitEntries(userLimits: Map<string, number>): void {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    for (const [dateStr] of userLimits) {
      if (new Date(dateStr) < sevenDaysAgo) {
        userLimits.delete(dateStr)
      }
    }
  }

  private isNewMonth(lastReset: Date): boolean {
    const now = new Date()
    return now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()
  }

  private getNextMonthReset(): Date {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  private startCleanupTimer(): void {
    // Clean up expired subscriptions and old rate limit data every hour
    setInterval(() => {
      this.cleanupExpiredData()
    }, 60 * 60 * 1000)
  }

  private cleanupExpiredData(): void {
    const now = new Date()
    
    // Clean up expired basic plans
    for (const [userId, subscription] of this.subscriptions) {
      if (subscription.subscription.plan === DemoSubscriptionPlan.BASIC &&
          subscription.subscription.expiresAt &&
          now > subscription.subscription.expiresAt) {
        this.downgradeToFree(userId)
      }
    }
    
    // Clean up old rate limit data
    for (const [userId, userLimits] of this.rateLimitTracker) {
      this.cleanupOldRateLimitEntries(userLimits)
    }
  }

  // Storage methods
  private saveToStorage(): void {
    try {
      const data = {
        subscriptions: Array.from(this.subscriptions.entries()),
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      // Removed console log
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.subscriptions = new Map(data.subscriptions.map(([userId, sub]: [string, any]) => {
          // Parse dates
          sub.subscription.createdAt = new Date(sub.subscription.createdAt)
          if (sub.subscription.expiresAt) {
            sub.subscription.expiresAt = new Date(sub.subscription.expiresAt)
          }
          if (sub.subscription.lastUsed) {
            sub.subscription.lastUsed = new Date(sub.subscription.lastUsed)
          }
          sub.usage.lastResetDate = new Date(sub.usage.lastResetDate)
          
          return [userId, sub]
        }))
      }
    } catch (error) {
      // Removed console log
    }
  }

  private saveAdminCyclesToStorage(): void {
    try {
      localStorage.setItem(this.ADMIN_CYCLES_KEY, JSON.stringify(this.adminCycles))
    } catch (error) {
      // Removed console log
    }
  }

  private loadAdminCyclesFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.ADMIN_CYCLES_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        data.lastUpdated = new Date(data.lastUpdated)
        this.adminCycles = data
      }
    } catch (error) {
      // Removed console log
    }
  }

  /**
   * Get usage statistics for display
   */
  public getUserUsageStats(userId: string): {
    modelsUsed: number
    modelsLimit: number
    computeHoursUsed: number
    computeHoursLimit: number
    apiCallsToday: number
    dailyApiLimit: number
    resetDate: Date
  } | null {
    const subscription = this.getUserSubscription(userId)
    if (!subscription) return null

    const limits = subscription.subscription.rateLimits
    const usage = subscription.usage
    
    return {
      modelsUsed: usage.modelsUsedThisMonth,
      modelsLimit: limits.modelsPerMonth,
      computeHoursUsed: usage.computeHoursUsed,
      computeHoursLimit: limits.computeHours,
      apiCallsToday: this.getApiCallsUsedToday(userId),
      dailyApiLimit: limits.apiCallsPerMinute * 60 * 24,
      resetDate: this.getNextMonthReset()
    }
  }
}

// Create singleton instance
export const demoSubscriptionService = new DemoSubscriptionService()

// Export types for use in components
export type { UserSubscription, DemoSubscriptionInfo, AdminCycleManagement, RateLimitStatus }