#!/usr/bin/env node

/**
 * Test setup script for Fuji POS System
 * This script prepares the testing environment and provides helpful commands
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 Fuji POS Testing Setup')
console.log('==========================\n')

// Check if required dependencies are installed
const checkDependencies = () => {
  console.log('📦 Checking test dependencies...')
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
  const requiredDevDeps = [
    '@testing-library/jest-dom',
    '@testing-library/react',
    'jest',
    'jest-environment-jsdom'
  ]

  const missing = requiredDevDeps.filter(dep => !packageJson.devDependencies[dep])
  
  if (missing.length > 0) {
    console.log('❌ Missing test dependencies:', missing.join(', '))
    console.log('💡 Run: npm install')
    process.exit(1)
  }
  
  console.log('✅ All test dependencies are installed\n')
}

// Check if test files exist
const checkTestFiles = () => {
  console.log('📋 Checking test files...')
  
  const testDirs = ['tests/unit', 'tests/integration', 'tests/e2e']
  const requiredFiles = [
    'jest.config.js',
    'jest.setup.js',
    'tests/unit/components/LoginForm.test.tsx',
    'tests/unit/hooks/useAuth.test.ts',
    'tests/unit/lib/permissions.test.ts',
    'tests/integration/auth.test.ts'
  ]

  let allExists = true

  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`📁 Creating directory: ${dir}`)
      fs.mkdirSync(dir, { recursive: true })
    }
  })

  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      console.log(`❌ Missing: ${file}`)
      allExists = false
    } else {
      console.log(`✅ Found: ${file}`)
    }
  })

  if (!allExists) {
    console.log('\n💡 Some test files are missing. Please ensure all required files are created.')
  }
  
  console.log('')
}

// Run basic test checks
const runBasicChecks = () => {
  console.log('🔍 Running basic checks...')
  
  try {
    // Check if Jest config is valid
    execSync('npx jest --showConfig', { stdio: 'pipe' })
    console.log('✅ Jest configuration is valid')
    
    // Check TypeScript compilation
    execSync('npx tsc --noEmit', { stdio: 'pipe' })
    console.log('✅ TypeScript compilation passes')
    
  } catch (error) {
    console.log('❌ Basic checks failed:')
    console.log(error.stdout?.toString() || error.message)
    return false
  }
  
  console.log('')
  return true
}

// Display available test commands
const showCommands = () => {
  console.log('🚀 Available Test Commands:')
  console.log('===========================')
  console.log('')
  console.log('📝 Unit Tests:')
  console.log('  npm test                          # Run all tests')
  console.log('  npm run test:watch                # Run tests in watch mode')
  console.log('  npm run test:coverage             # Run tests with coverage')
  console.log('')
  console.log('🎯 Specific Tests:')
  console.log('  npm test LoginForm                # Run LoginForm tests')
  console.log('  npm test useAuth                  # Run auth hook tests')  
  console.log('  npm test permissions              # Run permission tests')
  console.log('  npm test auth.test.ts             # Run auth integration tests')
  console.log('')
  console.log('🔧 Debugging:')
  console.log('  npm test -- --verbose             # Verbose output')
  console.log('  npm test -- --detectOpenHandles   # Find async issues')
  console.log('  npm test -- --runInBand           # Run tests serially')
  console.log('')
  console.log('📊 Coverage:')
  console.log('  npm run test:coverage             # Generate coverage report')
  console.log('  open coverage/lcov-report/index.html  # View coverage report')
  console.log('')
}

// Show manual testing info
const showManualTesting = () => {
  console.log('🧑‍💻 Manual Testing:')
  console.log('====================')
  console.log('')
  console.log('1. Start the development servers:')
  console.log('   npm run dev:all')
  console.log('')
  console.log('2. Open browser to:')
  console.log('   Frontend: http://localhost:3000')
  console.log('   Backend:  http://localhost:3001')
  console.log('')
  console.log('3. Test authentication with demo accounts:')
  console.log('   Manager:  manager@fujirestaurant.com  / password123')
  console.log('   Server:   server@fujirestaurant.com   / password123')
  console.log('   Cashier:  cashier@fujirestaurant.com  / password123')
  console.log('   Kitchen:  kitchen@fujirestaurant.com  / password123')
  console.log('')
  console.log('4. Test role-based access control:')
  console.log('   - Each role should see different dashboard content')
  console.log('   - Try accessing restricted routes')
  console.log('   - Test session timeout (15 minutes)')
  console.log('')
  console.log('📖 Full testing guide: See TESTING.md')
  console.log('')
}

// Main execution
const main = () => {
  checkDependencies()
  checkTestFiles()
  
  if (runBasicChecks()) {
    showCommands()
    showManualTesting()
    
    console.log('🎉 Testing environment is ready!')
    console.log('💡 Tip: Start with "npm run test:watch" for development')
    console.log('')
    console.log('Next steps:')
    console.log('1. Run tests: npm test')
    console.log('2. Check coverage: npm run test:coverage')
    console.log('3. Start manual testing: npm run dev:all')
  }
}

main()
