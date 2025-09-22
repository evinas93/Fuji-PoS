# Prompts Template - Fuji POS Claude Development

This file contains reusable prompt templates to ensure Claude always has proper context for the Fuji Restaurant POS project.

---

## 🎯 How to Use These Templates

1. **Copy the appropriate template** for your task type
2. **Fill in the bracketed placeholders** [like this] with your specific details
3. **Always reference the context files** (CLAUDE.md, PRD, TaskMaster)
4. **Paste the complete prompt** to Claude for consistent results

---

## 📋 Template Categories

### [🏗️ Feature Implementation](#feature-implementation)

### [🐛 Bug Fixes](#bug-fixes)

### [🧪 Testing](#testing)

### [📊 Code Review](#code-review)

### [🔍 Research & Analysis](#research--analysis)

### [🚀 Deployment](#deployment)

---

## 🏗️ Feature Implementation

### **New Feature Development**

```
CONTEXT: Fuji Restaurant POS System
- Tech Stack: TypeScript + Next.js + Supabase (see CLAUDE.md)
- Requirements: fuji-pos-prd.md Section [SECTION_NUMBER]
- Current Task: TaskMaster #[TASK_ID] - [TASK_NAME]

FEATURE REQUEST: Implement [FEATURE_NAME]

REQUIREMENTS FROM PRD:
- Business Rule: [SPECIFIC_REQUIREMENT_FROM_PRD]
- Success Criteria: [SUCCESS_METRICS_FROM_PRD]
- User Stories: [RELEVANT_USER_STORY]

TECHNICAL SPECIFICATIONS (from CLAUDE.md):
- Database: [TABLE_NAMES] with [SPECIFIC_SCHEMA_REQUIREMENTS]
- API Endpoints: [REQUIRED_ENDPOINTS]
- Frontend: [UI_COMPONENTS_NEEDED]
- Authentication: [ROLE_PERMISSIONS]

ACCEPTANCE CRITERIA:
- [ ] Meets PRD Section [X] requirements
- [ ] Uses TypeScript + Supabase architecture
- [ ] Implements proper RLS policies
- [ ] Includes comprehensive error handling
- [ ] Has unit tests with [COVERAGE_%]
- [ ] Follows UI specifications from CLAUDE.md

VALIDATION:
Please confirm this aligns with:
1. CLAUDE.md tech stack specifications
2. PRD business requirements
3. TaskMaster task dependencies
```

### **Database Schema Changes**

```
CONTEXT: Fuji POS Database Schema Update
- Current Schema: See CLAUDE.md "Supabase Database Schema"
- Requirements: PRD Section [SECTION] for [BUSINESS_NEED]

SCHEMA CHANGE: [DESCRIBE_CHANGE]

IMPACT ANALYSIS NEEDED:
- Existing Tables: [LIST_AFFECTED_TABLES]
- RLS Policies: [POLICIES_TO_UPDATE]
- API Endpoints: [ENDPOINTS_TO_MODIFY]
- Frontend Components: [COMPONENTS_TO_UPDATE]

MIGRATION REQUIREMENTS:
- Data Migration: [YES/NO - describe if yes]
- Backward Compatibility: [REQUIREMENTS]
- Production Impact: [ASSESSMENT]

VALIDATION:
- [ ] Aligns with Supabase best practices
- [ ] Maintains referential integrity
- [ ] Updates RLS policies appropriately
- [ ] Documents schema changes in CLAUDE.md
```

### **UI Component Development**

```
CONTEXT: Fuji POS Frontend Component
- Design System: CLAUDE.md "UI/UX Guidelines"
- Target Users: [MANAGER/SERVER/CASHIER/KITCHEN]
- Device: Touch-optimized tablets (see PRD requirements)

COMPONENT: [COMPONENT_NAME]

UI REQUIREMENTS FROM PRD:
- Screen Layout: [REFERENCE_PRD_SECTION]
- Touch Targets: 44x44 pixels minimum
- User Role: [SPECIFIC_ROLE_REQUIREMENTS]
- Responsive: [BREAKPOINT_REQUIREMENTS]

TECHNICAL SPECS FROM CLAUDE.md:
- Framework: Next.js + TypeScript
- State Management: [REDUX/CONTEXT/ZUSTAND]
- Styling: [TAILWIND/STYLED_COMPONENTS]
- Data: Supabase real-time subscriptions

ACCEPTANCE:
- [ ] Follows design system in CLAUDE.md
- [ ] Touch-optimized for tablets
- [ ] Role-based access control
- [ ] Real-time data updates
- [ ] Error states and loading indicators
- [ ] Accessibility compliance (WCAG 2.1 AA)
```

---

## 🐛 Bug Fixes

### **General Bug Fix**

```
CONTEXT: Fuji POS Bug Fix
- Component: [COMPONENT/MODULE_NAME]
- Current Behavior: [DESCRIBE_BUG]
- Expected Behavior: Based on [PRD_SECTION/CLAUDE_MD_SECTION]

BUG DETAILS:
- Steps to Reproduce: [STEPS]
- Error Messages: [ERROR_LOGS]
- Affected Users: [ROLES/USERS_IMPACTED]
- Browser/Device: [IF_RELEVANT]

ROOT CAUSE ANALYSIS:
- Suspected Cause: [HYPOTHESIS]
- Related Code: [FILE_PATHS]
- Dependencies: [AFFECTED_SYSTEMS]

FIX REQUIREMENTS:
- Scope: Minimal change to resolve issue
- Testing: [SPECIFIC_TEST_CASES]
- Validation: Must not break [RELATED_FEATURES]

TECH CONSTRAINTS:
- Must maintain TypeScript type safety
- Preserve Supabase RLS policies
- Follow error handling patterns from CLAUDE.md
```

### **Performance Bug**

```
CONTEXT: Fuji POS Performance Issue
- Component: [SLOW_COMPONENT]
- Performance Target: [FROM_PRD] <[TIME] seconds
- Current Performance: [MEASURED_TIME]

PERFORMANCE ISSUE:
- Symptom: [DESCRIBE_SLOWNESS]
- Measurement: [HOW_MEASURED]
- Impact: [USER_EXPERIENCE_IMPACT]

INVESTIGATION REQUIRED:
- Database Queries: Check for N+1, missing indexes
- Frontend: Bundle size, unnecessary re-renders
- Supabase: RLS policy efficiency, subscription optimization
- Network: API call optimization

OPTIMIZATION TARGETS (from PRD):
- Order processing: <30 seconds
- Payment processing: <45 seconds
- Page load: <2 seconds
- API response: <1 second

VALIDATION:
- [ ] Meets PRD performance requirements
- [ ] Maintains functionality integrity
- [ ] Preserves security (RLS policies)
- [ ] Includes performance monitoring
```

---

## 🧪 Testing

### **Unit Test Creation**

```
CONTEXT: Fuji POS Unit Testing
- Component: [COMPONENT_TO_TEST]
- Test Framework: Jest + Supertest (backend) / React Testing Library (frontend)
- Coverage Target: 90%+ (per CLAUDE.md requirements)

TESTING SCOPE:
- Functions: [LIST_FUNCTIONS_TO_TEST]
- User Interactions: [CLICK/FORM_SUBMISSIONS/etc]
- Edge Cases: [ERROR_CONDITIONS]
- Integration Points: [API_CALLS/DATABASE_OPERATIONS]

TEST CASES FROM PRD:
- Business Logic: [PAYMENT_CALCULATIONS/ORDER_PROCESSING]
- User Roles: [PERMISSION_TESTING]
- Success Criteria: [PRD_METRICS_TO_VALIDATE]

TECHNICAL REQUIREMENTS:
- TypeScript: Proper type mocking
- Supabase: Mock database operations
- Real-time: Mock subscription behavior
- Authentication: Mock user roles

ACCEPTANCE:
- [ ] 90%+ code coverage
- [ ] All business rules tested
- [ ] Error conditions handled
- [ ] Integration points mocked properly
- [ ] Tests run in CI/CD pipeline
```

### **Integration Test Creation**

```
CONTEXT: Fuji POS Integration Testing
- Workflow: [ORDER_CREATION/PAYMENT_PROCESS/etc]
- Systems: Frontend + Backend + Supabase + [EXTERNAL_APIS]

INTEGRATION SCOPE:
- User Journey: [COMPLETE_USER_WORKFLOW]
- Data Flow: [REQUEST_TO_RESPONSE_PATH]
- External Systems: [STRIPE/EMAIL/SMS_SERVICES]

TEST SCENARIOS FROM PRD:
- Happy Path: [NORMAL_USER_FLOW]
- Error Conditions: [NETWORK_FAILURES/VALIDATION_ERRORS]
- Business Rules: [PAYMENT_CALCULATIONS/ROLE_PERMISSIONS]

VALIDATION POINTS:
- Database: Correct data persistence
- Real-time: Live updates working
- Security: RLS policies enforced
- Performance: Response time targets met

ACCEPTANCE:
- [ ] Complete user journeys tested
- [ ] External API integrations validated
- [ ] Error scenarios handled gracefully
- [ ] Real-time updates functioning
- [ ] Security measures verified
```

---

## 📊 Code Review

### **Code Review Request**

```
CONTEXT: Fuji POS Code Review
- Component: [COMPONENT_NAME]
- Changes: [SUMMARY_OF_CHANGES]
- TaskMaster: Task #[ID] - [TASK_NAME]

REVIEW SCOPE:
- Files Changed: [LIST_FILES]
- New Features: [FEATURE_LIST]
- Bug Fixes: [BUG_LIST]
- Dependencies: [NEW_PACKAGES/CHANGES]

VALIDATION CHECKLIST:
ARCHITECTURE COMPLIANCE:
- [ ] Follows TypeScript + Supabase patterns from CLAUDE.md
- [ ] Database changes include proper RLS policies
- [ ] API endpoints follow RESTful conventions
- [ ] Frontend uses established design system

BUSINESS REQUIREMENTS:
- [ ] Meets PRD specifications in Section [X]
- [ ] Implements required user roles/permissions
- [ ] Calculation logic matches PRD formulas
- [ ] Success criteria achievable

CODE QUALITY:
- [ ] TypeScript strict mode compliance
- [ ] Comprehensive error handling
- [ ] Unit tests with 90%+ coverage
- [ ] Security best practices followed
- [ ] Performance considerations addressed

DEPLOYMENT READINESS:
- [ ] Environment variables documented
- [ ] Migration scripts included (if needed)
- [ ] Documentation updated
- [ ] Ready for staging deployment
```

### **Security Review**

```
CONTEXT: Fuji POS Security Review
- Component: [COMPONENT_NAME]
- Security Context: [PAYMENT_PROCESSING/USER_DATA/etc]
- Compliance: PCI DSS (payments), GDPR (user data)

SECURITY CHECKLIST:
DATA PROTECTION:
- [ ] Sensitive data encrypted at rest/transit
- [ ] PII handling compliant with privacy laws
- [ ] Credit card data handled via Stripe (never stored)
- [ ] Audit trail for all transactions

ACCESS CONTROL:
- [ ] Supabase RLS policies properly configured
- [ ] Role-based permissions enforced
- [ ] Authentication flows secure (JWT handling)
- [ ] Session management per CLAUDE.md specs

API SECURITY:
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Supabase handles)
- [ ] CORS properly configured
- [ ] Rate limiting implemented

VULNERABILITIES:
- [ ] Dependencies scanned for vulnerabilities
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly managed
- [ ] Error messages don't leak sensitive info
```

---

## 🔍 Research & Analysis

### **Technical Research**

```
CONTEXT: Fuji POS Technical Research
- Topic: [RESEARCH_TOPIC]
- Current Approach: [CURRENT_IMPLEMENTATION]
- Problem: [ISSUE_TO_SOLVE]

RESEARCH SCOPE:
- Alternatives: [OPTIONS_TO_INVESTIGATE]
- Constraints: TypeScript + Supabase stack (per CLAUDE.md)
- Requirements: [PRD_REQUIREMENTS_TO_MEET]

EVALUATION CRITERIA:
- Performance: [SPECIFIC_METRICS]
- Security: [SECURITY_REQUIREMENTS]
- Maintainability: [LONG_TERM_CONSIDERATIONS]
- Cost: [BUDGET_CONSTRAINTS]
- Integration: [COMPATIBILITY_WITH_EXISTING_STACK]

DELIVERABLE:
- Recommendation: [PREFERRED_SOLUTION]
- Implementation Plan: [HIGH_LEVEL_STEPS]
- Risk Assessment: [POTENTIAL_ISSUES]
- Impact Analysis: [CHANGES_REQUIRED]

VALIDATION:
- [ ] Aligns with project architecture
- [ ] Meets PRD requirements
- [ ] Compatible with TypeScript + Supabase
- [ ] Addresses original problem completely
```

### **Performance Analysis**

```
CONTEXT: Fuji POS Performance Analysis
- Component: [COMPONENT_TO_ANALYZE]
- Performance Targets: [FROM_PRD]
- Current Metrics: [MEASURED_PERFORMANCE]

ANALYSIS SCOPE:
- Database Queries: [SLOW_QUERIES_IDENTIFIED]
- Frontend Rendering: [COMPONENT_PERFORMANCE]
- Network Requests: [API_RESPONSE_TIMES]
- User Experience: [PERCEIVED_PERFORMANCE]

MEASUREMENT TOOLS:
- Database: Supabase performance insights
- Frontend: Chrome DevTools, Lighthouse
- Network: Network tab, API monitoring
- Real User: Analytics data

OPTIMIZATION OPPORTUNITIES:
- Database: [INDEX_OPTIMIZATIONS/QUERY_IMPROVEMENTS]
- Frontend: [BUNDLE_OPTIMIZATION/LAZY_LOADING]
- Caching: [CACHE_STRATEGIES]
- Real-time: [SUBSCRIPTION_OPTIMIZATION]

RECOMMENDATIONS:
- Immediate Fixes: [QUICK_WINS]
- Long-term Improvements: [ARCHITECTURAL_CHANGES]
- Monitoring: [PERFORMANCE_TRACKING_SETUP]
```

---

## 🚀 Deployment

### **Production Deployment**

```
CONTEXT: Fuji POS Production Deployment
- Environment: Production (Vercel + Supabase Pro)
- Version: [VERSION_NUMBER]
- Changes: [DEPLOYMENT_SUMMARY]

PRE-DEPLOYMENT CHECKLIST:
TESTING:
- [ ] All unit tests passing
- [ ] Integration tests completed
- [ ] User acceptance testing signed off
- [ ] Performance benchmarks met
- [ ] Security scan passed

CONFIGURATION:
- [ ] Environment variables set
- [ ] Database migrations prepared
- [ ] Supabase RLS policies reviewed
- [ ] API keys and secrets configured
- [ ] Domain and SSL certificates ready

ROLLOUT PLAN:
- Deployment Window: [TIME/DATE]
- Rollback Plan: [ROLLBACK_PROCEDURE]
- Monitoring: [HEALTH_CHECKS/ALERTS]
- Communication: [STAKEHOLDER_NOTIFICATIONS]

POST-DEPLOYMENT:
- [ ] Health checks passing
- [ ] Key user flows tested in production
- [ ] Performance monitoring active
- [ ] Error tracking configured
- [ ] Backup procedures verified

ACCEPTANCE CRITERIA:
- [ ] All TaskMaster acceptance criteria met
- [ ] PRD success metrics achievable
- [ ] No critical bugs in production
- [ ] User training completed
```

### **Database Migration**

```
CONTEXT: Fuji POS Database Migration
- Migration Type: [SCHEMA_CHANGE/DATA_MIGRATION]
- Tables Affected: [TABLE_LIST]
- Risk Level: [LOW/MEDIUM/HIGH]

MIGRATION DETAILS:
- Changes: [DETAILED_SCHEMA_CHANGES]
- Data Impact: [RECORDS_AFFECTED]
- Downtime Required: [TIME_ESTIMATE]
- Rollback Strategy: [ROLLBACK_PLAN]

SUPABASE CONSIDERATIONS:
- RLS Policies: [POLICY_UPDATES_NEEDED]
- Real-time: [SUBSCRIPTION_IMPACT]
- API Changes: [ENDPOINT_MODIFICATIONS]
- Storage: [FILE_STORAGE_CHANGES]

TESTING PLAN:
- Staging Environment: [MIGRATION_TEST_RESULTS]
- Data Validation: [VERIFICATION_QUERIES]
- Application Testing: [FUNCTIONAL_TESTING]
- Performance Impact: [BEFORE/AFTER_METRICS]

EXECUTION PLAN:
1. [STEP_BY_STEP_MIGRATION_PROCESS]
2. [VALIDATION_CHECKPOINTS]
3. [ROLLBACK_TRIGGERS]
4. [COMMUNICATION_PLAN]

ACCEPTANCE:
- [ ] Migration completed without data loss
- [ ] All applications functioning normally
- [ ] Performance targets maintained
- [ ] RLS policies working correctly
- [ ] Documentation updated
```

---

## 🎭 Role-Specific Prompts

### **Manager Features**

```
CONTEXT: Fuji POS Manager Features
- User Role: Manager (full system access)
- Requirements: PRD Section [MANAGER_REQUIREMENTS]
- UI: Manager dashboard specifications

MANAGER-SPECIFIC REQUIREMENTS:
- Analytics Access: [REPORTING_REQUIREMENTS]
- User Management: [STAFF_ADMINISTRATION]
- System Settings: [CONFIGURATION_ACCESS]
- Financial Reports: [FINANCIAL_DATA_ACCESS]

PERMISSION VALIDATION:
- [ ] Manager role grants appropriate access
- [ ] Sensitive operations require manager approval
- [ ] Audit trail for all admin actions
- [ ] Role-based UI elements displayed correctly

IMPLEMENTATION FOCUS:
- Comprehensive dashboard with all metrics
- User creation/modification capabilities
- System configuration management
- Advanced reporting and analytics
```

### **Server Features**

```
CONTEXT: Fuji POS Server Features
- User Role: Server (order taking, payment processing)
- Requirements: PRD User Stories US-001, US-002
- UI: Touch-optimized order interface

SERVER-SPECIFIC REQUIREMENTS:
- Order Taking: [MENU_BROWSING/ITEM_SELECTION]
- Table Management: [TABLE_ASSIGNMENT/TRANSFERS]
- Payment Processing: [CASH/CREDIT_HANDLING]
- Customer Service: [ORDER_MODIFICATIONS/SPECIAL_REQUESTS]

WORKFLOW OPTIMIZATION:
- [ ] Single-tap item addition
- [ ] Quick modifier selection
- [ ] Running total always visible
- [ ] Fast payment processing
- [ ] Receipt generation/printing

UI CONSIDERATIONS:
- Large touch targets (44x44px minimum)
- Clear visual hierarchy
- Minimal clicks to complete actions
- Error prevention and recovery
```

---

## 💡 Quick Reference

### **File Locations**

```
Context Files:
- .claude-context.md (this location)
- CLAUDE.md (project root)
- fuji-pos-prd.md (Downloads folder)
- .taskmaster/tasks/tasks.json

Templates:
- prompts-template.md (this file)
- project-checklist.md (coming next)
```

### **Most Used Sections**

- CLAUDE.md: "System Architecture", "Database Schema", "Security Measures"
- PRD: Section 7 "Functional Requirements", Section 12 "Success Metrics"
- TaskMaster: Current task dependencies and acceptance criteria

### **Common Validations**

```
- [ ] TypeScript + Supabase stack compliance
- [ ] PRD business requirements met
- [ ] TaskMaster acceptance criteria satisfied
- [ ] Security best practices followed
- [ ] Performance targets achievable
```

---

**Usage Tip:** Always start with the context loading statement, then use the specific template for your task type. This ensures Claude has complete project context before making any recommendations or changes.

**Last Updated:** September 22, 2025
