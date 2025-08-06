import React, { createContext, useContext, useState, type ReactNode } from 'react'
import { HttpAgent } from '@dfinity/agent'

// Define types for our canisters
export interface CanisterIds {
  ohms_model: string
  ohms_agent: string
  ohms_coordinator: string
  ohms_econ: string
}

interface AgentContextType {
  agent: HttpAgent | null
  canisterIds: CanisterIds
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => void
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

// Default canister IDs (from our local deployment)
const defaultCanisterIds: CanisterIds = {
  ohms_model: import.meta.env.VITE_OHMS_MODEL_CANISTER_ID || 'rdmx6-jaaaa-aaaaa-aaadq-cai',
  ohms_agent: import.meta.env.VITE_OHMS_AGENT_CANISTER_ID || 'lqy7q-dh777-77777-aaaaq-cai',
  ohms_coordinator: import.meta.env.VITE_OHMS_COORDINATOR_CANISTER_ID || 'll5dv-z7777-77777-aaaca-cai',
  ohms_econ: import.meta.env.VITE_OHMS_ECON_CANISTER_ID || 'lc6ij-px777-77777-aaadq-cai',
}

interface AgentProviderProps {
  children: ReactNode
}

export const AgentProvider: React.FC<AgentProviderProps> = ({ children }) => {
  const [agent, setAgent] = useState<HttpAgent | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [canisterIds] = useState<CanisterIds>(defaultCanisterIds)

  const connect = async () => {
    try {
      // Create agent for local development
      const newAgent = new HttpAgent({
        host: import.meta.env.VITE_DFX_NETWORK === 'ic' ? 'https://ic0.app' : 'http://127.0.0.1:4943',
      })

      // Fetch root key for local development
      if (import.meta.env.VITE_DFX_NETWORK !== 'ic') {
        await newAgent.fetchRootKey()
      }

      setAgent(newAgent)
      setIsConnected(true)
    } catch (error) {
      console.error('Failed to connect to IC:', error)
    }
  }

  const disconnect = () => {
    setAgent(null)
    setIsConnected(false)
  }

  return (
    <AgentContext.Provider
      value={{
        agent,
        canisterIds,
        isConnected,
        connect,
        disconnect,
      }}
    >
      {children}
    </AgentContext.Provider>
  )
}

export const useAgent = () => {
  const context = useContext(AgentContext)
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return context
}