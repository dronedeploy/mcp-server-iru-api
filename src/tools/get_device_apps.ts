/**
 * MCP Tool: get_device_apps
 * Retrieve installed apps for a specific device
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, KandjiApp } from '../utils/types.js';

const DeviceAppsSchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
});

export async function getDeviceApps(
  client: KandjiClient,
  params: z.infer<typeof DeviceAppsSchema>
): Promise<MCPResponse<KandjiApp[]>> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { device_id } = DeviceAppsSchema.parse(params);

    // Build cache key
    const cacheKey = `device-apps:${device_id}`;

    // Check cache
    const cachedData = cache.get<KandjiApp[]>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `Found ${cachedData.length} installed apps on device`,
        table: {
          columns: ['Name', 'Version', 'Bundle ID'],
          rows: cachedData.slice(0, 20).map(app => ({
            Name: app.name || 'N/A',
            Version: app.version || 'N/A',
            'Bundle ID': app.bundle_id || 'N/A',
          })),
        },
        data: cachedData,
        metadata: {
          totalCount: cachedData.length,
          elapsedMs: Date.now() - startTime,
          cached: true,
          source: 'Iru API',
        },
        suggestions: [
          'View device details',
          'Check device activity',
          'Review library items status',
        ],
      };
    }

    // Fetch device apps
    const apps = await client.getDeviceApps(device_id);

    // Cache the results
    cache.set(cacheKey, apps, CacheTTL.DEVICES);

    return {
      success: true,
      summary: `Found ${apps.length} installed apps on device`,
      table: {
        columns: ['Name', 'Version', 'Bundle ID'],
        rows: apps.slice(0, 20).map(app => ({
          Name: app.name || 'N/A',
          Version: app.version || 'N/A',
          'Bundle ID': app.bundle_id || 'N/A',
        })),
      },
      data: apps,
      metadata: {
        totalCount: apps.length,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: ['View device details', 'Check device activity', 'Review library items status'],
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
    } else if (errorMessage.includes('not found')) {
      category = 'validation';
      recovery = ['Verify the device_id is correct', 'Search for devices to find the correct ID'];
    } else if (error instanceof z.ZodError) {
      category = 'validation';
      recovery = ['Provide a valid device UUID', 'Check the device_id parameter format'];
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
