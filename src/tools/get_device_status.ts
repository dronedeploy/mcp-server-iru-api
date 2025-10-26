/**
 * MCP Tool: get_device_status
 * Retrieve full status (parameters and library items) for a specific device
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, DeviceStatus } from '../utils/types.js';

const DeviceStatusSchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
});

export async function getDeviceStatus(
  client: KandjiClient,
  params: z.infer<typeof DeviceStatusSchema>
): Promise<MCPResponse<DeviceStatus>> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { device_id } = DeviceStatusSchema.parse(params);

    // Build cache key
    const cacheKey = `device-status:${device_id}`;

    // Check cache
    const cachedData = cache.get<DeviceStatus>(cacheKey);
    if (cachedData) {
      const libraryItemCount = cachedData.library_items?.length || 0;
      const parameterCount = cachedData.parameters?.length || 0;

      return {
        success: true,
        summary: `Device status: ${libraryItemCount} library items, ${parameterCount} parameters`,
        table: {
          columns: ['Type', 'Count'],
          rows: [
            { Type: 'Library Items', Count: libraryItemCount },
            { Type: 'Parameters', Count: parameterCount },
          ],
        },
        data: cachedData,
        metadata: {
          elapsedMs: Date.now() - startTime,
          cached: true,
          source: 'Iru API',
        },
        suggestions: [
          'View device details',
          'Check specific library items',
          'Review specific parameters',
        ],
      };
    }

    // Fetch device status
    const status = await client.getDeviceStatus(device_id);

    // Cache the results
    cache.set(cacheKey, status, CacheTTL.DEVICES);

    const libraryItemCount = status.library_items?.length || 0;
    const parameterCount = status.parameters?.length || 0;

    return {
      success: true,
      summary: `Device status: ${libraryItemCount} library items, ${parameterCount} parameters`,
      table: {
        columns: ['Type', 'Count'],
        rows: [
          { Type: 'Library Items', Count: libraryItemCount },
          { Type: 'Parameters', Count: parameterCount },
        ],
      },
      data: status,
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: [
        'View device details',
        'Check specific library items',
        'Review specific parameters',
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
