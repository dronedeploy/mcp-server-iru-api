/**
 * MCP Tool: list_behavioral_detections
 * Get behavioral detections from Kandji threat detection
 */

import { KandjiClient } from '../utils/client.js';
import { MCPResponse, BehavioralDetection } from '../utils/types.js';

export async function listBehavioralDetections(
  client: KandjiClient,
  params: { threat_id?: string, classification?: string, status?: string, device_id?: string, limit?: number }
): Promise<MCPResponse<BehavioralDetection[]>> {
  const startTime = Date.now();

  try {
    const detections = await client.listBehavioralDetections(params);

    return {
      success: true,
      summary: `Found ${detections.length} behavioral detection(s)`,
      table: {
        columns: ["Threat ID","Device","Classification","Status","Detection Date"],
        rows: detections.map(d => ({
          'Threat ID': d.threat_id,
          'Device': d.device_name || 'N/A',
          'Classification': d.classification || 'N/A',
          'Status': d.status || 'N/A',
          'Detection Date': d.detection_date || 'N/A',
        })),
      },
      data: detections,
      metadata: {
        totalCount: detections.length,
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
      recovery = ['Verify KANDJI_API_TOKEN in .env file', 'Regenerate API token in Kandji settings'];
    } else if (errorMessage.includes('Rate limit')) {
      category = 'rate_limit';
      recovery = ['Wait a moment and retry', 'Reduce request frequency'];
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
