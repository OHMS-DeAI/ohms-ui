declare global {
  interface Window {
    ic?: {
      plug?: {
        requestConnect: (opts?: { whitelist?: string[]; host?: string }) => Promise<boolean>
        isConnected: () => Promise<boolean>
        getPrincipal: () => Promise<{ toString: () => string } | string>
        createAgent: (opts?: { whitelist?: string[]; host?: string }) => Promise<void>
        agent?: any
        requestTransfer: (args: any) => Promise<any>
      }
    }
  }
}
export {}

