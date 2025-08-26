import { HttpAgent, type Identity, type RequestId, type SubmitResponse, type QueryFields, type ApiQueryResponse } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'

/**
 * AgentAdapter wraps IdentityKit agent to implement HttpAgent interface
 * This ensures compatibility with payment service and other canister interactions
 */
export class AgentAdapter implements HttpAgent {
  private identity: Identity | null = null
  public readonly host: URL
  private credentials?: RequestCredentials
  public rootKey?: Uint8Array

  constructor(
    private wrappedAgent: any, // IdentityKit agent
    host: string,
    credentials?: RequestCredentials
  ) {
    this.host = new URL(host)
    this.credentials = credentials
  }

  // Set identity for the adapter
  setIdentity(identity: Identity): void {
    this.identity = identity
  }

  // Get the current identity
  getIdentity(): Identity | null {
    return this.identity
  }

  // Implement HttpAgent interface methods by delegating to wrapped agent
  async call(
    canisterId: Principal | string, 
    options: {
      methodName: string
      arg: ArrayBuffer
      effectiveCanisterId?: Principal | string
    }
  ): Promise<SubmitResponse> {
    if (!this.wrappedAgent) {
      throw new Error('Agent not initialized')
    }

    try {
      // Convert string canister ID to Principal if needed
      const canisterPrincipal = typeof canisterId === 'string' 
        ? Principal.fromText(canisterId) 
        : canisterId

      // Use wrapped agent's call method
      return await this.wrappedAgent.call(canisterPrincipal, options)
    } catch (error) {
      // Removed console log
      throw error
    }
  }

  // Query method for read-only calls
  async query(
    canisterId: Principal | string,
    fields: QueryFields,
    identity?: Identity | Promise<Identity>
  ): Promise<ApiQueryResponse> {
    if (!this.wrappedAgent) {
      throw new Error('Agent not initialized')
    }

    try {
      const canisterPrincipal = typeof canisterId === 'string' 
        ? Principal.fromText(canisterId) 
        : canisterId

      // Convert QueryFields to options format expected by wrapped agent
      const options = {
        methodName: fields.methodName,
        arg: fields.arg,
        effectiveCanisterId: fields.effectiveCanisterId
      }

      const result = await this.wrappedAgent.query(canisterPrincipal, options)
      
      // Wrap result in ApiQueryResponse format
      return {
        reply: result instanceof ArrayBuffer ? result : new ArrayBuffer(0),
        requestId: new Uint8Array(0) as RequestId
      }
    } catch (error) {
      // Removed console log
      throw error
    }
  }

  // Status method for checking agent status
  async status(): Promise<any> {
    if (!this.wrappedAgent) {
      throw new Error('Agent not initialized')
    }

    try {
      if (typeof this.wrappedAgent.status === 'function') {
        return await this.wrappedAgent.status()
      }
      
      // Return basic status if wrapped agent doesn't have status method
      return {
        status: 'ready',
        agent: 'oisy-adapter',
        timestamp: Date.now()
      }
    } catch (error) {
      // Removed console log
      throw error
    }
  }

  // Fetch root key for local development
  async fetchRootKey(): Promise<Uint8Array> {
    if (!this.wrappedAgent) {
      throw new Error('Agent not initialized')
    }

    try {
      const rootKey = await this.wrappedAgent.fetchRootKey()
      this.rootKey = rootKey instanceof ArrayBuffer ? new Uint8Array(rootKey) : rootKey
      return this.rootKey
    } catch (error) {
      // Removed console log
      throw error
    }
  }

  // Check if agent is properly initialized and compatible
  isReady(): boolean {
    return Boolean(
      this.wrappedAgent && 
      this.identity &&
      typeof this.wrappedAgent.call === 'function' &&
      typeof this.wrappedAgent.query === 'function'
    )
  }

  // Get readable status for debugging
  getStatus(): {
    hasWrappedAgent: boolean
    hasIdentity: boolean
    hasRootKey: boolean
    isReady: boolean
  } {
    return {
      hasWrappedAgent: Boolean(this.wrappedAgent),
      hasIdentity: Boolean(this.identity),
      hasRootKey: Boolean(this.rootKey),
      isReady: this.isReady()
    }
  }

  // Additional HttpAgent interface methods that may be needed
  async getPrincipal(): Promise<Principal> {
    if (!this.identity) {
      throw new Error('No identity available')
    }
    return await this.identity.getPrincipal()
  }

  // Replace root key if needed
  replaceIdentity(identity: Identity): void {
    this.identity = identity
  }

  // Add compatibility validation
  static validateCompatibility(agent: any): boolean {
    const requiredMethods = ['call', 'query', 'fetchRootKey']
    return requiredMethods.every(method => typeof agent[method] === 'function')
  }
}

/**
 * Factory function to create agent adapter with validation
 */
export function createAgentAdapter(
  wrappedAgent: any,
  identity: Identity | null,
  host: string,
  credentials?: RequestCredentials
): AgentAdapter {
  if (!AgentAdapter.validateCompatibility(wrappedAgent)) {
    throw new Error('Wrapped agent is not compatible - missing required methods')
  }

  const adapter = new AgentAdapter(wrappedAgent, host, credentials)
  if (identity) {
    adapter.setIdentity(identity)
  }

  return adapter
}