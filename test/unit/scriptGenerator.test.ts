/**
 * Unit tests for scriptGenerator utility
 * Tests pagination script generation and script suggestion logic
 */

import { describe, it, expect } from '@jest/globals';
import {
  generatePaginatedScript,
  shouldOfferScript,
  generateScriptSuggestion,
} from '../../src/utils/scriptGenerator.js';

describe('Script Generator', () => {
  const mockKandjiConfig = {
    subdomain: 'test',
    region: 'us' as const,
    token: 'test-token-123',
  };

  describe('generatePaginatedScript', () => {
    it('should generate offset pagination script', () => {
      const scriptConfig = {
        endpoint: '/devices/activity',
        paginationType: 'offset' as const,
        params: { device_id: '123', limit: 300 },
        outputFormat: 'json' as const,
        outputFile: 'output.json',
        description: 'Export device activity',
      };

      const script = generatePaginatedScript(scriptConfig, mockKandjiConfig);

      expect(script).toContain('#!/bin/bash');
      expect(script).toContain('/devices/activity');
      expect(script).toContain('device_id=123');
      expect(script).toContain('LIMIT=300');
      expect(script).toContain('test.api.kandji.io');
    });

    it('should generate cursor pagination script', () => {
      const scriptConfig = {
        endpoint: '/vulnerability-detections',
        paginationType: 'cursor' as const,
        params: { size: 100 },
        outputFormat: 'json' as const,
        description: 'Export vulnerability detections',
      };

      const script = generatePaginatedScript(scriptConfig, mockKandjiConfig);

      expect(script).toContain('#!/bin/bash');
      expect(script).toContain('/vulnerability-detections');
      expect(script).toContain('LIMIT=');
      expect(script).toContain('CURSOR=""');
    });

    it('should use EU region URL when specified', () => {
      const euConfig = {
        subdomain: 'test',
        region: 'eu' as const,
        token: 'test-token',
      };

      const scriptConfig = {
        endpoint: '/devices',
        paginationType: 'offset' as const,
        description: 'Export devices',
      };

      const script = generatePaginatedScript(scriptConfig, euConfig);

      expect(script).toContain('test.clients.eu.kandji.io');
    });

    it('should use default limit when not specified', () => {
      const scriptConfig = {
        endpoint: '/devices',
        paginationType: 'offset' as const,
        description: 'Export devices',
      };

      const script = generatePaginatedScript(scriptConfig, mockKandjiConfig);

      expect(script).toContain('LIMIT=300');
    });

    it('should include non-pagination params in query string', () => {
      const scriptConfig = {
        endpoint: '/devices',
        paginationType: 'offset' as const,
        params: {
          platform: 'Mac',
          blueprint_id: '123',
          limit: 50,
          offset: 0,
        },
        description: 'Export Mac devices',
      };

      const script = generatePaginatedScript(scriptConfig, mockKandjiConfig);

      // Should include custom params
      expect(script).toContain('platform=Mac');
      expect(script).toContain('blueprint_id=123');
    });
  });

  describe('shouldOfferScript', () => {
    it('should offer script when hasNext is true', () => {
      const result = shouldOfferScript(100, 50, true, 50);
      expect(result).toBe(true);
    });

    it('should offer script when totalCount exceeds limit', () => {
      const result = shouldOfferScript(200, 50, false, 50);
      expect(result).toBe(true);
    });

    it('should offer script when currentCount >= 100', () => {
      const result = shouldOfferScript(undefined, 100, false, undefined);
      expect(result).toBe(true);
    });

    it('should NOT offer script for small datasets', () => {
      const result = shouldOfferScript(50, 50, false, 100);
      expect(result).toBe(false);
    });

    it('should NOT offer script when no pagination indicators present', () => {
      const result = shouldOfferScript(undefined, 20, false, undefined);
      expect(result).toBe(false);
    });

    it('should handle undefined totalCount', () => {
      const result = shouldOfferScript(undefined, 50, false, 100);
      expect(result).toBe(false);
    });

    it('should handle undefined limit', () => {
      const result = shouldOfferScript(200, 50, false, undefined);
      expect(result).toBe(false);
    });
  });

  describe('generateScriptSuggestion', () => {
    it('should suggest script when hasNext is true', () => {
      const message = generateScriptSuggestion(undefined, undefined, true);
      expect(message).toContain('complete data export with all pages');
    });

    it('should suggest script when showing partial results', () => {
      const message = generateScriptSuggestion(200, 50, false);
      expect(message).toContain('Only showing 50 of 200 records');
    });

    it('should provide default message for other cases', () => {
      const message = generateScriptSuggestion(undefined, undefined, false);
      expect(message).toContain('automatic pagination');
    });

    it('should handle case where totalCount equals currentCount', () => {
      const message = generateScriptSuggestion(100, 100, false);
      expect(message).toContain('automatic pagination');
    });
  });
});
