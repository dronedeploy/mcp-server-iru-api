/**
 * MCP Tool: get_device_parameters
 * Retrieve parameters and their statuses for a specific macOS device
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, DeviceParameter } from '../utils/types.js';

const DeviceParametersSchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
});

export async function getDeviceParameters(
  client: KandjiClient,
  params: z.infer<typeof DeviceParametersSchema>
): Promise<MCPResponse<DeviceParameter[]>> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { device_id } = DeviceParametersSchema.parse(params);

    // Build cache key
    const cacheKey = `device-parameters:${device_id}`;

    // Check cache
    const cachedData = cache.get<DeviceParameter[]>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `Found ${cachedData.length} parameters for device`,
        table: {
          columns: ['Parameter ID', 'Status'],
          rows: cachedData.map(param => ({
            'Parameter ID': param.id || param.parameter_id || 'N/A',
            Status: param.status || 'N/A',
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
          'Check library items status',
          'Review full device status',
          'See parameter correlations: https://github.com/kandji-inc/support/wiki/Devices-API---Parameter-Correlations',
        ],
      };
    }

    // Fetch device parameters
    const parameters = await client.getDeviceParameters(device_id);

    // Cache the results
    cache.set(cacheKey, parameters, CacheTTL.DEVICES);

    return {
      success: true,
      summary: `Found ${parameters.length} parameters for device`,
      table: {
        columns: ['Parameter ID', 'Status'],
        rows: parameters.map(param => ({
          'Parameter ID': param.id || param.parameter_id || 'N/A',
          Status: param.status || 'N/A',
        })),
      },
      data: parameters,
      metadata: {
        totalCount: parameters.length,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: [
        'View device details',
        'Check library items status',
        'Review full device status',
        'See parameter correlations: https://github.com/kandji-inc/support/wiki/Devices-API---Parameter-Correlations',
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
        'Parameters endpoint is only applicable to macOS devices',
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
