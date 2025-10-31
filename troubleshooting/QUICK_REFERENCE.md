# Quick Troubleshooting Reference Card

## Quick Commands

```bash
# Verify API access and permissions
npm run verify

# Check if .env is configured
cat .env | grep -E "KANDJI_(API_TOKEN|SUBDOMAIN|REGION)"

# Test API connectivity with curl
curl -X GET "https://YOUR_SUBDOMAIN.api.kandji.io/api/v1/devices?limit=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# View Claude Desktop MCP logs
tail -f ~/Library/Logs/Claude/mcp*.log

# Run all integration tests
npm run test:all

# Check MCP server process
ps aux | grep "mcp-server-iru-api"
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing required environment variables` | `.env` not configured | Copy `.env.example` to `.env` and add credentials |
| `Authentication failed` | Invalid/expired token | Generate new token in Settings → Access |
| `Insufficient permissions` | Token missing required scope | Edit token permissions in Iru dashboard |
| `Rate limit exceeded` | Too many API requests | Wait 1 hour or use caching |
| `ECONNREFUSED` | Network/firewall issue | Check firewall, test with curl |
| `Resource not found` | Feature not in subscription | Check subscription tier |

## Required API Token Scopes

### Essential (Core functionality)
- ✅ Read: Devices
- ✅ Read: Blueprints
- ✅ Read: Prism

### Recommended (Full features)
- ✅ Read: Settings
- ✅ Read: Users
- ✅ Read: Tags
- ✅ Read: Audit Logs

### Optional (Security features)
- ✅ Read: Vulnerability Management
- ✅ Read: Threat Details

### Destructive (Use with caution)
- ⚠️ Write: Device Actions

## Status Check Checklist

- [ ] `.env` file exists and has `KANDJI_API_TOKEN` and `KANDJI_SUBDOMAIN`
- [ ] API token is valid (not expired)
- [ ] Token has required permissions (scopes)
- [ ] Network allows HTTPS to `*.api.kandji.io`
- [ ] Subscription includes features being accessed
- [ ] `npm run verify` passes all tests
- [ ] Claude Desktop config points to correct path
- [ ] MCP server builds without errors (`npm run build`)

## Where to Get Help

1. **API Verification Failed?** → See [troubleshooting/README.md](README.md)
2. **Claude Desktop Issues?** → See [config/README.md](../config/README.md)
3. **MCP Tool Errors?** → See [docs/TOOLS.md](../docs/TOOLS.md)
4. **Still Stuck?** → Open GitHub issue with `npm run verify` output

## Testing Your Setup

```bash
# Step 1: Verify environment
cat .env

# Step 2: Verify API access
npm run verify

# Step 3: Build the server
npm run build

# Step 4: Test in dev mode
npm run dev
# (Send test request via MCP client)

# Step 5: Configure Claude Desktop
# See config/README.md

# Step 6: Test in Claude Desktop
# Ask: "How many devices are in my Kandji tenant?"
```

## API Endpoint Quick Reference

| Category | Endpoint | Scope Required |
|----------|----------|----------------|
| **Devices** | `/devices` | Read: Devices |
| | `/devices/{id}` | Read: Devices |
| | `/devices/{id}/apps` | Read: Devices |
| | `/devices/{id}/activity` | Read: Devices |
| **Compliance** | `/prism/device_information` | Read: Prism |
| **Config** | `/blueprints` | Read: Blueprints |
| | `/tags` | Read: Tags |
| **Users** | `/users` | Read: Users |
| **Security** | `/vulnerability-management/*` | Read: Vulnerability Management |
| | `/behavioral-detections` | Read: Threat Details |
| | `/threat-details` | Read: Threat Details |
| **Audit** | `/audit/events` | Read: Audit Logs |
| **Settings** | `/settings/licensing` | Read: Settings |

## Contact & Resources

- **Iru API Docs**: https://api-docs.kandji.io/
- **Iru Status**: https://status.kandji.io/
- **MCP Docs**: https://modelcontextprotocol.io/
- **GitHub Issues**: https://github.com/mangopudding/mcp-server-iru-api/issues
