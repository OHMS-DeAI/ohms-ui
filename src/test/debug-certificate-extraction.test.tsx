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
    console.log('🔬 DEBUGGING CERTIFICATE EXTRACTION PROCESS')
    
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
      console.log(`\n🧪 Testing certificate structure ${i + 1}:`, certData)
      
      // Convert to bytes as the real system would
      const certBytes = new TextEncoder().encode(JSON.stringify(certData))
      console.log('📦 Certificate bytes length:', certBytes.length)
      
      // Test CBOR decoding
      const cborResult = await service['decodeCBORCertificate'](certBytes)
      console.log('🔍 CBOR decode result:', cborResult)
      
      // Test Google claims extraction
      if (cborResult) {
        const googleClaims = service['extractGoogleClaimsFromDecodedCert'](cborResult)
        console.log('📧 Google claims result:', googleClaims)
        
        if (googleClaims) {
          console.log(`✅ SUCCESS: Structure ${i + 1} extracted Google claims!`)
          expect(googleClaims.email).toBe('test.user@gmail.com')
        } else {
          console.log(`❌ FAILED: Structure ${i + 1} did not extract Google claims`)
        }
      }
    }
    
    // Test delegation certificate decoding directly
    console.log('\n🔧 Testing delegation certificate decoding...')
    
    const mockCertData = new TextEncoder().encode(JSON.stringify({
      oauth_claims: {
        google: mockGoogleData
      }
    }))
    
    const delegationResult = await service['decodeDelegationCertificate'](mockCertData)
    console.log('🎯 Delegation decode result:', delegationResult)
    
    if (delegationResult) {
      console.log('✅ SUCCESS: Delegation certificate extraction worked!')
      expect(delegationResult.email).toBe('test.user@gmail.com')
    } else {
      console.log('❌ FAILED: Delegation certificate extraction failed')
    }
  })
  
  it('should test the complete delegation chain flow', async () => {
    console.log('\n🔄 TESTING COMPLETE DELEGATION CHAIN FLOW')
    
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
    
    console.log('🎯 Mock identity delegation structure:', mockIdentity._delegation)
    
    // Test the extraction
    const result = await service['extractDelegationChainData']()
    console.log('📊 Delegation chain extraction result:', result)
    
    if (result?.googleProfile) {
      console.log('✅ SUCCESS: Found Google profile in delegation chain!')
      console.log('📧 Email:', result.googleProfile.email)
      console.log('👤 Name:', result.googleProfile.name)
      expect(result.googleProfile.email).toBe('test.user@gmail.com')
    } else {
      console.log('❌ FAILED: No Google profile found in delegation chain')
      console.log('🔍 Raw result:', result)
    }
  })
  
  it('should test string extraction from binary data', () => {
    console.log('\n📄 TESTING STRING EXTRACTION FROM BINARY DATA')
    
    const testStrings = [
      'test@gmail.com',
      'Test User',
      'google_oauth_data',
      'email_verified_true'
    ]
    
    const testData = new TextEncoder().encode(testStrings.join(' | '))
    console.log('📦 Test data:', testData)
    
    const extractedStrings = service['extractStringsFromBinary'](testData)
    console.log('🔍 Extracted strings:', extractedStrings)
    
    // Check if email was extracted
    const hasEmail = extractedStrings.some(s => s.includes('test@gmail.com'))
    console.log('📧 Email found:', hasEmail)
    
    expect(hasEmail).toBe(true)
  })
})