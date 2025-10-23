# Kandji MCP Server

AI-driven device management through Model Context Protocol. This MCP server enables natural-language interactions with the Kandji MDM API via Claude Desktop.

## Features

### Core Capabilities
- **23 MCP Tools**: Comprehensive device, security, and compliance management
- **Device Management**: Search, inspect, monitor, and control devices
- **Security Monitoring**: Vulnerability tracking, threat detection, and behavioral analysis
- **Compliance Reporting**: Organization-wide compliance and audit logging
- **User Management**: Directory integration and user lifecycle management
- **Configuration Management**: Blueprints, tags, and library items

### Technical Features
- **Smart Caching**: TTL-based caching (5min devices, 2min compliance, 30min blueprints)
- **Script Generation**: Automatic bash scripts for large data exports with pagination handling
- **Comprehensive Testing**: 61 unit tests with 32% coverage (utils at 80%+)
- **PII Redaction**: Optional privacy mode for sensitive data
- **Error Handling**: Categorized errors (auth, validation, rate_limit, network, server) with recovery strategies
- **Response Envelopes**: Standardized response format with tables, metadata, and suggestions
- **Security**: Explicit confirmation for destructive operations, secure credential storage

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

**See [config/README.md](config/README.md) for detailed setup instructions.**

Quick setup:

1. Build the server: `npm run build`
2. Copy example config: `cp config/claude_desktop_config.example.json ~/Desktop/`
3. Edit with your Kandji credentials and absolute path
4. Add to `~/Library/Application Support/Claude/claude_desktop_config.json`
5. Restart Claude Desktop

**Example configuration:**
```json
{
  "mcpServers": {
    "kandji": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server-kandji-api/dist/index.js"],
      "env": {
        "KANDJI_API_TOKEN": "your_token",
        "KANDJI_SUBDOMAIN": "your_subdomain",
        "KANDJI_REGION": "us"
      }
    }
  }
}
```

For troubleshooting and advanced options, see [config/README.md](config/README.md).

## Available MCP Tools

The server provides **23 MCP tools** organized into the following categories:

### Device Management (9 tools)

#### search_devices_by_criteria
Filter devices by name, platform, or blueprint.
- **Parameters**: `name`, `platform`, `blueprint_id` (all optional)
- **Example**: "Show me all MacBooks in Engineering"

#### get_device_details
Retrieve comprehensive device information including hardware, software, and MDM status.
- **Parameters**: `device_id` (required)
- **Example**: "Show me details for device abc-123-def"

#### get_device_activity
Retrieve device activity history with pagination support.
- **Parameters**: `device_id` (required), `limit`, `offset` (optional)
- **Example**: "Show recent activity for device abc-123-def"

#### get_device_apps
List all installed applications on a device.
- **Parameters**: `device_id` (required)
- **Example**: "What apps are installed on device abc-123-def"

#### get_device_library_items
View library items (profiles, apps, scripts) and their installation status.
- **Parameters**: `device_id` (required)
- **Example**: "Show library items for device abc-123-def"

#### get_device_parameters
Get parameters and compliance status for macOS devices.
- **Parameters**: `device_id` (required)
- **Example**: "Show parameters for device abc-123-def"

#### get_device_status
Get comprehensive status including both parameters and library items.
- **Parameters**: `device_id` (required)
- **Example**: "Show full status for device abc-123-def"

#### get_device_lost_mode_details
Check lost mode status for iOS/iPadOS devices.
- **Parameters**: `device_id` (required)
- **Example**: "Is device abc-123-def in lost mode?"

#### execute_device_action
Execute device actions (lock, restart, shutdown, erase) with required confirmation.
- **Parameters**: `device_id`, `action`, `confirm` (all required), `message`, `pin` (optional)
- **Example**: "Lock device abc-123-def with message 'Contact IT'"
- **⚠️ IMPORTANT**: Erase action is destructive and will wipe the device.

### Compliance & Reporting (2 tools)

#### get_compliance_summary
Organization-wide compliance report showing compliant vs non-compliant devices.
- **Parameters**: None
- **Example**: "What's our current compliance rate?"

#### list_audit_events
List audit log events from Kandji Activity module with filtering.
- **Parameters**: `limit`, `sort_by`, `start_date`, `end_date`, `cursor` (all optional)
- **Example**: "Show audit events from last week"

### Configuration Management (2 tools)

#### list_blueprints
List all device blueprints and their configurations.
- **Parameters**: None
- **Example**: "What blueprints are available?"

#### get_tags
Get configured tags with optional search filtering.
- **Parameters**: `search` (optional)
- **Example**: "Show all tags"

### User Management (2 tools)

#### list_users
List users from directory integrations with filtering.
- **Parameters**: `email`, `id`, `integration_id`, `archived` (all optional)
- **Example**: "Show all users"

#### get_user
Get specific user details by ID.
- **Parameters**: `user_id` (required)
- **Example**: "Show user details for user-123"

### Security & Vulnerabilities (6 tools)

#### list_vulnerabilities
List all vulnerabilities grouped by CVE with pagination.
- **Parameters**: `page`, `size`, `sort_by`, `filter` (all optional)
- **Example**: "Show all critical vulnerabilities"

#### get_vulnerability_details
Get detailed information about a specific CVE.
- **Parameters**: `cve_id` (required)
- **Example**: "Show details for CVE-2024-12345"

#### list_vulnerability_detections
List all vulnerability detections across the device fleet.
- **Parameters**: `after`, `size`, `filter` (all optional)
- **Example**: "Show recent vulnerability detections"

#### list_affected_devices
List devices affected by a specific CVE.
- **Parameters**: `cve_id` (required), `page`, `size` (optional)
- **Example**: "Which devices are affected by CVE-2024-12345?"

#### list_affected_software
List software packages affected by a specific CVE.
- **Parameters**: `cve_id` (required), `page`, `size` (optional)
- **Example**: "What software is affected by CVE-2024-12345?"

#### list_behavioral_detections
Get behavioral threat detections from Kandji security monitoring.
- **Parameters**: `threat_id`, `classification`, `status`, `device_id`, `limit` (all optional)
- **Example**: "Show all malicious detections"

### Threat Management (2 tools)

#### get_threat_details
Get detailed threat information with filtering.
- **Parameters**: `classification`, `status`, `device_id`, `limit` (all optional)
- **Example**: "Show all quarantined threats"

#### get_licensing
Get Kandji tenant licensing and utilization information.
- **Parameters**: None
- **Example**: "Show licensing information"

For detailed parameter descriptions, examples, and response formats, see the [Complete Tool Reference](docs/TOOLS.md).

## Architecture

```
mcp-server-kandji-api/
├── src/
│   ├── tools/              # MCP tool implementations (23 tools)
│   │   ├── search_devices_by_criteria.ts
│   │   ├── get_device_details.ts
│   │   ├── get_device_activity.ts
│   │   ├── get_device_apps.ts
│   │   ├── list_audit_events.ts
│   │   └── ... (18 more tools)
│   ├── utils/              # Core utilities
│   │   ├── client.ts       # Kandji API client
│   │   ├── cache.ts        # Caching layer
│   │   └── types.ts        # TypeScript types
│   └── index.ts            # Server entry point
├── config/                 # Claude Desktop configuration
│   ├── README.md           # Setup instructions
│   └── claude_desktop_config.example.json
├── test/                   # Test suite
│   ├── unit/               # Jest unit tests (61 tests)
│   ├── integration/        # Integration tests
│   └── scripts/            # Test utilities
├── docs/                   # Documentation
│   ├── api/                # API reference files
│   ├── CLAUDE.md
│   ├── PRD.md
│   └── QUICKSTART.md
├── scripts/                # Utility scripts
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

### Security Features

**Destructive Operations:**
- All destructive operations require explicit `confirm: true` parameter
- Device erase actions logged to stdout for accountability
- All API operations logged by Kandji's cloud audit system

**For Local Logging:**
```bash
# Redirect stdout to capture logs
npm start 2>&1 | tee kandji-mcp.log
```

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

- [TOOLS.md](docs/TOOLS.md) - **Complete reference for all 23 MCP tools**
- [QUICKSTART.md](docs/QUICKSTART.md) - Quick start guide
- [TEST_SUITE.md](docs/TEST_SUITE.md) - Testing documentation
- [CLAUDE.md](docs/CLAUDE.md) - Development guidelines for Claude Code
- [PRD.md](docs/PRD.md) - Product Requirements Document
- [API_REFERENCE.md](docs/API_REFERENCE.md) - Kandji API reference

## License

MIT

## Support

For issues or questions:
- Check the [API_REFERENCE.md](docs/API_REFERENCE.md) for endpoint details
- Review [CLAUDE.md](docs/CLAUDE.md) for development guidance
- Open an issue on GitHub

## Acknowledgments

Built with:
- [FastMCP](https://github.com/modelcontextprotocol/fastmcp) - MCP server framework
- [Kandji API](https://api-docs.kandji.io/) - MDM API platform
- [Model Context Protocol](https://modelcontextprotocol.io) - AI integration standard
