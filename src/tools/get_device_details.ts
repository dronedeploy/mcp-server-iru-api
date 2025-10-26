/**
 * MCP Tool: get_device_details
 * Retrieve detailed information about a specific device
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, KandjiDevice } from '../utils/types.js';

const DeviceDetailsSchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
});

export async function getDeviceDetails(
  client: KandjiClient,
  params: z.infer<typeof DeviceDetailsSchema>
): Promise<MCPResponse<KandjiDevice>> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { device_id } = DeviceDetailsSchema.parse(params);

    // Build cache key
    const cacheKey = `device:${device_id}`;

    // Check cache
    const cachedData = cache.get<KandjiDevice>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `Device: ${cachedData.device_name} (${cachedData.platform}) - ${cachedData.os_version}`,
        table: {
          columns: ['Property', 'Value'],
          rows: [
            { Property: 'Device Name', Value: cachedData.device_name },
            { Property: 'Serial Number', Value: cachedData.serial_number },
            { Property: 'Platform', Value: cachedData.platform },
            { Property: 'OS Version', Value: cachedData.os_version },
            { Property: 'Model', Value: cachedData.model },
            { Property: 'User Name', Value: cachedData.user_name || 'N/A' },
            { Property: 'User Email', Value: cachedData.user_email || 'N/A' },
            { Property: 'Blueprint', Value: cachedData.blueprint_name || 'N/A' },
            { Property: 'Last Check-in', Value: cachedData.last_check_in || 'N/A' },
            { Property: 'MDM Enabled', Value: cachedData.mdm_enabled ? 'Yes' : 'No' },
            { Property: 'Agent Installed', Value: cachedData.agent_installed ? 'Yes' : 'No' },
            { Property: 'Supervised', Value: cachedData.is_supervised ? 'Yes' : 'No' },
            { Property: 'DEP Enrolled', Value: cachedData.is_dep_enrolled ? 'Yes' : 'No' },
          ],
        },
        data: cachedData,
        metadata: {
          elapsedMs: Date.now() - startTime,
          cached: true,
          source: 'Kandji API',
        },
        suggestions: [
          'View installed apps with search for device apps endpoint',
          'View device activity history',
          'Execute device actions (lock, restart, etc.)',
        ],
      };
    }

    // Fetch device details
    const device = await client.getDevice(device_id);

    // Cache the results
    cache.set(cacheKey, device, CacheTTL.DEVICES);

    return {
      success: true,
      summary: `Device: ${device.device_name} (${device.platform}) - ${device.os_version}`,
      table: {
        columns: ['Property', 'Value'],
        rows: [
          { Property: 'Device Name', Value: device.device_name },
          { Property: 'Serial Number', Value: device.serial_number },
          { Property: 'Platform', Value: device.platform },
          { Property: 'OS Version', Value: device.os_version },
          { Property: 'Model', Value: device.model },
          { Property: 'User Name', Value: device.user_name || 'N/A' },
          { Property: 'User Email', Value: device.user_email || 'N/A' },
          { Property: 'Blueprint', Value: device.blueprint_name || 'N/A' },
          { Property: 'Last Check-in', Value: device.last_check_in || 'N/A' },
          { Property: 'MDM Enabled', Value: device.mdm_enabled ? 'Yes' : 'No' },
          { Property: 'Agent Installed', Value: device.agent_installed ? 'Yes' : 'No' },
          { Property: 'Supervised', Value: device.is_supervised ? 'Yes' : 'No' },
          { Property: 'DEP Enrolled', Value: device.is_dep_enrolled ? 'Yes' : 'No' },
        ],
      },
      data: device,
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
      suggestions: [
        'View installed apps with search for device apps endpoint',
        'View device activity history',
        'Execute device actions (lock, restart, etc.)',
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
