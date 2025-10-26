/**
 * Bash script generator for large data exports with pagination
 * Generates ready-to-run scripts that handle pagination automatically
 */

export interface ScriptConfig {
  endpoint: string; // API endpoint path (e.g., '/devices/{device_id}/activity')
  paginationType: 'offset' | 'cursor';
  params?: Record<string, string | number | boolean>;
  outputFormat?: 'json' | 'csv' | 'jsonl';
  outputFile?: string;
  description: string;
}

export interface KandjiConfig {
  subdomain: string;
  region: 'us' | 'eu';
  token: string;
}

/**
 * Generate a bash script for paginated data export
 */
export function generatePaginatedScript(config: ScriptConfig, kandjiConfig: KandjiConfig): string {
  const { subdomain, region, token } = kandjiConfig;
  const baseUrl =
    region === 'eu'
      ? `https://${subdomain}.clients.eu.kandji.io/api/v1`
      : `https://${subdomain}.api.kandji.io/api/v1`;

  const outputFile =
    config.outputFile || `kandji_export_${Date.now()}.${config.outputFormat || 'json'}`;

  if (config.paginationType === 'offset') {
    return generateOffsetPaginationScript(baseUrl, config, outputFile, token);
  } else {
    return generateCursorPaginationScript(baseUrl, config, outputFile, token);
  }
}

/**
 * Generate script for offset-based pagination (limit/offset)
 */
function generateOffsetPaginationScript(
  baseUrl: string,
  config: ScriptConfig,
  outputFile: string,
  token: string
): string {
  const params = buildQueryParams(config.params);
  const limit = config.params?.limit || 300;

  return `#!/bin/bash
set -e

# Kandji API Export Script
# Description: ${config.description}
# Generated: ${new Date().toISOString()}
# Pagination: Offset-based

# Configuration
BASE_URL="${baseUrl}"
ENDPOINT="${config.endpoint}"
OUTPUT_FILE="${outputFile}"
LIMIT=${limit}
API_TOKEN="${token}"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

echo -e "\${BLUE}========================================\${NC}"
echo -e "\${BLUE}Kandji API Paginated Export\${NC}"
echo -e "\${BLUE}========================================\${NC}"
echo -e "Endpoint: \${ENDPOINT}"
echo -e "Output: \${OUTPUT_FILE}"
echo ""

# Initialize variables
OFFSET=0
PAGE=1
TOTAL_RECORDS=0
ALL_DATA="[]"

# Create temporary file for intermediate results
TEMP_FILE="\$(mktemp)"
trap "rm -f \$TEMP_FILE" EXIT

echo -e "\${YELLOW}Starting data export...\${NC}"

# Pagination loop
while true; do
    echo -e "\${BLUE}Fetching page \${PAGE} (offset: \${OFFSET}, limit: \${LIMIT})...\${NC}"

    # Build URL with pagination
    URL="\${BASE_URL}\${ENDPOINT}?limit=\${LIMIT}&offset=\${OFFSET}${params}"

    # Make API request
    HTTP_CODE=\$(curl -s -w "%{http_code}" -o "\$TEMP_FILE" \\
        -H "Authorization: Bearer \${API_TOKEN}" \\
        -H "Content-Type: application/json" \\
        "\$URL")

    # Check HTTP status
    if [ "\$HTTP_CODE" -ne 200 ]; then
        echo -e "\${RED}Error: API returned HTTP \${HTTP_CODE}\${NC}"
        echo -e "\${RED}Response:\${NC}"
        cat "\$TEMP_FILE"
        exit 1
    fi

    # Extract data from response
    PAGE_DATA=\$(cat "\$TEMP_FILE")
    PAGE_COUNT=\$(echo "\$PAGE_DATA" | jq '. | length')

    if [ "\$PAGE_COUNT" -eq 0 ]; then
        echo -e "\${GREEN}No more data. Export complete!\${NC}"
        break
    fi

    # Merge data
    ALL_DATA=\$(echo "\$ALL_DATA" | jq --argjson new "\$PAGE_DATA" '. + \$new')
    TOTAL_RECORDS=\$((TOTAL_RECORDS + PAGE_COUNT))

    echo -e "\${GREEN}✓ Fetched \${PAGE_COUNT} records (Total: \${TOTAL_RECORDS})\${NC}"

    # Check if we got fewer records than the limit (last page)
    if [ "\$PAGE_COUNT" -lt "\$LIMIT" ]; then
        echo -e "\${GREEN}Reached last page. Export complete!\${NC}"
        break
    fi

    # Increment for next page
    OFFSET=\$((OFFSET + LIMIT))
    PAGE=\$((PAGE + 1))

    # Rate limiting - wait 1 second between requests
    sleep 1
done

# Save to output file
echo "\$ALL_DATA" | jq '.' > "\$OUTPUT_FILE"

echo ""
echo -e "\${GREEN}========================================\${NC}"
echo -e "\${GREEN}Export Complete!\${NC}"
echo -e "\${GREEN}========================================\${NC}"
echo -e "Total records: \${TOTAL_RECORDS}"
echo -e "Output file: \${OUTPUT_FILE}"
echo -e "File size: \$(du -h "\$OUTPUT_FILE" | cut -f1)"
echo ""
echo -e "\${YELLOW}To view the data:\${NC}"
echo -e "  cat \${OUTPUT_FILE} | jq '.'"
echo ""
echo -e "\${YELLOW}To convert to CSV (requires jq):\${NC}"
echo -e "  cat \${OUTPUT_FILE} | jq -r '(.[0] | keys_unsorted) as \$keys | \$keys, map([.[ \$keys[] ]])[] | @csv' > output.csv"
`;
}

/**
 * Generate script for cursor-based pagination
 */
function generateCursorPaginationScript(
  baseUrl: string,
  config: ScriptConfig,
  outputFile: string,
  token: string
): string {
  const params = buildQueryParams(config.params);
  const limit = config.params?.limit || 500;

  return `#!/bin/bash
set -e

# Kandji API Export Script
# Description: ${config.description}
# Generated: ${new Date().toISOString()}
# Pagination: Cursor-based

# Configuration
BASE_URL="${baseUrl}"
ENDPOINT="${config.endpoint}"
OUTPUT_FILE="${outputFile}"
LIMIT=${limit}
API_TOKEN="${token}"

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

echo -e "\${BLUE}========================================\${NC}"
echo -e "\${BLUE}Kandji API Paginated Export\${NC}"
echo -e "\${BLUE}========================================\${NC}"
echo -e "Endpoint: \${ENDPOINT}"
echo -e "Output: \${OUTPUT_FILE}"
echo ""

# Initialize variables
CURSOR=""
PAGE=1
TOTAL_RECORDS=0
ALL_DATA="[]"

# Create temporary file for intermediate results
TEMP_FILE="\$(mktemp)"
trap "rm -f \$TEMP_FILE" EXIT

echo -e "\${YELLOW}Starting data export...\${NC}"

# Pagination loop
while true; do
    echo -e "\${BLUE}Fetching page \${PAGE}...\${NC}"

    # Build URL with pagination
    if [ -z "\$CURSOR" ]; then
        URL="\${BASE_URL}\${ENDPOINT}?limit=\${LIMIT}${params}"
    else
        URL="\${BASE_URL}\${ENDPOINT}?limit=\${LIMIT}&cursor=\${CURSOR}${params}"
    fi

    # Make API request
    HTTP_CODE=\$(curl -s -w "%{http_code}" -o "\$TEMP_FILE" \\
        -H "Authorization: Bearer \${API_TOKEN}" \\
        -H "Content-Type: application/json" \\
        "\$URL")

    # Check HTTP status
    if [ "\$HTTP_CODE" -ne 200 ]; then
        echo -e "\${RED}Error: API returned HTTP \${HTTP_CODE}\${NC}"
        echo -e "\${RED}Response:\${NC}"
        cat "\$TEMP_FILE"
        exit 1
    fi

    # Extract data and next cursor from response
    RESPONSE=\$(cat "\$TEMP_FILE")
    PAGE_DATA=\$(echo "\$RESPONSE" | jq '.results // .data // .')
    PAGE_COUNT=\$(echo "\$PAGE_DATA" | jq '. | length')
    NEXT_CURSOR=\$(echo "\$RESPONSE" | jq -r '.next // empty')

    if [ "\$PAGE_COUNT" -eq 0 ]; then
        echo -e "\${GREEN}No more data. Export complete!\${NC}"
        break
    fi

    # Merge data
    ALL_DATA=\$(echo "\$ALL_DATA" | jq --argjson new "\$PAGE_DATA" '. + \$new')
    TOTAL_RECORDS=\$((TOTAL_RECORDS + PAGE_COUNT))

    echo -e "\${GREEN}✓ Fetched \${PAGE_COUNT} records (Total: \${TOTAL_RECORDS})\${NC}"

    # Check if there's a next page
    if [ -z "\$NEXT_CURSOR" ] || [ "\$NEXT_CURSOR" = "null" ]; then
        echo -e "\${GREEN}No more pages. Export complete!\${NC}"
        break
    fi

    # Extract cursor value from next URL if it's a full URL
    if [[ "\$NEXT_CURSOR" == http* ]]; then
        CURSOR=\$(echo "\$NEXT_CURSOR" | sed -n 's/.*cursor=\\([^&]*\\).*/\\1/p')
    else
        CURSOR="\$NEXT_CURSOR"
    fi

    PAGE=\$((PAGE + 1))

    # Rate limiting - wait 1 second between requests
    sleep 1
done

# Save to output file
echo "\$ALL_DATA" | jq '.' > "\$OUTPUT_FILE"

echo ""
echo -e "\${GREEN}========================================\${NC}"
echo -e "\${GREEN}Export Complete!\${NC}"
echo -e "\${GREEN}========================================\${NC}"
echo -e "Total records: \${TOTAL_RECORDS}"
echo -e "Output file: \${OUTPUT_FILE}"
echo -e "File size: \$(du -h "\$OUTPUT_FILE" | cut -f1)"
echo ""
echo -e "\${YELLOW}To view the data:\${NC}"
echo -e "  cat \${OUTPUT_FILE} | jq '.'"
echo ""
echo -e "\${YELLOW}To convert to CSV (requires jq):\${NC}"
echo -e "  cat \${OUTPUT_FILE} | jq -r '(.[0] | keys_unsorted) as \$keys | \$keys, map([.[ \$keys[] ]])[] | @csv' > output.csv"
`;
}

/**
 * Build query parameters string
 */
function buildQueryParams(params?: Record<string, string | number | boolean>): string {
  if (!params) {
    return '';
  }

  const filtered = Object.entries(params)
    .filter(([key]) => key !== 'limit' && key !== 'offset' && key !== 'cursor')
    .map(([key, value]) => `&${key}=${encodeURIComponent(String(value))}`)
    .join('');

  return filtered;
}

/**
 * Determine if script generation should be offered
 */
export function shouldOfferScript(
  totalCount?: number,
  currentCount?: number,
  hasNext?: boolean,
  limit?: number
): boolean {
  // Offer script if there are multiple pages
  if (hasNext) {
    return true;
  }

  // Offer script if total count exceeds limit
  if (totalCount && limit && totalCount > limit) {
    return true;
  }

  // Offer script if we're dealing with large datasets (>100 records)
  if (currentCount && currentCount >= 100) {
    return true;
  }

  return false;
}

/**
 * Generate script suggestion message
 */
export function generateScriptSuggestion(
  totalCount?: number,
  currentCount?: number,
  hasNext?: boolean
): string {
  if (hasNext) {
    return 'For complete data export with all pages, use the provided bash script';
  }

  if (totalCount && currentCount && totalCount > currentCount) {
    return `Only showing ${currentCount} of ${totalCount} records. Use the bash script to export all data`;
  }

  return 'Use the provided bash script to export all data with automatic pagination';
}
