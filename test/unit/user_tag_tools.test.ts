/**
 * Unit tests for user and tag tools
 * Tests get_tags, list_users, and get_user
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { KandjiClient } from '../../src/utils/client.js';
import { getTags } from '../../src/tools/get_tags.js';
import { listUsers } from '../../src/tools/list_users.js';
import { getUser } from '../../src/tools/get_user.js';

describe('User and Tag Tools', () => {
  let client: KandjiClient;
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    client = new KandjiClient({
      apiToken: 'test-token',
      subdomain: 'test',
      region: 'us',
    });
    mockFetch.mockClear();
  });

  describe('getTags', () => {
    const mockTags = [
      { id: 'tag-123', name: 'Engineering' },
      { id: 'tag-456', name: 'Marketing' },
      { id: 'tag-789', name: 'Sales' },
    ];

    describe('Basic Functionality', () => {
      it('should retrieve all tags successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTags,
        } as Response);

        const result = await getTags(client, {});

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(3);
      });

      it('should call correct API endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTags,
        } as Response);

        await getTags(client, {});

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/tags'),
          expect.any(Object)
        );
      });
    });

    describe('Search Functionality', () => {
      it('should search tags with query parameter', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [mockTags[0]],
        } as Response);

        const result = await getTags(client, { search: 'Engineering' });

        expect(result.success).toBe(true);
        expect(result.summary).toContain('matching "Engineering"');
      });

      it('should format summary without search term when not provided', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTags,
        } as Response);

        const result = await getTags(client, {});

        expect(result.summary).toContain('Found 3 tag(s)');
        expect(result.summary).not.toContain('matching');
      });
    });

    describe('Table Formatting', () => {
      it('should format table correctly', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTags,
        } as Response);

        const result = await getTags(client, {});

        expect(result.table?.columns).toEqual(['Tag Name', 'ID']);
        expect(result.table?.rows[0]).toEqual({
          'Tag Name': 'Engineering',
          ID: 'tag-123',
        });
      });
    });

    describe('Error Handling', () => {
      it('should handle authentication error (401)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: 'Auth failed' }),
        } as Response);

        const result = await getTags(client, {});

        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('auth');
        expect(result.errors![0].recovery.some(r => r.includes('KANDJI_API_TOKEN'))).toBe(true);
      });

      it('should handle rate limit error (429)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({ error: 'Rate limit' }),
        } as Response);

        const result = await getTags(client, {});

        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('rate_limit');
      });

      it('should handle server error (500)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        } as Response);

        const result = await getTags(client, {});

        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('server');
      });
    });

    describe('Empty Results', () => {
      it('should handle zero tags', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as Response);

        const result = await getTags(client, {});

        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(0);
        expect(result.summary).toContain('Found 0 tag(s)');
      });
    });

    describe('Metadata', () => {
      it('should include metadata', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTags,
        } as Response);

        const result = await getTags(client, {});

        expect(result.metadata?.totalCount).toBe(3);
        expect(result.metadata?.elapsedMs).toBeDefined();
        expect(result.metadata?.source).toBe('Kandji API');
      });

      it('should include suggestions', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockTags,
        } as Response);

        const result = await getTags(client, {});

        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('listUsers', () => {
    const mockUsersResponse = {
      results: [
        { id: 'user-123', email: 'john@example.com', name: 'John Doe', archived: false },
        { id: 'user-456', email: 'jane@example.com', name: 'Jane Smith', archived: false },
        { id: 'user-789', email: 'old@example.com', name: 'Old User', archived: true },
      ],
    };

    describe('Basic Functionality', () => {
      it('should list all users successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response);

        const result = await listUsers(client, {});

        expect(result.success).toBe(true);
        expect(result.data?.results).toHaveLength(3);
      });

      it('should call correct API endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response);

        await listUsers(client, {});

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/users'),
          expect.any(Object)
        );
      });
    });

    describe('Filtering', () => {
      it('should filter by email', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [mockUsersResponse.results[0]] }),
        } as Response);

        await listUsers(client, { email: 'john@example.com' });

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should filter by user ID', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [mockUsersResponse.results[0]] }),
        } as Response);

        await listUsers(client, { id: 'user-123' });

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should filter by integration_id', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response);

        await listUsers(client, { integration_id: 'integration-123' });

        expect(mockFetch).toHaveBeenCalled();
      });

      it('should filter by archived status', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [mockUsersResponse.results[2]] }),
        } as Response);

        const result = await listUsers(client, { archived: true });

        expect(result.success).toBe(true);
      });
    });

    describe('Table Formatting', () => {
      it('should format table with correct columns', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response);

        const result = await listUsers(client, {});

        expect(result.table?.columns).toEqual(['Email', 'Name', 'ID', 'Archived']);
      });

      it('should format table rows correctly', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response);

        const result = await listUsers(client, {});

        expect(result.table?.rows[0]).toEqual({
          Email: 'john@example.com',
          Name: 'John Doe',
          ID: 'user-123',
          Archived: 'No',
        });
      });

      it('should display archived status as Yes/No', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response);

        const result = await listUsers(client, {});

        const rows = result.table?.rows || [];
        expect(rows[0]['Archived']).toBe('No');
        expect(rows[2]['Archived']).toBe('Yes');
      });

      it('should handle missing fields with N/A', async () => {
        const usersWithMissingFields = {
          results: [{ id: 'user-999', email: undefined, name: undefined, archived: false }],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => usersWithMissingFields,
        } as Response);

        const result = await listUsers(client, {});

        const rows = result.table?.rows || [];
        expect(rows[0]['Email']).toBe('N/A');
        expect(rows[0]['Name']).toBe('N/A');
      });
    });

    describe('Error Handling', () => {
      it('should handle authentication error (401)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: 'Auth failed' }),
        } as Response);

        const result = await listUsers(client, {});

        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('auth');
      });

      it('should handle rate limit error (429)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({ error: 'Rate limit' }),
        } as Response);

        const result = await listUsers(client, {});

        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('rate_limit');
      });

      it('should handle server error (500)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        } as Response);

        const result = await listUsers(client, {});

        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('server');
      });
    });

    describe('Metadata', () => {
      it('should include metadata', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUsersResponse,
        } as Response);

        const result = await listUsers(client, {});

        expect(result.metadata?.elapsedMs).toBeDefined();
        expect(result.metadata?.source).toBe('Kandji API');
      });
    });
  });

  describe('getUser', () => {
    const mockUser = {
      id: 'user-123',
      email: 'john@example.com',
      name: 'John Doe',
      archived: false,
    };

    describe('Basic Functionality', () => {
      it('should retrieve user by ID successfully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        expect(result.success).toBe(true);
        expect(result.data?.id).toBe('user-123');
      });

      it('should call correct API endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        } as Response);

        await getUser(client, { user_id: 'user-123' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/users/user-123'),
          expect.any(Object)
        );
      });
    });

    describe('Summary Formatting', () => {
      it('should format summary with email', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        expect(result.summary).toContain('john@example.com');
      });

      it('should use ID when email is missing', async () => {
        const userWithoutEmail = { ...mockUser, email: undefined };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => userWithoutEmail,
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        expect(result.summary).toContain('user-123');
      });
    });

    describe('Table Formatting', () => {
      it('should format table with correct columns', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        expect(result.table?.columns).toEqual(['Field', 'Value']);
      });

      it('should format table rows correctly', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        const rows = result.table?.rows || [];
        expect(rows).toContainEqual({ Field: 'ID', Value: 'user-123' });
        expect(rows).toContainEqual({ Field: 'Email', Value: 'john@example.com' });
        expect(rows).toContainEqual({ Field: 'Name', Value: 'John Doe' });
        expect(rows).toContainEqual({ Field: 'Archived', Value: 'No' });
      });

      it('should display archived status as Yes/No', async () => {
        const archivedUser = { ...mockUser, archived: true };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => archivedUser,
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        const rows = result.table?.rows || [];
        expect(rows).toContainEqual({ Field: 'Archived', Value: 'Yes' });
      });

      it('should handle missing fields with N/A', async () => {
        const userMissingFields = {
          id: 'user-123',
          email: undefined,
          name: undefined,
          archived: false,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => userMissingFields,
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        const rows = result.table?.rows || [];
        expect(rows).toContainEqual({ Field: 'Email', Value: 'N/A' });
        expect(rows).toContainEqual({ Field: 'Name', Value: 'N/A' });
      });
    });

    describe('Error Handling', () => {
      it('should handle authentication error (401)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          json: async () => ({ error: 'Auth failed' }),
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('auth');
        expect(result.errors![0].recovery.some(r => r.includes('KANDJI_API_TOKEN'))).toBe(true);
      });

      it('should handle rate limit error (429)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          json: async () => ({ error: 'Rate limit' }),
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('rate_limit');
      });

      it('should handle server error (500)', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: 'Server error' }),
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        expect(result.success).toBe(false);
        expect(result.errors![0].category).toBe('server');
      });
    });

    describe('Metadata', () => {
      it('should include metadata', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        expect(result.metadata?.totalCount).toBe(1);
        expect(result.metadata?.elapsedMs).toBeDefined();
        expect(result.metadata?.source).toBe('Kandji API');
      });

      it('should include suggestions', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        } as Response);

        const result = await getUser(client, { user_id: 'user-123' });

        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBeGreaterThan(0);
      });
    });
  });
});
