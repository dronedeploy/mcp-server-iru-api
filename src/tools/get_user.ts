/**
 * MCP Tool: get_user
 * Get specific user by ID
 */

import { KandjiClient } from '../utils/client.js';
import { MCPResponse, KandjiUser } from '../utils/types.js';

export async function getUser(
  client: KandjiClient,
  params: { user_id: string }
): Promise<MCPResponse<KandjiUser>> {
  const startTime = Date.now();

  try {
    const userData = await client.getUser(params.user_id);

    return {
      success: true,
      summary: `Retrieved user: ${userData.email || userData.id}`,
      table: {
        columns: ['Field', 'Value'],
        rows: [
          { Field: 'ID', Value: userData.id },
          { Field: 'Email', Value: userData.email || 'N/A' },
          { Field: 'Name', Value: userData.name || 'N/A' },
          { Field: 'Archived', Value: userData.archived ? 'Yes' : 'No' },
        ],
      },
      data: userData,
      metadata: {
        totalCount: 1,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
      suggestions: [
        'Use filters to narrow down results',
        'Check individual items for more details',
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
