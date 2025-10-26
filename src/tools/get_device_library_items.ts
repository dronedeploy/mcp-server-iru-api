/**
 * MCP Tool: get_device_library_items
 * Retrieve library items and their statuses for a specific device
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, DeviceLibraryItem } from '../utils/types.js';

const DeviceLibraryItemsSchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
});

export async function getDeviceLibraryItems(
  client: KandjiClient,
  params: z.infer<typeof DeviceLibraryItemsSchema>
): Promise<MCPResponse<DeviceLibraryItem[]>> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { device_id } = DeviceLibraryItemsSchema.parse(params);

    // Build cache key
    const cacheKey = `device-library-items:${device_id}`;

    // Check cache
    const cachedData = cache.get<DeviceLibraryItem[]>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `Found ${cachedData.length} library items for device`,
        table: {
          columns: ['Name', 'Type', 'Status'],
          rows: cachedData.map(item => ({
            Name: item.name || 'N/A',
            Type: item.type || 'N/A',
            Status: item.status || 'N/A',
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
          'Check device parameters',
          'Review full device status',
        ],
      };
    }

    // Fetch device library items
    const items = await client.getDeviceLibraryItems(device_id);

    // Cache the results
    cache.set(cacheKey, items, CacheTTL.DEVICES);

    return {
      success: true,
      summary: `Found ${items.length} library items for device`,
      table: {
        columns: ['Name', 'Type', 'Status'],
        rows: items.map(item => ({
          Name: item.name || 'N/A',
          Type: item.type || 'N/A',
          Status: item.status || 'N/A',
        })),
      },
      data: items,
      metadata: {
        totalCount: items.length,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: ['View device details', 'Check device parameters', 'Review full device status'],
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
