/**
 * MCP Tool: get_device_activity
 * Retrieve device activity history for a specific device
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, KandjiActivity } from '../utils/types.js';
import {
  generatePaginatedScript,
  shouldOfferScript,
  generateScriptSuggestion,
} from '../utils/scriptGenerator.js';

const DeviceActivitySchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
  limit: z.number().optional().describe('Maximum number of activity records to return (max 300)'),
  offset: z.number().optional().describe('Starting record to return for pagination'),
});

export async function getDeviceActivity(
  client: KandjiClient,
  params: z.infer<typeof DeviceActivitySchema>
): Promise<MCPResponse<KandjiActivity[]>> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { device_id, limit, offset } = DeviceActivitySchema.parse(params);

    // Build cache key
    const cacheKey = `device-activity:${device_id}:${limit || 'default'}:${offset || 0}`;

    // Check cache
    const cachedData = cache.get<KandjiActivity[]>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `Retrieved ${cachedData.length} activity records for device`,
        table: {
          columns: ['Timestamp', 'Event Type', 'Description'],
          rows: cachedData.slice(0, 10).map(activity => ({
            Timestamp: activity.timestamp || 'N/A',
            'Event Type': activity.event_type || 'N/A',
            Description: activity.description || 'N/A',
          })),
        },
        data: cachedData,
        metadata: {
          totalCount: cachedData.length,
          limit,
          offset,
          elapsedMs: Date.now() - startTime,
          cached: true,
          source: 'Kandji API',
        },
        suggestions: ['View device details', 'Check installed apps', 'Review device status'],
      };
    }

    // Fetch device activity
    const activities = await client.getDeviceActivity(device_id, { limit, offset });

    // Cache the results
    cache.set(cacheKey, activities, CacheTTL.DEVICES);

    // Determine if we should offer a script for large exports
    const offerScript = shouldOfferScript(
      undefined,
      activities.length,
      activities.length === limit,
      limit
    );
    let script: string | undefined;

    if (
      offerScript &&
      process.env.KANDJI_API_TOKEN &&
      process.env.KANDJI_SUBDOMAIN &&
      process.env.KANDJI_REGION
    ) {
      script = generatePaginatedScript(
        {
          endpoint: `/devices/${device_id}/activity`,
          paginationType: 'offset',
          params: { limit: limit || 300 },
          outputFormat: 'json',
          outputFile: `device_activity_${device_id}_${Date.now()}.json`,
          description: `Export all activity records for device ${device_id}`,
        },
        {
          subdomain: process.env.KANDJI_SUBDOMAIN,
          region: process.env.KANDJI_REGION as 'us' | 'eu',
          token: process.env.KANDJI_API_TOKEN,
        }
      );
    }

    return {
      success: true,
      summary: `Retrieved ${activities.length} activity records for device`,
      table: {
        columns: ['Timestamp', 'Event Type', 'Description'],
        rows: activities.slice(0, 10).map(activity => ({
          Timestamp: activity.timestamp || 'N/A',
          'Event Type': activity.event_type || 'N/A',
          Description: activity.description || 'N/A',
        })),
      },
      data: activities,
      metadata: {
        totalCount: activities.length,
        limit,
        offset,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
      suggestions: [
        'View device details',
        'Check installed apps',
        'Review device status',
        ...(offerScript
          ? [generateScriptSuggestion(undefined, activities.length, activities.length === limit)]
          : []),
      ],
      script,
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
        source: 'Kandji API',
      },
    };
  }
}
