# Troubleshooting Tools

This directory contains diagnostic and troubleshooting tools for the Iru/Kandji MCP server.

## Available Tools

### 1. API Access Verification (`verify-api-access.ts`)

Comprehensive script that verifies your API token has the correct permissions and that all API endpoints are accessible.

#### What It Tests

The script tests access to **11 critical API endpoints**:

| Endpoint | Description | Required Scope |
|----------|-------------|----------------|
| `/devices` | List devices | Read: Devices |
| `/devices/{id}` | Get device details | Read: Devices |
| `/blueprints` | List blueprints | Read: Blueprints |
| `/prism/device_information` | Get compliance data | Read: Prism |
| `/settings/licensing` | Get licensing info | Read: Settings |
| `/users` | List users | Read: Users |
| `/tags` | Get tags | Read: Tags |
| `/vulnerability-management/vulnerabilities` | List vulnerabilities | Read: Vulnerability Management |
| `/behavioral-detections` | List behavioral detections | Read: Threat Details |
| `/threat-details` | Get threat details | Read: Threat Details |
| `/audit/events` | List audit events | Read: Audit Logs |

#### Usage

```bash
# Make sure your .env file is configured
npx tsx troubleshooting/verify-api-access.ts
```

#### Example Output

```
🔍 Iru/Kandji API Verification Tool
=====================================

Subdomain: your-company
Region: US
Base URL: https://your-company.api.kandji.io/api/v1

Running API tests...

✅ [PASS] /devices
   List devices
   Successfully retrieved 150 device(s)
   Required Scope: Read: Devices

✅ [PASS] /devices/{id}
   Get device details
   Retrieved details for device: MacBook-Pro-123
   Required Scope: Read: Devices

❌ [FAIL] /vulnerability-management/vulnerabilities
   List vulnerabilities
   Authentication failed: Insufficient permissions
   Required Scope: Read: Vulnerability Management

=====================================
📊 Summary
=====================================

Total Tests: 11
✅ Passed: 10
❌ Failed: 1
⚠️  Warnings: 0
⏭️  Skipped: 0
⏱️  Time: 2345ms

⚠️  Some API endpoints failed. Common issues:

1. API Token Permissions: Ensure your token has the required scopes
2. Subscription Tier: Some features require specific Kandji/Iru subscription tiers
3. Network Access: Verify firewall rules allow access to *.api.kandji.io
4. Token Expiration: Check if your API token is still valid

Failed Endpoints:
  - /vulnerability-management/vulnerabilities (Read: Vulnerability Management)
    Error: Authentication failed: Insufficient permissions
```

#### Interpreting Results

**✅ PASS** - The endpoint is accessible and your token has the correct permissions.

**❌ FAIL** - The endpoint is not accessible. Check the error message for details:
- `Authentication failed` - Token is invalid or expired
- `Insufficient permissions` - Token doesn't have the required scope
- `Rate limit exceeded` - Too many requests, wait and retry
- `Resource not found` - Endpoint may not be available in your subscription tier

**⏭️ SKIP** - The test was skipped (e.g., no devices available to test device details).

**⚠️ WARN** - The endpoint is accessible but returned unexpected data.

## Common Issues and Solutions

### Issue: "Missing required environment variables"

**Problem:** The `.env` file is not configured or is missing required variables.

**Solution:**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your credentials
KANDJI_API_TOKEN=your_token_here
KANDJI_SUBDOMAIN=your_subdomain
KANDJI_REGION=us
```

### Issue: "Authentication failed"

**Problem:** Your API token is invalid, expired, or malformed.

**Solution:**
1. Log in to your Iru/Kandji tenant
2. Navigate to **Settings → Access**
3. Generate a new API token
4. Update the `KANDJI_API_TOKEN` in your `.env` file

### Issue: "Insufficient permissions"

**Problem:** Your API token doesn't have the required scopes for certain endpoints.

**Solution:**
1. Log in to your Iru/Kandji tenant
2. Navigate to **Settings → Access**
3. Edit your existing token or create a new one
4. Grant the necessary permissions (see "Required Scopes" below)

### Issue: "Rate limit exceeded"

**Problem:** You've made too many API requests in a short time.

**Solution:**
- Wait a few minutes before retrying
- The Kandji API has a limit of 10,000 requests per hour
- The MCP server uses caching to minimize API calls

### Issue: "Network timeout" or "ECONNREFUSED"

**Problem:** Network connectivity issues or firewall blocking access.

**Solution:**
1. Check your internet connection
2. Verify firewall rules allow HTTPS (443) to `*.api.kandji.io`
3. Test connectivity: `curl https://your-subdomain.api.kandji.io/api/v1/devices -H "Authorization: Bearer YOUR_TOKEN"`
4. If behind a corporate proxy, configure proxy settings

### Issue: "Resource not found" for specific features

**Problem:** The feature may not be available in your subscription tier.

**Solution:**
- Check your Iru/Kandji subscription tier
- Some features (Vulnerability Management, Threat Details) require specific plans
- Contact Iru support to upgrade your subscription if needed

## Required API Token Scopes

When creating or editing your API token in Iru/Kandji, grant the following scopes for full MCP server functionality:

### Essential (Required for basic functionality)
- ✅ **Read: Devices** - Device listing and details
- ✅ **Read: Blueprints** - Blueprint configurations
- ✅ **Read: Prism** - Compliance and status data

### Recommended (For full feature support)
- ✅ **Read: Settings** - Licensing information
- ✅ **Read: Users** - User directory integration
- ✅ **Read: Tags** - Device tagging
- ✅ **Read: Audit Logs** - Audit event tracking

### Optional (For security features)
- ✅ **Read: Vulnerability Management** - CVE tracking
- ✅ **Read: Threat Details** - Behavioral detections and threats

### Destructive Actions (Use with caution)
- ⚠️ **Write: Device Actions** - Lock, restart, shutdown, erase devices
  - Only grant this if you need to perform device actions via MCP
  - Requires explicit confirmation for destructive operations

## Testing Your Configuration

After setting up your `.env` file and API token, run the verification script:

```bash
# Install dependencies if you haven't already
npm install

# Run the verification script
npx tsx troubleshooting/verify-api-access.ts
```

If all tests pass, your MCP server is ready to use with Claude Desktop or other MCP clients.

## Getting Help

If you continue to experience issues after running the verification script:

1. Review the error messages and check the solutions above
2. Verify your Iru/Kandji subscription includes the features you're trying to use
3. Check the [API documentation](https://api-docs.kandji.io/) for endpoint-specific requirements
4. Open an issue on GitHub with the verification script output

## Advanced Troubleshooting

### Test Individual Endpoints

You can modify the script to test specific endpoints by commenting out tests in the `runAll()` method:

```typescript
async runAll(): Promise<void> {
  // Test only devices
  await this.testDevicesList();
  await this.testDeviceDetails();

  // Comment out other tests
  // await this.testBlueprints();
  // await this.testCompliance();
  // ...
}
```

### Enable Debug Logging

Add debug logging to your `.env`:

```env
LOG_LEVEL=debug
```

This will output detailed API request/response information.

### Test with curl

Manually test API access with curl:

```bash
# Replace YOUR_TOKEN and YOUR_SUBDOMAIN
curl -X GET "https://YOUR_SUBDOMAIN.api.kandji.io/api/v1/devices?limit=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Expected response:
```json
[
  {
    "device_id": "abc-123-def",
    "device_name": "MacBook-Pro",
    "platform": "Mac",
    ...
  }
]
```

### Check API Status

Visit the [Iru Status Page](https://status.kandji.io) to check if there are any ongoing service issues.

## Next Steps

Once your API access is verified:

1. **Configure Claude Desktop** - See [config/README.md](../config/README.md)
2. **Review Available Tools** - See [docs/TOOLS.md](../docs/TOOLS.md)
3. **Try Example Queries** - See example questions in the main [README.md](../README.md)
4. **Run Integration Tests** - Use `npm run test:all` to test all MCP tools
