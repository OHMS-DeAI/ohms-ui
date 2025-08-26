/**
 * Direct LLM Service for OHMS Agents
 * Calls the deployed agent canister's infer method to use DFINITY LLM
 * This makes the agents immediately functional with the Llama 3.1 8B model
 */

import { Actor, HttpAgent } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'

// Agent canister ID - will be dynamically resolved from canister_ids.json
const getAgentCanisterId = (): string => {
  // Try to get from canister_ids.json or use a default
  try {
    const canisterIds = require('../canister_ids.json')
    return canisterIds.ohms_agent?.ic || 'gavyi-uyaaa-aaaaa-qbu7q-cai' // fallback to known ID
  } catch {
    return 'gavyi-uyaaa-aaaaa-qbu7q-cai' // fallback to known deployed canister
  }
}

// Agent canister IDL interface
const agentCanisterIdl = ({ IDL }: any) => {
  return IDL.Service({
    infer: IDL.Func(
      [IDL.Record({
        seed: IDL.Nat64,
        prompt: IDL.Text,
        decode_params: IDL.Record({
          max_tokens: IDL.Opt(IDL.Nat32),
          temperature: IDL.Opt(IDL.Float32),
          top_p: IDL.Opt(IDL.Float32),
          top_k: IDL.Opt(IDL.Nat32),
          repetition_penalty: IDL.Opt(IDL.Float32)
        }),
        msg_id: IDL.Text
      })],
      [IDL.Variant({
        Ok: IDL.Record({
          tokens: IDL.Vec(IDL.Text),
          generated_text: IDL.Text,
          inference_time_ms: IDL.Nat64,
          cache_hits: IDL.Nat32,
          cache_misses: IDL.Nat32
        }),
        Err: IDL.Text
      })],
      ['update']
    )
  })
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface LlmResponse {
  content: string
  success: boolean
  error?: string
}

/**
 * Direct LLM service that makes agents functional immediately
 */
export class DirectLlmService {
  private actor: any

  constructor(agent?: HttpAgent) {
    this.actor = Actor.createActor(agentCanisterIdl, {
      agent: agent || new HttpAgent({ host: 'https://ic0.app' }),
      canisterId: getAgentCanisterId(),
    })
  }

  /**
   * Send a message to agent canister and get response
   * This is what makes the agents actually work
   */
  async sendMessage(messages: ChatMessage[]): Promise<LlmResponse> {
    try {
      // Convert messages to a single prompt for the agent
      const systemMessages = messages.filter(m => m.role === 'system')
      const userMessages = messages.filter(m => m.role === 'user')
      const assistantMessages = messages.filter(m => m.role === 'assistant')

      // Build the prompt
      let prompt = ''

      // Add system instructions if present
      if (systemMessages.length > 0) {
        prompt += systemMessages.map(m => m.content).join('\n') + '\n\n'
      }

      // Add conversation history
      if (assistantMessages.length > 0 || userMessages.length > 1) {
        prompt += 'Previous conversation:\n'
        const historyMessages = [...assistantMessages, ...userMessages.slice(0, -1)]
        historyMessages.forEach((msg, idx) => {
          const role = msg.role === 'assistant' ? 'Assistant' : 'User'
          prompt += `${role}: ${msg.content}\n`
        })
        prompt += '\n'
      }

      // Add current user message
      const currentUserMessage = userMessages[userMessages.length - 1]
      if (currentUserMessage) {
        prompt += `User: ${currentUserMessage.content}\n\nAssistant:`
      }

      // Call the agent canister's infer method
      const response = await this.actor.infer({
        seed: BigInt(Math.floor(Math.random() * 1000000)),
        prompt,
        decode_params: {
          max_tokens: [512], // 512 tokens max
          temperature: [0.7], // Balanced creativity
          top_p: [0.9], // Nucleus sampling
          top_k: [], // Use default
          repetition_penalty: [1.1] // Slight repetition penalty
        },
        msg_id: `msg_${Date.now()}`
      })

      if (response.Err) {
        throw new Error(response.Err)
      }

      const result = response.Ok
      const content = result.generated_text || 'No response generated'

      return {
        content,
        success: true
      }
    } catch (error: any) {
      console.error('Agent canister call failed:', error)
      return {
        content: `I apologize, but I'm currently unable to respond due to a technical issue: ${error.message}`,
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Simple chat interface for agents
   */
  async chatWithAgent(agentId: string, userMessage: string): Promise<LlmResponse> {
    // Create a system message that gives the agent its identity
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are an autonomous AI agent (ID: ${agentId}) running on the OHMS 2.0 platform. You are powered by Llama 3.1 8B via DFINITY's Internet Computer. Be helpful, accurate, and engaging in your responses.`
    }

    const userMsg: ChatMessage = {
      role: 'user', 
      content: userMessage
    }

    return this.sendMessage([systemMessage, userMsg])
  }

  /**
 * Get agent capabilities and status
 */
async getAgentStatus(agentId: string): Promise<{online: boolean, model: string}> {
  try {
    // Test with a simple ping message
    const response = await this.chatWithAgent(agentId, "Hello! Are you online?")
    return {
      online: response.success,
      model: "Llama 3.1 8B (DFINITY)"
    }
  } catch {
    return {
      online: false,
      model: "Llama 3.1 8B (DFINITY)"
    }
  }
}
}

/**
 * Create a direct LLM service instance
 */
export const createDirectLlmService = (agent?: HttpAgent) => {
  return new DirectLlmService(agent)
}

/**
 * Utility function to test if an agent is responsive
 */
export const testAgentResponse = async (agentId: string, agent?: HttpAgent): Promise<boolean> => {
  try {
    const llmService = createDirectLlmService(agent)
    const response = await llmService.chatWithAgent(agentId, "Hello! Can you respond?")
    return response.success && response.content.length > 0
  } catch {
    return false
  }
}