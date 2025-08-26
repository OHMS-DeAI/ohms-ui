import { HttpAgent, type Identity } from '@dfinity/agent'

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  metadata?: {
    timestamp: number
    requestId: string
    duration: number
    attempt?: number
    retryable?: boolean
  }
}

export interface ApiError {
  code: string
  message: string
  details?: any
  retryAfter?: number
}

// Configuration Types
export interface ApiConfig {
  baseUrl?: string
  timeout: number
  retries: number
  retryDelay: number
  rateLimit: {
    requests: number
    period: number // in milliseconds
  }
}

export interface CanisterEndpoints {
  ohms_model: string
  ohms_agent: string
  ohms_coordinator: string
  ohms_econ: string
  dfinity_llm: string
}

// Request Interceptor Types
export interface RequestInterceptor {
  (config: RequestConfig): Promise<RequestConfig> | RequestConfig
}

export interface ResponseInterceptor {
  (response: ApiResponse): Promise<ApiResponse> | ApiResponse
}

export interface RequestConfig {
  endpoint: string
  method: string
  params?: any[]
  canisterId: string
  retries?: number
  timeout?: number
}

// Rate Limiting
class RateLimiter {
  private requests: number[] = []
  private config: ApiConfig['rateLimit']

  constructor(config: ApiConfig['rateLimit']) {
    this.config = config
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now()

    // Remove old requests outside the time window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.config.period
    )

    if (this.requests.length >= this.config.requests) {
      // Calculate wait time until the oldest request expires
      const oldestRequest = Math.min(...this.requests)
      const waitTime = this.config.period - (now - oldestRequest)

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.waitForSlot() // Recursively check again
      }
    }

    this.requests.push(now)
  }
}

// Main API Client Class
export class ApiClient {
  private agent: HttpAgent | null = null
  private identity: Identity | null = null
  private config: ApiConfig
  private rateLimiter: RateLimiter
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private endpoints: CanisterEndpoints

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      timeout: 30000, // 30 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
      rateLimit: {
        requests: 10,
        period: 60000 // 1 minute
      },
      ...config
    }

    this.rateLimiter = new RateLimiter(this.config.rateLimit)

    // Load real canister endpoints from canister_ids.json files
    this.endpoints = this.loadRealCanisterIds()
  }

  // Initialization
  async initialize(agent: HttpAgent, identity?: Identity): Promise<void> {
    this.agent = agent
    this.identity = identity || null

    // Fetch root key for local development
    if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') {
      try {
        await agent.fetchRootKey()
      } catch (error) {
        // Removed console log
      }
    }
  }

  // Configuration
  setEndpoints(endpoints: Partial<CanisterEndpoints>): void {
    this.endpoints = { ...this.endpoints, ...endpoints }
  }

  // Load real canister IDs from canister_ids.json files
  private loadRealCanisterIds(): CanisterEndpoints {
    // Default fallback canister IDs
    const defaultIds = {
      ohms_model: '3aes4-xyaaa-aaaal-qsryq-cai',
      ohms_agent: 'gavyi-uyaaa-aaaaa-qbu7q-cai',
      ohms_coordinator: 'xp6tn-piaaa-aaaah-qqe4q-cai',
      ohms_econ: 'tetse-piaaa-aaaao-qkeyq-cai',
      dfinity_llm: 'w36hm-eqaaa-aaaal-qr76a-cai'
    }

    // Try to load from canister_ids.json files
    try {
      // For now, use the hardcoded real IDs from the canister_ids.json files
      // In production, this would read from the actual canister_ids.json files
      return defaultIds
    } catch (error) {
      // Removed console log
      return defaultIds
    }
  }

  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor)
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor)
  }

  // Core Request Method with Retry Logic
  private async makeRequest<T>(
    canisterId: string,
    method: string,
    params: any[] = [],
    options: Partial<RequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId()
    const startTime = Date.now()

    if (!this.agent) {
      return this.createErrorResponse('CLIENT_NOT_INITIALIZED', 'API client not initialized')
    }

    const config: RequestConfig = {
      endpoint: method,
      method,
      params,
      canisterId,
      retries: options.retries ?? this.config.retries,
      timeout: options.timeout ?? this.config.timeout,
      ...options
    }

    // If retries are disabled, make a single attempt
    if (config.retries === 0) {
      return this.makeSingleRequest<T>(config, requestId, startTime)
    }

    // Use retry logic for multiple attempts
    return this.retryRequest<T>(canisterId, method, params, options)
  }

  // Single Request Attempt
  private async makeSingleRequest<T>(
    config: RequestConfig,
    requestId: string,
    startTime: number
  ): Promise<ApiResponse<T>> {
    try {
      // Apply request interceptors
      let processedConfig = config
      for (const interceptor of this.requestInterceptors) {
        processedConfig = await interceptor(processedConfig)
      }

      // Rate limiting
      await this.rateLimiter.waitForSlot()

      // Make the actual canister call
      const response = await this.callCanisterMethod<T>(
        processedConfig.canisterId,
        processedConfig.endpoint,
        processedConfig.params || [],
        processedConfig.timeout || this.config.timeout
      )

      const apiResponse: ApiResponse<T> = {
        success: true,
        data: response,
        metadata: {
          timestamp: Date.now(),
          requestId,
          duration: Date.now() - startTime
        }
      }

      // Apply response interceptors
      let processedResponse = apiResponse
      for (const interceptor of this.responseInterceptors) {
        processedResponse = await interceptor(processedResponse)
      }

      return processedResponse

    } catch (error) {
      // Removed console log
      return this.handleRequestError(error, requestId, startTime, 1)
    }
  }

  // Canister Method Calling
  private async callCanisterMethod<T>(
    canisterId: string,
    method: string,
    params: any[],
    timeout: number
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`))
      }, timeout)

      try {
        // Dynamic canister actor creation
        const actor = await this.createCanisterActor(canisterId)
        const methodFn = actor[method]

        if (!methodFn || typeof methodFn !== 'function') {
          throw new Error(`Method '${method}' not found on canister ${canisterId}`)
        }

        const result = await methodFn(...params)
        clearTimeout(timeoutId)
        resolve(result)

      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    })
  }

  // Canister Actor Creation
  private async createCanisterActor(canisterId: string): Promise<any> {
    // Import canister services dynamically
    const { createModelActor, createAgentActor, createCoordinatorActor, createEconActor } = await import('./canisterService')

    const serviceMap: Record<string, Function> = {
      [this.endpoints.ohms_model]: createModelActor,
      [this.endpoints.ohms_agent]: createAgentActor,
      [this.endpoints.ohms_coordinator]: createCoordinatorActor,
      [this.endpoints.ohms_econ]: createEconActor,
    }

    // Handle dfinity_llm canister - use ohms-agent for real LLM inference
    if (canisterId === this.endpoints.dfinity_llm) {
      // The ohms-agent canister provides real LLM inference via the 'infer' method
      const agentActor = serviceMap[this.endpoints.ohms_agent]
      if (!agentActor) {
        throw new Error('OHMS agent canister service not available for LLM inference')
      }

      // Return the real agent actor which has authentication
      return agentActor(this.agent, canisterId)
    }

    const createActor = serviceMap[canisterId]
    if (!createActor) {
      throw new Error(`No service available for canister ${canisterId}`)
    }

    // Pass the canister ID and authenticated agent to the actor creator
    return createActor(this.agent, canisterId)
  }


  // Enhanced Error Handling with Classification
  private handleRequestError(error: any, requestId: string, startTime: number, attempt: number = 1): ApiResponse {
    const errorClassification = this.classifyError(error)

    // Implement exponential backoff for retries
    const shouldRetry = this.shouldRetry(errorClassification, attempt)
    const retryAfter = shouldRetry ? this.calculateRetryDelay(attempt) : undefined

    return {
      success: false,
      error: {
        code: errorClassification.code,
        message: errorClassification.message,
        details: error,
        retryAfter
      },
      metadata: {
        timestamp: Date.now(),
        requestId,
        duration: Date.now() - startTime,
        attempt,
        retryable: shouldRetry
      }
    }
  }

  // Error Classification
  private classifyError(error: any): { code: string; message: string; retryable: boolean } {
    const errorString = error?.toString() || ''
    const errorMessage = error?.message || errorString

    // Network-related errors
    if (error.name === 'TimeoutError' || errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      return {
        code: 'REQUEST_TIMEOUT',
        message: 'Request timed out - the operation took too long to complete',
        retryable: true
      }
    }

    if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed - please check your internet connection',
        retryable: true
      }
    }

    // Authentication errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('Unauthorized') || errorMessage.includes('403')) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Authentication required - please log in again',
        retryable: false
      }
    }

    // Permission errors
    if (errorMessage.includes('forbidden') || errorMessage.includes('403') || errorMessage.includes('access denied')) {
      return {
        code: 'FORBIDDEN',
        message: 'Access denied - insufficient permissions',
        retryable: false
      }
    }

    // Not found errors
    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return {
        code: 'NOT_FOUND',
        message: 'Requested resource not found',
        retryable: false
      }
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('too many requests')) {
      return {
        code: 'RATE_LIMITED',
        message: 'Too many requests - please wait before trying again',
        retryable: true
      }
    }

    // Canister-specific errors
    if (errorMessage.includes('canister') || errorMessage.includes('actor')) {
      return {
        code: 'CANISTER_ERROR',
        message: 'Blockchain canister error - the service may be temporarily unavailable',
        retryable: true
      }
    }

    // Quota exceeded
    if (errorMessage.includes('quota') || errorMessage.includes('limit exceeded')) {
      return {
        code: 'QUOTA_EXCEEDED',
        message: 'Usage quota exceeded - please upgrade your plan',
        retryable: false
      }
    }

    // Service unavailable
    if (errorMessage.includes('service unavailable') || errorMessage.includes('503') || errorMessage.includes('502')) {
      return {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable - please try again later',
        retryable: true
      }
    }

    // Default unknown error
    return {
      code: 'UNKNOWN_ERROR',
      message: errorMessage || 'An unexpected error occurred',
      retryable: false
    }
  }

  // Retry Logic
  private shouldRetry(errorClassification: { code: string; retryable: boolean }, attempt: number): boolean {
    if (!errorClassification.retryable || attempt >= this.config.retries) {
      return false
    }

    // Don't retry certain types of errors even if marked as retryable
    const noRetryCodes = ['UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'QUOTA_EXCEEDED']
    return !noRetryCodes.includes(errorClassification.code)
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: baseDelay * 2^(attempt-1) + jitter
    const baseDelay = this.config.retryDelay
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 1000 // Add up to 1 second of jitter
    return Math.min(exponentialDelay + jitter, 30000) // Cap at 30 seconds
  }

  // Retry Implementation
  private async retryRequest<T>(
    canisterId: string,
    method: string,
    params: any[],
    options: Partial<RequestConfig>
  ): Promise<ApiResponse<T>> {
    let lastError: ApiResponse<T> | null = null

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      const result = await this.makeRequest<T>(canisterId, method, params, {
        ...options,
        retries: 0 // Disable retries in the recursive call
      })

      if (result.success) {
        return result
      }

      lastError = result

      // Check if we should retry
      if (!result.error?.retryAfter || attempt >= this.config.retries) {
        break
      }

      // Wait before retrying
      const waitTime = result.error.retryAfter || this.calculateRetryDelay(attempt)
      // Removed console log

      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    return lastError || this.createErrorResponse('RETRY_EXHAUSTED', 'All retry attempts exhausted')
  }

  // Utility Methods
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createErrorResponse(code: string, message: string): ApiResponse {
    return {
      success: false,
      error: { code, message },
      metadata: {
        timestamp: Date.now(),
        requestId: this.generateRequestId(),
        duration: 0
      }
    }
  }

  // Public API Methods

  // Model Management
  async listModels(): Promise<ApiResponse<any[]>> {
    return this.makeRequest(this.endpoints.ohms_model, 'list_models', [])
  }

  async getModel(modelId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(this.endpoints.ohms_model, 'get_model', [modelId])
  }

  async createModel(modelData: any): Promise<ApiResponse<string>> {
    return this.makeRequest(this.endpoints.ohms_model, 'create_model', [modelData])
  }

  // Agent Management
  async listAgents(): Promise<ApiResponse<any[]>> {
    return this.makeRequest(this.endpoints.ohms_agent, 'list_agents', [])
  }

  async getAgent(agentId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(this.endpoints.ohms_agent, 'get_agent', [agentId])
  }

  async createAgentFromInstructions(instructions: string, modelId?: string): Promise<ApiResponse<any>> {
    const params = modelId ? [instructions, modelId] : [instructions]
    return this.makeRequest(this.endpoints.ohms_agent, 'create_agent_from_instructions', params)
  }

  // LLM Integration - Use ohms-agent canister for inference
  async sendLlmMessage(message: string, model: string = 'llama3.1-8b'): Promise<ApiResponse<any>> {
    // Create InferenceRequest according to ohms-agent.did
    const inferenceRequest = {
      seed: BigInt(Math.floor(Math.random() * 1000000)),
      prompt: message,
      decode_params: {
        max_tokens: [1024],
        temperature: [0.7],
        top_p: [0.9],
        top_k: [],
        repetition_penalty: [1.1]
      },
      msg_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Use the ohms-agent canister which has the 'infer' method
    return this.makeRequest(
      this.endpoints.ohms_agent,
      'infer',
      [inferenceRequest]
    )
  }

  async getLlmModels(): Promise<ApiResponse<any[]>> {
    // Return supported models from ohms-agent
    return Promise.resolve({
      success: true,
      data: [
        { id: 'llama3.1-8b', name: 'Llama 3.1 8B', description: 'Fast and efficient general-purpose AI' }
      ],
      metadata: {
        timestamp: Date.now(),
        requestId: 'static-models',
        duration: 0
      }
    })
  }

  // Coordinator Functions
  async getCoordinatorHealth(): Promise<ApiResponse<any>> {
    return this.makeRequest(this.endpoints.ohms_coordinator, 'health', [])
  }

  async submitTask(task: any): Promise<ApiResponse<string>> {
    return this.makeRequest(this.endpoints.ohms_coordinator, 'submit_task', [task])
  }

  // Economics
  async getUserQuota(): Promise<ApiResponse<any>> {
    return this.makeRequest(this.endpoints.ohms_econ, 'get_user_quota', [])
  }

  async getSubscriptionStatus(): Promise<ApiResponse<any>> {
    return this.makeRequest(this.endpoints.ohms_econ, 'get_subscription_status', [])
  }

  async createSubscription(tier: string): Promise<ApiResponse<any>> {
    return this.makeRequest(this.endpoints.ohms_econ, 'create_subscription', [tier])
  }

  // Health Checks
  async healthCheck(): Promise<ApiResponse<any>> {
    const results = await Promise.allSettled([
      this.makeRequest(this.endpoints.ohms_model, 'health', []),
      this.makeRequest(this.endpoints.ohms_agent, 'health', []),
      this.makeRequest(this.endpoints.ohms_coordinator, 'health', []),
      this.makeRequest(this.endpoints.ohms_econ, 'health', []),
      this.makeRequest(this.endpoints.dfinity_llm, 'health', [])
    ])

    const health = {
      model: results[0].status === 'fulfilled' ? results[0].value : null,
      agent: results[1].status === 'fulfilled' ? results[1].value : null,
      coordinator: results[2].status === 'fulfilled' ? results[2].value : null,
      econ: results[3].status === 'fulfilled' ? results[3].value : null,
      llm: results[4].status === 'fulfilled' ? results[4].value : null
    }

    return {
      success: true,
      data: health,
      metadata: {
        timestamp: Date.now(),
        requestId: this.generateRequestId(),
        duration: 0
      }
    }
  }

  // Cleanup method for ApiClient
  destroy(): void {
    this.requestInterceptors.length = 0
    this.responseInterceptors.length = 0
    this.agent = null
  }
}

// Real-time Data Synchronization
export interface SubscriptionOptions {
  onUpdate: (data: any) => void
  onError?: (error: any) => void
  retryOnError?: boolean
  pollingInterval?: number // Fallback polling in milliseconds
}

export interface DataCache {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
}

export class RealTimeManager {
  private subscriptions: Map<string, SubscriptionOptions> = new Map()
  private cache: Map<string, DataCache> = new Map()
  private pollingTimers: Map<string, NodeJS.Timeout> = new Map()
  private wsConnections: Map<string, WebSocket> = new Map()

  // Subscribe to real-time data
  subscribe(endpoint: string, options: SubscriptionOptions): () => void {
    this.subscriptions.set(endpoint, options)

    // Start real-time connection or polling fallback
    this.startDataSync(endpoint, options)

    // Return unsubscribe function
    return () => {
      this.unsubscribe(endpoint)
    }
  }

  // Unsubscribe from real-time data
  private unsubscribe(endpoint: string): void {
    this.subscriptions.delete(endpoint)

    // Clear polling timer
    const timer = this.pollingTimers.get(endpoint)
    if (timer) {
      clearInterval(timer)
      this.pollingTimers.delete(endpoint)
    }

    // Close WebSocket connection
    const ws = this.wsConnections.get(endpoint)
    if (ws) {
      ws.close()
      this.wsConnections.delete(endpoint)
    }
  }

  // Start data synchronization
  private startDataSync(endpoint: string, options: SubscriptionOptions): void {
    // Try WebSocket first
    this.tryWebSocketConnection(endpoint, options)

    // Fallback to polling if WebSocket fails
    if (options.pollingInterval) {
      this.startPolling(endpoint, options)
    }
  }

  // WebSocket connection attempt
  private tryWebSocketConnection(endpoint: string, options: SubscriptionOptions): void {
    try {
      const wsUrl = this.buildWebSocketUrl(endpoint)
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        // Removed console log
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleDataUpdate(endpoint, data)
        } catch (error) {
          // Removed console log
          options.onError?.(error)
        }
      }

      ws.onerror = (error) => {
        // Removed console log
        options.onError?.(error)

        // Fallback to polling if WebSocket fails
        if (options.retryOnError !== false) {
          this.startPolling(endpoint, options)
        }
      }

      ws.onclose = () => {
        // Removed console log

        // Retry connection after delay
        if (options.retryOnError !== false) {
          setTimeout(() => {
            this.tryWebSocketConnection(endpoint, options)
          }, 5000) // Retry after 5 seconds
        }
      }

      this.wsConnections.set(endpoint, ws)
    } catch (error) {
      // Removed console log
      // Fallback to polling immediately
      this.startPolling(endpoint, options)
    }
  }

  // Start polling fallback
  private startPolling(endpoint: string, options: SubscriptionOptions): void {
    const interval = options.pollingInterval || 30000 // Default 30 seconds

    const timer = setInterval(async () => {
      try {
        // This would be replaced with actual API call
        const response = await fetch(`/api/${endpoint}`)
        if (response.ok) {
          const data = await response.json()
          this.handleDataUpdate(endpoint, data)
        }
      } catch (error) {
        // Removed console log
        options.onError?.(error)
      }
    }, interval)

    this.pollingTimers.set(endpoint, timer)
  }

  // Handle data updates
  private handleDataUpdate(endpoint: string, data: any): void {
    const subscription = this.subscriptions.get(endpoint)
    if (subscription) {
      // Update cache
      this.updateCache(endpoint, data)

      // Notify subscriber
      subscription.onUpdate(data)
    }
  }

  // Cache management
  private updateCache(endpoint: string, data: any, ttl: number = 300000): void { // 5 minutes default TTL
    this.cache.set(endpoint, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  getCachedData(endpoint: string): any | null {
    const cached = this.cache.get(endpoint)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }

    // Remove expired cache
    if (cached) {
      this.cache.delete(endpoint)
    }

    return null
  }

  // Utility methods
  private buildWebSocketUrl(endpoint: string): string {
    const baseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080'
    return `${baseUrl}/api/${endpoint}`
  }

  // Cleanup all connections
  destroy(): void {
    // Clear all subscriptions
    for (const endpoint of this.subscriptions.keys()) {
      this.unsubscribe(endpoint)
    }

    // Clear cache
    this.cache.clear()
  }
}

// Enhanced API Client with Real-time Capabilities
export class EnhancedApiClient extends ApiClient {
  private realTimeManager: RealTimeManager
  private clientIdentity: Identity | null = null

  constructor(config: Partial<ApiConfig> = {}) {
    super(config)
    this.realTimeManager = new RealTimeManager()

    // Defer interceptor setup to avoid circular dependency
    // They will be added during initialization
  }

  // Override initialize to store identity
  async initialize(agent: HttpAgent, identity?: Identity): Promise<void> {
    this.clientIdentity = identity || null
    
    // Add interceptors during initialization to avoid circular dependency
    this.addRequestInterceptor(createAuthInterceptor(() => this.clientIdentity))
    this.addResponseInterceptor(createLoggingInterceptor())
    
    await super.initialize(agent, identity)
  }

  // Real-time subscription methods
  subscribeToData(endpoint: string, options: SubscriptionOptions): () => void {
    return this.realTimeManager.subscribe(endpoint, options)
  }

  getCachedData(endpoint: string): any | null {
    return this.realTimeManager.getCachedData(endpoint)
  }

  // Enhanced health check with real-time status
  async healthCheckWithRealtime(): Promise<ApiResponse<any>> {
    const healthResult = await this.healthCheck()

    if (healthResult.success) {
      // Start real-time health monitoring
      this.subscribeToHealthUpdates()
    }

    return healthResult
  }

  // Subscribe to health updates
  private subscribeToHealthUpdates(): void {
    this.subscribeToData('health', {
      onUpdate: (healthData) => {
        // Removed console log
        // Emit health update event
        this.emitHealthUpdate(healthData)
      },
      onError: (error) => {
        // Removed console log
      },
      pollingInterval: 30000, // 30 second polling fallback
      retryOnError: true
    })
  }

  // Event emission for health updates
  private healthUpdateListeners: ((data: any) => void)[] = []

  onHealthUpdate(callback: (data: any) => void): () => void {
    this.healthUpdateListeners.push(callback)
    return () => {
      const index = this.healthUpdateListeners.indexOf(callback)
      if (index > -1) {
        this.healthUpdateListeners.splice(index, 1)
      }
    }
  }

  private emitHealthUpdate(data: any): void {
    this.healthUpdateListeners.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        // Removed console log
      }
    })
  }

  // Cleanup
  destroy(): void {
    this.realTimeManager.destroy()
    // Call parent cleanup if available
    if (super.destroy) {
      super.destroy()
    }
  }
}

// Lazy singleton instance with real-time capabilities
let _apiClient: EnhancedApiClient | null = null

export function getApiClient(): EnhancedApiClient {
  if (!_apiClient) {
    _apiClient = new EnhancedApiClient()
  }
  return _apiClient
}

// Simple getter for backwards compatibility - no immediate instantiation
export const apiClient = {
  get instance() {
    return getApiClient()
  }
} as {
  instance: EnhancedApiClient
} & EnhancedApiClient

// Add proxy methods to make it behave like the actual instance
const proxyMethods = [
  'initialize', 'listModels', 'getModel', 'createModel', 'listAgents', 
  'getAgent', 'createAgentFromInstructions', 'sendLlmMessage', 'getLlmModels',
  'getCoordinatorHealth', 'submitTask', 'getUserQuota', 'getSubscriptionStatus',
  'createSubscription', 'healthCheck', 'subscribeToData', 'getCachedData',
  'healthCheckWithRealtime', 'onHealthUpdate', 'destroy'
] as const

proxyMethods.forEach(method => {
  (apiClient as any)[method] = (...args: any[]) => {
    return (getApiClient() as any)[method](...args)
  }
})

// React hook for using the API client
export function useApiClient() {
  return apiClient
}

// Pre-configured interceptors
export const createAuthInterceptor = (getIdentity: () => Identity | null): RequestInterceptor => {
  return (config) => {
    const identity = getIdentity()
    if (identity) {
      // Add authentication headers or modify config as needed
      // Removed console log
    }
    return config
  }
}

export const createLoggingInterceptor = (): ResponseInterceptor => {
  return (response) => {
    if (response.metadata) {
      // API response logged
    }
    return response
  }
}

export const createRetryInterceptor = (maxRetries: number = 3): ResponseInterceptor => {
  return async (response) => {
    if (!response.success && response.error) {
      const { error } = response

      // Retry logic for specific error types
      if (['NETWORK_ERROR', 'REQUEST_TIMEOUT'].includes(error.code || '') && maxRetries > 0) {
        // Removed console log

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Note: Actual retry logic would need to be implemented at the caller level
        // This is just for demonstration
      }
    }

    return response
  }
}
