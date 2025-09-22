# Project Checklist - Fuji POS Development Validation

This checklist ensures all development work aligns with project requirements and maintains consistency with the Fuji Restaurant POS system specifications.

---

## 🚨 **MANDATORY - Before Any Development Work**

### **📋 Context Loading Checklist**

```
☐ Read .claude-context.md for project overview
☐ Review CLAUDE.md for current tech stack and architecture
☐ Check fuji-pos-prd.md for specific business requirements
☐ Verify current TaskMaster task status and dependencies
☐ Confirm understanding of user role requirements
```

---

## 🏗️ **Architecture & Tech Stack Validation**

### **Technology Stack Compliance**

```
☐ Frontend: Next.js + TypeScript (not React only)
☐ Backend: Node.js + Express + TypeScript (not Python/Java)
☐ Database: Supabase (not PostgreSQL/MySQL/MongoDB)
☐ Authentication: Supabase Auth (not custom JWT)
☐ Payment: Stripe integration (not other processors)
☐ Deployment: Vercel + Supabase Pro (not AWS/Azure/GCP)
☐ Real-time: Supabase subscriptions (not WebSockets)
```

### **Database Schema Compliance**

```
☐ Uses UUID primary keys (not auto-increment integers)
☐ Follows Supabase naming conventions (snake_case)
☐ Implements proper Row Level Security (RLS) policies
☐ Uses JSONB for complex data (modifiers, price_variations)
☐ Includes created_at/updated_at timestamps
☐ Maintains referential integrity with foreign keys
☐ Indexes created for performance-critical queries
```

---

## 💼 **Business Requirements Validation**

### **Core Business Rules (from PRD)**

```
☐ Payment calculations follow exact PRD formulas:
   - Subtotal = Sum(item_price × quantity) + modifiers
   - Tax = Subtotal × tax_rate
   - Gratuity = (Subtotal + Tax) × 0.20 (if party ≥ 2)
   - Service Charge = Total × 0.035 (if credit card)

☐ User roles implemented correctly:
   - Manager: Full access, reporting, user management
   - Server: Order taking, payment processing
   - Cashier: Payment processing, receipt generation
   - Kitchen: Order viewing, status updates

☐ Performance targets achievable:
   - Order processing: <30 seconds
   - Payment processing: <45 seconds
   - Daily reconciliation: <5 minutes
   - System uptime: >99.9%

☐ Menu structure supports all categories:
   - Beverages (wines, beers, sake, soft drinks)
   - Food (sushi, tempura, lunch/dinner specials)
   - Price variations (glass/bottle, lunch/dinner)
   - Modifiers and special instructions
```

### **Success Metrics Alignment**

```
☐ Order accuracy target: >99% achievable
☐ Average ticket increase: 15% mechanism implemented
☐ User adoption: 100% within 30 days (UX optimized)
☐ Support tickets: <5 per week (error handling robust)
☐ ROI within 12 months: Cost-effective implementation
```

---

## 🔒 **Security & Compliance Checklist**

### **Data Protection**

```
☐ PCI DSS compliance via Stripe (no card data stored locally)
☐ Row Level Security (RLS) policies implemented and tested
☐ User authentication via Supabase Auth (secure by default)
☐ All API endpoints require authentication
☐ Sensitive data encrypted in transit (HTTPS) and at rest
☐ Audit trail for all financial transactions
☐ No hardcoded secrets in code (environment variables)
```

### **Access Control**

```
☐ Role-based permissions enforced at database level (RLS)
☐ Manager approval required for voids/discounts
☐ Session timeout configured (15 minutes inactivity)
☐ Account lockout after failed login attempts
☐ Password requirements met via Supabase Auth
☐ Admin actions logged for audit purposes
```

---

## 🎨 **User Interface & Experience**

### **Touch-Optimized Design**

```
☐ Minimum touch target: 44x44 pixels
☐ Adequate spacing between interactive elements
☐ Clear visual hierarchy (primary vs secondary actions)
☐ Responsive design (tablets primary, desktop secondary)
☐ Loading states and error messages implemented
☐ Offline mode considerations (where applicable)
☐ Accessibility compliance (WCAG 2.1 AA)
```

### **Role-Specific UI**

```
☐ Manager: Analytics dashboard, reports, user management
☐ Server: Order entry, table management, payment processing
☐ Cashier: Payment processing, receipt generation
☐ Kitchen: Order display, status updates, preparation tracking
☐ Navigation appropriate for each role
☐ Features hidden/shown based on permissions
```

---

## 🧪 **Testing & Quality Assurance**

### **Code Quality**

```
☐ TypeScript strict mode enabled and passing
☐ ESLint and Prettier configured and passing
☐ No console.log statements in production code
☐ Error handling comprehensive (try/catch blocks)
☐ Input validation on all user inputs
☐ SQL injection prevention (Supabase handles automatically)
☐ XSS prevention in frontend rendering
```

### **Testing Requirements**

```
☐ Unit tests: 90%+ code coverage
☐ Integration tests: Key user workflows covered
☐ API tests: All endpoints tested with proper auth
☐ Database tests: RLS policies validated
☐ Frontend tests: Component behavior and interactions
☐ E2E tests: Critical business processes (order→payment)
☐ Performance tests: Response time targets met
☐ Security tests: Authentication/authorization flows
```

---

## 📊 **Data & Analytics**

### **Real-time Requirements**

```
☐ Order status updates broadcast to kitchen display
☐ Sales dashboard updates in real-time
☐ Inventory levels reflect immediately after orders
☐ Multiple user sessions stay synchronized
☐ Real-time subscriptions properly cleaned up
☐ Performance impact of real-time features minimal
```

### **Reporting & Analytics**

```
☐ Daily sales tracking automated
☐ Historical data accessible (5+ years per PRD)
☐ Export functionality (CSV, PDF) implemented
☐ QuickBooks integration ready (if required)
☐ Custom date range reports available
☐ Server performance metrics tracked
☐ Top-selling items analysis automated
```

---

## 🚀 **Deployment Readiness**

### **Environment Configuration**

```
☐ Environment variables documented and secure
☐ Supabase project configured for production
☐ Stripe account configured with proper keys
☐ Domain and SSL certificates ready
☐ CDN configuration optimized
☐ Backup procedures documented and tested
☐ Monitoring and alerting configured
```

### **Migration & Data**

```
☐ Database migration scripts tested
☐ Existing data migration plan validated
☐ Menu data imported and verified
☐ User accounts created with proper roles
☐ Tax rates configured correctly
☐ Test orders processed successfully
☐ Rollback procedures documented
```

---

## 📝 **Documentation & Training**

### **Technical Documentation**

```
☐ API endpoints documented (OpenAPI/Swagger)
☐ Database schema documented
☐ Setup/installation instructions complete
☐ Environment variables documented
☐ Troubleshooting guide created
☐ Code comments comprehensive but not excessive
☐ README.md updated with current information
```

### **User Documentation**

```
☐ Manager user manual created
☐ Server training materials prepared
☐ Cashier quick reference guide ready
☐ Kitchen display instructions clear
☐ Video tutorials recorded (if needed)
☐ FAQ document with common issues
☐ Super-user training program outlined
```

---

## 🎯 **TaskMaster Integration**

### **Task Validation**

```
☐ Current task ID and status confirmed
☐ All task dependencies met before starting
☐ Acceptance criteria clearly understood
☐ Test strategy from task implemented
☐ Task status updated as work progresses
☐ Subtasks completed in proper order
☐ Final validation against task requirements
```

### **Progress Tracking**

```
☐ TaskMaster updated with actual progress
☐ Blockers identified and documented
☐ Dependencies verified with related tasks
☐ Time estimates updated based on actual work
☐ Task marked complete only when fully done
☐ Next task dependencies evaluated
```

---

## ⚠️ **Red Flags - Stop and Reassess**

### **Architecture Violations**

```
❌ Using different tech stack than TypeScript + Supabase
❌ Implementing custom authentication instead of Supabase Auth
❌ Storing credit card data locally (PCI violation)
❌ Bypassing Row Level Security (RLS) policies
❌ Creating non-UUID primary keys
❌ Hardcoding environment-specific values
```

### **Business Logic Violations**

```
❌ Payment calculations don't match PRD formulas
❌ User permissions don't match role definitions
❌ Performance targets not achievable with current design
❌ Menu structure can't accommodate all categories
❌ Order workflow doesn't match user stories
❌ Reporting doesn't meet success metrics
```

### **Quality Issues**

```
❌ TypeScript errors or warnings present
❌ Tests failing or coverage below 90%
❌ Security vulnerabilities identified
❌ Performance benchmarks not met
❌ UI not touch-optimized for tablets
❌ Accessibility requirements ignored
```

---

## 🎯 **Pre-Commit Checklist**

### **Final Validation Before Code Commit**

```
☐ All linting and formatting rules pass
☐ TypeScript compiles without errors or warnings
☐ All tests pass (unit, integration, e2e)
☐ Security scan shows no critical vulnerabilities
☐ Performance benchmarks met
☐ Documentation updated for changes
☐ Environment variables documented
☐ Database migrations tested
☐ RLS policies validated
☐ TaskMaster task requirements met
☐ Code review completed (if required)
```

---

## 📞 **Support & Escalation**

### **When to Seek Help**

```
🆘 Technical blockers that prevent progress
🆘 Business requirement conflicts or ambiguities
🆘 Security concerns or compliance questions
🆘 Performance issues that can't be resolved
🆘 Integration problems with external services
🆘 Data migration or schema conflicts
```

### **Escalation Path**

1. **Technical Issues:** Review CLAUDE.md and TaskMaster details
2. **Business Questions:** Reference PRD sections
3. **Architecture Decisions:** Validate against established patterns
4. **Security Concerns:** Follow PCI DSS and privacy guidelines
5. **Performance Problems:** Check established benchmarks

---

## 📈 **Continuous Improvement**

### **Post-Development Review**

```
☐ Actual vs estimated time tracked
☐ Technical debt identified and documented
☐ User feedback collected and analyzed
☐ Performance metrics validated in production
☐ Security measures tested in real conditions
☐ Lessons learned documented for future tasks
☐ Process improvements identified
```

---

**Usage Instructions:**

1. **Print or bookmark this checklist** for easy reference
2. **Use during development** to validate each decision
3. **Review before commits** to ensure quality
4. **Update as project evolves** to maintain relevance
5. **Share with team members** for consistency

**Last Updated:** September 22, 2025
**Project Phase:** Development Foundation
**Next Review:** After TaskMaster Task #1 completion
