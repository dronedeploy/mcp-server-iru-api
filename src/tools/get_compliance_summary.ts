/**
 * MCP Tool: get_compliance_summary
 * Summarize organization-wide device compliance
 */

import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, ComplianceSummary } from '../utils/types.js';

export async function getComplianceSummary(
  client: KandjiClient
): Promise<MCPResponse<ComplianceSummary>> {
  const startTime = Date.now();

  try {
    // Build cache key
    const cacheKey = 'compliance:summary';

    // Check cache
    const cachedData = cache.get<ComplianceSummary>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `${cachedData.compliant_devices}/${cachedData.total_devices} devices compliant (${cachedData.compliance_percentage.toFixed(1)}%)`,
        table: {
          columns: ['Platform', 'Compliant', 'Non-Compliant', 'Total'],
          rows: Object.entries(cachedData.by_platform).map(([platform, stats]) => ({
            Platform: platform,
            Compliant: stats.compliant,
            'Non-Compliant': stats.non_compliant,
            Total: stats.compliant + stats.non_compliant,
          })),
        },
        data: cachedData,
        metadata: {
          elapsedMs: Date.now() - startTime,
          cached: true,
          source: 'Iru API',
        },
        suggestions: [
          'Filter non-compliant devices by platform',
          'View individual device details for remediation',
        ],
      };
    }

    // Fetch all devices to calculate compliance
    const devices = await client.listDevices();

    // Calculate compliance statistics
    const byPlatform: Record<string, { compliant: number; non_compliant: number }> = {};

    devices.forEach(device => {
      if (!byPlatform[device.platform]) {
        byPlatform[device.platform] = { compliant: 0, non_compliant: 0 };
      }

      // Assume devices with MDM enabled and agent installed are compliant
      // This is a simplified check - real compliance may involve more criteria
      const isCompliant = device.mdm_enabled && device.agent_installed;

      if (isCompliant) {
        byPlatform[device.platform].compliant++;
      } else {
        byPlatform[device.platform].non_compliant++;
      }
    });

    const totalDevices = devices.length;
    const compliantDevices = Object.values(byPlatform).reduce(
      (sum, stats) => sum + stats.compliant,
      0
    );
    const nonCompliantDevices = totalDevices - compliantDevices;
    const compliancePercentage = totalDevices > 0 ? (compliantDevices / totalDevices) * 100 : 0;

    const summary: ComplianceSummary = {
      total_devices: totalDevices,
      compliant_devices: compliantDevices,
      non_compliant_devices: nonCompliantDevices,
      compliance_percentage: compliancePercentage,
      by_platform: byPlatform,
    };

    // Cache the results
    cache.set(cacheKey, summary, CacheTTL.COMPLIANCE);

    return {
      success: true,
      summary: `${compliantDevices}/${totalDevices} devices compliant (${compliancePercentage.toFixed(1)}%)`,
      table: {
        columns: ['Platform', 'Compliant', 'Non-Compliant', 'Total'],
        rows: Object.entries(byPlatform).map(([platform, stats]) => ({
          Platform: platform,
          Compliant: stats.compliant,
          'Non-Compliant': stats.non_compliant,
          Total: stats.compliant + stats.non_compliant,
        })),
      },
      data: summary,
      metadata: {
        totalCount: totalDevices,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: [
        'Filter non-compliant devices by platform',
        'View individual device details for remediation',
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Categorize error
    let category: 'validation' | 'auth' | 'rate_limit' | 'network' | 'server' = 'server';
    let recovery: string[] = ['Check Iru API status'];

    if (errorMessage.includes('Authentication')) {
      category = 'auth';
      recovery = ['Verify KANDJI_API_TOKEN in .env file', 'Regenerate API token in Iru settings'];
    } else if (errorMessage.includes('Rate limit')) {
      category = 'rate_limit';
      recovery = ['Wait a moment and retry', 'Reduce request frequency'];
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
        source: 'Iru API',
      },
    };
  }
}
