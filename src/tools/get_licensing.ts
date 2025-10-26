/**
 * MCP Tool: get_licensing
 * Get Kandji tenant licensing and utilization information
 */

import { KandjiClient } from '../utils/client.js';
import { cache } from '../utils/cache.js';
import { MCPResponse, KandjiLicensing } from '../utils/types.js';

// Cache TTL for licensing data: 1 hour (3600 seconds)
const LICENSING_TTL = 3600;

export async function getLicensing(client: KandjiClient): Promise<MCPResponse<KandjiLicensing>> {
  const startTime = Date.now();

  try {
    // Build cache key
    const cacheKey = 'licensing:info';

    // Check cache
    const cachedData = cache.get<KandjiLicensing>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: formatLicensingSummary(cachedData, true),
        table: {
          columns: ['Metric', 'Value'],
          rows: formatLicensingTable(cachedData),
        },
        data: cachedData,
        metadata: {
          elapsedMs: Date.now() - startTime,
          cached: true,
          source: 'Kandji API',
        },
        suggestions: [
          'Check device list to identify inactive devices',
          'Review license allocation across blueprints',
          'Monitor license utilization trends',
        ],
      };
    }

    // Fetch licensing information
    const licensing = await client.getLicensing();

    // Cache the results
    cache.set(cacheKey, licensing, LICENSING_TTL);

    return {
      success: true,
      summary: formatLicensingSummary(licensing, false),
      table: {
        columns: ['Metric', 'Value'],
        rows: formatLicensingTable(licensing),
      },
      data: licensing,
      metadata: {
        totalCount: 1,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
      suggestions: [
        'Check device list to identify inactive devices',
        'Review license allocation across blueprints',
        'Monitor license utilization trends',
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Categorize error
    let category: 'validation' | 'auth' | 'rate_limit' | 'network' | 'server' = 'server';
    let recovery: string[] = ['Check Kandji API status'];

    if (errorMessage.includes('Authentication')) {
      category = 'auth';
      recovery = [
        'Verify KANDJI_API_TOKEN in .env file',
        'Regenerate API token in Kandji settings',
      ];
    } else if (errorMessage.includes('Rate limit')) {
      category = 'rate_limit';
      recovery = ['Wait a moment and retry', 'Reduce request frequency'];
    } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      category = 'server';
      recovery = [
        'Verify licensing endpoint is available for your Kandji instance',
        'Contact Kandji support',
      ];
    }

    return {
      success: false,
      errors: [
        {
          category,
          message: errorMessage,
          recovery,
        },
      ],
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
    };
  }
}

/**
 * Format licensing data into a human-readable summary
 */
function formatLicensingSummary(licensing: KandjiLicensing, cached: boolean): string {
  // Handle different possible response structures
  if (licensing.total_licenses !== undefined && licensing.used_licenses !== undefined) {
    const available = licensing.total_licenses - licensing.used_licenses;
    const utilization =
      licensing.total_licenses > 0
        ? ((licensing.used_licenses / licensing.total_licenses) * 100).toFixed(1)
        : '0.0';

    return `License utilization: ${licensing.used_licenses}/${licensing.total_licenses} (${utilization}%), ${available} available${cached ? ' (from cache)' : ''}`;
  }

  // Fallback if structure is different
  return `Retrieved licensing information${cached ? ' (from cache)' : ''}`;
}

/**
 * Format licensing data into table rows
 */
function formatLicensingTable(
  licensing: KandjiLicensing
): Array<{ Metric: string; Value: string }> {
  const rows: Array<{ Metric: string; Value: string }> = [];

  // Map common licensing fields to table rows
  const fieldMappings: Record<string, string> = {
    total_licenses: 'Total Licenses',
    used_licenses: 'Used Licenses',
    available_licenses: 'Available Licenses',
    license_type: 'License Type',
    subscription_status: 'Subscription Status',
    expiration_date: 'Expiration Date',
    license_tier: 'License Tier',
  };

  // Add known fields
  for (const [key, label] of Object.entries(fieldMappings)) {
    if (licensing[key] !== undefined && licensing[key] !== null) {
      rows.push({
        Metric: label,
        Value: String(licensing[key]),
      });
    }
  }

  // Calculate derived fields
  if (licensing.total_licenses !== undefined && licensing.used_licenses !== undefined) {
    const available = licensing.total_licenses - licensing.used_licenses;
    const utilization =
      licensing.total_licenses > 0
        ? ((licensing.used_licenses / licensing.total_licenses) * 100).toFixed(1)
        : '0.0';

    rows.push({
      Metric: 'Available Licenses',
      Value: String(available),
    });

    rows.push({
      Metric: 'Utilization',
      Value: `${utilization}%`,
    });
  }

  // If no known fields matched, show all fields generically
  if (rows.length === 0) {
    for (const [key, value] of Object.entries(licensing)) {
      if (typeof value === 'object' && value !== null) {
        rows.push({
          Metric: key,
          Value: JSON.stringify(value),
        });
      } else {
        rows.push({
          Metric: key,
          Value: String(value),
        });
      }
    }
  }

  return rows;
}
