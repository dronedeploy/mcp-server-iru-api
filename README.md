# MCP Server for Iru API (Previously Kandji API)

> **📢 Rebranding Notice:** Kandji has rebranded as **Iru**. This MCP server continues to work with the Iru platform (formerly Kandji). All API endpoints and functionality remain unchanged. For more information about Iru, visit [iru.com](https://iru.com).

AI-driven device management through Model Context Protocol. This MCP server enables natural-language interactions with the Iru (formerly Kandji) MDM API via Claude Desktop and other AI platforms.

> **🚀 Multi-Platform Support:** This server is being designed to support multiple AI platforms beyond Claude Desktop, including Google Gemini CLI, Ollama, OpenAI ChatGPT, and Microsoft Copilot Studio. See [Multi-Platform Support](#multi-platform-support) and the [ROADMAP](ROADMAP.md) for implementation planning and status.

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
- **Comprehensive Testing**: 456 unit tests with 81% branch coverage (exceeds 80% threshold)
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
git clone https://github.com/mangopudding/mcp-server-iru-api.git
cd mcp-server-iru-api
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

### Verify API Access

After configuring your `.env` file, verify your API token has the correct permissions:

```bash
npm run verify
```

This will test all API endpoints and report any permission issues. See [troubleshooting/README.md](troubleshooting/README.md) for details.

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

## Multi-Platform Support

This MCP server is designed to work with multiple AI platforms. **Claude Desktop is production-ready today.** Additional platform integrations are in planning and development phases.

> **📋 Planning Phase:** Comprehensive implementation plans for Google Gemini CLI, Ollama, OpenAI ChatGPT, and Microsoft Copilot Studio are documented in the [ROADMAP](ROADMAP.md). Integration guides are being prepared to support future implementations.

### Platform Comparison

| Platform | Transport | Code Changes | Setup Time | Monthly Cost | Status |
|----------|-----------|--------------|------------|--------------|--------|
| **[Claude Desktop](config/README.md)** | stdio | None | 5 min | $20 | ✅ Production Ready |
| **[Google Gemini CLI](docs/integrations/GEMINI_CLI.md)** | stdio | None | 30 min | $0-20 | 📝 Documented |
| **[Ollama](docs/integrations/OLLAMA.md)** | stdio (bridge) | None | 2 hours | $0 | 📋 Planned |
| **[OpenAI ChatGPT](docs/integrations/CHATGPT.md)** | HTTP | Extensive | 3-4 weeks | $12-65 | 📋 Planned |
| **[Microsoft Copilot Studio](docs/integrations/COPILOT_STUDIO.md)** | HTTP | Extensive | 3-4 weeks | $320-500 | 📋 Planned |

### Quick Decision Guide

**Choose Claude Desktop** (current default):
- ✅ Best overall MCP experience
- ✅ Production-ready and stable
- ✅ Native MCP support
- ✅ 5-minute setup

**Choose [Google Gemini CLI](docs/integrations/GEMINI_CLI.md)**:
- ✅ Zero code changes (works with current stdio server)
- ✅ Free tier available (1,500 requests/day)
- ✅ Command-line interface
- ✅ 1M token context window
- ✅ 30-minute setup

**Choose [Ollama](docs/integrations/OLLAMA.md)**:
- ✅ 100% local and offline
- ✅ Complete privacy (no cloud calls)
- ✅ Zero ongoing costs
- ✅ Works with existing stdio server

**Choose [OpenAI ChatGPT](docs/integrations/CHATGPT.md)**:
- ⚠️ Requires extensive HTTP refactoring (3-4 weeks)
- ⚠️ Hosting costs ($12-65/month)
- ℹ️ Consider Gemini CLI as simpler alternative

**Choose [Microsoft Copilot Studio](docs/integrations/COPILOT_STUDIO.md)**:
- ⚠️ Enterprise-only (requires M365 infrastructure)
- ⚠️ Expensive ($320-500/month)
- ⚠️ 3-4 weeks implementation
- ℹ️ Only for organizations with M365 investment

### Implementation Status & Planning

**Current Status:**
- ✅ **Claude Desktop** - Production ready, fully tested
- 📝 **Google Gemini CLI** - Implementation guide prepared, ready for Phase 1
- 📋 **Ollama** - Detailed plan prepared for Phase 2
- 📋 **OpenAI ChatGPT** - Architecture design and requirements documented for Phase 3
- 📋 **Microsoft Copilot Studio** - Enterprise requirements documented for Phase 4

**Next Steps:**
1. Review the **[ROADMAP](ROADMAP.md)** for detailed implementation plans
2. Explore **[integration guides](docs/integrations/)** for planned features
3. See [docs/integrations/GEMINI_CLI.md](docs/integrations/GEMINI_CLI.md) for the most detailed future integration example

**Note:** The integration guides represent planned implementations with detailed technical specifications. Actual implementation timing will depend on community interest and contributions.

## Example Questions for IT & Security Teams

Ask these natural language questions in Claude Desktop to get actionable insights from your Iru/Kandji tenant. These examples demonstrate real-world IT and security use cases.

### Security & Threat Intelligence

**Vulnerability Management:**
- "What are the top 10 most critical vulnerabilities affecting my fleet?"
- "Show me all devices with known exploitable vulnerabilities"
- "Which vulnerabilities have been detected in the last 7 days?"
- "What devices are affected by CVE-2024-XXXXX?"
- "List all high-severity CVEs with a CVSS score above 8.0"
- "Show me vulnerable software that's installed on more than 50 devices"

**Threat Detection & Response:**
- "Are there any active malware detections in my environment?"
- "Show me all quarantined threats from the last 30 days"
- "List devices with behavioral detections classified as 'malicious'"
- "What threats have been detected but not quarantined?"
- "Show me all threat detections on executive devices"

**Security Audit & Compliance:**
- "Show me recent audit events related to device actions"
- "What configuration changes were made in the last week?"
- "Who performed device erase actions in the last 30 days?"
- "List all authentication failures from the audit log"
- "Show me admin activities from a specific date range"

### Device Fleet Management

**Compliance Monitoring:**
- "What's our current fleet compliance rate?"
- "Show me all non-compliant devices"
- "Which devices haven't checked in for more than 7 days?"
- "List all Mac devices that are not FileVault encrypted"
- "Show me iOS devices that aren't supervised"
- "What's the compliance breakdown by platform (Mac, iPhone, iPad)?"

**Device Inventory & Discovery:**
- "How many devices do we have in each blueprint?"
- "Show me all MacBooks assigned to the Engineering team"
- "List all devices running macOS versions older than Sonoma"
- "What devices are assigned to user@company.com?"
- "Show me all iPad devices in lost mode"
- "Which devices have the Kandji agent version 1.2.3 installed?"

**Application & Software Management:**
- "What apps are installed on John's MacBook?"
- "Show me all devices with Zoom installed"
- "Which devices are missing required security software?"
- "List all devices with unapproved software installed"
- "What's the distribution of Microsoft Office versions across Macs?"

### Configuration & Deployment

**Blueprint & Policy Management:**
- "What blueprints are available in my tenant?"
- "Show me all library items assigned to the 'Executive' blueprint"
- "Which devices are in the default blueprint?"
- "List all configuration profiles deployed to iOS devices"
- "What scripts are pending installation on device XYZ?"

**Device Status & Health:**
- "Show me the full compliance status for device ABC-123"
- "What library items failed to install on this device?"
- "Check the parameter status for all Mac devices in Engineering"
- "Which devices have pending updates or installations?"
- "Show me device activity history for the last 24 hours"

### User & Identity Management

**User Lifecycle:**
- "How many active users are in my directory integration?"
- "Show me all users created in the last 30 days"
- "List devices assigned to users in the Finance department"
- "What devices does user.name@company.com have enrolled?"
- "Show me all archived users"

**Access & Licensing:**
- "What's our current license utilization?"
- "How many licenses are available?"
- "Show me our licensing tier and subscription status"
- "When does our subscription expire?"

### Incident Response & Remediation

**Device Actions (Read-Only Queries):**
- "Show me the last known location of device ABC-123"
- "What's the battery level and connection status of device XYZ?"
- "List all devices currently in lost mode"
- "Show me recent activity for a potentially compromised device"

**Investigation & Forensics:**
- "What apps were recently installed on device ABC-123?"
- "Show me all network configuration changes on this device"
- "What user accounts exist on device XYZ?"
- "List all failed login attempts on executive devices"
- "Show me parameter compliance history for this device"

### Reporting & Analytics

**Executive Summaries:**
- "Give me a high-level security overview of my fleet"
- "What's our overall compliance percentage by platform?"
- "How many critical vulnerabilities need immediate attention?"
- "Show me a summary of threats detected this month"
- "What's the health status of our device fleet?"

**Trend Analysis:**
- "How has our compliance rate changed over the last 30 days?"
- "Show me vulnerability detection trends for this quarter"
- "What devices consistently fail compliance checks?"
- "List devices with recurring security issues"

**Capacity Planning:**
- "How many more devices can we enroll with our current license?"
- "What's the breakdown of device types in our fleet?"
- "Show me devices by macOS version for upgrade planning"
- "How many devices will need hardware replacement based on age?"

### Cross-Functional Queries

**Combining Multiple Data Sources:**
- "Show me all non-compliant devices with high-severity vulnerabilities"
- "List executive devices with any security threats or vulnerabilities"
- "Which Engineering team devices haven't checked in this week?"
- "Show me devices in the Finance blueprint that are non-compliant"
- "Find all devices with vulnerabilities that also have malware detections"

### Quick Troubleshooting

**Common IT Help Desk Questions:**
- "Is device ABC-123 checking in properly?"
- "What's the MDM enrollment status of this device?"
- "Show me why device XYZ is marked as non-compliant"
- "What library items are pending on this device?"
- "Is FileVault enabled on this Mac?"
- "What's the last activity timestamp for device ABC-123?"

**Proactive Monitoring:**
- "Are there any devices that need immediate attention?"
- "Show me devices with failed security configurations"
- "List all devices with agent communication issues"
- "What devices have been offline for more than 48 hours?"

### Tips for Effective Questions

1. **Be Specific**: Reference device IDs, CVE IDs, or user emails when possible
2. **Use Time Ranges**: "in the last 7 days", "this month", "since January 1st"
3. **Filter by Criteria**: Platform (Mac/iPhone/iPad), blueprint, severity, status
4. **Chain Queries**: Start broad, then drill down based on results
5. **Export Large Datasets**: For queries returning 100+ results, request a bash script for complete data export

### Need More Examples?

See the [Complete Tool Reference](docs/TOOLS.md) for detailed parameter descriptions and additional examples for all 23 MCP tools.

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
│   ├── unit/               # Jest unit tests (456 tests, 81% coverage)
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
