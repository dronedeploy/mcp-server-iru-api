/**
 * MCP Tool: list_blueprints
 * List all device blueprints and associated profiles
 */

import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, KandjiBlueprint } from '../utils/types.js';

export async function listBlueprints(
  client: KandjiClient
): Promise<MCPResponse<KandjiBlueprint[]>> {
  const startTime = Date.now();

  try {
    // Build cache key
    const cacheKey = 'blueprints:list';

    // Check cache
    const cachedData = cache.get<KandjiBlueprint[]>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `Found ${cachedData.length} blueprint(s) (from cache)`,
        table: {
          columns: ['Blueprint Name', 'ID', 'Enrollment Active'],
          rows: cachedData.map(b => ({
            'Blueprint Name': b.name,
            ID: b.id,
            'Enrollment Active': b.enrollment_code_is_active ? 'Yes' : 'No',
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
          'Get detailed blueprint info with blueprint ID',
          'Filter devices by blueprint_id',
        ],
      };
    }

    // Fetch all blueprints
    const blueprints = await client.listBlueprints();

    // Cache the results
    cache.set(cacheKey, blueprints, CacheTTL.BLUEPRINTS);

    return {
      success: true,
      summary: `Found ${blueprints.length} blueprint(s)`,
      table: {
        columns: ['Blueprint Name', 'ID', 'Enrollment Active'],
        rows: blueprints.map(b => ({
          'Blueprint Name': b.name,
          ID: b.id,
          'Enrollment Active': b.enrollment_code_is_active ? 'Yes' : 'No',
        })),
      },
      data: blueprints,
      metadata: {
        totalCount: blueprints.length,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: [
        'Get detailed blueprint info with blueprint ID',
        'Filter devices by blueprint_id',
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
