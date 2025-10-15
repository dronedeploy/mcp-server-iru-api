/**
 * MCP Tool: search_devices_by_criteria
 * Filter devices by name, OS, platform, or compliance status
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, KandjiDevice } from '../utils/types.js';

const SearchCriteriaSchema = z.object({
  name: z.string().optional().describe('Filter by device name (partial match)'),
  platform: z.enum(['Mac', 'iPhone', 'iPad', 'AppleTV']).optional().describe('Filter by platform'),
  blueprint_id: z.string().optional().describe('Filter by blueprint UUID'),
});

export async function searchDevicesByCriteria(
  client: KandjiClient,
  params: z.infer<typeof SearchCriteriaSchema>
): Promise<MCPResponse<KandjiDevice[]>> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const validatedParams = SearchCriteriaSchema.parse(params);

    // Build cache key
    const cacheKey = `devices:search:${JSON.stringify(validatedParams)}`;

    // Check cache
    const cachedData = cache.get<KandjiDevice[]>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `Found ${cachedData.length} device(s) (from cache)`,
        table: {
          columns: ['Device Name', 'Platform', 'OS Version', 'Serial Number', 'User'],
          rows: cachedData.map(d => ({
            'Device Name': d.device_name,
            'Platform': d.platform,
            'OS Version': d.os_version,
            'Serial Number': d.serial_number,
            'User': d.user_email || 'N/A',
          })),
        },
        data: cachedData,
        metadata: {
          totalCount: cachedData.length,
          elapsedMs: Date.now() - startTime,
          cached: true,
          source: 'Kandji API',
        },
        suggestions: [
          'Get details for a specific device using get_device_details',
          'Filter by blueprint_id to narrow results',
        ],
      };
    }

    // Fetch all devices (with platform filter if specified)
    const devices = await client.listDevices({
      platform: validatedParams.platform,
      blueprint_id: validatedParams.blueprint_id,
    });

    // Apply name filter if specified (client-side filtering)
    let filteredDevices = devices;
    if (validatedParams.name) {
      const nameQuery = validatedParams.name.toLowerCase();
      filteredDevices = devices.filter(d =>
        d.device_name.toLowerCase().includes(nameQuery)
      );
    }

    // Cache the results
    cache.set(cacheKey, filteredDevices, CacheTTL.DEVICES);

    return {
      success: true,
      summary: `Found ${filteredDevices.length} device(s) matching criteria`,
      table: {
        columns: ['Device Name', 'Platform', 'OS Version', 'Serial Number', 'User'],
        rows: filteredDevices.map(d => ({
          'Device Name': d.device_name,
          'Platform': d.platform,
          'OS Version': d.os_version,
          'Serial Number': d.serial_number,
          'User': d.user_email || 'N/A',
        })),
      },
      data: filteredDevices,
      metadata: {
        totalCount: filteredDevices.length,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
      suggestions: [
        'Get details for a specific device using get_device_details',
        'Check compliance status with get_compliance_summary',
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Categorize error
    let category: 'validation' | 'auth' | 'rate_limit' | 'network' | 'server' = 'server';
    let recovery: string[] = ['Check Kandji API status'];

    if (errorMessage.includes('Authentication')) {
      category = 'auth';
      recovery = ['Verify KANDJI_API_TOKEN in .env file', 'Regenerate API token in Kandji settings'];
    } else if (errorMessage.includes('Rate limit')) {
      category = 'rate_limit';
      recovery = ['Wait a moment and retry', 'Reduce request frequency'];
    } else if (error instanceof z.ZodError) {
      category = 'validation';
      recovery = ['Check parameter format', 'Ensure all required fields are provided'];
    }

    return {
      success: false,
      errors: [{
        category,
        message: errorMessage,
        recovery,
      }],
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
    };
  }
}
