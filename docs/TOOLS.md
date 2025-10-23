# Kandji MCP Server - Tool Reference

Complete reference for all 23 MCP tools provided by the Kandji MCP Server.

## Table of Contents

- [Device Management](#device-management) (9 tools)
- [Compliance & Reporting](#compliance--reporting) (2 tools)
- [Configuration Management](#configuration-management) (2 tools)
- [User Management](#user-management) (2 tools)
- [Security & Vulnerabilities](#security--vulnerabilities) (6 tools)
- [Threat Management](#threat-management) (2 tools)
- [Script Generation](#script-generation) - Automatic export scripts for large datasets

## Script Generation for Large Exports 🚀

Tools with pagination support can automatically generate bash scripts for exporting large datasets. When a response contains more data than can be returned in a single call, the MCP server includes a ready-to-run bash script in the `script` field.

**Benefits:**
- ✅ Automatic pagination handling (no manual page tracking)
- ✅ Built-in error handling and rate limiting
- ✅ Progress indicators and colored output
- ✅ Exports to JSON with optional CSV conversion
- ✅ Pre-configured with your API credentials

See [SCRIPT_GENERATION.md](./SCRIPT_GENERATION.md) for complete documentation.

**Tools with script generation:**
- `get_device_activity` (offset-based pagination)
- `list_audit_events` (cursor-based pagination)

---

## Device Management

### search_devices_by_criteria

Filter devices by name, platform, or blueprint assignment.

**Parameters:**
- `name` (string, optional): Filter by device name (partial match)
- `platform` (enum, optional): Filter by platform (`Mac`, `iPhone`, `iPad`, `AppleTV`)
- `blueprint_id` (string, optional): Filter by blueprint UUID

**Returns:** Array of devices matching criteria

**Examples:**
```
"Show me all MacBooks"
"Find devices with 'Engineering' in the name"
"List all devices in the Production blueprint"
```

**Cache:** 5 minutes

---

### get_device_details

Retrieve comprehensive device information including hardware specs, software version, user info, and MDM status.

**Parameters:**
- `device_id` (string, required): Device UUID

**Returns:** Complete device object with all properties

**Examples:**
```
"Show me details for device abc-123-def"
"Get information about device xyz-789"
```

**Cache:** 5 minutes

---

### get_device_activity

Retrieve device activity history with pagination support.

**Parameters:**
- `device_id` (string, required): Device UUID
- `limit` (number, optional): Maximum records to return (max 300)
- `offset` (number, optional): Starting record for pagination

**Returns:** Array of activity events

**Examples:**
```
"Show recent activity for device abc-123-def"
"Get the last 50 activity records for device xyz-789"
```

**Cache:** 5 minutes

---

### get_device_apps

List all installed applications on a device. Note: For iPhone and iPad, preinstalled Apple apps are not reported.

**Parameters:**
- `device_id` (string, required): Device UUID

**Returns:** Array of installed apps with name, version, and bundle ID

**Examples:**
```
"What apps are installed on device abc-123-def?"
"Show me the software inventory for device xyz-789"
```

**Cache:** 5 minutes

---

### get_device_library_items

View library items (configuration profiles, apps, scripts) and their installation status for a specific device.

**Parameters:**
- `device_id` (string, required): Device UUID

**Returns:** Array of library items with status

**Possible Status Values:**
- `AVAILABLE` - Library item available in Self Service
- `CACHED` - Downloaded but not yet installed
- `CHANGE_PENDING` - Changes not yet applied
- `DOWNLOADING` - Currently downloading
- `ERROR` - Audit failure
- `EXCLUDED` - Not in scope for assignment rule
- `INCOMPATIBLE` - Not compatible with device or OS
- `INSTALLING` - Currently installing
- `PASS` - Device meets requirements
- `PENDING` - Waiting on device
- `success` - Configuration profile installed
- `failed` - Configuration profile failed
- `pending` - Configuration profile not yet installed

**Examples:**
```
"Show library items for device abc-123-def"
"What profiles are installed on device xyz-789?"
```

**Cache:** 5 minutes

---

### get_device_parameters

Get parameters and their compliance status for macOS devices. Parameters are returned as IDs which can be correlated at: https://github.com/kandji-inc/support/wiki/Devices-API---Parameter-Correlations

**Parameters:**
- `device_id` (string, required): Device UUID

**Returns:** Array of parameters with status

**Possible Status Values:**
- `ERROR` - Audit failure
- `INCOMPATIBLE` - Not compatible
- `PASS` - Device meets requirements
- `PENDING` - Not yet run
- `REMEDIATED` - Parameter remediated
- `WARNING` - Muted alert

**Examples:**
```
"Show parameters for device abc-123-def"
"Check compliance status for device xyz-789"
```

**Note:** This endpoint is only applicable to macOS clients.

**Cache:** 5 minutes

---

### get_device_status

Get comprehensive status including both parameters and library items for a device.

**Parameters:**
- `device_id` (string, required): Device UUID

**Returns:** Combined view of library items and parameters

**Examples:**
```
"Show full status for device abc-123-def"
"Get complete compliance view for device xyz-789"
```

**Cache:** 5 minutes

---

### get_device_lost_mode_details

Check lost mode status and configuration for iOS/iPadOS devices.

**Parameters:**
- `device_id` (string, required): Device UUID

**Returns:** Lost mode configuration (enabled status, message, phone number, footnote)

**Examples:**
```
"Is device abc-123-def in lost mode?"
"Check lost mode status for iPad xyz-789"
```

**Note:** Lost Mode is only available for iOS and iPadOS devices.

**Cache:** 5 minutes

---

### execute_device_action

Execute device actions including lock, restart, shutdown, or erase. **Requires explicit confirmation.**

**Parameters:**
- `device_id` (string, required): Device UUID
- `action` (enum, required): `lock`, `restart`, `shutdown`, or `erase`
- `confirm` (boolean, required): Must be `true` to execute
- `message` (string, optional): Lock screen message (for lock action only)
- `pin` (string, optional): 6-digit PIN for erase action on macOS

**Returns:** Action confirmation with success status

**Examples:**
```
"Lock device abc-123-def with message 'Contact IT at x1234'"
"Restart device xyz-789"
```

**⚠️ WARNING:** The `erase` action is DESTRUCTIVE and will completely wipe the device. Always verify the device ID before confirming an erase action.

**Cache:** Not cached (immediate execution)

---

## Compliance & Reporting

### get_compliance_summary

Get organization-wide compliance summary showing compliant vs non-compliant devices by platform.

**Parameters:** None

**Returns:** Compliance statistics by platform

**Examples:**
```
"Show me the compliance summary"
"What's our current compliance rate?"
"How many devices are non-compliant?"
```

**Cache:** 2 minutes

---

### list_audit_events

List audit log events from the Kandji Activity module with filtering and pagination.

**Parameters:**
- `limit` (number, optional): Maximum events to return (max 500)
- `sort_by` (string, optional): Sort field (e.g., `-occurred_at` for descending)
- `start_date` (string, optional): Filter by start date (YYYY-MM-DD or datetime)
- `end_date` (string, optional): Filter by end date (YYYY-MM-DD or datetime)
- `cursor` (string, optional): Pagination cursor

**Returns:** Audit events with pagination info

**Event Types Include:**
- Blueprint and Library Item changes (Create, Update, Delete)
- Access to sensitive data (FileVault keys, recovery keys)
- Device lifecycle events (enrollment, deletion, MDM removal)
- User directory events
- Administrative actions (API token management, tenant owner updates)
- Vulnerability management events
- Endpoint Detection and Response events

**Examples:**
```
"Show audit events from last week"
"List administrative actions from January 2024"
"Show recent MDM changes"
```

**Cache:** 2 minutes

---

## Configuration Management

### list_blueprints

List all device blueprints with their configurations and enrollment codes.

**Parameters:** None

**Returns:** Array of blueprints with details

**Examples:**
```
"List all blueprints"
"What blueprints are available?"
"Show me blueprint configurations"
```

**Cache:** 30 minutes

---

### get_tags

Get configured tags with optional search filtering.

**Parameters:**
- `search` (string, optional): Search term to filter tags

**Returns:** Array of tags

**Examples:**
```
"Show all tags"
"Find tags containing 'department'"
```

**Cache:** 30 minutes

---

## User Management

### list_users

List users from user directory integrations with optional filtering.

**Parameters:**
- `email` (string, optional): Filter by email containing this string
- `id` (string, optional): Search for user by UUID
- `integration_id` (string, optional): Filter by integration UUID
- `archived` (boolean, optional): Filter by archived status

**Returns:** Paginated list of users

**Examples:**
```
"Show all users"
"Find users with email containing '@example.com'"
"List archived users"
```

**Cache:** 5 minutes

---

### get_user

Get detailed information for a specific user.

**Parameters:**
- `user_id` (string, required): User UUID

**Returns:** User object with all properties

**Examples:**
```
"Show user details for user-123"
"Get information about user abc-456"
```

**Cache:** 5 minutes

---

## Security & Vulnerabilities

### list_vulnerabilities

List all vulnerabilities grouped by CVE with optional filtering and pagination.

**Parameters:**
- `page` (number, optional): Page number
- `size` (number, optional): Results per page (max 50)
- `sort_by` (string, optional): Sort field (e.g., `cve_id`, `cvss_score`, `device_count`)
- `filter` (string, optional): JSON filter string

**Returns:** Paginated list of CVE vulnerabilities with device counts

**Examples:**
```
"Show all critical vulnerabilities"
"List vulnerabilities sorted by device count"
"Find vulnerabilities with CVSS score > 7"
```

**Cache:** 5 minutes

---

### get_vulnerability_details

Get detailed information about a specific CVE vulnerability.

**Parameters:**
- `cve_id` (string, required): CVE ID (e.g., CVE-2024-12345)

**Returns:** Detailed CVE information including CVSS score, description, and links

**Examples:**
```
"Show details for CVE-2024-12345"
"What is CVE-2023-98765?"
```

**Cache:** 5 minutes

---

### list_vulnerability_detections

List all vulnerability detections across the entire device fleet with pagination.

**Parameters:**
- `after` (string, optional): Cursor token for pagination
- `size` (number, optional): Results per page (max 300)
- `filter` (string, optional): JSON filter string

**Returns:** List of vulnerability detections across all devices

**Examples:**
```
"Show all vulnerability detections"
"List recent detections"
```

**Cache:** 5 minutes

---

### list_affected_devices

List all devices affected by a specific CVE vulnerability.

**Parameters:**
- `cve_id` (string, required): CVE ID
- `page` (number, optional): Page number
- `size` (number, optional): Results per page (max 50)

**Returns:** List of devices with vulnerability details

**Examples:**
```
"Which devices are affected by CVE-2024-12345?"
"Show devices with CVE-2023-98765"
```

**Cache:** 5 minutes

---

### list_affected_software

List all software packages affected by a specific CVE vulnerability.

**Parameters:**
- `cve_id` (string, required): CVE ID
- `page` (number, optional): Page number
- `size` (number, optional): Results per page (max 50)

**Returns:** List of software packages with version and device count

**Examples:**
```
"What software is affected by CVE-2024-12345?"
"Show vulnerable software for CVE-2023-98765"
```

**Cache:** 5 minutes

---

### list_behavioral_detections

Get behavioral threat detections from Kandji security monitoring.

**Parameters:**
- `threat_id` (string, optional): Filter by threat ID
- `classification` (string, optional): Filter by classification (e.g., `malicious`)
- `status` (string, optional): Filter by status (e.g., `blocked`)
- `device_id` (string, optional): Filter by device UUID
- `limit` (number, optional): Max results (default 1000)

**Returns:** List of behavioral threat detections

**Examples:**
```
"Show all malicious detections"
"List blocked threats"
"Find detections on device abc-123"
```

**Cache:** 2 minutes

---

## Threat Management

### get_threat_details

Get detailed threat information with filtering options.

**Parameters:**
- `classification` (string, optional): Filter by classification (`malware`, `pup`)
- `status` (string, optional): Filter by status (`quarantined`, `not_quarantined`, `released`)
- `device_id` (string, optional): Filter by device UUID
- `limit` (number, optional): Max results (default 1000)

**Returns:** Detailed threat information

**Examples:**
```
"Show all quarantined threats"
"List malware detections"
"Find threats on device abc-123"
```

**Cache:** 2 minutes

---

### get_licensing

Get Kandji tenant licensing and utilization information.

**Parameters:** None

**Returns:** License counts, utilization percentage, tier, and expiration

**Examples:**
```
"Show licensing information"
"How many licenses are available?"
"What's our license utilization?"
```

**Cache:** 30 minutes

---

## Response Format

All tools return a standardized response envelope:

```json
{
  "success": true,
  "summary": "Human-readable summary of the result",
  "table": {
    "columns": ["Column1", "Column2", "Column3"],
    "rows": [
      {"Column1": "value1", "Column2": "value2", "Column3": "value3"}
    ]
  },
  "data": {},
  "metadata": {
    "totalCount": 10,
    "elapsedMs": 123,
    "cached": false,
    "source": "Kandji API"
  },
  "suggestions": [
    "Next action suggestion 1",
    "Next action suggestion 2"
  ]
}
```

## Error Handling

Failed requests return error details:

```json
{
  "success": false,
  "errors": [{
    "category": "validation",
    "message": "Invalid device UUID",
    "recovery": [
      "Provide a valid device UUID",
      "Search for devices to find the correct ID"
    ]
  }],
  "metadata": {
    "elapsedMs": 45,
    "cached": false,
    "source": "Kandji API"
  }
}
```

**Error Categories:**
- `validation` - Parameter errors
- `auth` - Authentication failures
- `rate_limit` - API throttling
- `network` - Connection issues
- `server` - Kandji API errors
