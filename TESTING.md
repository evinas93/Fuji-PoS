# Testing Guide - Fuji POS System

This document provides comprehensive instructions for testing the Fuji Restaurant POS System.

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- LoginForm.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="authentication"
```

### Test Environment Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Environment variables** are automatically mocked in `jest.setup.js`

3. **Database setup**: Tests use mocked Supabase client (no real database needed)

## 📋 Testing Structure

### Test Types & Locations

```
tests/
├── unit/           # Component and function unit tests
├── integration/    # API and service integration tests  
└── e2e/            # End-to-end browser tests
```

### Coverage Goals

- **Branches**: 70%
- **Functions**: 70% 
- **Lines**: 70%
- **Statements**: 70%

## 🧪 Manual Testing Guide

### 1. Authentication System Testing

#### **Login Testing**

1. **Email/Password Login**:
   ```
   URL: http://localhost:3000/auth/login
   
   Test Cases:
   ✅ Valid credentials (use demo accounts from login page)
   ✅ Invalid email format
   ✅ Wrong password
   ✅ Empty fields
   ✅ Account lockout (after multiple failed attempts)
   ```

2. **PIN Login**:
   ```
   Test Cases:
   ✅ Valid PIN (4 digits)
   ✅ Invalid PIN
   ✅ PIN too short/long
   ✅ Non-numeric PIN
   ```

3. **Session Management**:
   ```
   Test Cases:
   ✅ Session timeout after 15 minutes of inactivity
   ✅ Warning modal appears at 2 minutes remaining
   ✅ "Stay Signed In" extends session
   ✅ "Log Out Now" signs user out
   ✅ Activity resets the timer
   ✅ Browser tab switching pauses/resumes timer
   ```

#### **Role-Based Access Testing**

Test with different user roles to verify RBAC:

1. **Admin Access**:
   ```
   Login as: admin@fujirestaurant.com
   Expected: Access to all features, purple admin controls on dashboard
   ```

2. **Manager Access**:
   ```
   Login as: manager@fujirestaurant.com  
   Expected: Blue manager controls, can't access admin-only features
   ```

3. **Server Access**:
   ```
   Login as: server@fujirestaurant.com
   Expected: Green server controls, limited menu access
   ```

4. **Cashier Access**:
   ```
   Login as: cashier@fujirestaurant.com
   Expected: Yellow cashier controls, payment processing access
   ```

5. **Kitchen Access**:
   ```
   Login as: kitchen@fujirestaurant.com
   Expected: Orange kitchen controls, order viewing only
   ```

### 2. Navigation Testing

#### **Route Protection**

Test unauthorized access:

```bash
# Try accessing protected routes without login
http://localhost:3000/dashboard     # Should redirect to login
http://localhost:3000/menu         # Should redirect to login
http://localhost:3000/orders       # Should redirect to login

# Try accessing role-restricted routes with wrong role
# Login as server, then try:
http://localhost:3000/admin/users   # Should show "Access Denied"
```

#### **Permission Guards**

On dashboard, verify:
- Only admins see "User Management" card
- Only cashiers/managers see "Payment Processing" card  
- Only kitchen staff see "Kitchen Access" card
- Only managers/admins see "Advanced Reporting" card

### 3. UI Component Testing

#### **Responsive Design**

Test on different screen sizes:
```
✅ Desktop (1920x1080)
✅ Tablet (768x1024) 
✅ Mobile (375x667)
✅ Touch interactions work properly
✅ Forms are accessible
```

#### **Accessibility Testing**

```
✅ Tab navigation works
✅ Screen reader compatibility  
✅ High contrast mode
✅ Keyboard shortcuts
✅ Focus indicators visible
```

## 🔧 Development Testing

### Setting Up Local Testing Environment

1. **Start the development servers**:
   ```bash
   # Terminal 1: Next.js frontend
   npm run dev

   # Terminal 2: Express.js backend  
   npm run server:dev

   # Or both together:
   npm run dev:all
   ```

2. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

### Demo User Accounts

Use these accounts for testing (created via Supabase):

```
Manager:  manager@fujirestaurant.com  / password123
Server:   server@fujirestaurant.com   / password123  
Cashier:  cashier@fujirestaurant.com  / password123
Kitchen:  kitchen@fujirestaurant.com  / password123
Admin:    admin@fujirestaurant.com    / password123
```

### API Testing

Test authentication endpoints:

```bash
# Sign in
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@fujirestaurant.com","password":"password123"}'

# Get current user (replace TOKEN with actual token)
curl -X GET http://localhost:3001/api/auth/user \
  -H "Authorization: Bearer TOKEN"

# Sign out  
curl -X POST http://localhost:3001/api/auth/signout \
  -H "Authorization: Bearer TOKEN"
```

## 📊 Performance Testing

### Key Metrics to Monitor

1. **Login Performance**:
   - Login should complete in < 2 seconds
   - Session validation < 500ms
   - Dashboard load < 3 seconds

2. **Memory Usage**:
   - No memory leaks during session timeout cycles
   - Component cleanup on logout

3. **Network Requests**:
   - JWT tokens refresh automatically
   - API calls include proper authentication headers

### Tools for Performance Testing

```bash
# Lighthouse (built into Chrome DevTools)
# Check Core Web Vitals, Accessibility, Performance

# Bundle analyzer
npm run build
npx @next/bundle-analyzer
```

## 🐛 Common Testing Issues & Solutions

### Issue: Tests fail with Supabase errors

**Solution**: Check `jest.setup.js` has proper mocks:

```javascript
// Add to jest.setup.js if missing
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
    },
  })),
}))
```

### Issue: Session timeout not working in tests

**Solution**: Mock timers in your test:

```javascript
beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()  
})
```

### Issue: Permission guards not working

**Solution**: Provide user context in test:

```javascript
const mockUser = { profile: { role: 'manager' } }
render(
  <AuthContext.Provider value={{ user: mockUser }}>
    <ComponentToTest />
  </AuthContext.Provider>
)
```

## 📈 Test Reporting

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

### CI/CD Integration

Tests automatically run on:
- Pre-commit hooks (via Husky)
- Pull requests  
- Deployment pipelines

## 🔒 Security Testing

### Authentication Security Tests

1. **Token Security**:
   - JWT tokens expire properly
   - Refresh tokens work correctly
   - Invalid tokens are rejected

2. **Session Security**:
   - Sessions timeout appropriately
   - No session fixation vulnerabilities
   - Secure cookie settings

3. **Authorization Tests**:
   - Route protection works
   - API endpoints reject unauthorized requests
   - Role escalation is prevented

### Manual Security Testing

```bash
# Test invalid JWT tokens
curl -H "Authorization: Bearer invalid-token" \
  http://localhost:3001/api/auth/user

# Test SQL injection (should be prevented)
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com; DROP TABLE users;--","password":"test"}'
```

## 📝 Writing New Tests

### Test File Naming Convention

```
ComponentName.test.tsx    # Component tests
serviceName.test.ts       # Service/utility tests  
apiEndpoint.test.ts       # API endpoint tests
```

### Example Test Structure

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from '../LoginForm'

describe('LoginForm', () => {
  beforeEach(() => {
    // Setup before each test
  })

  it('should render login form correctly', () => {
    // Arrange
    render(<LoginForm />)
    
    // Act & Assert
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })
})
```

---

## 🎯 Testing Checklist

Before deploying to production:

### Functionality
- [ ] All authentication flows work
- [ ] Role-based access control functions correctly  
- [ ] Session management operates as expected
- [ ] API endpoints are secured
- [ ] Error handling works properly

### Performance  
- [ ] Login completes in < 2 seconds
- [ ] No memory leaks detected
- [ ] Bundle size is optimized
- [ ] Core Web Vitals meet targets

### Security
- [ ] No sensitive data in client-side code
- [ ] All API routes are protected
- [ ] JWT tokens expire appropriately
- [ ] RBAC prevents unauthorized access

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen readers can navigate
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators are visible

---

**Next Steps**: Run the test suite and address any failing tests before moving to the next development phase.
