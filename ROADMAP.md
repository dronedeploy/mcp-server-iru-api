# Multi-Platform Integration Roadmap

> **📋 Status:** This is a **planning document** that outlines potential future integrations. Only **Claude Desktop is currently implemented and production-ready**. This roadmap serves as a comprehensive technical specification for teams interested in implementing support for additional AI platforms.

This roadmap outlines the tasks and requirements for extending the Iru API MCP Server to support multiple AI platforms beyond Claude Desktop.

## Table of Contents

- [Current State](#current-state)
- [Platform Support Overview](#platform-support-overview)
- [Phase 1: Google Gemini CLI (Quick Win)](#phase-1-google-gemini-cli-quick-win)
- [Phase 2: Ollama (Local AI)](#phase-2-ollama-local-ai)
- [Phase 3: OpenAI ChatGPT (HTTP Refactor)](#phase-3-openai-chatgpt-http-refactor)
- [Phase 4: Microsoft Copilot Studio (Enterprise)](#phase-4-microsoft-copilot-studio-enterprise)
- [Technical Architecture](#technical-architecture)
- [Resource Requirements](#resource-requirements)
- [Risk Assessment](#risk-assessment)

---

## Current State

### ✅ Working Integrations
- **Claude Desktop**: Native MCP support via stdio transport
  - Status: Production ready
  - Setup time: 5 minutes
  - Cost: $20/month (Claude Pro)

### 📊 Current Architecture
```
┌─────────────────────────────────┐
│   MCP Server (stdio-based)      │
│   - FastMCP framework           │
│   - stdio transport only        │
│   - 23 MCP tools                │
│   - Environment-based auth      │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│      Claude Desktop             │
│      (Native MCP Client)        │
└─────────────────────────────────┘
```

---

## Platform Support Overview

| Platform | Transport | Code Changes | Setup Time | Monthly Cost | Priority | Status |
|----------|-----------|-------------|------------|--------------|----------|--------|
| **Claude Desktop** | stdio | None | 5 min | $20 | ✅ Complete | Production |
| **Google Gemini CLI** | stdio | None | 30 min | $0-20 | 🟢 High | Planned |
| **Ollama** | stdio (via bridge) | None | 2 hours | $0 | 🟢 High | Planned |
| **VS Code Copilot** | stdio | TBD | TBD | $0-10 | 🟡 Medium | Research |
| **OpenAI ChatGPT** | HTTP | Extensive | 3-4 weeks | $0-50 | 🟡 Medium | Planned |
| **Microsoft Copilot Studio** | HTTP | Extensive | 3-4 weeks | $250-400 | 🔴 Low | Planned |

### Legend
- 🟢 High Priority: Quick wins, minimal effort, high value
- 🟡 Medium Priority: Moderate effort, specific use cases
- 🔴 Low Priority: High effort, enterprise-only, or limited ROI

---

## Phase 1: Google Gemini CLI (Quick Win)

**Priority**: 🟢 High
**Status**: Not Started
**Estimated Time**: 4-8 hours
**Cost**: $0-20/month
**Code Changes**: None

### Overview
Google Gemini CLI has native MCP support with stdio transport, making this a zero-code-change integration.

### Benefits
- ✅ Zero code changes required (uses existing stdio server)
- ✅ Native MCP support (no bridge needed)
- ✅ Excellent tool calling capabilities
- ✅ 1M token context window
- ✅ Free tier available (1,500 requests/day)
- ✅ Fast setup (30 minutes)

### Tasks

#### 1.1 Setup & Configuration (2 hours)
- [ ] Install Gemini CLI via npm: `npm install -g @google/gemini-cli@latest`
- [ ] Create Google AI Studio API key at https://aistudio.google.com/apikey
- [ ] Configure Gemini CLI with API key
- [ ] Add MCP server to Gemini CLI config
- [ ] Test basic connectivity and tool discovery

**Acceptance Criteria**:
- Gemini CLI can connect to MCP server via stdio
- All 23 tools are discovered and available
- Sample queries execute successfully

#### 1.2 Automation Scripts (2 hours)
- [ ] Create `scripts/setup-gemini-cli.sh` - Automated setup script
- [ ] Create `scripts/start-gemini-cli.sh` - Quick start with env vars
- [ ] Add Gemini CLI configuration to `.gitignore`
- [ ] Test scripts on clean environment

**Deliverables**:
- `scripts/setup-gemini-cli.sh`
- `scripts/start-gemini-cli.sh`
- Update `.gitignore`

#### 1.3 Documentation (2-3 hours)
- [ ] Create `docs/integrations/GEMINI_CLI.md` - Setup guide
- [ ] Document recommended models and settings
- [ ] Add troubleshooting section
- [ ] Create example queries and use cases
- [ ] Add cost breakdown (free vs paid tiers)
- [ ] Update main README.md with Gemini CLI section

**Deliverables**:
- `docs/integrations/GEMINI_CLI.md`
- Updated `README.md`

#### 1.4 Testing (1-2 hours)
- [ ] Test all 23 tools via Gemini CLI
- [ ] Verify error handling and recovery
- [ ] Test with different models (Flash, Pro)
- [ ] Performance benchmarking vs Claude Desktop
- [ ] Document any limitations or issues

**Deliverables**:
- Test results document
- Performance comparison data

#### 1.5 Optional Enhancements (2-3 hours)
- [ ] Create Gemini CLI configuration file for easy setup
- [ ] Add shell completion for Gemini CLI commands
- [ ] Create demo video or screenshots
- [ ] Add CI/CD test for Gemini CLI compatibility

### Success Metrics
- ✅ 100% of MCP tools working via Gemini CLI
- ✅ Setup time < 30 minutes for new users
- ✅ Documentation complete and tested
- ✅ At least 5 example queries documented

### Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API rate limits | Medium | Low | Document free tier limits, provide paid tier guidance |
| Model limitations | Low | Low | Test with multiple models, document best practices |
| Breaking changes | Low | Low | Pin Gemini CLI version, monitor releases |

---

## Phase 2: Ollama (Local AI)

**Priority**: 🟢 High
**Status**: Not Started
**Estimated Time**: 8-16 hours
**Cost**: $0
**Code Changes**: None

### Overview
Ollama integration via community bridge tools enables 100% local, offline AI with privacy benefits.

### Benefits
- ✅ Zero code changes (uses existing stdio server)
- ✅ 100% local and offline capable
- ✅ No API costs
- ✅ Privacy-focused (no cloud calls)
- ✅ Multiple model options (Qwen, Llama, Mistral)
- ✅ Two integration methods (TypeScript bridge, Python TUI)

### Tasks

#### 2.1 Environment Setup (2-3 hours)
- [ ] Install Ollama: `brew install ollama` (macOS) or equivalent
- [ ] Pull recommended models with tool calling support
  - [ ] `qwen2.5-coder:7b-instruct` (recommended)
  - [ ] `llama3.2:3b` (lightweight alternative)
  - [ ] `mistral:7b-instruct` (backup option)
- [ ] Verify Ollama service is running
- [ ] Test model inference and tool calling
- [ ] Benchmark model performance on local hardware

**Acceptance Criteria**:
- Ollama installed and running
- At least 2 models tested successfully
- Performance benchmarks documented

#### 2.2 Bridge Integration - Option A: TypeScript (3-4 hours)
- [ ] Research and evaluate `ollama-mcp-bridge` (https://github.com/patruff/ollama-mcp-bridge)
- [ ] Clone and build the bridge project
- [ ] Create configuration file for Iru API MCP server
- [ ] Test connection between bridge, MCP server, and Ollama
- [ ] Document setup process and gotchas

**Deliverables**:
- `config/ollama_bridge_config.json`
- Setup documentation

#### 2.3 Bridge Integration - Option B: Python TUI (2-3 hours)
- [ ] Install `mcp-client-for-ollama` via pipx or pip
- [ ] Configure to use existing stdio MCP server
- [ ] Test interactive TUI interface
- [ ] Evaluate features (hot-reload, human-in-the-loop, etc.)
- [ ] Create quick-start guide

**Deliverables**:
- Installation guide
- Configuration examples

#### 2.4 Documentation (3-4 hours)
- [ ] Create `docs/integrations/OLLAMA.md` - Comprehensive setup guide
- [ ] Document both bridge options with pros/cons
- [ ] Add model comparison table (performance, accuracy, speed)
- [ ] Create troubleshooting guide (OOM errors, slow responses, etc.)
- [ ] Add system requirements (RAM, CPU, disk)
- [ ] Document offline usage workflow
- [ ] Update main README.md

**Deliverables**:
- `docs/integrations/OLLAMA.md`
- `docs/integrations/OLLAMA_MODELS.md`
- `docs/integrations/OLLAMA_TROUBLESHOOTING.md`
- Updated `README.md`

#### 2.5 Automation Scripts (2-3 hours)
- [ ] Create `scripts/setup-ollama-bridge.sh`
- [ ] Create `scripts/setup-ollama-tui.sh`
- [ ] Create `scripts/test-ollama-integration.sh`
- [ ] Create `scripts/benchmark-ollama-models.sh`
- [ ] Add model auto-download script

**Deliverables**:
- Complete set of automation scripts
- Script documentation

#### 2.6 Testing & Validation (2-3 hours)
- [ ] Test all 23 tools with each recommended model
- [ ] Measure response times and accuracy
- [ ] Test error handling and recovery
- [ ] Verify offline functionality
- [ ] Load testing with multiple concurrent queries
- [ ] Document performance differences vs Claude/Gemini

**Deliverables**:
- Test results matrix (models × tools)
- Performance benchmark report
- Known limitations document

### Success Metrics
- ✅ 90%+ of MCP tools working with recommended models
- ✅ Setup time < 2 hours for new users
- ✅ Complete documentation for both bridge options
- ✅ Performance benchmarks published

### Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Insufficient system resources | High | Medium | Document minimum requirements, provide lightweight model alternatives |
| Poor tool calling accuracy | Medium | Medium | Test multiple models, recommend best performers |
| Bridge compatibility issues | Medium | Low | Test both bridge options, maintain fork if needed |
| Model quality degradation | Low | Low | Pin model versions, test on updates |

---

## Phase 3: OpenAI ChatGPT (HTTP Refactor)

**Priority**: 🟡 Medium
**Status**: Not Started
**Estimated Time**: 3-4 weeks (120-160 hours)
**Cost**: $5-50/month (hosting)
**Code Changes**: Extensive

### Overview
OpenAI ChatGPT requires HTTP-based transport, necessitating significant architectural changes. This is a major refactoring effort.

### Benefits
- ✅ Access to GPT-4 and GPT-4 Turbo models
- ✅ Large user base
- ✅ Web-based interface (no local install)
- ✅ Multi-platform support (web, mobile, API)

### Challenges
- ❌ Requires complete transport layer rewrite (stdio → HTTP)
- ❌ Must be publicly accessible (no localhost)
- ❌ Requires robust authentication (OAuth 2.1 or API keys)
- ❌ Ongoing hosting costs
- ❌ Security hardening needed
- ❌ Rate limiting required

### Tasks

#### 3.1 Requirements & Planning (1 week)
- [ ] Research OpenAI MCP implementation details
- [ ] Review OpenAI Apps SDK documentation
- [ ] Design HTTP transport architecture
- [ ] Choose HTTP framework (Express.js recommended)
- [ ] Plan authentication strategy (OAuth 2.1 vs API key)
- [ ] Design deployment architecture
- [ ] Create detailed technical specification
- [ ] Estimate costs (hosting, bandwidth, maintenance)

**Deliverables**:
- Technical specification document
- Architecture diagrams
- Cost analysis

#### 3.2 HTTP Transport Layer (1.5 weeks)
- [ ] Add Express.js or Fastify HTTP server
- [ ] Implement SSE (Server-Sent Events) endpoint
- [ ] Implement Streamable HTTP endpoint (recommended)
- [ ] Replace FastMCP stdio with HTTP transport
- [ ] Implement JSON-RPC 2.0 over HTTP
- [ ] Add proper error handling for HTTP errors
- [ ] Implement request/response logging

**Deliverables**:
- `src/server/http-server.ts`
- `src/server/sse-handler.ts`
- `src/server/streamable-http-handler.ts`
- `src/server/mcp-router.ts`
- Updated `src/index.ts` with multi-transport support

**Dependencies**:
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "@modelcontextprotocol/sdk": "^1.0.0"
}
```

#### 3.3 Authentication & Security (1 week)
- [ ] Implement OAuth 2.1 with PKCE
- [ ] Create token management system (JWT)
- [ ] Implement API key authentication (simpler alternative)
- [ ] Add request signing for extra security
- [ ] Implement role-based access control (RBAC)
- [ ] Add audit logging for security events
- [ ] Security review and penetration testing

**Deliverables**:
- `src/auth/oauth-provider.ts`
- `src/auth/token-manager.ts`
- `src/auth/api-key-validator.ts`
- `src/middleware/auth.ts`
- Security audit report

#### 3.4 HTTP Middleware & Protection (3-4 days)
- [ ] Implement CORS middleware with allowlist
- [ ] Add rate limiting (per-IP, per-user)
- [ ] Implement request throttling
- [ ] Add request validation middleware
- [ ] Implement helmet.js security headers
- [ ] Add DDoS protection measures
- [ ] Implement request size limits

**Deliverables**:
- `src/middleware/cors.ts`
- `src/middleware/rate-limit.ts`
- `src/middleware/validation.ts`
- `src/middleware/security.ts`

#### 3.5 OpenAPI Specification (3-4 days)
- [ ] Generate OpenAPI 3.1 schema for all tools
- [ ] Add tool descriptions and examples
- [ ] Document authentication flows
- [ ] Add response schemas
- [ ] Create interactive API documentation (Swagger UI)
- [ ] Validate schema compliance

**Deliverables**:
- `src/openapi/generator.ts`
- `src/openapi/schemas/` (all tool schemas)
- `public/openapi.json`
- `public/api-docs/` (Swagger UI)

#### 3.6 Deployment Infrastructure (1 week)
- [ ] Choose cloud provider (AWS, Azure, Railway, Render)
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment
- [ ] Set up HTTPS with SSL certificate
- [ ] Configure domain and DNS
- [ ] Implement health checks and monitoring
- [ ] Set up logging infrastructure (CloudWatch, etc.)
- [ ] Configure auto-scaling (optional)
- [ ] Set up backup and disaster recovery

**Deliverables**:
- Deployment scripts
- Infrastructure as Code (Terraform or CloudFormation)
- CI/CD configuration
- Monitoring dashboards
- Runbook for operations

**Alternative**: Development tunneling (ngrok)
- [ ] Set up ngrok or cloudflared tunnel
- [ ] Create stable tunnel configuration
- [ ] Document tunnel setup for testing
- [ ] **Note**: Not suitable for production

#### 3.7 Tool Response Format Updates (3-4 days)
- [ ] Update all 23 tools to support HTTP response format
- [ ] Add support for "embedded resources" (UI components)
- [ ] Test response rendering in ChatGPT
- [ ] Optimize response sizes for HTTP
- [ ] Update error response formats

**Affected Files**:
- All files in `src/tools/` (23 tools)

#### 3.8 Testing & QA (1 week)
- [ ] Update unit tests for HTTP transport
- [ ] Create integration tests for HTTP endpoints
- [ ] Create OAuth flow tests
- [ ] Load testing and performance optimization
- [ ] Security testing (OWASP Top 10)
- [ ] Test with OpenAI Agents SDK
- [ ] Manual testing in ChatGPT interface
- [ ] End-to-end testing all 23 tools

**Deliverables**:
- `tests/integration/http-transport.test.ts`
- `tests/integration/oauth.test.ts`
- `tests/integration/chatgpt-integration.test.ts`
- Load test results
- Security audit report

#### 3.9 Documentation (3-4 days)
- [ ] Create `docs/integrations/CHATGPT.md`
- [ ] Document OAuth setup process
- [ ] Create deployment guide
- [ ] Add troubleshooting guide
- [ ] Document API endpoints
- [ ] Create operations runbook
- [ ] Update main README.md

**Deliverables**:
- Complete ChatGPT integration documentation
- API reference guide
- Operations manual

#### 3.10 Monitoring & Observability (3-4 days)
- [ ] Implement structured logging
- [ ] Add metrics collection (Prometheus/StatsD)
- [ ] Set up error tracking (Sentry)
- [ ] Create monitoring dashboards
- [ ] Configure alerts for critical issues
- [ ] Implement distributed tracing (optional)

**Deliverables**:
- Monitoring configuration
- Alert rules
- Dashboard templates

### Success Metrics
- ✅ 100% of MCP tools working via ChatGPT
- ✅ Response time < 2 seconds (p95)
- ✅ Uptime > 99.5%
- ✅ Security audit passed
- ✅ Load test: 100 concurrent users

### Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Security vulnerabilities | High | Medium | Security audit, penetration testing, regular updates |
| High hosting costs | Medium | Medium | Implement caching, rate limiting, cost monitoring |
| Poor performance | Medium | Low | Load testing, optimization, CDN |
| Breaking OpenAI changes | Medium | Low | Monitor API changes, maintain flexibility |
| DDoS attacks | High | Low | Cloudflare, rate limiting, IP blocking |

### Cost Breakdown (Estimated Monthly)
| Component | Cost Range |
|-----------|------------|
| Cloud hosting (Railway/Render) | $10-30 |
| Domain + SSL | $2-5 |
| Monitoring (optional) | $0-20 |
| CDN (optional) | $0-10 |
| **Total** | **$12-65/month** |

---

## Phase 4: Microsoft Copilot Studio (Enterprise)

**Priority**: 🔴 Low
**Status**: Not Started
**Estimated Time**: 3-4 weeks (120-160 hours)
**Cost**: $250-400/month
**Code Changes**: Extensive (similar to Phase 3)

### Overview
Microsoft Copilot Studio integration is designed for enterprise customers with existing M365 infrastructure. Requires extensive refactoring similar to OpenAI ChatGPT plus additional enterprise features.

### Benefits
- ✅ Enterprise-grade security and compliance
- ✅ Integration with Microsoft 365 ecosystem
- ✅ Power Platform integration
- ✅ Built-in governance (DLP, VNet, etc.)
- ✅ Multi-tenant support

### Challenges
- ❌ Requires HTTP transport (same as ChatGPT)
- ❌ Requires enterprise M365 licensing ($200/month)
- ❌ Complex setup (Azure, Power Platform, etc.)
- ❌ High ongoing costs
- ❌ Limited to enterprise use cases

### Prerequisites
- ✅ Microsoft 365 or Azure subscription
- ✅ Copilot Studio license ($200/month/tenant)
- ✅ Power Platform environment
- ✅ Global admin or Environment admin role

### Tasks

#### 4.1 Prerequisites & Planning (3-4 days)
- [ ] Verify Microsoft 365 tenant access
- [ ] Purchase Copilot Studio licenses
- [ ] Set up Power Platform environment
- [ ] Review Copilot Studio MCP documentation
- [ ] Design connector architecture
- [ ] Plan authentication strategy
- [ ] Estimate total costs

**Deliverables**:
- Technical specification
- Cost analysis
- Architecture diagrams

#### 4.2 HTTP Transport Layer (Reuse from Phase 3)
- [ ] Complete Phase 3 (OpenAI ChatGPT) implementation
- [ ] Verify compatibility with Copilot Studio requirements
- [ ] Ensure Streamable HTTP transport is implemented
- [ ] Test JSON-RPC protocol compatibility

**Note**: This phase depends on Phase 3 completion.

#### 4.3 Azure Deployment (1 week)
- [ ] Create Azure App Service
- [ ] Configure Azure AD authentication
- [ ] Set up Virtual Network integration
- [ ] Configure Azure Key Vault for secrets
- [ ] Set up Azure Monitor and Application Insights
- [ ] Configure auto-scaling rules
- [ ] Set up Azure CDN (optional)
- [ ] Configure DDoS protection

**Deliverables**:
- Azure resource templates
- Deployment automation
- Configuration documentation

#### 4.4 Custom Connector Creation (3-4 days)
- [ ] Create custom connector in Power Platform
- [ ] Configure Streamable HTTP endpoint
- [ ] Set up OAuth 2.0 Dynamic Client Registration (DCR)
- [ ] Configure connector authentication
- [ ] Map MCP tools to connector actions
- [ ] Test connector connectivity
- [ ] Publish connector to environment

**Deliverables**:
- Custom connector configuration
- Connector setup guide

#### 4.5 Copilot Studio Agent Configuration (2-3 days)
- [ ] Create new agent in Copilot Studio
- [ ] Add custom connector to agent
- [ ] Configure tool permissions and scopes
- [ ] Set up Data Loss Prevention (DLP) policies
- [ ] Configure agent settings and behavior
- [ ] Test agent with sample queries
- [ ] Publish agent to environment

**Deliverables**:
- Agent configuration guide
- DLP policy documentation

#### 4.6 Enterprise Security & Compliance (1 week)
- [ ] Implement enterprise authentication (Azure AD)
- [ ] Configure conditional access policies
- [ ] Set up multi-factor authentication (MFA)
- [ ] Implement data loss prevention (DLP)
- [ ] Configure audit logging
- [ ] Set up compliance monitoring
- [ ] Document security architecture
- [ ] Security compliance review

**Deliverables**:
- Security architecture document
- Compliance checklist
- Audit configuration

#### 4.7 Testing & Validation (1 week)
- [ ] Test all 23 tools via Copilot Studio
- [ ] Test authentication flows
- [ ] Test with different user roles
- [ ] Performance testing
- [ ] Security testing
- [ ] Compliance validation
- [ ] User acceptance testing (UAT)

**Deliverables**:
- Test results
- UAT report
- Performance benchmarks

#### 4.8 Documentation (3-4 days)
- [ ] Create `docs/integrations/COPILOT_STUDIO.md`
- [ ] Document Azure deployment process
- [ ] Create connector setup guide
- [ ] Document agent configuration
- [ ] Add troubleshooting guide
- [ ] Create operations runbook
- [ ] Document enterprise security features
- [ ] Update main README.md

**Deliverables**:
- Complete Copilot Studio documentation
- Enterprise deployment guide
- Operations manual

#### 4.9 Monitoring & Operations (3-4 days)
- [ ] Configure Azure Monitor dashboards
- [ ] Set up Application Insights
- [ ] Configure alerting rules
- [ ] Set up Power Platform analytics
- [ ] Document operational procedures
- [ ] Create incident response plan

**Deliverables**:
- Monitoring configuration
- Operations runbook
- Incident response plan

### Success Metrics
- ✅ 100% of MCP tools working via Copilot Studio
- ✅ Enterprise security requirements met
- ✅ Compliance requirements satisfied
- ✅ Performance SLA met (99.9% uptime)
- ✅ User acceptance testing passed

### Risks & Mitigations
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| High costs | High | High | ROI analysis, pilot program first |
| Complex setup | Medium | High | Detailed documentation, expert consultation |
| Licensing issues | High | Medium | Verify licenses before starting |
| Integration challenges | Medium | Medium | Proof of concept, phased rollout |
| Vendor lock-in | Medium | Medium | Design for portability where possible |

### Cost Breakdown (Estimated Monthly)
| Component | Cost Range |
|-----------|------------|
| Copilot Studio license | $200/tenant |
| Azure App Service (Premium) | $100-200 |
| Azure AD Premium (if needed) | $0-20/user |
| Azure Monitor + App Insights | $20-50 |
| Virtual Network (optional) | $0-30 |
| **Total** | **$320-500/month** |

### Recommendation
⚠️ **Proceed only if**:
- You have existing Microsoft 365 E3/E5 licenses
- Enterprise compliance requirements mandate M365 integration
- Budget approved for $300-500/month ongoing costs
- Dedicated IT resources available for maintenance

---

## Technical Architecture

### Current Architecture (Claude Desktop Only)

```
┌─────────────────────────────────────────────────┐
│           Iru API MCP Server                    │
│                                                 │
│  ┌───────────────────────────────────────┐    │
│  │   FastMCP Server (stdio)              │    │
│  │   - 23 MCP Tools                      │    │
│  │   - Zod validation                    │    │
│  │   - TTL-based caching                 │    │
│  │   - Error categorization              │    │
│  └───────────────┬───────────────────────┘    │
│                  │                              │
│  ┌───────────────▼───────────────────────┐    │
│  │   KandjiClient (HTTP)                 │    │
│  │   - Iru API integration               │    │
│  │   - PII redaction                     │    │
│  │   - Rate limit handling               │    │
│  └───────────────┬───────────────────────┘    │
└──────────────────┼──────────────────────────────┘
                   │
                   ▼
          ┌────────────────┐
          │   Iru API      │
          │   (Cloud)      │
          └────────────────┘

Connected via stdio:
┌──────────────┐
│ Claude       │
│ Desktop      │
└──────────────┘
```

### Target Architecture (Multi-Platform)

```
┌─────────────────────────────────────────────────────────────────┐
│                  Iru API MCP Server                             │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │        Transport Layer (New)                             │  │
│  │  ┌────────────┐  ┌──────────┐  ┌────────────────────┐  │  │
│  │  │   stdio    │  │   SSE    │  │  Streamable HTTP   │  │  │
│  │  │ (existing) │  │   (new)  │  │      (new)         │  │  │
│  │  └────────────┘  └──────────┘  └────────────────────┘  │  │
│  └────────────┬─────────────┬──────────────┬───────────────┘  │
│               │             │              │                   │
│  ┌────────────▼─────────────▼──────────────▼────────────────┐ │
│  │         MCP Protocol Handler (Unified)                    │ │
│  │         - Tool routing                                    │ │
│  │         - Validation                                      │ │
│  │         - Error handling                                  │ │
│  └────────────────────────────┬──────────────────────────────┘ │
│                               │                                │
│  ┌────────────────────────────▼──────────────────────────────┐ │
│  │              Business Logic Layer                          │ │
│  │              - 23 MCP Tools                                │ │
│  │              - Caching                                     │ │
│  │              - Response formatting                         │ │
│  └────────────────────────────┬──────────────────────────────┘ │
│                               │                                │
│  ┌────────────────────────────▼──────────────────────────────┐ │
│  │              KandjiClient (unchanged)                      │ │
│  └────────────────────────────┬──────────────────────────────┘ │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                                 ▼
                        ┌────────────────┐
                        │   Iru API      │
                        └────────────────┘

Connected Platforms:

stdio transport:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Claude       │  │ Gemini CLI   │  │ Ollama       │
│ Desktop      │  │              │  │ (via bridge) │
└──────────────┘  └──────────────┘  └──────────────┘

HTTP transport:
┌──────────────┐  ┌──────────────┐
│ ChatGPT      │  │ Copilot      │
│              │  │ Studio       │
└──────────────┘  └──────────────┘
```

### New Components Required (Phases 3 & 4)

```typescript
// New file structure for HTTP support
src/
├── server/
│   ├── http-server.ts              // Express/Fastify HTTP server
│   ├── sse-handler.ts              // Server-Sent Events transport
│   ├── streamable-http-handler.ts  // Streamable HTTP transport
│   ├── mcp-router.ts               // Route MCP requests
│   └── stdio-server.ts             // Existing stdio (refactored)
├── auth/
│   ├── oauth-provider.ts           // OAuth 2.1 implementation
│   ├── token-manager.ts            // JWT token handling
│   └── api-key-validator.ts        // API key authentication
├── middleware/
│   ├── auth.ts                     // Authentication middleware
│   ├── rate-limit.ts               // Rate limiting
│   ├── cors.ts                     // CORS configuration
│   ├── validation.ts               // Request validation
│   └── security.ts                 // Security headers (helmet)
├── openapi/
│   ├── generator.ts                // OpenAPI spec generation
│   └── schemas/                    // Tool schemas
└── index.ts                        // Multi-transport startup
```

---

## Resource Requirements

### Team Skills Required

| Phase | Skills Needed |
|-------|--------------|
| **Phase 1: Gemini CLI** | Basic CLI, Node.js, MCP concepts |
| **Phase 2: Ollama** | Docker/containerization, Python or TypeScript |
| **Phase 3: ChatGPT** | Node.js, Express.js, OAuth 2.1, HTTP protocols, Cloud deployment |
| **Phase 4: Copilot Studio** | Azure, Power Platform, Enterprise security, M365 admin |

### Time Investment

| Phase | Developer | Documentation | Testing | Total |
|-------|-----------|---------------|---------|-------|
| **Phase 1** | 4h | 3h | 1h | 8h |
| **Phase 2** | 8h | 4h | 4h | 16h |
| **Phase 3** | 120h | 16h | 24h | 160h |
| **Phase 4** | 120h | 16h | 24h | 160h |

### Budget Estimate

| Phase | Setup Cost | Monthly Cost | Annual Cost |
|-------|-----------|--------------|-------------|
| **Phase 1: Gemini CLI** | $0 | $0-20 | $0-240 |
| **Phase 2: Ollama** | $0 | $0 | $0 |
| **Phase 3: ChatGPT** | $2,000 | $30 | $360 |
| **Phase 4: Copilot Studio** | $5,000 | $350 | $4,200 |
| **Total** | **$7,000** | **$380-400** | **$4,560-4,800** |

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| Breaking MCP protocol changes | High | Low | Monitor spec changes, maintain version compatibility |
| Platform API changes | Medium | Medium | Abstract platform-specific code, maintain adapters |
| Security vulnerabilities | High | Medium | Regular audits, dependency updates, penetration testing |
| Performance degradation | Medium | Low | Load testing, monitoring, optimization |
| Tool compatibility issues | Medium | Medium | Comprehensive testing matrix, fallback mechanisms |

### Business Risks

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| High development costs | High | Medium | Phased approach, start with quick wins (Gemini, Ollama) |
| Ongoing operational costs | Medium | High | Cost monitoring, optimize resource usage, evaluate ROI |
| Limited user adoption | Medium | Medium | User research, documentation, support resources |
| Platform vendor lock-in | Low | Low | Design for portability, standard protocols |
| Maintenance burden | Medium | Medium | Automation, monitoring, clear documentation |

### Operational Risks

| Risk | Impact | Likelihood | Mitigation Strategy |
|------|--------|------------|---------------------|
| Insufficient monitoring | Medium | Medium | Implement comprehensive observability |
| No disaster recovery plan | High | Low | Backup strategy, documented recovery procedures |
| Security incidents | High | Low | Security best practices, incident response plan |
| Service degradation | Medium | Medium | Health checks, auto-scaling, alerting |
| Knowledge silos | Medium | Medium | Documentation, runbooks, training |

---

## Success Criteria

### Phase 1: Gemini CLI
- ✅ All 23 tools functional via Gemini CLI
- ✅ Setup time < 30 minutes
- ✅ Complete documentation
- ✅ No code changes to core MCP server

### Phase 2: Ollama
- ✅ At least 90% of tools working with recommended models
- ✅ Setup time < 2 hours
- ✅ Both bridge options documented
- ✅ Performance benchmarks published

### Phase 3: ChatGPT
- ✅ 100% of tools functional via ChatGPT
- ✅ Security audit passed
- ✅ Production deployment live
- ✅ < 2 second response time (p95)
- ✅ 99.5% uptime

### Phase 4: Copilot Studio
- ✅ 100% of tools functional via Copilot Studio
- ✅ Enterprise security requirements met
- ✅ Compliance validation passed
- ✅ Custom connector published
- ✅ Operations runbook complete

---

## Timeline

### Aggressive Timeline (Parallel Work)
```
Month 1:
  Week 1-2: Phase 1 (Gemini CLI) + Phase 2 (Ollama) - Parallel
  Week 3-4: Phase 3 Start (Architecture & HTTP transport)

Month 2:
  Week 1-4: Phase 3 Continue (Auth, security, deployment)

Month 3:
  Week 1-2: Phase 3 Complete (Testing, docs)
  Week 3-4: Phase 4 Start (Azure setup)

Month 4:
  Week 1-4: Phase 4 Complete (Connector, testing, docs)
```

### Conservative Timeline (Sequential Work)
```
Month 1:
  Week 1: Phase 1 (Gemini CLI)
  Week 2-3: Phase 2 (Ollama)
  Week 4: Buffer/Documentation

Month 2-3:
  Weeks 1-6: Phase 3 (ChatGPT)
  Weeks 7-8: Testing & hardening

Month 4-5:
  Weeks 1-6: Phase 4 (Copilot Studio)
  Weeks 7-8: Testing & documentation

Total: 5 months
```

---

## Recommendations

### Priority Order
1. **✅ Phase 1: Google Gemini CLI** (Start immediately)
   - Quick win, zero code changes
   - Low risk, low cost
   - High value for users

2. **✅ Phase 2: Ollama** (Start within 2 weeks)
   - Zero code changes
   - Privacy-focused use case
   - Growing community interest

3. **🟡 Phase 3: OpenAI ChatGPT** (Evaluate need after Phases 1-2)
   - Only if web-based interface is critical
   - Consider if Gemini CLI meets requirements
   - Significant investment required

4. **🔴 Phase 4: Microsoft Copilot Studio** (Enterprise customers only)
   - Only for customers with M365 investment
   - Requires dedicated enterprise team
   - High cost, high complexity

### Go/No-Go Decision Points

**After Phase 1** (Gemini CLI):
- ✅ Go to Phase 2 if: Gemini CLI adoption successful, community interest
- ❌ Stop if: Major compatibility issues, poor tool calling performance

**After Phase 2** (Ollama):
- ✅ Go to Phase 3 if: Business need for web interface, budget approved
- ❌ Stop if: stdio platforms (Claude, Gemini, Ollama) meet all needs

**After Phase 3** (ChatGPT):
- ✅ Go to Phase 4 if: Enterprise customers with M365, budget + team available
- ❌ Stop if: No enterprise demand, insufficient resources

---

## Maintenance & Long-term Considerations

### Ongoing Maintenance (Post-Implementation)

| Task | Frequency | Effort | Owner |
|------|-----------|--------|-------|
| Dependency updates | Weekly | 2-4 hours | Dev team |
| Security patches | As needed | 1-8 hours | Dev team |
| MCP protocol updates | Quarterly | 4-16 hours | Dev team |
| Performance optimization | Quarterly | 8-16 hours | Dev team |
| Documentation updates | Monthly | 2-4 hours | Dev team |
| User support | Daily | 1-2 hours | Support team |

### Platform-Specific Maintenance

| Platform | Estimated Monthly Effort |
|----------|-------------------------|
| Claude Desktop | 2 hours |
| Gemini CLI | 2 hours |
| Ollama | 4 hours (model updates) |
| ChatGPT | 16 hours (hosting, security) |
| Copilot Studio | 20 hours (Azure, compliance) |

### Breaking Changes Risk

| Platform | Risk Level | Mitigation |
|----------|-----------|------------|
| Claude Desktop | Low | Monitor Anthropic announcements |
| Gemini CLI | Low | Pin CLI version, test updates |
| Ollama | Low | Pin model versions |
| ChatGPT | Medium | Monitor OpenAI API changes |
| Copilot Studio | Medium | Monitor Microsoft Power Platform updates |

---

## Conclusion

This roadmap provides a phased approach to multi-platform integration:

- **Phases 1-2** (Gemini CLI, Ollama): Quick wins with minimal effort
- **Phase 3** (ChatGPT): Major refactoring effort for web-based access
- **Phase 4** (Copilot Studio): Enterprise-grade integration

**Recommended Starting Point**: Begin with Phase 1 (Google Gemini CLI) for immediate value with zero code changes.

**Questions or Feedback?** Please open an issue or discussion on GitHub.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-27 | Initial | Initial roadmap creation |

---

## Related Documentation

- [README.md](README.md) - Project overview
- [docs/integrations/GEMINI_CLI.md](docs/integrations/GEMINI_CLI.md) - Gemini CLI setup (to be created)
- [docs/integrations/OLLAMA.md](docs/integrations/OLLAMA.md) - Ollama integration (to be created)
- [docs/integrations/CHATGPT.md](docs/integrations/CHATGPT.md) - ChatGPT integration (to be created)
- [docs/integrations/COPILOT_STUDIO.md](docs/integrations/COPILOT_STUDIO.md) - Copilot Studio integration (to be created)
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) - Contribution guidelines
