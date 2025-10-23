# Script Generation for Large Data Exports

## Overview

When working with large datasets that require pagination, the MCP Server can automatically generate bash scripts that handle pagination for you. This is especially useful for:

- Exporting all device activity history
- Downloading complete audit logs
- Extracting large vulnerability reports
- Any query that returns more data than a single API call can handle

## How It Works

### Automatic Detection

The MCP server automatically detects when script generation would be helpful:

1. **Multiple Pages Available**: When the API response indicates there's a next page (cursor-based pagination)
2. **Large Datasets**: When the response has more records than the requested limit
3. **Bulk Exports**: When you're dealing with 100+ records

### When Scripts Are Offered

Scripts are automatically included in the MCP response when:

```typescript
// Cursor-based pagination with next page
response.next !== null

// Total records exceed current limit
totalCount > limit

// Large dataset (100+ records)
currentCount >= 100
```

## Response Format

When a script is offered, it's included in the `script` field of the MCP response:

```typescript
{
  success: true,
  summary: "Retrieved 300 records",
  data: [...],
  suggestions: [
    "Use the provided bash script to export all data with automatic pagination"
  ],
  script: "#!/bin/bash\n..."  // Full executable bash script
}
```

## Pagination Types

### Offset-Based Pagination

Used by endpoints like:
- `/devices/{id}/activity` - Device activity history
- `/devices` - Device listing

**Features**:
- Uses `limit` and `offset` parameters
- Automatically increments offset
- Detects last page when fewer records than limit are returned

**Example**:
```bash
# Generated script handles this automatically:
# Page 1: ?limit=300&offset=0
# Page 2: ?limit=300&offset=300
# Page 3: ?limit=300&offset=600
# ...until no more records
```

### Cursor-Based Pagination

Used by endpoints like:
- `/activity/audit-log` - Audit events
- Other paginated list endpoints

**Features**:
- Uses `cursor` parameter
- Follows `next` URL or cursor token
- Stops when `next` is null

**Example**:
```bash
# Generated script handles this automatically:
# Page 1: ?limit=500
# Page 2: ?limit=500&cursor=abc123
# Page 3: ?limit=500&cursor=def456
# ...until next is null
```

## Using Generated Scripts

### Step 1: Get the Script

Query the MCP server and look for the `script` field in the response:

```typescript
// Example with get_device_activity
{
  device_id: "abc-123-def-456",
  limit: 300
}

// Response includes:
{
  success: true,
  script: "#!/bin/bash\n..."
}
```

### Step 2: Save to File

Save the script content to a file:

```bash
# Copy the script content and save it
cat > export_script.sh << 'EOF'
#!/bin/bash
...script content...
EOF

# Make it executable
chmod +x export_script.sh
```

### Step 3: Run the Script

Execute the script to perform the full export:

```bash
./export_script.sh
```

### Step 4: View Results

The script will:
1. Automatically handle all pagination
2. Show progress with colored output
3. Save results to a JSON file
4. Display summary statistics

```bash
========================================
Kandji API Paginated Export
========================================
Endpoint: /devices/abc-123-def/activity
Output: device_activity_1234567890.json

Starting data export...
Fetching page 1 (offset: 0, limit: 300)...
✓ Fetched 300 records (Total: 300)
Fetching page 2 (offset: 300, limit: 300)...
✓ Fetched 300 records (Total: 600)
Fetching page 3 (offset: 600, limit: 300)...
✓ Fetched 150 records (Total: 750)
Reached last page. Export complete!

========================================
Export Complete!
========================================
Total records: 750
Output file: device_activity_1234567890.json
File size: 2.3M

To view the data:
  cat device_activity_1234567890.json | jq '.'

To convert to CSV (requires jq):
  cat device_activity_1234567890.json | jq -r '...' > output.csv
```

## Script Features

### Built-in Error Handling

```bash
# Checks HTTP status codes
if [ "$HTTP_CODE" -ne 200 ]; then
    echo "Error: API returned HTTP ${HTTP_CODE}"
    cat "$TEMP_FILE"
    exit 1
fi
```

### Rate Limiting

```bash
# Automatic 1-second delay between requests
sleep 1
```

### Progress Indicators

- Color-coded output (blue for info, green for success, red for errors)
- Real-time progress updates
- Page counters and record counts

### Data Merging

```bash
# Automatically merges all pages into single JSON array
ALL_DATA=$(echo "$ALL_DATA" | jq --argjson new "$PAGE_DATA" '. + $new')
```

### Cleanup

```bash
# Temporary files automatically removed
TEMP_FILE="$(mktemp)"
trap "rm -f $TEMP_FILE" EXIT
```

## Configuration

Scripts automatically use your Kandji API configuration:

- **API Token**: From `KANDJI_API_TOKEN` environment variable
- **Subdomain**: From `KANDJI_SUBDOMAIN` environment variable
- **Region**: From `KANDJI_REGION` environment variable (us/eu)

Scripts are pre-configured with these values when generated.

## Requirements

Scripts require these tools to be installed:

1. **curl** - For API requests (usually pre-installed)
2. **jq** - For JSON parsing
   ```bash
   # Install jq
   brew install jq  # macOS
   apt-get install jq  # Ubuntu/Debian
   ```

## Examples

### Example 1: Export Device Activity

```typescript
// Request
{
  tool: "get_device_activity",
  params: {
    device_id: "abc-123-def-456",
    limit: 300
  }
}

// Response includes script
// Save and run script:
chmod +x device_activity_export.sh
./device_activity_export.sh

// Results in: device_activity_1234567890.json
```

### Example 2: Export Audit Events

```typescript
// Request
{
  tool: "list_audit_events",
  params: {
    limit: 500,
    start_date: "2024-01-01",
    end_date: "2024-12-31"
  }
}

// Response includes script with date filters
// Save and run script:
chmod +x audit_export.sh
./audit_export.sh

// Results in: audit_events_1234567890.json
```

### Example 3: Convert to CSV

After running an export script:

```bash
# View as JSON
cat output.json | jq '.'

# Convert to CSV
cat output.json | jq -r '
  (.[0] | keys_unsorted) as $keys |
  $keys,
  map([.[ $keys[] ]])[] |
  @csv
' > output.csv

# Open in Excel/Sheets
open output.csv
```

## Troubleshooting

### Script Fails with "jq: command not found"

Install jq:
```bash
brew install jq  # macOS
apt-get install jq  # Ubuntu/Debian
```

### Script Shows "Authentication failed"

Verify your API token is correct in the script:
```bash
# Check the API_TOKEN variable in the script
grep "API_TOKEN=" export_script.sh

# Update if needed
sed -i 's/API_TOKEN=".*"/API_TOKEN="your_new_token"/' export_script.sh
```

### Script Times Out or Hangs

- Check your network connection
- Verify Kandji API is accessible
- Look for rate limiting errors in output

### Need to Modify Script

Scripts are fully editable bash scripts. You can:
- Change the output filename
- Adjust rate limiting delay
- Modify error handling
- Add custom processing

## Best Practices

1. **Use Scripts for Large Exports**: When you need >100 records, use scripts instead of manual pagination
2. **Save Scripts**: Keep generated scripts for repeated exports
3. **Check File Sizes**: Monitor output file sizes for very large exports
4. **Rate Limiting**: Scripts include 1-second delays to respect API rate limits
5. **Backup Data**: Scripts overwrite output files, so back up previous exports

## Security Notes

⚠️ **Scripts contain your API token**. Handle them securely:

- Don't commit scripts to version control
- Don't share scripts with others
- Delete scripts after use if they contain sensitive tokens
- Use environment variables for tokens in production

Better approach for production:
```bash
# Edit script to use environment variable
API_TOKEN="${KANDJI_API_TOKEN}"

# Run with token from environment
KANDJI_API_TOKEN="your_token" ./export_script.sh
```

## API Endpoints with Script Generation

Currently supported endpoints:

| Endpoint | Pagination Type | Tool |
|----------|----------------|------|
| `/devices/{id}/activity` | Offset | `get_device_activity` |
| `/activity/audit-log` | Cursor | `list_audit_events` |

More endpoints will be added as the feature expands.
