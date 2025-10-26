/**
 * MCP Tool: execute_device_action
 * Execute device actions (lock, restart, shutdown, erase) with confirmation
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache } from '../utils/cache.js';
import { MCPResponse } from '../utils/types.js';

const DeviceActionSchema = z.object({
  device_id: z.string().uuid().describe('Device UUID'),
  action: z.enum(['lock', 'restart', 'shutdown', 'erase']).describe('Action to perform'),
  confirm: z.boolean().describe('Confirmation flag (must be true for destructive actions)'),
  message: z.string().optional().describe('Lock screen message (for lock action only)'),
  pin: z.string().optional().describe('6-digit PIN for erase action on macOS'),
});

export async function executeDeviceAction(
  client: KandjiClient,
  params: z.infer<typeof DeviceActionSchema>
): Promise<MCPResponse> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { device_id, action, confirm, message, pin } = DeviceActionSchema.parse(params);

    // Require explicit confirmation for all actions
    if (!confirm) {
      return {
        success: false,
        errors: [
          {
            category: 'validation',
            message: 'Device action requires explicit confirmation. Set confirm=true to proceed.',
            recovery: [
              'Add confirm: true to the request',
              'Verify this is the correct device before confirming',
            ],
          },
        ],
        metadata: {
          elapsedMs: Date.now() - startTime,
          cached: false,
          source: 'MCP Server',
        },
      };
    }

    // Additional warning for erase action
    if (action === 'erase') {
      // Log audit trail for destructive action
      console.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          action: 'DEVICE_ERASE',
          device_id,
          confirmed: confirm,
        })
      );
    }

    // Execute the action
    let response;
    let actionDescription = '';

    switch (action) {
      case 'lock':
        response = await client.lockDevice(device_id, message);
        actionDescription = 'Device locked successfully';
        break;

      case 'restart':
        response = await client.restartDevice(device_id);
        actionDescription = 'Device restart command sent';
        break;

      case 'shutdown':
        response = await client.shutdownDevice(device_id);
        actionDescription = 'Device shutdown command sent';
        break;

      case 'erase':
        response = await client.eraseDevice(device_id, { pin });
        actionDescription = 'Device erase command sent - THIS WILL WIPE THE DEVICE';
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Invalidate device cache after action
    cache.invalidate(`device:${device_id}`);

    // Build response table
    const rows: Record<string, string | number | boolean>[] = [
      { Property: 'Action', Value: action.toUpperCase() },
      { Property: 'Device ID', Value: device_id },
      { Property: 'Status', Value: 'Success' },
    ];

    if (action === 'lock' && response.unlock_pin) {
      rows.push({ Property: 'Unlock PIN', Value: response.unlock_pin });
    }

    return {
      success: true,
      summary: actionDescription,
      table: {
        columns: ['Property', 'Value'],
        rows,
      },
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions:
        action === 'erase'
          ? []
          : [
              'Check device status with get_device_details',
              'View device activity to confirm action execution',
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
      recovery = [
        'Check parameter format',
        'Ensure device_id is a valid UUID',
        'Ensure action is one of: lock, restart, shutdown, erase',
        'Set confirm to true',
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
        source: 'Iru API',
      },
    };
  }
}
