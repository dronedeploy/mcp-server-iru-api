/**
 * MCP Tool: get_threat_details
 * Get detailed threat information
 */

import { KandjiClient } from '../utils/client.js';
import { MCPResponse, ThreatDetail } from '../utils/types.js';

export async function getThreatDetails(
  client: KandjiClient,
  params: { classification?: string; status?: string; device_id?: string; limit?: number }
): Promise<MCPResponse<ThreatDetail[]>> {
  const startTime = Date.now();

  try {
    const threats = await client.getThreatDetails(params);

    return {
      success: true,
      summary: `Found ${threats.length} threat(s)`,
      table: {
        columns: ['Threat Name', 'Device', 'Classification', 'Status', 'Detection Date'],
        rows: threats.map(t => ({
          'Threat Name': t.threat_name,
          Device: t.device_name || 'N/A',
          Classification: t.classification,
          Status: t.status || 'N/A',
          'Detection Date': t.detection_date || 'N/A',
        })),
      },
      data: threats,
      metadata: {
        totalCount: threats.length,
        elapsedMs: Date.now() - startTime,
        cached: false,
        source: 'Iru API',
      },
      suggestions: [
        'Use filters to narrow down results',
        'Check individual items for more details',
      ],
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
