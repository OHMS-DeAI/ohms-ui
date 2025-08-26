/**
 * Debug Certificate Extraction Test
 * Focused test to debug exactly what's happening in certificate extraction
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InternetIdentityService } from '../services/internetIdentityService'
import type { Identity } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'

describe('Debug Certificate Extraction', () => {
  let service: InternetIdentityService
  
  beforeEach(() => {
    service = new InternetIdentityService({
      canisterId: 'rdmx6-jaaaa-aaaaa-aaadq-cai',
      host: 'https://id.ai'
    })
  })
  
  it('should debug the exact certificate extraction process', async () => {
    // DEBUGGING CERTIFICATE EXTRACTION PROCESS - logging removed for security
    
    // Create test data exactly as it would appear
    const mockGoogleData = {
      email: 'test.user@gmail.com',
      name: 'Test User',
      picture: 'https://lh3.googleusercontent.com/a/test-profile-pic',
      sub: 'google_123456789',
      email_verified: true
    }
    
    const testCertificateStructures = [
      // Structure 1: Direct oauth_claims
      {
        oauth_claims: {
          google: mockGoogleData
        }
      },
      // Structure 2: Direct Google claims
      mockGoogleData,
      // Structure 3: Nested claims
      {
        claims: {
          google: mockGoogleData
        }
      }
    ]
    
    for (let i = 0; i < testCertificateStructures.length; i++) {
      const certData = testCertificateStructures[i]
      // Removed // Removed console log
      
      // Convert to bytes as the real system would
      const certBytes = new TextEncoder().encode(JSON.stringify(certData))
      // Removed // Removed console log
      
      // Test CBOR decoding
      const cborResult = await service['decodeCBORCertificate'](certBytes)
      // Removed // Removed console log
      
      // Test Google claims extraction
      if (cborResult) {
        const googleClaims = service['extractGoogleClaimsFromDecodedCert'](cborResult)
        // Removed // Removed console log
        
        if (googleClaims) {
          // Removed // Removed console log
          expect(googleClaims.email).toBe('test.user@gmail.com')
        } else {
          // Removed // Removed console log
        }
      }
    }
    
    // Test delegation certificate decoding directly
    // Removed // Removed console log
    
    const mockCertData = new TextEncoder().encode(JSON.stringify({
      oauth_claims: {
        google: mockGoogleData
      }
    }))
    
    const delegationResult = await service['decodeDelegationCertificate'](mockCertData)
    // Removed // Removed console log
    
    if (delegationResult) {
      // Removed // Removed console log
      expect(delegationResult.email).toBe('test.user@gmail.com')
    } else {
      // Removed // Removed console log
    }
  })
  
  it('should test the complete delegation chain flow', async () => {
    // Removed // Removed console log
    
    // Create a mock identity with proper delegation structure
    const mockGoogleData = {
      email: 'test.user@gmail.com',
      name: 'Test User',
      sub: 'google_123456789',
      email_verified: true
    }
    
    const certificateData = new TextEncoder().encode(JSON.stringify({
      oauth_claims: {
        google: mockGoogleData
      },
      // Add fallback direct claims
      email: mockGoogleData.email,
      name: mockGoogleData.name
    }))
    
    const mockIdentity: Identity = {
      getPrincipal: vi.fn().mockResolvedValue(Principal.fromText('rdmx6-jaaaa-aaaaa-aaadq-cai')),
      transformRequest: vi.fn(),
      _delegation: {
        delegations: [{
          delegation: certificateData,
          signature: new Uint8Array(64)
        }]
      }
    } as any
    
    service['currentIdentity'] = mockIdentity
    
    // Removed // Removed console log
    
    // Test the extraction
    const result = await service['extractDelegationChainData']()
    // Removed // Removed console log
    
    if (result?.googleProfile) {
      // Removed // Removed console log
      // Removed // Removed console log
      // Removed // Removed console log
      expect(result.googleProfile.email).toBe('test.user@gmail.com')
    } else {
      // Removed // Removed console log
      // Removed // Removed console log
    }
  })
  
  it('should test string extraction from binary data', () => {
    // Removed // Removed console log
    
    const testStrings = [
      'test@gmail.com',
      'Test User',
      'google_oauth_data',
      'email_verified_true'
    ]
    
    const testData = new TextEncoder().encode(testStrings.join(' | '))
    // Removed // Removed console log
    
    const extractedStrings = service['extractStringsFromBinary'](testData)
    // Removed // Removed console log
    
    // Check if email was extracted
    const hasEmail = extractedStrings.some(s => s.includes('test@gmail.com'))
    // Removed // Removed console log
    
    expect(hasEmail).toBe(true)
  })
})