import { Principal } from '@dfinity/principal';

// Type definitions for AI model integration
// Currently only Llama 3.1 8B is supported
export enum QuantizedModel {
  Llama3_1_8B = 'llama3.1-8b', // Match the real model ID from backend
}

// Future-ready architecture: Additional models will be added based on demand

export enum MessageRole {
  User = 'User',
  Assistant = 'Assistant',
  System = 'System',
}

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: bigint;
  model: QuantizedModel;
}

export interface ConversationSession {
  session_id: string;
  user_principal: Principal;
  model: QuantizedModel;
  messages: ChatMessage[];
  created_at: bigint;
  last_activity: bigint;
  token_usage: TokenUsage;
}

export interface TokenUsage {
  input_tokens: bigint;
  output_tokens: bigint;
  total_tokens: bigint;
  estimated_cost: number;
}

export interface UserQuota {
  user_principal: Principal;
  daily_token_limit: bigint;
  monthly_token_limit: bigint;
  current_daily_usage: bigint;
  current_monthly_usage: bigint;
  last_reset: bigint;
  is_premium: boolean;
}

export enum LlmError {
  RateLimitExceeded = 'RateLimitExceeded',
  ModelUnavailable = 'ModelUnavailable',
  InvalidRequest = 'InvalidRequest',
  AuthenticationFailed = 'AuthenticationFailed',
  QuotaExceeded = 'QuotaExceeded',
  ServiceUnavailable = 'ServiceUnavailable',
  ContentFiltered = 'ContentFiltered',
  InternalError = 'InternalError',
}

export interface LlmErrorResponse {
  error: LlmError;
  message: string;
  reset_time?: bigint;
  retry_after?: bigint;
}

export interface ModelInfo {
  model: QuantizedModel;
  display_name: string;
  description: string;
  capabilities: string[];
  is_available: boolean;
}

// Reactive state management for LLM interactions
export interface LlmState {
  conversations: Map<string, ConversationSession>;
  currentConversation: ConversationSession | null;
  availableModels: ModelInfo[];
  userQuota: UserQuota | null;
  isLoading: boolean;
  error: LlmErrorResponse | null;
}

// Event types for real-time updates
export interface LlmEvent {
  type: 'message' | 'conversation_created' | 'model_switched' | 'error' | 'quota_updated';
  session_id?: string;
  data: any;
}

// Main LLM Service Class
export class LlmService {
  private state: LlmState;
  private eventListeners: Map<string, (event: LlmEvent) => void>;
  private agentCanister: any; // Will be initialized with actual canister

  constructor() {
    this.state = {
      conversations: new Map(),
      currentConversation: null,
      availableModels: [],
      userQuota: null,
      isLoading: false,
      error: null,
    };
    this.eventListeners = new Map();
  }

  // Initialize with agent canister reference
  async initialize(agentCanister: any): Promise<void> {
    this.agentCanister = agentCanister;
    await this.loadAvailableModels();
  }

  // Event subscription system
  on(eventType: string, callback: (event: LlmEvent) => void): () => void {
    this.eventListeners.set(eventType, callback);
    return () => {
      this.eventListeners.delete(eventType);
    };
  }

  private emit(event: LlmEvent): void {
    this.eventListeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        // Removed console log
      }
    });
  }

  // Load available models from backend
  private async loadAvailableModels(): Promise<void> {
    try {
      if (!this.agentCanister) {
        throw new Error('Agent canister not initialized');
      }

      // This would call the actual canister method
      // const models = await this.agentCanister.getAvailableModels();

      // Model information for current AI infrastructure
      // Currently only Llama 3.1 8B is supported
      this.state.availableModels = [
        {
          model: QuantizedModel.Llama3_1_8B,
          display_name: 'Llama 3.1 8B',
          description: 'Fast and efficient general-purpose AI for content generation and code assistance',
          capabilities: [
            'Content Generation',
            'Code Assistance',
            'General Chat',
            'Fast Response Times'
          ],
          is_available: true,
        },
      ];

      this.emit({
        type: 'model_switched',
        data: { models: this.state.availableModels }
      });
    } catch (error) {
      // Removed console log
      this.handleError(LlmError.InternalError, 'Failed to load models');
    }
  }

  // Create new conversation
  async createConversation(model: QuantizedModel): Promise<ConversationSession> {
    this.setLoading(true);

    try {
      if (!this.agentCanister) {
        throw new Error('Agent canister not initialized');
      }

      // For local development, just create the session without calling LLM yet
      // The actual LLM call will happen when the user sends their first message

      // Create session with real data
      const sessionId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: ConversationSession = {
        session_id: sessionId,
        user_principal: Principal.anonymous(), // Will be replaced with real principal
        model,
        messages: [],
        created_at: BigInt(Date.now()) * BigInt(1000000),
        last_activity: BigInt(Date.now()) * BigInt(1000000),
        token_usage: {
          input_tokens: BigInt(0),
          output_tokens: BigInt(0),
          total_tokens: BigInt(0),
          estimated_cost: 0,
        },
      };

      this.state.conversations.set(sessionId, session);
      this.state.currentConversation = session;

      this.emit({
        type: 'conversation_created',
        session_id: sessionId,
        data: session
      });

      return session;
    } catch (error) {
      this.handleError(LlmError.InternalError, 'Failed to create conversation');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  // Send message to LLM
  async sendMessage(message: string): Promise<ChatMessage> {
    if (!this.state.currentConversation) {
      throw new Error('No active conversation');
    }

    this.setLoading(true);

    try {
      if (!this.agentCanister) {
        throw new Error('Agent canister not initialized');
      }

      // Use the API client to send the message to the LLM service
      const { getApiClient } = await import('./apiClient');
      const apiClientInstance = getApiClient();

      // Send message to LLM via ohms-agent canister (uses real DFINITY LLM)
      const llmResponse = await apiClientInstance.sendLlmMessage(message, this.state.currentConversation.model);

      // Use real API response from ohms-agent canister - no mocks or simulations
      if (!llmResponse.success) {
        throw new Error(`LLM API call failed: ${llmResponse.error?.message || 'Unknown error'}`);
      }

      if (!llmResponse.data) {
        throw new Error('LLM API returned no data');
      }

      // Parse InferenceResponse from ohms-agent
      // Handle Candid variant response format: variant { Ok = record { ... } }
      let inferenceResponse;
      if (llmResponse.data && llmResponse.data.Ok) {
        // Candid variant format
        inferenceResponse = llmResponse.data.Ok;
      } else if (llmResponse.data) {
        // Direct record format (fallback)
        inferenceResponse = llmResponse.data;
      } else {
        throw new Error('Invalid response format from OHMS Agent');
      }

      const response = inferenceResponse.generated_text || '';
      if (!response) {
        // Removed console log
        throw new Error('OHMS Agent returned empty generated_text');
      }

      // Update conversation with new messages
      const userMessage: ChatMessage = {
        role: MessageRole.User,
        content: message,
        timestamp: BigInt(Date.now()) * BigInt(1000000),
        model: this.state.currentConversation.model,
      };

      const assistantMessage: ChatMessage = {
        role: MessageRole.Assistant,
        content: response,
        timestamp: BigInt(Date.now()) * BigInt(1000000),
        model: this.state.currentConversation.model,
      };

      // Update conversation state
      const conversation = this.state.conversations.get(this.state.currentConversation.session_id);
      if (conversation) {
        conversation.messages.push(userMessage);
        conversation.messages.push(assistantMessage);
        conversation.last_activity = assistantMessage.timestamp;

        // Update token usage - convert to integers first to avoid decimal BigInt conversion
        const estimatedTokens = BigInt(Math.floor(message.length / 4));
        const responseTokens = BigInt(Math.floor(response.length / 4));
        conversation.token_usage.input_tokens += estimatedTokens;
        conversation.token_usage.output_tokens += responseTokens;
        conversation.token_usage.total_tokens += estimatedTokens + responseTokens;
        conversation.token_usage.estimated_cost = this.calculateCost(
          conversation.token_usage.total_tokens,
          conversation.model
        );

        this.emit({
          type: 'message',
          session_id: conversation.session_id,
          data: { userMessage, assistantMessage }
        });
      }

      return assistantMessage;
    } catch (error) {
      this.handleError(LlmError.InternalError, 'Failed to send message');
      throw error;
    } finally {
      this.setLoading(false);
    }
  }


  // Switch model in current conversation
  async switchModel(newModel: QuantizedModel): Promise<void> {
    if (!this.state.currentConversation) {
      throw new Error('No active conversation');
    }

    try {
      // Call canister method to switch model
      // await this.agentCanister.switchModel(
      //   this.state.currentConversation.session_id,
      //   newModel
      // );

      // Update local state
      this.state.currentConversation.model = newModel;

      this.emit({
        type: 'model_switched',
        session_id: this.state.currentConversation.session_id,
        data: { newModel }
      });
    } catch (error) {
      this.handleError(LlmError.InternalError, 'Failed to switch model');
      throw error;
    }
  }

  // Get conversation history
  getConversation(sessionId: string): ConversationSession | undefined {
    return this.state.conversations.get(sessionId);
  }

  // List all conversations for current user
  getConversations(): ConversationSession[] {
    return Array.from(this.state.conversations.values());
  }

  // Delete conversation
  async deleteConversation(sessionId: string): Promise<void> {
    try {
      // Call canister method to delete conversation
      // await this.agentCanister.deleteConversation(sessionId);

      this.state.conversations.delete(sessionId);

      if (this.state.currentConversation?.session_id === sessionId) {
        this.state.currentConversation = null;
      }
    } catch (error) {
      this.handleError(LlmError.InternalError, 'Failed to delete conversation');
      throw error;
    }
  }

  // Calculate estimated cost (currently free for beta users)
  private calculateCost(totalTokens: bigint, model: QuantizedModel): number {
    const tokens = Number(totalTokens) / 1000; // Convert to thousands

    // Currently free for beta users
    // Future pricing model will be based on usage tiers
    switch (model) {
      case QuantizedModel.Llama3_1_8B:
        return 0; // Currently free
        // Future: return tokens * 0.0001; // $0.10 per 1K tokens
      default:
        return 0; // Currently free
    }
  }

  // Get current state
  getState(): LlmState {
    return { ...this.state };
  }

  // Utility methods
  private setLoading(loading: boolean): void {
    this.state.isLoading = loading;
  }

  private handleError(error: LlmError, message: string): void {
    this.state.error = { error, message };
    this.emit({
      type: 'error',
      data: { error, message }
    });
  }

  // Clean up resources
  destroy(): void {
    this.eventListeners.clear();
    this.state.conversations.clear();
    this.state.currentConversation = null;
  }
}

// Lazy singleton instance
let _llmService: LlmService | null = null;

export function getLlmService(): LlmService {
  if (!_llmService) {
    _llmService = new LlmService();
  }
  return _llmService;
}

// For backwards compatibility
export const llmService = getLlmService();

// React hook for using LLM service
export function useLlmService() {
  return llmService;
}
