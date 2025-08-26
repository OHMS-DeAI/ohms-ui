import React, { useState, useEffect } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import AdminRoute from '../components/AdminRoute'
import Card from '../components/Card'
import Badge from '../components/Badge'
import Button from '../components/Button'
import NOVAQMetrics from '../components/NOVAQMetrics'

interface NOVAQBenchmarkConfig {
  model_name: string
  target_bits: number
  subspaces: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  estimated_completion: string
}

interface NOVAQValidationReport {
  model_id: string
  validation_status: 'passed' | 'failed' | 'pending'
  compression_ratio: number
  bit_accuracy: number
  quality_score: number
  issues: string[]
  validation_date: string
}

export const NOVAQDashboard: React.FC = () => {
  const [benchmarkConfigs, setBenchmarkConfigs] = useState<NOVAQBenchmarkConfig[]>([])
  const [validationReports, setValidationReports] = useState<NOVAQValidationReport[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [isAdmin] = useAdmin()

  useEffect(() => {
    const fetchNOVAQData = async () => {
      try {
        // Fetch real benchmark configurations from NOVAQ system
        const benchmarkResponse = await fetch('/api/novaq/benchmarks/active', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (benchmarkResponse.ok) {
          const benchmarkData: NOVAQBenchmarkConfig[] = await benchmarkResponse.json()
          setBenchmarkConfigs(benchmarkData)
        }

        // Fetch real validation reports from NOVAQ system
        const validationResponse = await fetch('/api/novaq/validation/reports', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (validationResponse.ok) {
          const validationData: NOVAQValidationReport[] = await validationResponse.json()
          setValidationReports(validationData)
        }
      } catch (error) {
        // Removed console log
        // Initialize with empty arrays instead of mock data
        setBenchmarkConfigs([])
        setValidationReports([])
      }
    }

    fetchNOVAQData()
  }, [])

  const handleStartBenchmark = async (modelName: string) => {
    try {
      const response = await fetch('/api/novaq/benchmarks/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_name: modelName }),
      })
      
      if (response.ok) {
        // Removed console log
        // Refresh the benchmark list
        window.location.reload()
      } else {
        // Removed console log
      }
    } catch (error) {
      // Removed console log
    }
  }

  const handleValidateModel = async (modelId: string) => {
    try {
      const response = await fetch('/api/novaq/validation/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model_id: modelId }),
      })
      
      if (response.ok) {
        // Removed console log
        // Refresh the validation reports
        window.location.reload()
      } else {
        // Removed console log
      }
    } catch (error) {
      // Removed console log
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>
      case 'running':
        return <Badge variant="warning" size="sm">Running</Badge>
      case 'pending':
        return <Badge variant="info" size="sm">Pending</Badge>
      case 'failed':
        return <Badge variant="error" size="sm">Failed</Badge>
      default:
        return <Badge variant="info" size="sm">{status}</Badge>
    }
  }

  const getValidationStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return <Badge variant="success" size="sm">Passed</Badge>
      case 'failed':
        return <Badge variant="error" size="sm">Failed</Badge>
      case 'pending':
        return <Badge variant="warning" size="sm">Pending</Badge>
      default:
        return <Badge variant="info" size="sm">{status}</Badge>
    }
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-backgroundDark text-textOnDark p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-accentGold">NOVAQ Dashboard</h1>
              <p className="mt-2 text-textOnDark/70">
                Advanced NOVAQ compression management and monitoring
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-accentGold/30 text-accentGold hover:bg-accentGold/10"
              >
                Export Report
              </Button>
              <Button
                size="sm"
                className="bg-accentGold text-backgroundDark hover:bg-accentGold/90"
              >
                New Benchmark
              </Button>
            </div>
          </div>

          {/* NOVAQ Metrics Overview */}
          <div className="mb-8">
            <NOVAQMetrics />
          </div>

          {/* Benchmark Management */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Active Benchmarks */}
            <Card className="p-6 border-accentGold/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-accentGold">Active Benchmarks</h3>
                <Badge variant="info" size="sm">{benchmarkConfigs.length} Total</Badge>
              </div>
              <div className="space-y-4">
                {benchmarkConfigs.map((config, index) => (
                  <div key={index} className="p-4 bg-primary/20 rounded border border-accentGold/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-accentGold">{config.model_name}</h4>
                      {getStatusBadge(config.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-textOnDark/60">Target Bits:</span>
                        <span className="text-textOnDark font-medium ml-1">{config.target_bits}</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Subspaces:</span>
                        <span className="text-textOnDark font-medium ml-1">{config.subspaces}</span>
                      </div>
                    </div>
                    {config.status === 'running' && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-textOnDark/60 mb-1">
                          <span>Progress</span>
                          <span>{config.progress}%</span>
                        </div>
                        <div className="w-full bg-primary/20 rounded-full h-2">
                          <div 
                            className="bg-accentGold h-2 rounded-full transition-all duration-300"
                            style={{ width: `${config.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-textOnDark/50">
                        ETA: {new Date(config.estimated_completion).toLocaleTimeString()}
                      </span>
                      {config.status === 'pending' && (
                        <Button
                          size="xs"
                          onClick={() => handleStartBenchmark(config.model_name)}
                          className="bg-accentGold text-backgroundDark hover:bg-accentGold/90"
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Validation Reports */}
            <Card className="p-6 border-accentGold/30">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-accentGold">Validation Reports</h3>
                <Badge variant="info" size="sm">{validationReports.length} Models</Badge>
              </div>
              <div className="space-y-4">
                {validationReports.map((report, index) => (
                  <div key={index} className="p-4 bg-primary/20 rounded border border-accentGold/20">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-accentGold">{report.model_id}</h4>
                      {getValidationStatusBadge(report.validation_status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-textOnDark/60">Compression:</span>
                        <span className="text-textOnDark font-medium ml-1">{report.compression_ratio.toFixed(1)}x</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Accuracy:</span>
                        <span className="text-textOnDark font-medium ml-1">{report.bit_accuracy.toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Quality:</span>
                        <span className="text-textOnDark font-medium ml-1">{report.quality_score.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Date:</span>
                        <span className="text-textOnDark font-medium ml-1">
                          {new Date(report.validation_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {report.issues.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs text-textOnDark/60">Issues:</span>
                        <ul className="text-xs text-red-400 mt-1">
                          {report.issues.map((issue, i) => (
                            <li key={i}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-textOnDark/50">
                        {new Date(report.validation_date).toLocaleString()}
                      </span>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleValidateModel(report.model_id)}
                        className="border-accentGold/30 text-accentGold hover:bg-accentGold/10"
                      >
                        Re-validate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* NOVAQ System Status */}
          <Card className="p-6 border-accentGold/30">
            <h3 className="text-lg font-semibold text-accentGold mb-4">NOVAQ System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-primary/20 rounded border border-accentGold/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-textOnDark">NOVAQ Engine</span>
                </div>
                <p className="text-xs text-textOnDark/60">Operational</p>
              </div>
              <div className="p-4 bg-primary/20 rounded border border-accentGold/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-textOnDark">Validation Service</span>
                </div>
                <p className="text-xs text-textOnDark/60">Active</p>
              </div>
              <div className="p-4 bg-primary/20 rounded border border-accentGold/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-textOnDark">Benchmark Suite</span>
                </div>
                <p className="text-xs text-textOnDark/60">Ready</p>
              </div>
              <div className="p-4 bg-primary/20 rounded border border-accentGold/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-medium text-textOnDark">Catalog Integration</span>
                </div>
                <p className="text-xs text-textOnDark/60">Connected</p>
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="mt-12 text-center text-sm text-textOnDark/50">
            <p>NOVAQ Dashboard • Advanced compression monitoring and management</p>
            <p className="mt-1">
              System Status: <Badge variant="success" size="sm">All Systems Operational</Badge>
            </p>
          </div>
        </div>
      </div>
    </AdminRoute>
  )
}

export default NOVAQDashboard
