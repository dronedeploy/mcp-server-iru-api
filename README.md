# Kandji MCP Server

AI-driven device management through Model Context Protocol. This MCP server enables natural-language interactions with the Kandji MDM API via Claude Desktop.

## Features

- **Device Search**: Find devices by name, platform, or blueprint
- **Device Details**: Retrieve comprehensive device information
- **Compliance Reporting**: Organization-wide compliance summaries
- **Blueprint Management**: List and query device blueprints
- **Device Actions**: Lock, restart, shutdown, or erase devices (with confirmation)
- **Smart Caching**: TTL-based caching for optimal performance
- **PII Redaction**: Optional privacy mode for sensitive data
- **Error Handling**: Structured error responses with recovery strategies

## Installation

### Prerequisites

- Node.js 18 or higher
- Kandji API token
- Kandji subdomain

### Setup

1. Clone the repository:
```bash
git clone https://github.com/mangopudding/mcp-server-kandji-api.git
cd mcp-server-kandji-api
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
KANDJI_API_TOKEN=your_api_token_here
KANDJI_SUBDOMAIN=your_subdomain_here
KANDJI_REGION=us
```

### Getting Your Kandji API Token

1. Log in to your Kandji tenant
2. Navigate to Settings → Access
3. Click "Add API Token"
4. Copy the generated token to your `.env` file

## Usage

### Development Mode

Run the server in development mode with auto-reload:
```bash
npm run dev
```

### Production Mode

Build and run in production:
```bash
npm run build
npm start
```

### Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Configuring Claude Desktop

Add this server to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "kandji": {
      "command": "node",
      "args": ["/path/to/mcp-server-kandji-api/dist/index.js"],
      "env": {
        "KANDJI_API_TOKEN": "your_token",
        "KANDJI_SUBDOMAIN": "your_subdomain",
        "KANDJI_REGION": "us"
      }
    }
  }
}
```

## Available MCP Tools

### 1. search_devices_by_criteria

Filter devices by name, platform, or blueprint.

**Parameters:**
- `name` (optional): Filter by device name (partial match)
- `platform` (optional): Filter by platform (Mac, iPhone, iPad, AppleTV)
- `blueprint_id` (optional): Filter by blueprint UUID

**Example:**
```
"Show me all MacBooks"
"Find devices with 'Engineering' in the name"
```

### 2. get_device_details

Retrieve detailed information about a specific device.

**Parameters:**
- `device_id` (required): Device UUID

**Example:**
```
"Show me details for device abc-123-def"
```

### 3. get_compliance_summary

Get organization-wide compliance summary.

**Parameters:** None

**Example:**
```
"Show me the compliance summary"
"What's our current compliance rate?"
```

### 4. list_blueprints

List all device blueprints.

**Parameters:** None

**Example:**
```
"List all blueprints"
"What blueprints are available?"
```

### 5. execute_device_action

Execute device actions (requires explicit confirmation).

**Parameters:**
- `device_id` (required): Device UUID
- `action` (required): Action to perform (lock, restart, shutdown, erase)
- `confirm` (required): Must be `true`
- `message` (optional): Lock screen message (for lock action)
- `pin` (optional): 6-digit PIN (for erase action on macOS)

**Example:**
```
"Lock device abc-123-def with message 'Contact IT'"
"Restart device abc-123-def"
```

**IMPORTANT:** The erase action is destructive and will wipe the device. Always verify the device ID before confirming.

## Architecture

```
mcp-server-kandji-api/
├── src/
│   ├── tools/              # MCP tool implementations
│   │   ├── search_devices_by_criteria.ts
│   │   ├── get_device_details.ts
│   │   ├── get_compliance_summary.ts
│   │   ├── list_blueprints.ts
│   │   └── execute_device_action.ts
│   ├── utils/              # Core utilities
│   │   ├── client.ts       # Kandji API client
│   │   ├── cache.ts        # Caching layer
│   │   └── types.ts        # TypeScript types
│   └── index.ts            # Server entry point
├── .env.example            # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Response Format

All tools return a standardized MCP response envelope:

```json
{
  "success": true,
  "summary": "Human-readable summary",
  "table": {
    "columns": ["Column1", "Column2"],
    "rows": [{"Column1": "value", "Column2": "value"}]
  },
  "data": {},
  "metadata": {
    "elapsedMs": 123,
    "cached": false,
    "source": "Kandji API"
  },
  "suggestions": ["Next action 1", "Next action 2"]
}
```

## Caching

The server implements TTL-based caching for optimal performance:

- **Devices**: 5 minutes (300s)
- **Compliance**: 2 minutes (120s)
- **Blueprints**: 30 minutes (1800s)

Cache TTLs can be customized via environment variables:
```env
CACHE_TTL_DEVICES=300
CACHE_TTL_COMPLIANCE=120
CACHE_TTL_BLUEPRINTS=1800
```

## Security

### PII Redaction

Enable PII redaction to mask user emails and names:
```env
ENABLE_PII_REDACTION=true
```

### Audit Logging

Device actions are automatically logged in JSON format for audit trails. Check console output for logs.

### Destructive Operations

All destructive operations require explicit `confirm: true` parameter. The erase action also logs to the audit trail.

## Error Handling

Errors are categorized and include recovery strategies:

- **validation**: Parameter errors → Fix input
- **auth**: Authentication failures → Regenerate token
- **rate_limit**: API throttling → Retry with backoff
- **network**: Connection issues → Check connectivity
- **server**: Kandji API errors → Retry later

## Performance Targets

- P95 latency: < 2 seconds
- Cache hit rate: ≥ 40%
- Error rate: < 5%

## Rate Limiting

The Kandji API has a rate limit of 10,000 requests per hour per customer. This server implements client-side caching to minimize API calls.

## Contributing

Contributions are welcome! Please ensure:
1. All tests pass
2. Code follows TypeScript best practices
3. Update documentation for new features

## Documentation

- [PRD.md](PRD.md) - Product Requirements Document
- [CLAUDE.md](CLAUDE.md) - Development guidelines for Claude Code
- [API_REFERENCE.md](API_REFERENCE.md) - Kandji API reference

## License

MIT

## Support

For issues or questions:
- Check the [API_REFERENCE.md](API_REFERENCE.md) for endpoint details
- Review [CLAUDE.md](CLAUDE.md) for development guidance
- Open an issue on GitHub

## Acknowledgments

Built with:
- [FastMCP](https://github.com/modelcontextprotocol/fastmcp) - MCP server framework
- [Kandji API](https://api-docs.kandji.io/) - MDM API platform
- [Model Context Protocol](https://modelcontextprotocol.io) - AI integration standard
