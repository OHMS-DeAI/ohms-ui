#!/usr/bin/env node

/**
 * Integration Test Runner for OHMS 2.0 II v2 + Stripe Integration
 * 
 * This script runs comprehensive integration tests covering:
 * - Authentication flows (II v2 + Google OAuth)
 * - Payment processing (Stripe + ICP conversion)
 * - Market data integration (Multi-source APIs)
 * - End-to-end user journeys
 * 
 * Usage:
 *   npm run test:integration
 *   pnpm test:integration
 *   yarn test:integration
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  subheader: (msg: string) => console.log(`${colors.bright}${msg}${colors.reset}`)
}

interface TestSuite {
  name: string
  path: string
  description: string
  critical: boolean
}

const testSuites: TestSuite[] = [
  {
    name: 'Authentication Integration',
    path: 'src/test/integration/authentication.test.tsx',
    description: 'II v2 authentication, Google OAuth integration, session management',
    critical: true
  },
  {
    name: 'Payment Processing',
    path: 'src/test/integration/payment.test.tsx',
    description: 'Stripe integration, ICP conversion, subscription management',
    critical: true
  },
  {
    name: 'Market Data Integration',
    path: 'src/test/integration/market-data.test.tsx',
    description: 'Multi-source market data, real-time updates, fallback mechanisms',
    critical: true
  },
  {
    name: 'End-to-End User Journeys',
    path: 'src/test/integration/end-to-end.test.tsx',
    description: 'Complete user flows from authentication to payment completion',
    critical: true
  }
]

function checkTestFiles(): boolean {
  log.header('🔍 Checking Test Files')
  
  let allExist = true
  
  for (const suite of testSuites) {
    const fullPath = path.resolve(suite.path)
    if (existsSync(fullPath)) {
      log.success(`${suite.name}: ${suite.path}`)
    } else {
      log.error(`${suite.name}: Missing file ${suite.path}`)
      allExist = false
    }
  }
  
  return allExist
}

function runTestSuite(suite: TestSuite): boolean {
  log.subheader(`Running ${suite.name}`)
  log.info(suite.description)
  
  try {
    const command = `npx vitest run ${suite.path} --reporter=verbose`
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
    
    log.success(`${suite.name} completed successfully`)
    
    // Parse output for test statistics
    const passMatch = output.match(/(\d+) passed/)
    const failMatch = output.match(/(\d+) failed/)
    
    if (passMatch) {
      log.info(`  ${passMatch[1]} tests passed`)
    }
    
    if (failMatch && parseInt(failMatch[1]) > 0) {
      log.warning(`  ${failMatch[1]} tests failed`)
      return false
    }
    
    return true
  } catch (error: any) {
    log.error(`${suite.name} failed`)
    log.error(error.stdout || error.message)
    
    if (suite.critical) {
      log.error('Critical test suite failed - this may indicate a serious issue')
    }
    
    return false
  }
}

function runCoverageReport(): void {
  log.header('📊 Generating Coverage Report')
  
  try {
    const command = 'npx vitest run --coverage src/test/integration/'
    execSync(command, { stdio: 'inherit' })
    log.success('Coverage report generated successfully')
  } catch (error) {
    log.warning('Coverage report generation failed')
  }
}

function validateEnvironment(): boolean {
  log.header('🔧 Validating Test Environment')
  
  const requiredCommands = ['npx', 'node']
  let valid = true
  
  for (const cmd of requiredCommands) {
    try {
      execSync(`which ${cmd}`, { stdio: 'pipe' })
      log.success(`${cmd} is available`)
    } catch {
      log.error(`${cmd} is not available`)
      valid = false
    }
  }
  
  // Check package.json for required dependencies
  const packageJsonPath = path.resolve('package.json')
  if (existsSync(packageJsonPath)) {
    log.success('package.json found')
    
    try {
      const packageJson = require(packageJsonPath)
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
      
      const requiredDeps = [
        '@testing-library/react',
        '@testing-library/jest-dom',
        'vitest',
        'jsdom'
      ]
      
      for (const dep of requiredDeps) {
        if (dependencies[dep]) {
          log.success(`${dep} dependency found`)
        } else {
          log.warning(`${dep} dependency missing`)
        }
      }
    } catch (error) {
      log.warning('Could not parse package.json')
    }
  } else {
    log.error('package.json not found')
    valid = false
  }
  
  return valid
}

function generateTestReport(results: Array<{ suite: TestSuite; passed: boolean }>): void {
  log.header('📋 Test Execution Summary')
  
  const totalTests = results.length
  const passedTests = results.filter(r => r.passed).length
  const failedTests = totalTests - passedTests
  const criticalFailures = results.filter(r => !r.passed && r.suite.critical).length
  
  log.info(`Total Test Suites: ${totalTests}`)
  log.success(`Passed: ${passedTests}`)
  
  if (failedTests > 0) {
    log.error(`Failed: ${failedTests}`)
  }
  
  if (criticalFailures > 0) {
    log.error(`Critical Failures: ${criticalFailures}`)
  }
  
  log.subheader('Test Suite Details:')
  for (const result of results) {
    const icon = result.passed ? '✓' : '✗'
    const color = result.passed ? colors.green : colors.red
    const critical = result.suite.critical ? ' (CRITICAL)' : ''
    
    log.subheader(`  ${color}${result.passed ? '✓' : '✗'}${colors.reset} ${result.suite.name}${critical} - ${result.duration}ms`)
  }
  
  // Overall status
  const overallSuccess = criticalFailures === 0
  
  if (overallSuccess) {
    log.success('\n🎉 All critical tests passed! OHMS 2.0 integration is ready for production.')
  } else {
    log.error('\n❌ Critical test failures detected. Please review and fix issues before deployment.')
  }
  
  // Recommendations
  log.subheader('\nNext Steps:')
  if (overallSuccess) {
    log.info('• Proceed with security audit (Task 100)')
    log.info('• Complete production readiness checks')
    log.info('• Prepare deployment scripts')
    log.info('• Update documentation')
  } else {
    log.info('• Review failed test output for specific issues')
    log.info('• Fix authentication, payment, or market data integration problems')
    log.info('• Re-run tests after fixes')
    log.info('• Ensure all services are properly configured')
  }
}

async function main(): Promise<void> {
  log.header('🧪 OHMS 2.0 Integration Test Runner')
  log.info('Testing II v2 Authentication + Stripe Payment + Market Data Integration')
  
  // Validate environment
  if (!validateEnvironment()) {
    log.error('Environment validation failed')
    process.exit(1)
  }
  
  // Check test files
  if (!checkTestFiles()) {
    log.error('Some test files are missing')
    process.exit(1)
  }
  
  // Run test suites
  const results: Array<{ suite: TestSuite; passed: boolean }> = []
  
  for (const suite of testSuites) {
    const passed = runTestSuite(suite)
    results.push({ suite, passed })
    
    // Add delay between test suites to prevent resource conflicts
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Generate coverage report
  runCoverageReport()
  
  // Generate final report
  generateTestReport(results)
  
  // Exit with appropriate code
  const criticalFailures = results.filter(r => !r.passed && r.suite.critical).length
  process.exit(criticalFailures > 0 ? 1 : 0)
}

// Run the test runner
if (require.main === module) {
  main().catch(error => {
    log.error('Test runner failed')
    log.error(error.message)
    process.exit(1)
  })
}

export { main as runIntegrationTests }