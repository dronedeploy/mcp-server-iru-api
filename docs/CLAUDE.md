# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Kandji MCP (Model Context Protocol) Server** built on the FastMCP framework. It provides a local, secure bridge between Anthropic Claude Desktop and the Kandji MDM API, enabling AI-driven device management, compliance reporting, and automation through natural language.

The project integrates with Kandji's REST API to expose MCP tools for device queries, compliance checks, blueprint management, and device actions.

## Architecture

### Core Components

- **FastMCP Integration**: Built on TypeScript-based FastMCP framework for MCP server implementation
- **Kandji Client**: HTTP client wrapper (`utils/client.ts`) for Kandji API interactions with authentication
- **Tools**: MCP tool definitions in `src/tools/` - each tool wraps a Kandji API capability
- **Types**: TypeScript type definitions in `utils/types.ts` for API models
- **Caching Layer**: TTL-based cache (`utils/cache.ts`) for device (5min), compliance (2min), and blueprint (30min) data

### Response Envelope Standard

All tools MUST return a standardized response envelope:
```json
{
  "success": boolean,
  "summary": "Human-readable summary",
  "table": {
    "columns": ["Col1", "Col2"],
    "rows": [{ "Col1": "value", "Col2": "value" }]
  },
  "metadata": {
    "totalCount": number,
    "elapsedMs": number,
    "cached": boolean,
    "source": "Kandji API"
  },
  "suggestions": ["Next action 1", "Next action 2"],
  "errors": [{ "category": "validation|auth|rate_limit|network|server", "message": "...", "recovery": ["..."] }]
}
```

### Error Categories

Handle all errors with structured recovery strategies:
- `validation`: Bad/missing parameters → correct input
- `auth`: Invalid/expired token → regenerate token
- `rate_limit`: API throttle → exponential backoff retry
- `network`: Timeout/DNS → retry or check connectivity
- `server`: 5xx errors → graceful fail + retry later

## Development Commands

### Setup
```bash
npm install
```

### Development Mode
```bash
npm run dev
fastmcp serve
```

### Testing
```bash
npm test                # Run unit tests (61 tests)
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:all        # Run integration tests
```

**Current Test Status:**
- 61 unit tests passing
- 32% overall coverage (utils at 80%+)
- Coverage targets: 80% lines, branches, functions
- 3 test suites: cache.test.ts, client.test.ts, tools.test.ts

### Configuration

Required `.env` file:
```
KANDJI_API_TOKEN=your_api_key_here
KANDJI_SUBDOMAIN=your_subdomain_here
KANDJI_API_URL=https://{subdomain}.api.kandji.io/api/v1
```

NEVER commit `.env` to Git. Validate token presence before server startup.

## Tool Implementation Pattern

Each tool in `src/tools/` follows this pattern:

```typescript
import { defineTool } from "fastmcp";
import { KandjiClient } from "../utils/client";

export const toolName = defineTool({
  name: "tool_name",
  description: "Clear description for AI interpretation",
  parameters: {
    param: { type: "string", description: "Parameter description" }
  },
  async run({ param }) {
    // 1. Validate parameters (Zod)
    // 2. Check cache (if applicable)
    // 3. Call Kandji API via client
    // 4. Transform to response envelope
    // 5. Apply PII redaction if enabled
    // 6. Log audit trail
    return { success: true, summary: "...", table: {...}, metadata: {...} };
  }
});
```

## Security Requirements

- **PII Redaction**: Session-based toggle for masking user emails, names in responses
- **Device Erase Logging**: Erase actions logged to stdout for accountability
- **Read-Only Default**: Destructive operations (`execute_device_action`) require explicit `confirm: true` parameter
- **No Emoji**: Never use emoji in logs or console output
- **Security Best Practices**: Secure credential storage (.env gitignored), Zod input validation, HTTPS-only API calls

## Implemented MCP Tools

The server provides **23 fully implemented MCP tools** across these categories:

### Device Management (9 tools)
- `search_devices_by_criteria` - Filter devices by criteria
- `get_device_details` - Device hardware/software details
- `get_device_activity` - Activity history with pagination
- `get_device_apps` - Installed applications list
- `get_device_library_items` - Library items and statuses
- `get_device_parameters` - Parameters for macOS devices
- `get_device_status` - Comprehensive status view
- `get_device_lost_mode_details` - Lost mode for iOS/iPadOS
- `execute_device_action` - Device actions (lock, restart, erase)

### Compliance & Reporting (2 tools)
- `get_compliance_summary` - Org-wide compliance metrics
- `list_audit_events` - Audit log events with filtering

### Configuration (2 tools)
- `list_blueprints` - Device blueprints
- `get_tags` - Tag management

### User Management (2 tools)
- `list_users` - Directory integration users
- `get_user` - Specific user details

### Security & Vulnerabilities (6 tools)
- `list_vulnerabilities` - CVE vulnerability list
- `get_vulnerability_details` - Specific CVE details
- `list_vulnerability_detections` - Fleet-wide detections
- `list_affected_devices` - Devices by CVE
- `list_affected_software` - Software by CVE
- `list_behavioral_detections` - Threat detections

### Threat Management (2 tools)
- `get_threat_details` - Detailed threat info
- `get_licensing` - License utilization

All tools follow the standardized pattern with response envelopes, caching, and error handling.

## Performance Targets

- P95 latency: < 2 seconds
- Cache hit rate: ≥ 40%
- Error rate: < 5%

## Kandji API Integration

Base URL: `https://{subdomain}.api.kandji.io/api/v1`

Authentication: Bearer token in `Authorization` header

Key endpoints:
- `GET /devices` - List devices
- `GET /devices/{id}` - Device details
- `GET /blueprints` - List blueprints
- `POST /devices/{id}/action` - Execute device action

Implement exponential backoff for rate limiting (Kandji API has rate limits).

## Testing Strategy

Tests are organized in `test/` directory:

### Unit Tests (`test/unit/`)
- **cache.test.ts**: TTL expiration, pattern invalidation, cleanup
- **client.test.ts**: Error categorization, PII redaction, API calls
- **tools.test.ts**: Response envelopes, validation, caching

### Integration Tests (`test/integration/`)
- Live API tests for specific tools
- Requires valid `.env` configuration
- Run with `npm run test:all`

### Test Coverage
Run `npm run test:coverage` to generate HTML coverage reports in `coverage/` directory.

Focus areas:
1. Response envelope validation (all fields present)
2. Error handling for each category (auth, validation, rate_limit, network, server)
3. Cache behavior and TTL expiry
4. Parameter validation with Zod schemas
5. PII redaction toggle functionality
