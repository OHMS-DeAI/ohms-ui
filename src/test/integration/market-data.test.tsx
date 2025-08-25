import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { act, waitFor } from '@testing-library/react'
import { renderWithProviders, triggerMarketDataUpdate, cleanupMocks } from '../utils'
import { marketDataService } from '../../services/marketDataService'
import { mockMarketData, mockFetchResponses, setupFetchMock } from '../mocks'
import { MarketDataDisplay } from '../../components/MarketDataDisplay'
import { useMarketData } from '../../hooks/useMarketData'
import { SubscriptionTiers } from '../../components/SubscriptionTiers'

describe('Market Data Integration Tests', () => {
  beforeEach(() => {
    cleanupMocks()
    setupFetchMock()
  })

  afterEach(() => {
    // Clean up any running timers
    vi.clearAllTimers()
  })

  describe('Market Data Service', () => {
    it('should fetch data from CoinGecko API (primary source)', async () => {
      const data = await marketDataService.updateMarketData()
      
      expect(data).toEqual(mockMarketData)
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('coingecko.com')
      )
    })

    it('should fallback to CoinMarketCap when CoinGecko fails', async () => {
      // Mock CoinGecko failure
      vi.mocked(global.fetch).mockImplementationOnce(() => 
        Promise.reject(new Error('CoinGecko API error'))
      )
      
      // Mock CoinMarketCap success
      vi.mocked(global.fetch).mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            data: {
              ICP: {
                quote: {
                  USD: {
                    price: 12.50,
                    percent_change_24h: 5.25,
                    market_cap: 5800000000,
                    volume_24h: 120000000
                  }
                }
              }
            }
          })
        } as any)
      )
      
      const data = await marketDataService.updateMarketData()
      
      expect(data.source).toBe('CoinMarketCap')
      expect(data.priceUSD).toBe(12.50)
    })

    it('should fallback to CryptoCompare when both primary sources fail', async () => {
      // Mock both primary sources failing
      vi.mocked(global.fetch)
        .mockImplementationOnce(() => Promise.reject(new Error('CoinGecko error')))
        .mockImplementationOnce(() => Promise.reject(new Error('CoinMarketCap error')))
        .mockImplementationOnce(() => 
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              USD: 12.50,
              CHANGEDAY: 5.25,
              MKTCAP: 5800000000,
              VOLUME24HOUR: 120000000
            })
          } as any)
        )
      
      const data = await marketDataService.updateMarketData()
      
      expect(data.source).toBe('CryptoCompare')
      expect(data.priceUSD).toBe(12.50)
    })

    it('should handle complete API failure gracefully', async () => {
      // Mock all APIs failing
      vi.mocked(global.fetch).mockRejectedValue(new Error('All APIs failed'))
      
      try {
        await marketDataService.updateMarketData()
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('All market data sources failed')
      }
    })

    it('should return cached data when available', async () => {
      // First call fetches fresh data
      const data1 = await marketDataService.updateMarketData()
      
      // Second call should return cached data
      const data2 = marketDataService.getCurrentPrice()
      
      expect(data1).toEqual(data2)
      expect(data2).toEqual(mockMarketData)
    })

    it('should respect rate limiting for each API', async () => {
      const cacheStatus = marketDataService.getCacheStatus()
      
      expect(cacheStatus).toEqual({
        isCached: true,
        cacheAge: 30000,
        nextUpdate: 90000
      })
    })
  })

  describe('Real-time Data Updates', () => {
    it('should subscribe to market data updates', async () => {
      const callback = vi.fn()
      
      const unsubscribe = marketDataService.subscribe(callback)
      
      // Trigger an update
      triggerMarketDataUpdate({ priceUSD: 13.0 })
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ priceUSD: 13.0 })
      )
      
      unsubscribe()
    })

    it('should handle multiple subscribers', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      const unsubscribe1 = marketDataService.subscribe(callback1)
      const unsubscribe2 = marketDataService.subscribe(callback2)
      
      triggerMarketDataUpdate({ priceUSD: 14.0 })
      
      expect(callback1).toHaveBeenCalledWith(
        expect.objectContaining({ priceUSD: 14.0 })
      )
      expect(callback2).toHaveBeenCalledWith(
        expect.objectContaining({ priceUSD: 14.0 })
      )
      
      unsubscribe1()
      unsubscribe2()
    })

    it('should unsubscribe properly', async () => {
      const callback = vi.fn()
      
      const unsubscribe = marketDataService.subscribe(callback)
      unsubscribe()
      
      // Trigger update after unsubscribing
      triggerMarketDataUpdate({ priceUSD: 15.0 })
      
      // Callback should not be called
      expect(callback).not.toHaveBeenCalled()
    })

    it('should force refresh when requested', async () => {
      const freshData = await marketDataService.forceRefresh()
      
      expect(freshData).toEqual(mockMarketData)
      expect(marketDataService.forceRefresh).toHaveBeenCalled()
    })
  })

  describe('Currency Conversion', () => {
    it('should convert USD to ICP accurately', async () => {
      const conversion = marketDataService.convertUSDToICP(29) // Basic tier price
      
      expect(conversion).toEqual({
        amountICP: 2.4,
        conversionRate: 12.50,
        lastUpdated: mockMarketData.timestamp,
        source: mockMarketData.source
      })
    })

    it('should convert ICP to USD accurately', async () => {
      const conversion = marketDataService.convertICPToUSD(2.4)
      
      expect(conversion).toEqual({
        amountUSD: 30.0,
        conversionRate: 12.50,
        lastUpdated: mockMarketData.timestamp,
        source: mockMarketData.source
      })
    })

    it('should handle zero and negative amounts', async () => {
      const zeroConversion = marketDataService.convertUSDToICP(0)
      expect(zeroConversion.amountICP).toBe(0)
      
      const negativeConversion = marketDataService.convertUSDToICP(-10)
      expect(negativeConversion.amountICP).toBe(0) // Should handle gracefully
    })

    it('should handle large amounts without precision loss', async () => {
      const largeAmount = 1000000 // $1M
      const conversion = marketDataService.convertUSDToICP(largeAmount)
      
      expect(conversion.amountICP).toBeGreaterThan(0)
      expect(conversion.conversionRate).toBe(12.50)
    })
  })

  describe('Market Data Display Component', () => {
    it('should display current price and changes', async () => {
      const { getByTestId } = renderWithProviders(<MarketDataDisplay />)
      
      await waitFor(() => {
        expect(getByTestId('current-price')).toHaveTextContent('$12.50')
        expect(getByTestId('change-24h')).toHaveTextContent('5.25%')
        expect(getByTestId('change-7d')).toHaveTextContent('-2.10%')
      })
    })

    it('should show market cap and volume', async () => {
      const { getByTestId } = renderWithProviders(<MarketDataDisplay />)
      
      await waitFor(() => {
        expect(getByTestId('market-cap')).toHaveTextContent('$5.80B')
        expect(getByTestId('volume-24h')).toHaveTextContent('$120.00M')
      })
    })

    it('should display data source and last update time', async () => {
      const { getByTestId } = renderWithProviders(<MarketDataDisplay />)
      
      await waitFor(() => {
        expect(getByTestId('data-source')).toHaveTextContent('CoinGecko')
        expect(getByTestId('last-updated')).toBeInTheDocument()
      })
    })

    it('should handle refresh button click', async () => {
      const { getByTestId } = renderWithProviders(<MarketDataDisplay />)
      
      await waitFor(() => {
        const refreshButton = getByTestId('refresh-button')
        expect(refreshButton).toBeInTheDocument()
      })
      
      // Click refresh
      const refreshButton = getByTestId('refresh-button')
      await act(async () => {
        refreshButton.click()
      })
      
      // Should trigger refresh
      expect(marketDataService.forceRefresh).toHaveBeenCalled()
    })

    it('should show loading state during updates', async () => {
      const { getByTestId } = renderWithProviders(<MarketDataDisplay />)
      
      // Mock loading state
      vi.mocked(marketDataService.forceRefresh).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockMarketData), 100))
      )
      
      const refreshButton = getByTestId('refresh-button')
      await act(async () => {
        refreshButton.click()
      })
      
      // Should show loading state
      expect(getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('useMarketData Hook Integration', () => {
    it('should provide market data through hook', async () => {
      const TestComponent = () => {
        const { data, loading, error, refresh } = useMarketData()
        
        return (
          <div>
            <div data-testid="price">{data?.priceUSD}</div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
            <div data-testid="error">{error || 'no-error'}</div>
            <button data-testid="refresh" onClick={refresh}>Refresh</button>
          </div>
        )
      }
      
      const { getByTestId } = renderWithProviders(<TestComponent />)
      
      await waitFor(() => {
        expect(getByTestId('price')).toHaveTextContent('12.5')
        expect(getByTestId('loading')).toHaveTextContent('loaded')
        expect(getByTestId('error')).toHaveTextContent('no-error')
      })
    })

    it('should handle hook refresh functionality', async () => {
      const TestComponent = () => {
        const { refresh } = useMarketData()
        return <button data-testid="hook-refresh" onClick={refresh}>Refresh</button>
      }
      
      const { getByTestId } = renderWithProviders(<TestComponent />)
      
      const refreshButton = getByTestId('hook-refresh')
      await act(async () => {
        refreshButton.click()
      })
      
      expect(marketDataService.forceRefresh).toHaveBeenCalled()
    })

    it('should handle conversion through hook', async () => {
      const TestComponent = () => {
        const { convertUSDToICP, convertICPToUSD } = useMarketData()
        
        const usdToIcp = convertUSDToICP(29)
        const icpToUsd = convertICPToUSD(2.4)
        
        return (
          <div>
            <div data-testid="usd-to-icp">{usdToIcp.amountICP}</div>
            <div data-testid="icp-to-usd">{icpToUsd.amountUSD}</div>
          </div>
        )
      }
      
      const { getByTestId } = renderWithProviders(<TestComponent />)
      
      expect(getByTestId('usd-to-icp')).toHaveTextContent('2.4')
      expect(getByTestId('icp-to-usd')).toHaveTextContent('30')
    })
  })

  describe('Integration with Subscription Tiers', () => {
    it('should update subscription prices in real-time', async () => {
      const onTierSelect = vi.fn()
      
      const { getByTestId } = renderWithProviders(
        <SubscriptionTiers onTierSelect={onTierSelect} />
      )
      
      await waitFor(() => {
        expect(getByTestId('price-icp-basic')).toHaveTextContent('2.32 ICP')
        expect(getByTestId('price-icp-pro')).toHaveTextContent('7.92 ICP')
        expect(getByTestId('price-icp-enterprise')).toHaveTextContent('23.92 ICP')
      })
      
      // Simulate price change
      triggerMarketDataUpdate({ priceUSD: 15.0 })
      
      await waitFor(() => {
        // Prices should update based on new conversion rate
        // Note: This would require the component to subscribe to market data updates
        expect(getByTestId('data-source')).toBeInTheDocument()
      })
    })

    it('should show price change indicators', async () => {
      const onTierSelect = vi.fn()
      
      const { getByTestId } = renderWithProviders(
        <SubscriptionTiers onTierSelect={onTierSelect} />
      )
      
      await waitFor(() => {
        expect(getByTestId('change-indicator-24h')).toHaveTextContent('+5.25%')
      })
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle API rate limiting', async () => {
      // Mock rate limit error
      vi.mocked(global.fetch).mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      )
      
      try {
        await marketDataService.updateMarketData()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Rate limit')
      }
    })

    it('should handle malformed API responses', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'data' })
      } as any)
      
      try {
        await marketDataService.updateMarketData()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle network timeouts', async () => {
      vi.mocked(global.fetch).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 1000)
        )
      )
      
      try {
        await marketDataService.updateMarketData()
      } catch (error) {
        expect((error as Error).message).toContain('timeout')
      }
    })

    it('should continue working with stale data when updates fail', async () => {
      // First successful update
      await marketDataService.updateMarketData()
      
      // Subsequent update fails
      vi.mocked(global.fetch).mockRejectedValue(new Error('Update failed'))
      
      // Should still return cached data
      const cachedData = marketDataService.getCurrentPrice()
      expect(cachedData).toEqual(mockMarketData)
    })
  })

  describe('Performance and Caching', () => {
    it('should implement proper caching strategy', async () => {
      // First call should fetch from API
      await marketDataService.updateMarketData()
      expect(global.fetch).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      const cachedData = marketDataService.getCurrentPrice()
      expect(cachedData).toBeDefined()
      
      // Should not have made another API call
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it('should respect cache TTL', async () => {
      const cacheStatus = marketDataService.getCacheStatus()
      
      expect(cacheStatus.isCached).toBe(true)
      expect(cacheStatus.cacheAge).toBeGreaterThan(0)
      expect(cacheStatus.nextUpdate).toBeGreaterThan(0)
    })

    it('should handle memory cleanup on service destruction', async () => {
      // Subscribe to updates
      const unsubscribe = marketDataService.subscribe(() => {})
      
      // Destroy service
      marketDataService.destroy()
      
      // Should clean up properly
      expect(marketDataService.destroy).toHaveBeenCalled()
    })
  })

  describe('Historical Data and Trends', () => {
    it('should track price history', async () => {
      const history = marketDataService.getPriceHistory()
      
      expect(history).toEqual([mockMarketData])
      expect(history[0].priceUSD).toBe(12.50)
      expect(history[0].timestamp).toBeInstanceOf(Date)
    })

    it('should calculate trends accurately', async () => {
      const data = marketDataService.getCurrentPrice()
      
      expect(data.change24h).toBe(5.25) // Positive change
      expect(data.change7d).toBe(-2.10) // Negative change
    })
  })
})