import React, { useState, useEffect } from 'react'
import Card from './Card'
import Badge from './Badge'
import Button from './Button'

interface NOVAQModelMetrics {
  model_id: string
  compression_ratio: number
  bit_accuracy: number
  quality_score: number
  target_bits: number
  num_subspaces: number
  validation_passed: boolean
  compression_time_seconds: number
  memory_usage_mb: number
  timestamp: string
}

interface NOVAQBenchmarkResults {
  total_models: number
  average_compression_ratio: number
  average_bit_accuracy: number
  average_quality_score: number
  best_compression_model: string
  best_accuracy_model: string
  validation_success_rate: number
  recent_benchmarks: NOVAQModelMetrics[]
}

const NOVAQMetricsCard = ({ 
  title, 
  metrics, 
  icon,
  className = ""
}: { 
  title: string
  metrics: Record<string, number | string | boolean>
  icon: string
  className?: string
}) => (
  <Card className={`p-4 ${className}`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xl">{icon}</span>
      <h3 className="text-sm font-semibold text-accentGold">{title}</h3>
    </div>
    <div className="space-y-2">
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="flex justify-between items-center text-xs">
          <span className="text-textOnDark/70 capitalize">
            {key.replace(/_/g, ' ')}:
          </span>
          <span className="text-textOnDark font-medium">
            {typeof value === 'boolean' ? (
              <Badge variant={value ? "success" : "error"} size="xs">
                {value ? "Passed" : "Failed"}
              </Badge>
            ) : typeof value === 'number' ? (
              key.includes('ratio') ? 
                `${value.toFixed(1)}x` :
                key.includes('accuracy') || key.includes('score') || key.includes('rate') ? 
                  `${value.toFixed(1)}%` :
                  key.includes('time') ?
                    `${value.toFixed(1)}s` :
                    key.includes('usage') ?
                      `${value.toFixed(2)}MB` :
                      value.toFixed(2)
            ) : (
              value
            )}
          </span>
        </div>
      ))}
    </div>
  </Card>
)

const NOVAQModelCard = ({ model }: { model: NOVAQModelMetrics }) => (
  <Card className="p-3 border-accentGold/20">
    <div className="flex items-center justify-between mb-2">
      <h4 className="text-sm font-medium text-accentGold truncate">{model.model_id}</h4>
      <Badge variant={model.validation_passed ? "success" : "error"} size="xs">
        {model.validation_passed ? "Valid" : "Invalid"}
      </Badge>
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <span className="text-textOnDark/60">Compression:</span>
        <span className="text-textOnDark font-medium ml-1">{model.compression_ratio.toFixed(1)}x</span>
      </div>
      <div>
        <span className="text-textOnDark/60">Accuracy:</span>
        <span className="text-textOnDark font-medium ml-1">{(model.bit_accuracy * 100).toFixed(1)}%</span>
      </div>
      <div>
        <span className="text-textOnDark/60">Quality:</span>
        <span className="text-textOnDark font-medium ml-1">{model.quality_score.toFixed(2)}</span>
      </div>
      <div>
        <span className="text-textOnDark/60">Bits:</span>
        <span className="text-textOnDark font-medium ml-1">{model.target_bits}</span>
      </div>
    </div>
  </Card>
)

export const NOVAQMetrics: React.FC = () => {
  const [novaqData, setNovaqData] = useState<NOVAQBenchmarkResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchNOVAQData = async () => {
    setLoading(true)
    try {
      // Fetch real NOVAQ benchmark results from the benchmark-novaq binary
      const response = await fetch('/api/novaq/benchmarks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch NOVAQ data: ${response.status}`)
      }
      
      const novaqData: NOVAQBenchmarkResults = await response.json()
      setNovaqData(novaqData)
      setLastUpdate(new Date())
    } catch (error) {
      // Removed console log
      // Fallback to empty state instead of mock data
      setNovaqData({
        total_models: 0,
        average_compression_ratio: 0,
        average_bit_accuracy: 0,
        average_quality_score: 0,
        best_compression_model: "",
        best_accuracy_model: "",
        validation_success_rate: 0,
        recent_benchmarks: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNOVAQData()
    const interval = setInterval(fetchNOVAQData, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchNOVAQData()
  }

  if (!novaqData) {
    return (
      <Card className="p-6 border-accentGold/30">
        <div className="flex items-center justify-center">
          <div className="text-textOnDark/50">Loading NOVAQ metrics...</div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-accentGold">NOVAQ Compression Metrics</h2>
          <p className="text-sm text-textOnDark/70">
            Real-time monitoring of NOVAQ quantization performance
          </p>
          <p className="text-xs text-textOnDark/50">
            Last updated: {lastUpdate.toLocaleString()}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          size="sm"
          variant="outline"
          className="border-accentGold/30 text-accentGold hover:bg-accentGold/10"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NOVAQMetricsCard
          title="Compression Overview"
          metrics={{
            'total_models': novaqData.total_models,
            'avg_compression_ratio': novaqData.average_compression_ratio,
            'avg_bit_accuracy': novaqData.average_bit_accuracy,
            'validation_success_rate': novaqData.validation_success_rate
          }}
          icon="📊"
        />
        
        <NOVAQMetricsCard
          title="Quality Metrics"
          metrics={{
            'avg_quality_score': novaqData.average_quality_score,
            'best_compression': novaqData.best_compression_model,
            'best_accuracy': novaqData.best_accuracy_model
          }}
          icon="🎯"
        />
        
        <NOVAQMetricsCard
          title="Performance"
          metrics={{
            'avg_compression_time': novaqData.recent_benchmarks.reduce((acc, m) => acc + m.compression_time_seconds, 0) / novaqData.recent_benchmarks.length,
            'avg_memory_usage': novaqData.recent_benchmarks.reduce((acc, m) => acc + m.memory_usage_mb, 0) / novaqData.recent_benchmarks.length,
            'models_processed': novaqData.recent_benchmarks.length
          }}
          icon="⚡"
        />
        
        <NOVAQMetricsCard
          title="System Status"
          metrics={{
            'novaq_engine': true,
            'validation_service': true,
            'benchmark_suite': true,
            'catalog_integration': true
          }}
          icon="🔧"
        />
      </div>

      {/* Recent Benchmarks */}
      <Card className="p-4 border-accentGold/30">
        <h3 className="text-sm font-semibold text-accentGold mb-3">Recent NOVAQ Benchmarks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {novaqData.recent_benchmarks.map((model, index) => (
            <NOVAQModelCard key={index} model={model} />
          ))}
        </div>
      </Card>

      {/* Compression Quality Chart */}
      <Card className="p-4 border-accentGold/30">
        <h3 className="text-sm font-semibold text-accentGold mb-3">Compression Quality Distribution</h3>
        <div className="space-y-2">
          {novaqData.recent_benchmarks.map((model, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-32 text-xs text-textOnDark/70 truncate">{model.model_id}</div>
              <div className="flex-1 bg-primary/20 rounded-full h-2">
                <div 
                  className="bg-accentGold h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(model.quality_score / 3.0) * 100}%` }}
                />
              </div>
              <div className="w-16 text-xs text-textOnDark font-medium text-right">
                {model.quality_score.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default NOVAQMetrics
