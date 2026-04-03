/**
 * Unit tests for get_blueprint tool
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getBlueprintDetails } from '../../src/tools/get_blueprint.js';
import { KandjiClient } from '../../src/utils/client.js';

describe('getBlueprintDetails', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const blueprintId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
      enablePIIRedaction: false,
    });
    mockFetch.mockClear();
  });

  it('should return blueprint with library_items', async () => {
    const mockBlueprint = {
      id: blueprintId,
      name: 'Standard',
      enrollment_code_is_active: true,
      library_items: [{ id: 'li-1', name: 'Profile A', type: 'profile' as const }],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockBlueprint,
    } as Response);

    const result = await getBlueprintDetails(client, { blueprint_id: blueprintId });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(blueprintId);
    expect(result.data?.library_items).toHaveLength(1);
    expect(result.summary).toContain('Standard');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(`/blueprints/${blueprintId}`),
      expect.any(Object)
    );
  });

  it('should reject invalid blueprint_id', async () => {
    const result = await getBlueprintDetails(client, { blueprint_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
    expect(result.errors?.[0].category).toBe('validation');
  });
});
