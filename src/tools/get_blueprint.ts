/**
 * MCP Tool: get_blueprint
 * Fetch a single blueprint by ID (includes library_items when returned by the API).
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, KandjiBlueprint } from '../utils/types.js';

const GetBlueprintSchema = z.object({
  blueprint_id: z.string().uuid().describe('Blueprint UUID'),
});

export async function getBlueprintDetails(
  client: KandjiClient,
  params: z.infer<typeof GetBlueprintSchema>
): Promise<MCPResponse<KandjiBlueprint>> {
  const startTime = Date.now();

  try {
    const { blueprint_id } = GetBlueprintSchema.parse(params);
    const cacheKey = `blueprint:${blueprint_id}`;

    const cached = cache.get<KandjiBlueprint>(cacheKey);
    if (cached) {
      return {
        success: true,
        summary: `Blueprint "${cached.name}" (from cache)`,
        table: {
          columns: ['Property', 'Value'],
          rows: [
            { Property: 'Name', Value: cached.name },
            { Property: 'ID', Value: cached.id },
            {
              Property: 'Library items',
              Value: cached.library_items?.length?.toString() ?? '0',
            },
          ],
        },
        data: cached,
        metadata: {
          elapsedMs: Date.now() - startTime,
          cached: true,
          source: 'Iru API',
        },
        suggestions: ['Compare with list_blueprints', 'Filter devices by this blueprint_id'],
      };
    }

    const blueprint = await client.getBlueprint(blueprint_id);
    cache.set(cacheKey, blueprint, CacheTTL.BLUEPRINTS);

    return {
      success: true,
      summary: `Blueprint "${blueprint.name}"`,
      table: {
        columns: ['Property', 'Value'],
        rows: [
          { Property: 'Name', Value: blueprint.name },
          { Property: 'ID', Value: blueprint.id },
          {
            Property: 'Library items',
            Value: blueprint.library_items?.length?.toString() ?? '0',
          },
        ],
      },
      data: blueprint,
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: ['Compare with list_blueprints', 'Filter devices by this blueprint_id'],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

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
      recovery = ['Verify blueprint_id from list_blueprints', 'Check the UUID format'];
    } else if (error instanceof z.ZodError) {
      category = 'validation';
      recovery = ['Provide a valid blueprint UUID'];
    }

    return {
      success: false,
      errors: [{ category, message: errorMessage, recovery }],
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
    };
  }
}
