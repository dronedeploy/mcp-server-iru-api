/**
 * MCP Tool: list_audit_events
 * List audit log events from the Kandji Activity module
 */

import { z } from 'zod';
import { KandjiClient } from '../utils/client.js';
import { cache, CacheTTL } from '../utils/cache.js';
import { MCPResponse, AuditEventListResponse } from '../utils/types.js';
import {
  generatePaginatedScript,
  shouldOfferScript,
  generateScriptSuggestion
} from '../utils/scriptGenerator.js';

const AuditEventsSchema = z.object({
  limit: z.number().optional().describe('Maximum number of events to return (max 500)'),
  sort_by: z.string().optional().describe('Sort results by field (e.g., -occurred_at for descending)'),
  start_date: z.string().optional().describe('Filter by start date (YYYY-MM-DD or datetime format)'),
  end_date: z.string().optional().describe('Filter by end date (YYYY-MM-DD or datetime format)'),
  cursor: z.string().optional().describe('Cursor for pagination'),
});

export async function listAuditEvents(
  client: KandjiClient,
  params: z.infer<typeof AuditEventsSchema>
): Promise<MCPResponse<AuditEventListResponse>> {
  const startTime = Date.now();

  try {
    // Validate parameters
    const { limit, sort_by, start_date, end_date, cursor } = AuditEventsSchema.parse(params);

    // Build cache key
    const cacheKey = `audit-events:${limit || 'default'}:${sort_by || 'default'}:${start_date || ''}:${end_date || ''}:${cursor || ''}`;

    // Check cache
    const cachedData = cache.get<AuditEventListResponse>(cacheKey);
    if (cachedData) {
      return {
        success: true,
        summary: `Retrieved ${cachedData.results.length} audit events`,
        table: {
          columns: ['Occurred At', 'Event Type', 'User', 'Description'],
          rows: cachedData.results.slice(0, 20).map(event => ({
            'Occurred At': event.occurred_at || 'N/A',
            'Event Type': event.event_type || 'N/A',
            User: event.user || event.user_email || 'N/A',
            Description: event.description || 'N/A',
          })),
        },
        data: cachedData,
        metadata: {
          totalCount: cachedData.count,
          elapsedMs: Date.now() - startTime,
          cached: true,
          source: 'Kandji API',
        },
        suggestions: [
          cachedData.next ? 'Use cursor parameter to fetch next page' : 'All events retrieved',
          'Filter by date range for specific period',
          'Sort by different fields for different views',
        ],
      };
    }

    // Fetch audit events
    const response = await client.listAuditEvents({ limit, sort_by, start_date, end_date, cursor });

    // Cache the results (shorter TTL for audit events)
    cache.set(cacheKey, response, CacheTTL.COMPLIANCE);

    // Determine if we should offer a script for large exports
    const hasNext = !!response.next;
    const offerScript = shouldOfferScript(response.count, response.results.length, hasNext, limit);
    let script: string | undefined;

    if (offerScript && process.env.KANDJI_API_TOKEN && process.env.KANDJI_SUBDOMAIN && process.env.KANDJI_REGION) {
      const scriptParams: Record<string, string> = {};
      if (sort_by) scriptParams.sort_by = sort_by;
      if (start_date) scriptParams.start_date = start_date;
      if (end_date) scriptParams.end_date = end_date;

      script = generatePaginatedScript(
        {
          endpoint: '/activity/audit-log',
          paginationType: 'cursor',
          params: { limit: limit || 500, ...scriptParams },
          outputFormat: 'json',
          outputFile: `audit_events_${Date.now()}.json`,
          description: `Export all audit events${start_date ? ` from ${start_date}` : ''}${end_date ? ` to ${end_date}` : ''}`,
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
      summary: `Retrieved ${response.results.length} audit events`,
      table: {
        columns: ['Occurred At', 'Event Type', 'User', 'Description'],
        rows: response.results.slice(0, 20).map(event => ({
          'Occurred At': event.occurred_at || 'N/A',
          'Event Type': event.event_type || 'N/A',
          User: event.user || event.user_email || 'N/A',
          Description: event.description || 'N/A',
        })),
      },
      data: response,
      metadata: {
        totalCount: response.count,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
      suggestions: [
        response.next ? 'Use cursor parameter to fetch next page' : 'All events retrieved',
        'Filter by date range for specific period',
        'Sort by different fields for different views',
        ...(offerScript ? [generateScriptSuggestion(response.count, response.results.length, hasNext)] : []),
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
      recovery = ['Verify KANDJI_API_TOKEN in .env file', 'Regenerate API token in Kandji settings'];
    } else if (errorMessage.includes('Rate limit')) {
      category = 'rate_limit';
      recovery = ['Wait a moment and retry', 'Reduce request frequency'];
    } else if (error instanceof z.ZodError) {
      category = 'validation';
      recovery = ['Check parameter formats', 'Ensure date formats are valid (YYYY-MM-DD)'];
    }

    return {
      success: false,
      errors: [{
        category,
        message: errorMessage,
        recovery,
      }],
      metadata: {
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Kandji API',
      },
    };
  }
}
