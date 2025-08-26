/**
 * Real Google Profile Extraction Test
 * Tests the actual extraction of Google profile data from II v2 delegation certificates
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { InternetIdentityService, IIv2CertificateDebugger } from '../../services/internetIdentityService'
import type { Identity } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'

// Mock environment for testing
const mockEnvironment = {
  VITE_II_CANISTER_ID: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
  VITE_II_HOST: 'https://id.ai',
  VITE_DEBUG_MODE: 'true',
  VITE_GOOGLE_PROFILE_DEBUG: 'true'
}

// Mock delegation chain with realistic structure
const createMockDelegationChain = (includeGoogleData: boolean = true) => {
  const mockGoogleEmail = 'test.user@gmail.com'
  const mockGoogleName = 'Test User'
  const mockGooglePicture = 'https://lh3.googleusercontent.com/a/test-profile-pic'
  
  // Create realistic delegation certificate data
  const googleProfileData = includeGoogleData ? {
    email: mockGoogleEmail,
    name: mockGoogleName,
    picture: mockGooglePicture,
    sub: 'google_123456789',
    email_verified: true
  } : null
  
  // Simulate embedded Google data in certificate - create multiple formats for testing
  let certificateData: Uint8Array
  
  if (includeGoogleData) {
    // Create a JSON structure that the decoder can find
    const certStructure = {
      oauth_claims: {
        google: googleProfileData
      },
      // Also add direct claims format for fallback testing
      email: mockGoogleEmail,
      name: mockGoogleName,
      picture: mockGooglePicture,
      sub: 'google_123456789',
      email_verified: true
    }
    certificateData = new TextEncoder().encode(JSON.stringify(certStructure))
  } else {
    certificateData = new TextEncoder().encode('no_google_data_here')
  }
  
  return {
    delegations: [{
      delegation: certificateData,
      signature: new Uint8Array(64) // Mock signature
    }]
  }
}

// Mock Identity with delegation chain
const createMockIdentity = (includeGoogleData: boolean = true): Identity => {
  const mockPrincipal = Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai')
  const delegationChain = createMockDelegationChain(includeGoogleData)
  
  return {
    getPrincipal: vi.fn().mockResolvedValue(mockPrincipal),
    transformRequest: vi.fn(),
    _delegation: delegationChain
  } as any
}

describe('Real Google Profile Extraction', () => {
  let service: InternetIdentityService
  
  beforeAll(() => {
    // Set environment variables
    Object.assign(import.meta.env, mockEnvironment)
    
    // Mock console methods to capture debug output
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  
  beforeEach(() => {
    service = new InternetIdentityService({
      canisterId: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
      host: 'https://id.ai'
    })
  })
  
  describe('Certificate Decoding', () => {
    it('should decode delegation certificates with Google OAuth data', async () => {
      const mockIdentity = createMockIdentity(true)
      service['currentIdentity'] = mockIdentity
      
      // Test the delegation chain extraction
      const result = await service['extractDelegationChainData']()
      
      expect(result).toBeDefined()
      expect(result?.googleProfile).toBeDefined()
      
      // Check that we extracted some form of Google profile data
      const profile = result?.googleProfile
      expect(profile?.email).toContain('@')
      expect(profile?.name).toBeDefined()
      expect(profile?.verified).toBe(true)
      
      // Profile extracted successfully - logging removed for security
    })
    
    it('should handle delegation certificates without Google data', async () => {
      const mockIdentity = createMockIdentity(false)
      service['currentIdentity'] = mockIdentity
      
      const result = await service['extractDelegationChainData']()
      
      // Should return null when no Google data is found
      expect(result).toBeNull()
    })
    
    it('should extract strings from binary certificate data', () => {
      const testData = new TextEncoder().encode('email:test@gmail.com,name:Test User,google:oauth')
      const strings = IIv2CertificateDebugger.extractStringsFromBinary(testData)
      
      expect(strings).toContain('email:test@gmail.com,name:Test User,google:oauth')
    })
  })
  
  describe('JWT Token Parsing', () => {
    it('should identify JWT-like strings', () => {
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      const invalidString = 'not-a-jwt-token'
      
      expect(service['looksLikeJWT'](validJWT)).toBe(true)
      expect(service['looksLikeJWT'](invalidString)).toBe(false)
    })
    
    it('should decode JWT tokens correctly', () => {
      // Simple JWT with Google claims
      const payload = { email: 'test@gmail.com', name: 'Test User', sub: 'google_123' }
      const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '')
      const jwt = `header.${encodedPayload}.signature`
      
      const decoded = service['decodeJWT'](jwt)
      
      expect(decoded).toBeDefined()
      expect(decoded.email).toBe('test@gmail.com')
      expect(decoded.name).toBe('Test User')
    })
  })
  
  describe('Google Claims Extraction', () => {
    it('should extract Google claims from various certificate formats', () => {
      const testCases = [
        // Direct Google claims
        {
          google: { email: 'test@gmail.com', name: 'Test User' }
        },
        // OAuth claims format
        {
          oauth_claims: { google: { email: 'test@gmail.com', name: 'Test User' } }
        },
        // Direct claims format
        {
          email: 'test@gmail.com',
          name: 'Test User',
          sub: 'google_123'
        },
        // Extracted strings format
        {
          extractedStrings: ['test@gmail.com', 'Test User', 'google']
        }
      ]
      
      testCases.forEach((testCase, index) => {
        const result = service['extractGoogleClaimsFromDecodedCert'](testCase)
        
        expect(result, `Test case ${index + 1} should extract Google claims`).toBeDefined()
        expect(result?.email, `Test case ${index + 1} should have email`).toContain('@')
      })
    })
    
    it('should return null for certificates without Google data', () => {
      const testCases = [
        null,
        undefined,
        {},
        { randomData: 'no google here' },
        { extractedStrings: ['no', 'google', 'data'] }
      ]
      
      testCases.forEach((testCase, index) => {
        const result = service['extractGoogleClaimsFromDecodedCert'](testCase)
        expect(result, `Test case ${index + 1} should return null`).toBeNull()
      })
    })
  })
  
  describe('Certificate Structure Analysis', () => {
    it('should analyze delegation chain structure correctly', async () => {
      const mockIdentity = createMockIdentity(true)
      
      // Mock // Removed console log
      const logSpy = vi.spyOn(console, 'log')
      
      await IIv2CertificateDebugger.analyzeDelegationChain(mockIdentity)
      
      // Verify that analysis logged expected information
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('COMPREHENSIVE DELEGATION CHAIN ANALYSIS'))
      // Check for the actual log format used
      expect(logSpy).toHaveBeenCalledWith('👤 Principal:', 'rdmx6-jaaaa-aaaaa-aaadq-cai')
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('DELEGATION CHAIN FOUND:'))
    })
    
    it('should handle identities without delegation chains', async () => {
      const mockIdentityNoDelegation = {
        getPrincipal: vi.fn().mockResolvedValue(Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai')),
        transformRequest: vi.fn()
      } as any
      
      const logSpy = vi.spyOn(console, 'log')
      
      await IIv2CertificateDebugger.analyzeDelegationChain(mockIdentityNoDelegation)
      
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('NO DELEGATION CHAIN FOUND'))
    })
  })
  
  describe('CBOR Certificate Decoding', () => {
    it('should attempt CBOR decoding of certificate data', async () => {
      const testData = new TextEncoder().encode('{"google":{"email":"test@gmail.com"}}')
      
      const result = await service['decodeCBORCertificate'](testData)
      
      expect(result).toBeDefined()
      // Should extract the JSON structure
      expect(result.google?.email).toBe('test@gmail.com')
    })
    
    it('should extract strings from binary certificate data', async () => {
      const testData = new TextEncoder().encode('contains email test@gmail.com and name Test User')
      
      const result = await service['decodeCBORCertificate'](testData)
      
      expect(result).toBeDefined()
      // Check that strings were extracted (may be in different format)
      expect(result.extractedStrings || result).toBeDefined()
      
      // Log what was actually extracted
      // Removed console log
      
      // Check if email was found in any form
      const hasEmail = result.extractedStrings?.some((s: string) => s.includes('test@gmail.com')) ||
                      JSON.stringify(result).includes('test@gmail.com')
      expect(hasEmail).toBe(true)
    })
  })
  
  describe('Integration Testing', () => {
    it('should provide debugging tools in development mode', () => {
      // Simulate development environment
      Object.assign(import.meta.env, { DEV: true })
      
      // Re-import to trigger development mode setup
      expect(typeof IIv2CertificateDebugger.analyzeDelegationChain).toBe('function')
      expect(typeof IIv2CertificateDebugger.testGoogleProfileExtraction).toBe('function')
    })
    
    it('should handle authentication flow with Google profile extraction', async () => {
      const mockIdentity = createMockIdentity(true)
      service['currentIdentity'] = mockIdentity
      
      // Mock the auth client
      const mockAuthClient = {
        isAuthenticated: vi.fn().mockResolvedValue(true),
        getIdentity: vi.fn().mockReturnValue(mockIdentity)
      }
      service['authClient'] = mockAuthClient as any
      
      const userProfile = await service['getUserProfile']('rdmx6-jaaaa-aaaaa-aaadq-cai')
      
      expect(userProfile).toBeDefined()
      expect(userProfile.googleAccount).toBeDefined()
      
      // Log what we got for debugging
      // Removed console log
      
      // Check for any Google account data (real or generated)
      const googleAccount = userProfile.googleAccount
      expect(googleAccount?.email).toContain('@')
      expect(googleAccount?.name).toBeDefined()
      expect(typeof googleAccount?.verified).toBe('boolean')
    })
  })
  
  describe('Error Handling', () => {
    it('should handle certificate decoding errors gracefully', async () => {
      const mockIdentityBadData = {
        getPrincipal: vi.fn().mockResolvedValue(Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai')),
        transformRequest: vi.fn(),
        _delegation: {
          delegations: [{
            delegation: new Uint8Array([255, 255, 255, 255]), // Invalid data
            signature: new Uint8Array(64)
          }]
        }
      } as any
      
      service['currentIdentity'] = mockIdentityBadData
      
      const result = await service['extractDelegationChainData']()
      
      // Should handle errors gracefully and return null
      expect(result).toBeNull()
    })
    
    it('should handle missing delegation chains gracefully', async () => {
      const mockIdentityNoChain = {
        getPrincipal: vi.fn().mockResolvedValue(Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai')),
        transformRequest: vi.fn()
      } as any
      
      service['currentIdentity'] = mockIdentityNoChain
      
      const result = await service['extractDelegationChainData']()
      
      expect(result).toBeNull()
    })
  })
  
  describe('Fallback Generation', () => {
    it('should generate realistic fallback profiles when real data is not available', () => {
      const mockIdentity = createMockIdentity(false)
      service['currentIdentity'] = mockIdentity
      
      const fallbackProfile = service['generateRealisticGoogleProfile']()
      
      expect(fallbackProfile).toBeDefined()
      
      if (fallbackProfile) {
        expect(fallbackProfile.email).toContain('@gmail.com')
        expect(fallbackProfile.name).toBeDefined()
        expect(fallbackProfile.picture).toContain('ui-avatars.com')
        expect(fallbackProfile.generated).toBe(true)
      }
    })
    
    it('should generate deterministic profiles based on principal', () => {
      const mockIdentity = createMockIdentity(false)
      service['currentIdentity'] = mockIdentity
      
      const profile1 = service['generateRealisticGoogleProfile']()
      const profile2 = service['generateRealisticGoogleProfile']()
      
      // Should be deterministic for the same principal
      expect(profile1?.email).toBe(profile2?.email)
      expect(profile1?.name).toBe(profile2?.name)
    })
  })
})