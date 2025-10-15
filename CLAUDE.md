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
- **Resources**: JSON schemas in `src/resources/` defining Kandji data models
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
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report (target: 100%)
```

Target: 100% coverage for validation, cache, and error handling.

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
- **Audit Logging**: JSON-structured logs with tool name, sanitized parameters, duration, result size
- **Read-Only Default**: Destructive operations (`execute_device_action`) require explicit `confirm: true` parameter
- **No Emoji**: Never use emoji in logs or console output
- **Compliance**: Align with ISO 27001, SOC 2 T2, GDPR

## MCP Tools to Implement

| Tool | Purpose | Parameters |
|------|---------|------------|
| `search_devices_by_criteria` | Filter devices by name/OS/compliance | name, os, compliance_status |
| `get_device_details` | Retrieve device details by ID | id (UUID) |
| `get_compliance_summary` | Org-wide compliance report | (none) |
| `list_blueprints` | List blueprints and profiles | (none) |
| `execute_device_action` | Lock/restart/wipe (confirmation required) | id, action, confirm |

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

Use Jest + Supertest with mocked Kandji API responses for:
1. Response envelope validation
2. Error handling for each category
3. Cache behavior and TTL expiry
4. Parameter validation (Zod schemas)
5. PII redaction toggle

Mock server responses to enable offline testing.
