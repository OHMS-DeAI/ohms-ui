import { useState, useEffect, useCallback } from 'react'
import { marketDataService, type MarketDataPoint } from '../services/marketDataService'

interface UseMarketDataReturn {
  marketData: MarketDataPoint | null
  priceHistory: MarketDataPoint[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
  source: string | null
  cacheStatus: {
    isCached: boolean
    cacheAge: number
    nextUpdate: number
  }
  // Actions
  forceRefresh: (sourceName?: string) => Promise<void>
  convertUSDToICP: (usdAmount: number) => {
    amountICP: number
    conversionRate: number
    lastUpdated: Date | null
    source: string
  }
  convertICPToUSD: (icpAmount: number) => {
    amountUSD: number
    conversionRate: number
    lastUpdated: Date | null
    source: string
  }
}

interface UseMarketDataOptions {
  autoRefresh?: boolean
  onUpdate?: (data: MarketDataPoint) => void
  onError?: (error: string) => void
}

/**
 * React hook for accessing real-time market data
 * 
 * Features:
 * - Automatic subscription to market data updates
 * - Loading states and error handling
 * - Conversion utilities
 * - Cache status information
 * - Manual refresh capabilities
 */
export const useMarketData = (options: UseMarketDataOptions = {}): UseMarketDataReturn => {
  const { autoRefresh = true, onUpdate, onError } = options
  
  const [marketData, setMarketData] = useState<MarketDataPoint | null>(
    marketDataService.getCurrentPrice()
  )
  const [priceHistory, setPriceHistory] = useState<MarketDataPoint[]>(
    marketDataService.getPriceHistory()
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Subscribe to market data updates
  useEffect(() => {
    const unsubscribe = marketDataService.subscribe((data: MarketDataPoint) => {
      setMarketData(data)
      setPriceHistory(marketDataService.getPriceHistory())
      setError(null)
      
      if (onUpdate) {
        onUpdate(data)
      }
    })

    return unsubscribe
  }, [onUpdate])

  // Force refresh function
  const forceRefresh = useCallback(async (sourceName?: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await marketDataService.forceRefresh(sourceName)
      if (!result) {
        throw new Error('Failed to refresh market data')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh market data'
      setError(errorMessage)
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }, [onError])

  // Conversion functions
  const convertUSDToICP = useCallback((usdAmount: number) => {
    return marketDataService.convertUSDToICP(usdAmount)
  }, [])

  const convertICPToUSD = useCallback((icpAmount: number) => {
    return marketDataService.convertICPToUSD(icpAmount)
  }, [])

  // Get cache status
  const cacheStatus = marketDataService.getCacheStatus()

  return {
    marketData,
    priceHistory,
    isLoading,
    error,
    lastUpdated: marketData?.timestamp || null,
    source: marketData?.source || null,
    cacheStatus,
    forceRefresh,
    convertUSDToICP,
    convertICPToUSD
  }
}

/**
 * Hook for simple price conversion without subscribing to updates
 */
export const useMarketConversion = () => {
  const convertUSDToICP = useCallback((usdAmount: number) => {
    return marketDataService.convertUSDToICP(usdAmount)
  }, [])

  const convertICPToUSD = useCallback((icpAmount: number) => {
    return marketDataService.convertICPToUSD(icpAmount)
  }, [])

  const getCurrentPrice = useCallback(() => {
    return marketDataService.getCurrentPrice()
  }, [])

  return {
    convertUSDToICP,
    convertICPToUSD,
    getCurrentPrice
  }
}

/**
 * Hook for market data statistics and analytics
 */
export const useMarketAnalytics = () => {
  const [priceHistory, setPriceHistory] = useState<MarketDataPoint[]>(
    marketDataService.getPriceHistory()
  )

  useEffect(() => {
    const unsubscribe = marketDataService.subscribe(() => {
      setPriceHistory(marketDataService.getPriceHistory())
    })

    return unsubscribe
  }, [])

  const getStatistics = useCallback(() => {
    if (priceHistory.length === 0) {
      return null
    }

    const prices = priceHistory.map(p => p.priceUSD)
    const recent = priceHistory.slice(-10) // Last 10 data points
    
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const average = prices.reduce((a, b) => a + b, 0) / prices.length
    const current = prices[prices.length - 1]
    
    // Calculate volatility (standard deviation)
    const variance = prices.reduce((acc, price) => acc + Math.pow(price - average, 2), 0) / prices.length
    const volatility = Math.sqrt(variance)
    
    // Trend analysis (simple moving average)
    const trend = recent.length >= 5 ? (
      recent.slice(-5).reduce((a, b) => a + b.priceUSD, 0) / 5 >
      recent.slice(-10, -5).reduce((a, b) => a + b.priceUSD, 0) / 5 ? 'up' : 'down'
    ) : 'neutral'

    return {
      min,
      max,
      average,
      current,
      volatility,
      trend,
      dataPoints: priceHistory.length,
      timeSpan: priceHistory.length > 0 ? {
        start: priceHistory[0].timestamp,
        end: priceHistory[priceHistory.length - 1].timestamp
      } : null
    }
  }, [priceHistory])

  return {
    priceHistory,
    statistics: getStatistics()
  }
}

export default useMarketData