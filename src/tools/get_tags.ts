/**
 * MCP Tool: get_tags
 * Retrieve configured tags from Kandji
 */

import { KandjiClient } from '../utils/client.js';
import { MCPResponse, KandjiTag } from '../utils/types.js';

export async function getTags(
  client: KandjiClient,
  params: { search?: string }
): Promise<MCPResponse<KandjiTag[]>> {
  const startTime = Date.now();

  try {
    // Fetch tags
    const tags = await client.getTags(params);

    return {
      success: true,
      summary: params.search
        ? `Found ${tags.length} tag(s) matching "${params.search}"`
        : `Found ${tags.length} tag(s)`,
      table: {
        columns: ['Tag Name', 'ID'],
        rows: tags.map(tag => ({
          'Tag Name': tag.name,
          ID: tag.id,
        })),
      },
      data: tags,
      metadata: {
        totalCount: tags.length,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
      suggestions: [
        'Use tags to filter devices and organize assets',
        'Assign tags to devices for better categorization',
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
