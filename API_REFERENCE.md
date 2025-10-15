# Kandji API Reference

This document provides a comprehensive reference for the Kandji API endpoints used in this MCP server.

## Base Configuration

### Authentication
- **Method**: Bearer token authentication
- **Header**: `Authorization: Bearer {apiToken}`
- **Token Generation**: Settings → Access → Add API Token

### Base URLs
- **US Region**: `https://{subdomain}.api.kandji.io`
- **EU Region**: `https://{subdomain}.api.eu.kandji.io`
- **API Version**: `/api/v1`

### Rate Limiting
- **Limit**: 10,000 requests per hour per customer
- **Strategy**: Implement exponential backoff on 429 responses

## Core Endpoints

### Devices

#### List Devices
```
GET /api/v1/devices
```
**Description**: Retrieve list of all devices in the tenant

**Query Parameters**:
- `blueprint_id` (optional): Filter by blueprint UUID
- `platform` (optional): Filter by platform (Mac, iPhone, iPad, AppleTV)
- `limit` (optional): Number of results per page
- `offset` (optional): Pagination offset

**Response**: Array of device objects

---

#### Get Device Details
```
GET /api/v1/devices/{deviceID}
```
**Description**: Retrieve detailed information about a specific device

**Parameters**:
- `deviceID` (required): Device UUID

**Response**:
```json
{
  "device_id": "uuid",
  "device_name": "string",
  "serial_number": "string",
  "platform": "Mac|iPhone|iPad|AppleTV",
  "os_version": "string",
  "model": "string",
  "user_name": "string",
  "user_email": "string",
  "asset_tag": "string",
  "blueprint_id": "uuid",
  "blueprint_name": "string",
  "last_check_in": "ISO 8601 timestamp",
  "is_supervised": boolean,
  "is_dep_enrolled": boolean,
  "mdm_enabled": boolean,
  "agent_installed": boolean
}
```

---

#### Get Device Apps
```
GET /api/v1/devices/{deviceID}/apps
```
**Description**: List all applications installed on a device

**Parameters**:
- `deviceID` (required): Device UUID

**Response**: Array of installed applications with versions

---

#### Get Device Activity
```
GET /api/v1/devices/{deviceID}/activity
```
**Description**: Retrieve activity log for a specific device

**Parameters**:
- `deviceID` (required): Device UUID

**Response**: Array of activity events with timestamps

---

### Device Actions

#### Lock Device
```
POST /api/v1/devices/{deviceID}/action/lock
```
**Description**: Send MDM command to remotely lock a device

**Parameters**:
- `deviceID` (required): Device UUID

**Request Body** (macOS):
```json
{
  "message": "Optional lock screen message"
}
```

**Response** (macOS):
```json
{
  "unlock_pin": "6-digit PIN"
}
```

**Notes**:
- For macOS, an unlock PIN is generated and returned
- Command executes almost instantly via APNs
- Requires confirmation in MCP server implementation

---

#### Restart Device
```
POST /api/v1/devices/{deviceID}/action/restart
```
**Description**: Send MDM command to remotely restart a device

**Parameters**:
- `deviceID` (required): Device UUID

**Notes**: Executes via APNs

---

#### Shutdown Device
```
POST /api/v1/devices/{deviceID}/action/shutdown
```
**Description**: Send MDM command to remotely shutdown a device

**Parameters**:
- `deviceID` (required): Device UUID

---

#### Erase Device
```
POST /api/v1/devices/{deviceID}/action/erase
```
**Description**: Send MDM command to wipe/erase a device

**Parameters**:
- `deviceID` (required): Device UUID

**Request Body** (optional):
```json
{
  "pin": "6-digit PIN for macOS",
  "preserve_data_plan": boolean,
  "disallow_proximity_setup": boolean
}
```

**CRITICAL**:
- This is a destructive action
- Requires explicit `confirm: true` in MCP tool
- Should log audit trail
- User should be warned before execution

---

#### Delete Device Record
```
DELETE /api/v1/devices/{deviceID}
```
**Description**: Remove device record from Kandji (does not wipe device)

**Parameters**:
- `deviceID` (required): Device UUID

---

### Blueprints

#### List Blueprints
```
GET /api/v1/blueprints
```
**Description**: Retrieve list of all blueprints in the tenant

**Response**: Array of blueprint objects
```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "enrollment_code_is_active": boolean,
    "enrollment_code": "string"
  }
]
```

---

#### Get Blueprint Details
```
GET /api/v1/blueprints/{blueprintID}
```
**Description**: Retrieve detailed information about a specific blueprint

**Parameters**:
- `blueprintID` (required): Blueprint UUID

**Response**:
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "enrollment_code_is_active": boolean,
  "enrollment_code": "string",
  "library_items": [
    {
      "id": "uuid",
      "name": "string",
      "type": "profile|script|app"
    }
  ]
}
```

---

### Compliance & Prism

#### Get Prism Device Information
```
GET /api/v1/prism/device_information
```
**Description**: Retrieve comprehensive device inventory data

**Query Parameters**:
- `blueprint_id` (optional): Filter by blueprint
- `platform` (optional): Filter by platform

**Response**: Enhanced device data including compliance status

---

#### Get Device FileVault Key
```
GET /api/v1/devices/{deviceID}/secrets/filevaultkey
```
**Description**: Retrieve FileVault recovery key for a macOS device

**Parameters**:
- `deviceID` (required): Device UUID

**Response**:
```json
{
  "filevault_key": "recovery-key-string"
}
```

**CRITICAL**:
- Highly sensitive endpoint
- Must implement PII redaction toggle
- Log all access attempts
- Consider additional confirmation requirement

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "error": "Invalid or expired API token"
}
```
**Recovery**: Regenerate API token in Kandji settings

### 404 Not Found
```json
{
  "error": "Device not found"
}
```
**Recovery**: Verify device ID is valid

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded"
}
```
**Recovery**: Implement exponential backoff, respect rate limits

### 500 Internal Server Error
```json
{
  "error": "Kandji API error"
}
```
**Recovery**: Retry with backoff, check Kandji status page

## Pagination

For endpoints that return lists:
- Use `limit` parameter to set page size (max typically 300)
- Use `offset` parameter for pagination
- Response includes total count in headers or metadata

## Best Practices

1. **Caching**: Cache device and blueprint data with appropriate TTLs
   - Devices: 5 minutes
   - Blueprints: 30 minutes
   - Compliance: 2 minutes

2. **Error Handling**: Always handle all error categories with proper recovery strategies

3. **Rate Limiting**: Track request count and implement client-side throttling

4. **Security**:
   - Never log API tokens
   - Redact PII when privacy mode enabled
   - Audit log all destructive actions

5. **Retries**: Implement exponential backoff for transient failures

## Additional Resources

- Official API Documentation: https://api-docs.kandji.io/
- Kandji Support: https://support.kandji.io/kb/kandji-api
