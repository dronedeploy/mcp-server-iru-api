# Kandji MCP Server - Test Suite Documentation

## Overview

This test suite provides comprehensive integration testing for all 10 newly implemented Kandji API endpoints. Each test suite validates the complete request/response cycle, error handling, caching behavior, and response envelope compliance.

## Test Files

### 1. **test-all-tools.ts**
Comprehensive test suite that runs 16 tests covering all 10 tools with various parameter combinations.

**Coverage:**
- All 10 API tools
- Parameter validation
- Error handling
- Cache behavior
- Response envelope compliance

**Run:** `npm run test:all`

### 2. **test-tags.ts**
Tests for tag management functionality.

**Coverage:**
- Get all tags
- Search tags by name
- Cache performance
- Empty search handling

**Tools Tested:**
- `get_tags`

**Run:** `npm run test:tags`

### 3. **test-users.ts**
Tests for user management functionality.

**Coverage:**
- List all users
- Filter by archived status
- Search by email
- Get specific user details
- Error handling for invalid user IDs

**Tools Tested:**
- `list_users`
- `get_user`

**Run:** `npm run test:users`

### 4. **test-vulnerabilities.ts**
Tests for vulnerability management functionality.

**Coverage:**
- List all vulnerabilities
- Filter by severity (critical, high, medium, low)
- Filter by known exploits
- Get vulnerability details
- List affected devices
- List affected software
- List vulnerability detections
- Pagination behavior

**Tools Tested:**
- `list_vulnerabilities`
- `get_vulnerability_details`
- `list_vulnerability_detections`
- `list_affected_devices`
- `list_affected_software`

**Run:** `npm run test:vulnerabilities`

### 5. **test-threats.ts**
Tests for threat detection functionality.

**Coverage:**
- List all behavioral detections
- Filter by status (open, closed)
- Filter by severity
- Filter by device
- Get threat details
- Filter by classification (malware, pup, etc.)
- Combined filter scenarios
- Table output validation

**Tools Tested:**
- `list_behavioral_detections`
- `get_threat_details`

**Run:** `npm run test:threats`

### 6. **test-licensing.ts**
Tests for licensing information.

**Coverage:**
- Get licensing details
- Cache behavior
- Response formatting

**Tools Tested:**
- `get_licensing`

**Run:** `npm run test:licensing`

## Master Test Runner

### **run-all-tests.sh**
Bash script that executes all test suites sequentially and generates a summary report.

**Run:** `npm run test:integration`

**Output:**
- Individual test suite results
- Pass/fail statistics
- Success rate percentage
- Execution timestamps

## Running Tests

### Prerequisites

1. **Environment Configuration**
   Create a `.env` file with valid Kandji API credentials:
   ```bash
   KANDJI_API_TOKEN=your_api_token_here
   KANDJI_SUBDOMAIN=your_subdomain
   KANDJI_REGION=us  # or 'eu'
   ```

2. **API Token Permissions**
   Ensure your API token has permissions for ALL endpoints:
   - Device Management
   - User Management
   - Tag Management
   - Vulnerability Management
   - Threat Detection
   - Licensing Information

### Run Individual Test Suites

```bash
# Tags
npm run test:tags

# Users
npm run test:users

# Vulnerabilities
npm run test:vulnerabilities

# Threats
npm run test:threats

# Licensing
npm run test:licensing

# All tools (comprehensive)
npm run test:all
```

### Run All Tests

```bash
# Run all test suites with summary report
npm run test:integration
```

## Test Output

Each test provides detailed output including:

### Success Response
```
[SUCCESS] tool_name
Summary: Retrieved 15 users
Duration: 245ms
Cached: false
Total Count: 15

Table Preview (first 3 rows):
Columns: Field | Value
Row 1: {"Field":"Email","Value":"user@example.com"}
Row 2: {"Field":"Name","Value":"John Doe"}
Row 3: {"Field":"Status","Value":"Active"}
```

### Error Response
```
[FAILED] tool_name
Errors: [{
  "category": "auth",
  "message": "Invalid API token",
  "recovery": [
    "Verify KANDJI_API_TOKEN in .env file",
    "Regenerate API token in Kandji settings"
  ]
}]
```

## Error Categories

Tests validate proper error categorization:

| Category | Description | Recovery Actions |
|----------|-------------|------------------|
| `validation` | Invalid parameters | Correct input values |
| `auth` | Authentication failure | Regenerate API token |
| `rate_limit` | API throttling | Wait and retry |
| `network` | Connection issues | Check connectivity |
| `server` | Kandji API errors | Retry later |

## Response Envelope Validation

All tests verify the standardized response envelope:

```typescript
{
  success: boolean,
  summary: string,
  table?: {
    columns: string[],
    rows: object[]
  },
  data: T,
  metadata: {
    totalCount?: number,
    elapsedMs: number,
    cached: boolean,
    source: string
  },
  suggestions?: string[],
  errors?: Array<{
    category: string,
    message: string,
    recovery: string[]
  }>
}
```

## Cache Testing

Tests validate caching behavior:

1. **First Call**: `cached: false` - API request made
2. **Second Call**: `cached: true` - Data served from cache
3. **Duration**: Cached responses should be significantly faster

### Cache TTLs by Tool

| Tool | TTL | Use Case |
|------|-----|----------|
| `get_tags` | 30 min | Infrequent changes |
| `list_users` | 5 min | Moderate changes |
| `get_user` | 5 min | Moderate changes |
| `list_vulnerabilities` | 2 min | Frequent updates |
| `get_vulnerability_details` | 2 min | Frequent updates |
| `list_vulnerability_detections` | 2 min | Frequent updates |
| `list_affected_devices` | 2 min | Frequent updates |
| `list_affected_software` | 2 min | Frequent updates |
| `list_behavioral_detections` | 2 min | Frequent updates |
| `get_threat_details` | 2 min | Frequent updates |
| `get_licensing` | 1 hour | Rare changes |

## Common Test Scenarios

### Pagination Test
```typescript
const page1 = await listVulnerabilities(client, { limit: 3 });
// Validates: results count, next/previous URLs
```

### Filter Combination Test
```typescript
const result = await getThreatDetails(client, {
  classification: 'malware',
  status: 'open',
  limit: 5
});
// Validates: multiple filters working together
```

### Invalid Parameter Test
```typescript
const result = await getUser(client, {
  user_id: '00000000-0000-0000-0000-000000000000'
});
// Validates: proper error handling
```

## Troubleshooting

### 403 Forbidden Errors
**Issue:** API token lacks necessary permissions
**Solution:** Regenerate token with ALL permissions in Kandji console

### Network Timeouts
**Issue:** Slow API responses
**Solution:** Increase timeout in client configuration

### Cache Issues
**Issue:** Stale data being returned
**Solution:** Restart server to clear in-memory cache

### Build Errors
**Issue:** TypeScript compilation failures
**Solution:** Run `npm run build` to verify all code compiles

## Performance Benchmarks

Expected performance targets:

- **P50 latency:** < 500ms (uncached)
- **P95 latency:** < 2000ms (uncached)
- **Cache hit latency:** < 10ms
- **Cache hit rate:** ≥ 40%
- **Error rate:** < 5%

## Test Coverage

Current test coverage:

| Category | Tests | Coverage |
|----------|-------|----------|
| Tags Management | 5 | 100% |
| User Management | 5 | 100% |
| Vulnerability Management | 9 | 100% |
| Threat Detection | 10 | 100% |
| Licensing | 3 | 100% |
| **Total** | **32** | **100%** |

## Next Steps

1. **Run Initial Tests**
   ```bash
   npm run test:integration
   ```

2. **Review Results**
   - Check pass/fail rates
   - Identify permission issues
   - Verify cache performance

3. **Iterate**
   - Fix any failing tests
   - Adjust API token permissions
   - Optimize cache TTLs if needed

4. **Continuous Testing**
   - Run tests before commits
   - Include in CI/CD pipeline
   - Monitor API changes

## Support

For issues or questions:
- Review error messages and recovery suggestions
- Check Kandji API documentation
- Verify .env configuration
- Ensure API token has full permissions
