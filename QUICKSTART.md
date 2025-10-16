# Kandji MCP Server - Quick Start Guide

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root:
```bash
KANDJI_API_TOKEN=your_api_token_here
KANDJI_SUBDOMAIN=your_subdomain
KANDJI_REGION=us  # or 'eu' for European region
```

**Important:** Ensure your API token has ALL permissions enabled in Kandji console.

### 3. Build the Project
```bash
npm run build
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Using with Claude Desktop
The server runs as an MCP server compatible with Claude Desktop. Configure Claude Desktop to connect to this server.

## Testing

### Run All Tests
```bash
npm run test:integration
```

### Run Individual Test Suites
```bash
# Tags management
npm run test:tags

# User management
npm run test:users

# Vulnerability management
npm run test:vulnerabilities

# Threat detection
npm run test:threats

# Licensing information
npm run test:licensing

# Comprehensive all-tools test
npm run test:all
```

## Available MCP Tools

### Device Management (Original Tools)
1. `search_devices_by_criteria` - Search and filter devices
2. `get_device_details` - Get detailed device information
3. `get_compliance_summary` - Organization compliance overview
4. `list_blueprints` - List all blueprints
5. `execute_device_action` - Execute device actions (lock, restart, wipe)
6. `get_licensing` - Licensing information

### User Management
7. `list_users` - List all users with optional filters
8. `get_user` - Get specific user details by ID

### Tags
9. `get_tags` - Get all tags with optional search

### Vulnerability Management
10. `list_vulnerabilities` - List vulnerabilities with filters
11. `get_vulnerability_details` - Get CVE details
12. `list_vulnerability_detections` - List vulnerability detections
13. `list_affected_devices` - Devices affected by a CVE
14. `list_affected_software` - Software affected by a CVE

### Threat Detection
15. `list_behavioral_detections` - List behavioral detections
16. `get_threat_details` - Get detailed threat information

## Quick Test Examples

### Test Tags
```bash
npm run test:tags
```
**Expected Output:**
- Lists all configured tags
- Tests search functionality
- Validates cache behavior

### Test Users
```bash
npm run test:users
```
**Expected Output:**
- Lists all users
- Filters by archived status
- Gets individual user details
- Tests error handling

### Test Vulnerabilities
```bash
npm run test:vulnerabilities
```
**Expected Output:**
- Lists all vulnerabilities
- Filters by severity
- Gets CVE details
- Lists affected devices and software
- Tests pagination

### Test Threats
```bash
npm run test:threats
```
**Expected Output:**
- Lists behavioral detections
- Gets threat details
- Filters by classification and status
- Tests combined filters

## Troubleshooting

### 403 Forbidden Errors
**Problem:** API token lacks permissions
**Solution:**
1. Log into Kandji console
2. Generate new API token with ALL permissions
3. Update `.env` file with new token

### Build Errors
**Problem:** TypeScript compilation fails
**Solution:**
```bash
# Clean build
rm -rf dist/
npm run build
```

### Network Errors
**Problem:** Connection timeouts
**Solution:**
1. Verify `KANDJI_SUBDOMAIN` is correct
2. Check internet connectivity
3. Verify region setting (us/eu)

### Cache Issues
**Problem:** Stale data being returned
**Solution:** Restart the server to clear in-memory cache

## API Response Format

All tools return a standardized response envelope:

```json
{
  "success": true,
  "summary": "Found 15 users",
  "table": {
    "columns": ["Email", "Name", "Status"],
    "rows": [
      {"Email": "user@example.com", "Name": "John Doe", "Status": "Active"}
    ]
  },
  "data": { /* Full API response */ },
  "metadata": {
    "totalCount": 15,
    "elapsedMs": 245,
    "cached": false,
    "source": "Kandji API"
  },
  "suggestions": [
    "Use filters to narrow results",
    "Check individual items for details"
  ]
}
```

## Error Response Format

```json
{
  "success": false,
  "errors": [{
    "category": "auth",
    "message": "Invalid API token",
    "recovery": [
      "Verify KANDJI_API_TOKEN in .env file",
      "Regenerate API token in Kandji settings"
    ]
  }],
  "metadata": {
    "elapsedMs": 125,
    "cached": false,
    "source": "Kandji API"
  }
}
```

## Performance Tips

### Cache Hit Rates
To maximize cache performance:
- Query the same data repeatedly within TTL windows
- Use broader filters first, then narrow down
- Avoid random device/user ID queries

### Optimal Query Patterns
```bash
# Good: List users once, then get specific users
1. list_users → cache hit for 5 minutes
2. get_user(id1) → cache hit for 5 minutes
3. get_user(id2) → cache hit for 5 minutes

# Not optimal: Different queries each time
1. get_user(random_id1)
2. get_user(random_id2)
3. get_user(random_id3)
```

## Cache TTL Reference

| Tool | TTL | Best For |
|------|-----|----------|
| Tags | 30 min | Infrequent changes |
| Users | 5 min | Moderate updates |
| Vulnerabilities | 2 min | Security monitoring |
| Threats | 2 min | Real-time detection |
| Licensing | 1 hour | Billing/admin |

## Next Steps

1. ✅ Run `npm run test:integration` to verify all tools work
2. ✅ Review test output for any permission issues
3. ✅ Update API token if needed
4. ✅ Integrate with Claude Desktop
5. ✅ Start using MCP tools for device management

## Documentation

- **TEST_SUITE.md** - Comprehensive test documentation
- **IMPLEMENTATION_SUMMARY.md** - Technical implementation details
- **docs/API_REFERENCE.md** - Full Kandji API reference
- **CLAUDE.md** - Development guidelines

## Support

For issues or questions:
1. Check error messages and recovery suggestions
2. Review documentation files
3. Verify .env configuration
4. Ensure API token has full permissions
5. Check Kandji API status

---

**Ready to use!** Run `npm run test:integration` to get started.
