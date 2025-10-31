# API Scope and Permission Verification

## Overview

The verification script now properly detects and reports API token permission/scope issues. This document explains how scope verification works and what to expect.

## How It Works

### 1. HTTP Status Code Detection

The Kandji/Iru API returns different HTTP status codes for different error conditions:

| Status Code | Meaning | Cause |
|-------------|---------|-------|
| **401 Unauthorized** | Authentication failed | Invalid or expired API token |
| **403 Forbidden** | Permission denied | Valid token but missing required scope |
| **404 Not Found** | Resource not found | Endpoint doesn't exist or feature not available |
| **429 Too Many Requests** | Rate limit exceeded | Too many API calls in time window |
| **5xx Server Error** | Server-side error | Kandji/Iru infrastructure issue |

### 2. Error Categorization

The verification script categorizes errors into:

- **authentication** - Token is invalid/expired (401)
- **permission** - Token lacks required scope (403)
- **not_found** - Endpoint unavailable (404)
- **rate_limit** - API throttling (429)
- **network** - Connectivity issues
- **unknown** - Other errors

### 3. Scope Enhancement

When a permission error (403) is detected, the script:

1. Identifies which API scope is missing
2. Enhances the error message with the specific scope name
3. Groups permission failures separately in the summary
4. Provides actionable remediation steps

## Example Output

### Successful Verification

```
✅ [PASS] /devices
   List devices
   Successfully retrieved 150 device(s)
   Required Scope: Read: Devices

✅ [PASS] /blueprints
   List blueprints
   Successfully retrieved 5 blueprint(s)
   Required Scope: Read: Blueprints
```

### Permission Scope Error

```
❌ [FAIL] /vulnerability-management/vulnerabilities
   List vulnerabilities
   Permission denied: Forbidden - API token is missing the "Read: Vulnerability Management" permission scope
   Required Scope: Read: Vulnerability Management

=====================================
📊 Summary
=====================================

Total Tests: 11
✅ Passed: 8
❌ Failed: 3
⚠️  Warnings: 0
⏭️  Skipped: 0

🔒 Permission/Scope Failures:
   Your API token is missing required permission scopes.

  - /vulnerability-management/vulnerabilities
    Missing: Read: Vulnerability Management
  - /behavioral-detections
    Missing: Read: Threat Details
  - /threat-details
    Missing: Read: Threat Details

   Fix: Edit your API token in Settings → Access and grant these scopes:

     [ ] Read: Vulnerability Management
     [ ] Read: Threat Details
```

### Authentication Error

```
❌ [FAIL] /devices
   List devices
   Authentication failed: Invalid API token
   Required Scope: Read: Devices

🔐 Authentication Failures:
   Your API token is invalid or expired.

  - /devices
  - /blueprints
  - /prism/device_information

   Fix: Regenerate your API token in Settings → Access
```

## API Scope Reference

The Kandji/Iru API uses the following permission scopes:

### Core Scopes (Essential)

| Scope | Endpoints | Description |
|-------|-----------|-------------|
| **Read: Devices** | `/devices`, `/devices/{id}`, `/devices/{id}/apps`, `/devices/{id}/activity` | Access device inventory and details |
| **Read: Blueprints** | `/blueprints`, `/blueprints/{id}` | View blueprint configurations |
| **Read: Prism** | `/prism/device_information` | Access compliance and status data |

### Additional Scopes (Recommended)

| Scope | Endpoints | Description |
|-------|-----------|-------------|
| **Read: Settings** | `/settings/licensing` | View tenant licensing information |
| **Read: Users** | `/users`, `/users/{id}` | Access directory integration data |
| **Read: Tags** | `/tags` | View device tags |
| **Read: Audit Logs** | `/audit/events` | Access audit event history |

### Security Scopes (Optional)

| Scope | Endpoints | Description |
|-------|-----------|-------------|
| **Read: Vulnerability Management** | `/vulnerability-management/*` | CVE tracking and vulnerability data |
| **Read: Threat Details** | `/behavioral-detections`, `/threat-details` | Security threat monitoring |

### Destructive Scopes (Use with Caution)

| Scope | Endpoints | Description |
|-------|-----------|-------------|
| **Write: Device Actions** | `/devices/{id}/action/*` | Execute device commands (lock, erase, etc.) |

## Configuring API Token Scopes

### Creating a New Token

1. Log in to your Iru/Kandji tenant
2. Navigate to **Settings → Access**
3. Click **"Add API Token"**
4. Enter a description (e.g., "MCP Server - Production")
5. Grant the required scopes (see recommendations below)
6. Click **"Generate Token"**
7. Copy the token immediately (it won't be shown again)
8. Add to your `.env` file: `KANDJI_API_TOKEN=your_token_here`

### Editing an Existing Token

1. Log in to your Iru/Kandji tenant
2. Navigate to **Settings → Access**
3. Find your existing token in the list
4. Click the **"Edit"** button
5. Check the additional scopes you need
6. Click **"Save"**
7. No need to update `.env` - the token remains the same

## Recommended Scope Configuration

### Minimal (Read-Only Monitoring)

```
✅ Read: Devices
✅ Read: Blueprints
✅ Read: Prism
```

**Use Case:** Basic device inventory and compliance monitoring

### Standard (Full Read Access)

```
✅ Read: Devices
✅ Read: Blueprints
✅ Read: Prism
✅ Read: Settings
✅ Read: Users
✅ Read: Tags
✅ Read: Audit Logs
```

**Use Case:** Complete visibility into tenant configuration and activity

### Security-Focused (Includes Security Features)

```
✅ Read: Devices
✅ Read: Blueprints
✅ Read: Prism
✅ Read: Settings
✅ Read: Users
✅ Read: Tags
✅ Read: Audit Logs
✅ Read: Vulnerability Management
✅ Read: Threat Details
```

**Use Case:** Security operations and vulnerability management

### Full Access (Includes Write Actions)

```
✅ All Read scopes above
✅ Write: Device Actions
⚠️  CAUTION: Allows destructive operations!
```

**Use Case:** Remote device management and incident response

## Troubleshooting Scope Issues

### Issue: "Permission denied" but token is valid

**Symptom:**
```
❌ Permission denied: Forbidden
```

**Cause:** The API token is valid but doesn't have the required scope.

**Solution:**
1. Go to Settings → Access in your Iru/Kandji tenant
2. Edit the API token
3. Grant the missing scope shown in the error message
4. Re-run `npm run verify`

### Issue: All endpoints return 403

**Symptom:**
```
❌ All tests fail with "Permission denied"
```

**Cause:** The token may have been created without any scopes selected.

**Solution:**
1. Create a new API token with proper scopes
2. Update `KANDJI_API_TOKEN` in `.env`
3. Re-run `npm run verify`

### Issue: Some features work, others return 403

**Symptom:**
```
✅ Devices works
✅ Blueprints works
❌ Vulnerabilities returns 403
```

**Cause:** This is normal - some features require additional scopes or may not be available in your subscription tier.

**Solution:**
1. Check if the feature is included in your Iru/Kandji subscription
2. If included, add the required scope to your token
3. If not included, the feature will remain unavailable

## Subscription Tier Limitations

Some API endpoints require specific Iru/Kandji subscription tiers:

| Feature | Required Tier | Scope |
|---------|---------------|-------|
| Basic Device Management | All Tiers | Read: Devices |
| Compliance (Prism) | All Tiers | Read: Prism |
| Vulnerability Management | Enterprise+ | Read: Vulnerability Management |
| Threat Details | Enterprise+ | Read: Threat Details |
| Audit Logs | Professional+ | Read: Audit Logs |

**Note:** Even with the correct scope, you'll receive a 403 or 404 if your subscription doesn't include the feature.

## Best Practices

### Security

1. **Principle of Least Privilege:** Only grant scopes you actually need
2. **Separate Tokens:** Use different tokens for different purposes
3. **Regular Rotation:** Regenerate tokens periodically
4. **Audit Access:** Monitor API token usage in audit logs

### Token Management

1. **Descriptive Names:** Name tokens clearly (e.g., "MCP Server - Prod")
2. **Documentation:** Document which token is used where
3. **Version Control:** Never commit tokens to git
4. **Environment Variables:** Always use `.env` files

### Verification

1. **Initial Setup:** Always run `npm run verify` after configuration
2. **After Token Changes:** Re-verify when editing scopes
3. **Troubleshooting:** Run verification when encountering errors
4. **CI/CD:** Include verification in deployment pipelines

## Support

If scope verification fails unexpectedly:

1. Review the error messages carefully
2. Check subscription tier requirements
3. Verify token hasn't expired
4. Consult Iru/Kandji API documentation
5. Contact Iru support if issues persist

## References

- [Iru API Documentation](https://api-docs.kandji.io/)
- [Iru Support](https://support.kandji.io/)
- [MCP Server Documentation](../README.md)
- [Troubleshooting Guide](README.md)
