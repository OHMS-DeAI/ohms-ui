import { useState, useEffect } from 'react'
import { useAgent } from '../context/AgentContext'
import { listModels } from '../services/canisterService'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import Input from '../components/Input'
import LoadingSpinner from '../components/LoadingSpinner'
import { ModelAdminMetrics, SystemHealthBanner } from '../components/AdminMetrics'

interface Model {
  model_id: string
  version: string
  state: 'Active' | 'Pending' | 'Deprecated'
  digest: string
  chunks: Array<{
    id: string
    sha256: string
    size: number
    offset: number
  }>
  uploaded_at: number
  activated_at?: number
  // Extended properties for display
  family?: string
  description?: string
  size_mb?: number
  badges?: string[]
  parameters?: string
  license?: string
}

const ModelCatalog = () => {
  const { isWalletAvailable, createAuthAgent } = useAgent()
  const [models, setModels] = useState<Model[]>([])
  const [filteredModels, setFilteredModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedState, setSelectedState] = useState<string>('all')
  const [selectedBadge, setSelectedBadge] = useState<string>('all')

  // Remove automatic fetching - let users manually connect and fetch

  useEffect(() => {
    filterModels()
  }, [models, searchTerm, selectedState, selectedBadge])

  const fetchModels = async () => {
    setLoading(true)
    setError(null)
    try {
      // Create authenticated agent when needed
      const plugAgent = await createAuthAgent()
      if (!plugAgent) {
        throw new Error('Authentication required. Please connect your wallet.')
      }
      
      const list = await listModels(undefined, plugAgent)
      // Skip metadata fetching for now since get_model_meta doesn't exist in actual interface
      const metas = list.map(() => null)

      const enrichedModels = list.map((model: any, idx: number) => {
        const meta = metas[idx] as any // Type as any since we're setting it to null
        // Convert Candid variant to string
        const stateString = typeof model.state === 'object' ? Object.keys(model.state)[0] : model.state
        return {
          ...model,
          state: stateString, // Ensure state is a string
          family: meta?.family ?? getModelFamily(model.model_id),
          description: getModelDescription(model.model_id),
          size_mb: calculateSizeMB(model.chunks),
          badges: getModelBadges(stateString, model.model_id),
          parameters: getModelParameters(model.model_id),
          license: meta?.license ?? getModelLicense(model.model_id)
        }
      })

      setModels(enrichedModels)
      } catch (err: any) {
        console.error('Failed to fetch models:', err)
        setError(err.message || 'Failed to fetch models')
        setModels([])
      } finally {
      setLoading(false)
    }
  }

  const filterModels = () => {
    let filtered = models

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(model =>
        model.model_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.family?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // State filter
    if (selectedState !== 'all') {
      filtered = filtered.filter(model => model.state === selectedState)
    }

    // Badge filter
    if (selectedBadge !== 'all') {
      filtered = filtered.filter(model => 
        model.badges?.some(badge => badge.toLowerCase().includes(selectedBadge.toLowerCase()))
      )
    }

    setFilteredModels(filtered)
  }

  const getStateVariant = (state: string) => {
    switch (state) {
      case 'Active': return 'success'
      case 'Pending': return 'warning'
      case 'Deprecated': return 'error'
      default: return 'default'
    }
  }

  const getBadgeVariant = (badge: string) => {
    if (badge.includes('Verified')) return 'success'
    if (badge.includes('Pending')) return 'warning'
    if (badge.includes('License')) return 'info'
    return 'default'
  }

  // Helper functions for enrichment
  const getModelFamily = (modelId: string) => {
    if (modelId.includes('llama')) return 'Llama'
    if (modelId.includes('phi')) return 'Phi'
    if (modelId.includes('mistral')) return 'Mistral'
    if (modelId.includes('gemma')) return 'Gemma'
    return 'Unknown'
  }

  const getModelDescription = (modelId: string) => {
    const descriptions: Record<string, string> = {
      'llama': 'Meta\'s large language model series with strong instruction following capabilities',
      'phi': 'Microsoft\'s efficient small language model optimized for reasoning',
      'mistral': 'Mistral AI\'s open-source model with excellent performance',
      'gemma': 'Google\'s lightweight, state-of-the-art open model'
    }
    return Object.entries(descriptions).find(([key]) => modelId.includes(key))?.[1] || 'High-quality language model'
  }

  const calculateSizeMB = (chunks: any[]) => {
    const totalBytes = chunks.reduce((sum, chunk) => {
      // Convert BigInt to number for calculation
      const chunkSize = typeof chunk.size === 'bigint' ? Number(chunk.size) : chunk.size
      return sum + chunkSize
    }, 0)
    return Math.round(totalBytes / (1024 * 1024))
  }

  const getModelBadges = (state: string, modelId: string) => {
    const badges = []
    if (state === 'Active') {
      badges.push('Verified Quant', 'Reproducible')
      if (!modelId.includes('test')) badges.push('License Clear')
    } else if (state === 'Pending') {
      badges.push('Pending Verification')
    }
    return badges
  }

  const getModelParameters = (modelId: string) => {
    if (modelId.includes('8b')) return '8B'
    if (modelId.includes('7b')) return '7B'
    if (modelId.includes('3b') || modelId.includes('mini')) return '3.8B'
    if (modelId.includes('2b')) return '2B'
    return 'Unknown'
  }

  const getModelLicense = (modelId: string) => {
    if (modelId.includes('llama')) return 'Custom'
    if (modelId.includes('phi')) return 'MIT'
    if (modelId.includes('mistral')) return 'Apache 2.0'
    if (modelId.includes('gemma')) return 'Gemma Terms'
    return 'Unknown'
  }

  return (
    <div className="max-w-7xl mx-auto">
      <SystemHealthBanner />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-accentGold mb-2">Model Catalog</h1>
          <p className="text-textOnDark/70">Discover and verify quantized AI models on OHMS</p>
        </div>
        <Button onClick={fetchModels} loading={loading} disabled={!isWalletAvailable}>
          Refresh Models
        </Button>
      </div>

      {!isWalletAvailable && (
        <Card className="mb-6">
          <div className="text-center">
            <p className="text-red-300 mb-4">Oisy wallet not available. Please open Oisy wallet.</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="mb-6 border-red-500/50">
          <p className="text-red-300">Error: {error}</p>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search models..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-3 py-2 bg-primary/60 border border-accentGold/40 rounded-lg text-textOnDark focus:outline-none focus:ring-2 focus:ring-accentGold/50"
            >
              <option value="all">All States</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Deprecated">Deprecated</option>
            </select>

            <select
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              className="px-3 py-2 bg-primary/60 border border-accentGold/40 rounded-lg text-textOnDark focus:outline-none focus:ring-2 focus:ring-accentGold/50"
            >
              <option value="all">All Badges</option>
              <option value="verified">Verified</option>
              <option value="reproducible">Reproducible</option>
              <option value="license">License Clear</option>
            </select>

            <div className="text-sm text-textOnDark/60 flex items-center">
              {filteredModels.length} of {models.length} models
            </div>
          </div>
        </div>
      </Card>

      <ModelAdminMetrics />

      {/* Model Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <Card key={model.model_id} hover className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-accentGold mb-1">
                      {model.model_id}
                    </h3>
                    <p className="text-sm text-textOnDark/60">{model.family} • {model.parameters}</p>
                  </div>
                  <Badge variant={getStateVariant(model.state)} size="sm">
                    {model.state}
                  </Badge>
                </div>

                <p className="text-sm text-textOnDark/80 mb-4 flex-grow">
                  {model.description}
                </p>

                <div className="space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {model.badges?.map((badge) => (
                      <Badge 
                        key={badge} 
                        variant={getBadgeVariant(badge)} 
                        size="sm"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  {/* Model Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-textOnDark/60">Size:</span>
                      <p className="text-textOnDark font-medium">{model.size_mb} MB</p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Chunks:</span>
                      <p className="text-textOnDark font-medium">{model.chunks.length}</p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Version:</span>
                      <p className="text-textOnDark font-medium">{model.version}</p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">License:</span>
                      <p className="text-textOnDark font-medium">{model.license}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-accentGold/20">
                    <Button variant="primary" size="sm" className="flex-1">
                      View Details
                    </Button>
                    {model.state === 'Active' && (
                      <Button variant="outline" size="sm">
                        Use Model
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredModels.length === 0 && !loading && isWalletAvailable && (
        <Card className="text-center py-12">
          <p className="text-textOnDark/60 mb-4">No models found matching your criteria</p>
          <Button variant="ghost" onClick={() => {
            setSearchTerm('')
            setSelectedState('all')
            setSelectedBadge('all')
          }}>
            Clear Filters
          </Button>
        </Card>
      )}
    </div>
  )
}

export default ModelCatalog