# Script Generation Example

This example demonstrates how the script generation feature works when querying large datasets.

## Scenario: Exporting Device Activity History

You need to export all activity records for a device that has been active for months. The device has 2,500+ activity records.

### Step 1: Query through MCP

Ask Claude to get device activity:

```
User: "Get all activity for device abc-123-def-456"
```

Claude uses the `get_device_activity` tool with:
```json
{
  "device_id": "abc-123-def-456",
  "limit": 300
}
```

### Step 2: MCP Response Includes Script

The MCP response returns:

```json
{
  "success": true,
  "summary": "Retrieved 300 activity records for device",
  "table": {
    "columns": ["Timestamp", "Event Type", "Description"],
    "rows": [
      // First 10 records shown in table
    ]
  },
  "data": [
    // 300 records returned
  ],
  "metadata": {
    "totalCount": 300,
    "limit": 300,
    "offset": 0,
    "elapsedMs": 1250,
    "cached": false,
    "source": "Kandji API"
  },
  "suggestions": [
    "View device details",
    "Check installed apps",
    "Review device status",
    "Use the provided bash script to export all data with automatic pagination"
  ],
  "script": "#!/bin/bash\nset -e\n\n# Kandji API Export Script\n..."
}
```

### Step 3: Claude Offers the Script

Claude responds to the user:

```
I retrieved 300 activity records for this device. Since there may be
more records available (the response returned exactly the limit of 300),
I've generated a bash script that will automatically export ALL activity
records with pagination.

Here's what I found in the first batch:
[Shows table of first 10 records]

Would you like me to provide the complete export script? It will:
- Automatically handle pagination
- Export all records to a JSON file
- Show progress as it runs
- Include error handling
```

### Step 4: User Requests Script

```
User: "Yes, give me the script"
```

Claude provides:

```bash
#!/bin/bash
set -e

# Kandji API Export Script
# Description: Export all activity records for device abc-123-def-456
# Generated: 2025-10-23T18:28:13.482Z
# Pagination: Offset-based

# Configuration
BASE_URL="https://yourcompany.api.kandji.io/api/v1"
ENDPOINT="/devices/abc-123-def-456/activity"
OUTPUT_FILE="device_activity_abc-123-def-456_1729708093.json"
LIMIT=300
API_TOKEN="your_api_token_here"

# [Rest of script...]
```

### Step 5: User Runs Script

The user saves and runs the script:

```bash
# Save script
cat > export_activity.sh << 'EOF'
[paste script content]
EOF

# Make executable
chmod +x export_activity.sh

# Run
./export_activity.sh
```

### Step 6: Script Output

The script runs and shows progress:

```
========================================
Kandji API Paginated Export
========================================
Endpoint: /devices/abc-123-def-456/activity
Output: device_activity_abc-123-def-456_1729708093.json

Starting data export...
Fetching page 1 (offset: 0, limit: 300)...
✓ Fetched 300 records (Total: 300)
Fetching page 2 (offset: 300, limit: 300)...
✓ Fetched 300 records (Total: 600)
Fetching page 3 (offset: 600, limit: 300)...
✓ Fetched 300 records (Total: 900)
Fetching page 4 (offset: 900, limit: 300)...
✓ Fetched 300 records (Total: 1200)
Fetching page 5 (offset: 1200, limit: 300)...
✓ Fetched 300 records (Total: 1500)
Fetching page 6 (offset: 1500, limit: 300)...
✓ Fetched 300 records (Total: 1800)
Fetching page 7 (offset: 1800, limit: 300)...
✓ Fetched 300 records (Total: 2100)
Fetching page 8 (offset: 2100, limit: 300)...
✓ Fetched 300 records (Total: 2400)
Fetching page 9 (offset: 2400, limit: 300)...
✓ Fetched 187 records (Total: 2587)
Reached last page. Export complete!

========================================
Export Complete!
========================================
Total records: 2587
Output file: device_activity_abc-123-def-456_1729708093.json
File size: 3.2M

To view the data:
  cat device_activity_abc-123-def-456_1729708093.json | jq '.'

To convert to CSV (requires jq):
  cat device_activity_abc-123-def-456_1729708093.json | jq -r '...' > output.csv
```

### Step 7: Analyze Results

User can now analyze the complete dataset:

```bash
# View in JSON
cat device_activity_abc-123-def-456_1729708093.json | jq '.'

# Count event types
cat device_activity_abc-123-def-456_1729708093.json | jq '[.[] | .event_type] | group_by(.) | map({type: .[0], count: length})'

# Convert to CSV for Excel
cat device_activity_abc-123-def-456_1729708093.json | jq -r '
  (.[0] | keys_unsorted) as $keys |
  $keys,
  map([.[ $keys[] ]])[] |
  @csv
' > device_activity.csv

# Open in Excel
open device_activity.csv
```

## Benefits Demonstrated

1. **No Manual Pagination**: User doesn't need to make 9 separate queries
2. **Progress Tracking**: Visual feedback during export
3. **Error Handling**: Automatic retry and error detection
4. **Complete Data**: All 2,587 records exported, not just first 300
5. **Flexible Output**: JSON for processing, CSV for spreadsheets
6. **Time Savings**: Automated process vs manual API calls

## Other Use Cases

### Audit Log Export (Cursor-based)

```
User: "Export all audit events from January 2024"
```

MCP generates cursor-based pagination script that:
- Handles `next` cursor automatically
- Filters by date range
- Exports complete audit trail

### Large Device Lists

```
User: "Get all devices in the organization"
```

For organizations with 1000+ devices, script generation provides:
- Complete device inventory export
- Filtered by criteria (platform, blueprint, etc.)
- Ready for analysis or reporting

### Vulnerability Reports

```
User: "Export all vulnerability detections"
```

Script handles:
- Large security datasets
- Multiple CVEs across fleet
- Complete compliance reporting data
