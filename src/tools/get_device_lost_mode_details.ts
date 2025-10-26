/**
 * MCP Tool: get_device_lost_mode_details
 * Retrieve lost mode details for a specific iOS/iPadOS device
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, DeviceLostModeDetails } from '../utils/types.js';

const DeviceLostModeDetailsSchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
});

export async function getDeviceLostModeDetails(
  client: KandjiClient,
  params: z.infer<typeof DeviceLostModeDetailsSchema>
): Promise<MCPResponse<DeviceLostModeDetails>> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { device_id } = DeviceLostModeDetailsSchema.parse(params);

    // Build cache key
    const cacheKey = `device-lost-mode:${device_id}`;

    // Check cache
    const cachedData = cache.get<DeviceLostModeDetails>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `Lost Mode is ${cachedData.enabled ? 'enabled' : 'disabled'} for this device`,
        table: {
          columns: ['Property', 'Value'],
          rows: [
            { Property: 'Enabled', Value: cachedData.enabled ? 'Yes' : 'No' },
            { Property: 'Message', Value: cachedData.message || 'N/A' },
            { Property: 'Phone Number', Value: cachedData.phone_number || 'N/A' },
            { Property: 'Footnote', Value: cachedData.footnote || 'N/A' },
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
          'Check device status',
          'Execute device action if needed',
        ],
      };
    }

    // Fetch device lost mode details
    const lostMode = await client.getDeviceLostModeDetails(device_id);

    // Cache the results
    cache.set(cacheKey, lostMode, CacheTTL.DEVICES);

    return {
      success: true,
      summary: `Lost Mode is ${lostMode.enabled ? 'enabled' : 'disabled'} for this device`,
      table: {
        columns: ['Property', 'Value'],
        rows: [
          { Property: 'Enabled', Value: lostMode.enabled ? 'Yes' : 'No' },
          { Property: 'Message', Value: lostMode.message || 'N/A' },
          { Property: 'Phone Number', Value: lostMode.phone_number || 'N/A' },
          { Property: 'Footnote', Value: lostMode.footnote || 'N/A' },
        ],
      },
      data: lostMode,
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: [
        'View device details',
        'Check device status',
        'Execute device action if needed',
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
      recovery = [
        'Verify the device_id is correct',
        'Lost Mode is only available for iOS/iPadOS devices',
        'Search for devices to find the correct ID',
      ];
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
