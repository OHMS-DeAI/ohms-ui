import { useState } from 'react'
import { useMarketData, useMarketAnalytics } from '../hooks/useMarketData'
import Card from './Card'
import Button from './Button'
import Badge from './Badge'
import LoadingSpinner from './LoadingSpinner'

interface MarketDataDisplayProps {
  showDetailed?: boolean
  showControls?: boolean
  showHistory?: boolean
  onPriceUpdate?: (priceUSD: number) => void
  className?: string
}

const MarketDataDisplay: React.FC<MarketDataDisplayProps> = ({
  showDetailed = false,
  showControls = false,
  showHistory = false,
  onPriceUpdate,
  className = ''
}) => {
  const { 
    marketData, 
    isLoading, 
    error, 
    cacheStatus, 
    forceRefresh 
  } = useMarketData({
    onUpdate: onPriceUpdate ? (data) => onPriceUpdate(data.priceUSD) : undefined
  })
  
  const { priceHistory, statistics } = useMarketAnalytics()
  const [refreshing, setRefreshing] = useState(false)

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatPercentage = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    return `${sign}${percent.toFixed(2)}%`
  }
  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return formatCurrency(num)
  }

  const handleRefresh = async (sourceName?: string) => {
    try {
      setRefreshing(true)
      await forceRefresh(sourceName)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-textOnDark/60'
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return '📈'
    if (change < 0) return '📉'
    return '➡️'
  }

  if (error) {
    return (
      <Card className={`border-red-500/50 ${className}`}>
        <div className="text-center py-4">
          <p className="text-red-300 mb-2">⚠️ Market Data Error</p>
          <p className="text-sm text-red-400 mb-3">{error}</p>
          {showControls && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleRefresh()}
              loading={refreshing}
            >
              Retry
            </Button>
          )}
        </div>
      </Card>
    )
  }

  if (!marketData) {
    return (
      <Card className={`text-center py-6 ${className}`}>
        <LoadingSpinner size="md" />
        <p className="text-textOnDark/60 mt-2">Loading market data...</p>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Main Price Display */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🔷</div>
            <div>
              <h3 className="text-lg font-semibold text-accentGold">ICP Price</h3>
              <p className="text-xs text-textOnDark/60">Internet Computer Protocol</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-textOnDark">
              {formatCurrency(marketData.priceUSD)}
            </div>
            <div className={`text-sm ${getStatusColor(marketData.change24h)}`}>
              {getTrendIcon(marketData.change24h)} {formatPercentage(marketData.change24h)} 24h
            </div>
          </div>
        </div>

        {/* Data Source and Update Info */}
        <div className="flex items-center justify-between text-xs text-textOnDark/60">
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">{marketData.source}</Badge>
            <span>•</span>
            <span>Updated: {marketData.timestamp.toLocaleTimeString()}</span>
          </div>
          
          {cacheStatus.isCached && (
            <div className="text-textOnDark/40">
              Cache: {Math.floor(cacheStatus.cacheAge / 1000)}s old
            </div>
          )}
        </div>

        {/* Detailed Information */}
        {showDetailed && (
          <div className="mt-4 pt-4 border-t border-accentGold/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-textOnDark/60 mb-1">Market Cap</p>
                <p className="text-textOnDark font-medium">
                  {formatLargeNumber(marketData.marketCap)}
                </p>
              </div>
              <div>
                <p className="text-textOnDark/60 mb-1">24h Volume</p>
                <p className="text-textOnDark font-medium">
                  {formatLargeNumber(marketData.volume24h)}
                </p>
              </div>
              {marketData.change7d !== undefined && (
                <div>
                  <p className="text-textOnDark/60 mb-1">7d Change</p>
                  <p className={`font-medium ${getStatusColor(marketData.change7d)}`}>
                    {formatPercentage(marketData.change7d)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-textOnDark/60 mb-1">Data Points</p>
                <p className="text-textOnDark font-medium">{priceHistory.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="mt-4 pt-4 border-t border-accentGold/20">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRefresh()}
                  loading={refreshing || isLoading}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleRefresh('CoinGecko')}
                  disabled={refreshing || isLoading}
                >
                  CoinGecko
                </Button>
              </div>

              <div className="text-xs text-textOnDark/60">
                Next update: {Math.floor(cacheStatus.nextUpdate / 1000)}s
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Statistics Card */}
      {showDetailed && statistics && (
        <Card className="mt-4">
          <h4 className="text-lg font-semibold text-accentGold mb-3">Price Statistics</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-textOnDark/60 mb-1">Min Price</p>
              <p className="text-textOnDark font-medium">{formatCurrency(statistics.min)}</p>
            </div>
            <div>
              <p className="text-textOnDark/60 mb-1">Max Price</p>
              <p className="text-textOnDark font-medium">{formatCurrency(statistics.max)}</p>
            </div>
            <div>
              <p className="text-textOnDark/60 mb-1">Average</p>
              <p className="text-textOnDark font-medium">{formatCurrency(statistics.average)}</p>
            </div>
            <div>
              <p className="text-textOnDark/60 mb-1">Volatility</p>
              <p className="text-textOnDark font-medium">{formatCurrency(statistics.volatility)}</p>
            </div>
            <div>
              <p className="text-textOnDark/60 mb-1">Trend</p>
              <p className={`font-medium ${
                statistics.trend === 'up' ? 'text-green-400' : 
                statistics.trend === 'down' ? 'text-red-400' : 
                'text-textOnDark/60'
              }`}>
                {statistics.trend === 'up' ? '📈 Bullish' : 
                 statistics.trend === 'down' ? '📉 Bearish' : 
                 '➡️ Neutral'}
              </p>
            </div>
            <div>
              <p className="text-textOnDark/60 mb-1">Time Span</p>
              <p className="text-textOnDark font-medium">
                {statistics.timeSpan ? 
                  `${Math.floor((statistics.timeSpan.end.getTime() - statistics.timeSpan.start.getTime()) / (1000 * 60))} min` :
                  'N/A'
                }
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Price History */}
      {showHistory && priceHistory.length > 0 && (
        <Card className="mt-4">
          <h4 className="text-lg font-semibold text-accentGold mb-3">Recent Price History</h4>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {priceHistory.slice(-10).reverse().map((point, index) => (
              <div key={index} className="flex items-center justify-between text-sm py-2 border-b border-accentGold/10 last:border-b-0">
                <div className="flex items-center gap-3">
                  <Badge variant="info" size="sm">{point.source}</Badge>
                  <span className="text-textOnDark/60">
                    {point.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-textOnDark font-medium">
                    {formatCurrency(point.priceUSD)}
                  </span>
                  <span className={getStatusColor(point.change24h)}>
                    {formatPercentage(point.change24h)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default MarketDataDisplay