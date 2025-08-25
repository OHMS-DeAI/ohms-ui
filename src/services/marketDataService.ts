/**
 * Comprehensive Market Data Service for Real-time ICP/USD Conversion
 * 
 * Features:
 * - Multiple API sources with fallback mechanisms
 * - Rate limiting and request queuing
 * - Intelligent caching with TTL
 * - Automatic refresh intervals
 * - Error handling and recovery
 * - Historical data tracking
 */

export interface MarketDataPoint {
  priceUSD: number
  timestamp: Date
  change24h: number
  change7d?: number
  marketCap: number
  volume24h: number
  source: string
}

export interface MarketDataConfig {
  refreshInterval: number // milliseconds
  cacheTimeout: number // milliseconds
  maxRetries: number
  rateLimitDelay: number // milliseconds between requests
  fallbackPrice: number // USD fallback price
}

export interface ApiEndpoint {
  name: string
  url: string
  parser: (data: any) => MarketDataPoint
  rateLimit: number // requests per minute
  priority: number // lower = higher priority
}

/**
 * Rate limiter for API requests
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private delays: Map<string, number> = new Map()

  canMakeRequest(endpoint: string, maxRequests: number): boolean {
    const now = Date.now()
    const requests = this.requests.get(endpoint) || []
    
    // Clean old requests (older than 1 minute)
    const recentRequests = requests.filter(time => now - time < 60000)
    this.requests.set(endpoint, recentRequests)
    
    return recentRequests.length < maxRequests
  }

  recordRequest(endpoint: string): void {
    const requests = this.requests.get(endpoint) || []
    requests.push(Date.now())
    this.requests.set(endpoint, requests)
  }

  getDelay(endpoint: string): number {
    return this.delays.get(endpoint) || 0
  }

  setDelay(endpoint: string, delay: number): void {
    this.delays.set(endpoint, delay)
  }
}

/**
 * Market Data Service with multiple sources and fallbacks
 */
export class MarketDataService {
  private config: MarketDataConfig
  private rateLimiter: RateLimiter
  private cache: { data: MarketDataPoint; timestamp: number } | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private currentPrice: MarketDataPoint | null = null
  private priceHistory: MarketDataPoint[] = []
  private listeners: Array<(data: MarketDataPoint) => void> = []
  private isUpdating = false

  // API endpoints in priority order
  private endpoints: ApiEndpoint[] = [
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_7d_change=true',
      rateLimit: 30, // 30 requests per minute for free tier
      priority: 1,
      parser: (data: any) => {
        const icp = data['internet-computer']
        if (!icp || typeof icp.usd !== 'number') {
          throw new Error('Invalid CoinGecko response')
        }
        return {
          priceUSD: icp.usd,
          timestamp: new Date(),
          change24h: icp.usd_24h_change || 0,
          change7d: icp.usd_7d_change || 0,
          marketCap: icp.usd_market_cap || 0,
          volume24h: icp.usd_24h_vol || 0,
          source: 'CoinGecko'
        }
      }
    },
    {
      name: 'CoinMarketCap',
      url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ICP&convert=USD',
      rateLimit: 333, // Basic plan limit
      priority: 2,
      parser: (data: any) => {
        const icp = data.data?.ICP?.[0]
        if (!icp || typeof icp.quote?.USD?.price !== 'number') {
          throw new Error('Invalid CoinMarketCap response')
        }
        const quote = icp.quote.USD
        return {
          priceUSD: quote.price,
          timestamp: new Date(quote.last_updated),
          change24h: quote.percent_change_24h || 0,
          change7d: quote.percent_change_7d || 0,
          marketCap: quote.market_cap || 0,
          volume24h: quote.volume_24h || 0,
          source: 'CoinMarketCap'
        }
      }
    },
    {
      name: 'CryptoCompare',
      url: 'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ICP&tsyms=USD',
      rateLimit: 100, // Free tier limit
      priority: 3,
      parser: (data: any) => {
        const raw = data.RAW?.ICP?.USD
        if (!raw || typeof raw.PRICE !== 'number') {
          throw new Error('Invalid CryptoCompare response')
        }
        return {
          priceUSD: raw.PRICE,
          timestamp: new Date(raw.LASTUPDATE * 1000),
          change24h: raw.CHANGEPCT24HOUR || 0,
          change7d: 0, // Not available in free tier
          marketCap: raw.MKTCAP || 0,
          volume24h: raw.TOTALVOLUME24HTO || 0,
          source: 'CryptoCompare'
        }
      }
    },
    {
      name: 'Fallback',
      url: '',
      rateLimit: Infinity,
      priority: 999,
      parser: () => ({
        priceUSD: this.config.fallbackPrice,
        timestamp: new Date(),
        change24h: 0,
        change7d: 0,
        marketCap: 0,
        volume24h: 0,
        source: 'Fallback'
      })
    }
  ]

  constructor(config: Partial<MarketDataConfig> = {}) {
    this.config = {
      refreshInterval: 2 * 60 * 1000, // 2 minutes
      cacheTimeout: 2 * 60 * 1000, // 2 minutes
      maxRetries: 3,
      rateLimitDelay: 1000, // 1 second
      fallbackPrice: 10.0, // $10 USD fallback
      ...config
    }
    
    this.rateLimiter = new RateLimiter()
    
    // Initialize with cached data or start first fetch
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      // Try to load from localStorage
      const cached = this.loadFromStorage()
      if (cached) {
        this.currentPrice = cached
        this.cache = { data: cached, timestamp: Date.now() }
        this.notifyListeners(cached)
      }

      // Start automatic refresh
      this.startAutoRefresh()
      
      // Fetch fresh data
      await this.updateMarketData()
    } catch (error) {
      console.error('Failed to initialize market data service:', error)
    }
  }

  /**
   * Start automatic refresh interval
   */
  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }

    this.refreshTimer = setInterval(async () => {
      try {
        await this.updateMarketData()
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      }
    }, this.config.refreshInterval)
  }

  /**
   * Stop automatic refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  /**
   * Update market data from APIs with fallback logic
   */
  async updateMarketData(force = false): Promise<MarketDataPoint | null> {
    // Prevent concurrent updates
    if (this.isUpdating && !force) {
      return this.currentPrice
    }

    // Check cache first (unless forced)
    if (!force && this.cache && Date.now() - this.cache.timestamp < this.config.cacheTimeout) {
      return this.cache.data
    }

    this.isUpdating = true

    try {
      console.log('🔄 Updating ICP market data...')
      
      // Try endpoints in priority order
      for (const endpoint of this.endpoints.sort((a, b) => a.priority - b.priority)) {
        try {
          const data = await this.fetchFromEndpoint(endpoint)
          if (data) {
            this.updateCache(data)
            this.saveToStorage(data)
            this.addToHistory(data)
            this.notifyListeners(data)
            
            console.log('✅ Market data updated:', {
              price: data.priceUSD,
              change24h: data.change24h.toFixed(2) + '%',
              source: data.source,
              timestamp: data.timestamp.toISOString()
            })
            
            return data
          }
        } catch (error) {
          console.warn(`Failed to fetch from ${endpoint.name}:`, error)
          continue
        }
      }

      // If all endpoints fail, use fallback
      console.warn('⚠️ All market data sources failed, using fallback price')
      const fallback = this.endpoints.find(e => e.name === 'Fallback')!
      const fallbackData = fallback.parser({})
      
      this.updateCache(fallbackData)
      this.notifyListeners(fallbackData)
      return fallbackData

    } finally {
      this.isUpdating = false
    }
  }

  /**
   * Fetch data from a specific endpoint
   */
  private async fetchFromEndpoint(endpoint: ApiEndpoint): Promise<MarketDataPoint | null> {
    // Skip fallback endpoint in normal fetch
    if (endpoint.name === 'Fallback') {
      return endpoint.parser({})
    }

    // Check rate limiting
    if (!this.rateLimiter.canMakeRequest(endpoint.name, endpoint.rateLimit)) {
      const delay = this.rateLimiter.getDelay(endpoint.name)
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw new Error(`Rate limit exceeded for ${endpoint.name}`)
      }
    }

    // Add request delay
    await new Promise(resolve => setTimeout(resolve, this.config.rateLimitDelay))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OHMS-2.0-Market-Data-Service'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      this.rateLimiter.recordRequest(endpoint.name)
      
      return endpoint.parser(data)
    } catch (error) {
      clearTimeout(timeoutId)
      
      // Set delay for rate limited endpoints
      if (error instanceof Error && error.message.includes('rate limit')) {
        this.rateLimiter.setDelay(endpoint.name, 60000) // 1 minute delay
      }
      
      throw error
    }
  }

  /**
   * Update internal cache
   */
  private updateCache(data: MarketDataPoint): void {
    this.currentPrice = data
    this.cache = {
      data,
      timestamp: Date.now()
    }
  }

  /**
   * Add to price history (keep last 100 points)
   */
  private addToHistory(data: MarketDataPoint): void {
    this.priceHistory.push(data)
    if (this.priceHistory.length > 100) {
      this.priceHistory = this.priceHistory.slice(-100)
    }
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(data: MarketDataPoint): void {
    try {
      localStorage.setItem('ohms-market-data', JSON.stringify({
        ...data,
        timestamp: data.timestamp.toISOString()
      }))
    } catch (error) {
      console.warn('Failed to save market data to storage:', error)
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): MarketDataPoint | null {
    try {
      const stored = localStorage.getItem('ohms-market-data')
      if (!stored) return null

      const data = JSON.parse(stored)
      return {
        ...data,
        timestamp: new Date(data.timestamp)
      }
    } catch (error) {
      console.warn('Failed to load market data from storage:', error)
      return null
    }
  }

  /**
   * Notify all listeners of data updates
   */
  private notifyListeners(data: MarketDataPoint): void {
    this.listeners.forEach(listener => {
      try {
        listener(data)
      } catch (error) {
        console.error('Market data listener error:', error)
      }
    })
  }

  /**
   * Subscribe to market data updates
   */
  subscribe(listener: (data: MarketDataPoint) => void): () => void {
    this.listeners.push(listener)
    
    // Send current data immediately if available
    if (this.currentPrice) {
      listener(this.currentPrice)
    }
    
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Get current market data
   */
  getCurrentPrice(): MarketDataPoint | null {
    return this.currentPrice
  }

  /**
   * Get price history
   */
  getPriceHistory(): MarketDataPoint[] {
    return [...this.priceHistory]
  }

  /**
   * Convert USD to ICP
   */
  convertUSDToICP(usdAmount: number): {
    amountICP: number
    conversionRate: number
    lastUpdated: Date | null
    source: string
  } {
    if (!this.currentPrice) {
      return {
        amountICP: usdAmount / this.config.fallbackPrice,
        conversionRate: this.config.fallbackPrice,
        lastUpdated: null,
        source: 'Fallback'
      }
    }

    return {
      amountICP: usdAmount / this.currentPrice.priceUSD,
      conversionRate: this.currentPrice.priceUSD,
      lastUpdated: this.currentPrice.timestamp,
      source: this.currentPrice.source
    }
  }

  /**
   * Convert ICP to USD
   */
  convertICPToUSD(icpAmount: number): {
    amountUSD: number
    conversionRate: number
    lastUpdated: Date | null
    source: string
  } {
    if (!this.currentPrice) {
      return {
        amountUSD: icpAmount * this.config.fallbackPrice,
        conversionRate: this.config.fallbackPrice,
        lastUpdated: null,
        source: 'Fallback'
      }
    }

    return {
      amountUSD: icpAmount * this.currentPrice.priceUSD,
      conversionRate: this.currentPrice.priceUSD,
      lastUpdated: this.currentPrice.timestamp,
      source: this.currentPrice.source
    }
  }

  /**
   * Get cache status
   */
  getCacheStatus(): {
    isCached: boolean
    cacheAge: number
    nextUpdate: number
  } {
    const now = Date.now()
    const cacheAge = this.cache ? now - this.cache.timestamp : 0
    const nextUpdate = this.config.refreshInterval - (cacheAge % this.config.refreshInterval)
    
    return {
      isCached: !!this.cache && cacheAge < this.config.cacheTimeout,
      cacheAge,
      nextUpdate
    }
  }

  /**
   * Force refresh from specific source
   */
  async forceRefresh(sourceName?: string): Promise<MarketDataPoint | null> {
    if (sourceName) {
      const endpoint = this.endpoints.find(e => e.name === sourceName)
      if (endpoint) {
        try {
          return await this.fetchFromEndpoint(endpoint)
        } catch (error) {
          console.error(`Failed to refresh from ${sourceName}:`, error)
          return null
        }
      }
    }
    
    return await this.updateMarketData(true)
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopAutoRefresh()
    this.listeners = []
    this.cache = null
    this.currentPrice = null
    this.priceHistory = []
  }
}

/**
 * Singleton market data service instance
 */
export const marketDataService = new MarketDataService({
  refreshInterval: 2 * 60 * 1000, // 2 minutes
  cacheTimeout: 2 * 60 * 1000, // 2 minutes
  maxRetries: 3,
  rateLimitDelay: 1000, // 1 second between requests
  fallbackPrice: 10.0 // $10 USD fallback
})

export default marketDataService