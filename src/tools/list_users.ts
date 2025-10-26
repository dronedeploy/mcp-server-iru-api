/**
 * MCP Tool: list_users
 * List users from user directory integrations
 */

import { KandjiClient } from '../utils/client.js';
import { MCPResponse, UserListResponse } from '../utils/types.js';

export async function listUsers(
  client: KandjiClient,
  params: { email?: string; id?: string; integration_id?: string; archived?: boolean }
): Promise<MCPResponse<UserListResponse>> {
  const startTime = Date.now();

  try {
    const usersResponse = await client.listUsers(params);

    return {
      success: true,
      summary: `Found ${usersResponse.results.length} user(s)`,
      table: {
        columns: ['Email', 'Name', 'ID', 'Archived'],
        rows: usersResponse.results.map((u: any) => ({
          Email: u.email || 'N/A',
          Name: u.name || 'N/A',
          ID: u.id,
          Archived: u.archived ? 'Yes' : 'No',
        })),
      },
      data: usersResponse,
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
