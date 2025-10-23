/**
 * Jest test setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.KANDJI_API_TOKEN = 'test-token-12345';
process.env.KANDJI_SUBDOMAIN = 'test-subdomain';
process.env.KANDJI_REGION = 'us';
process.env.ENABLE_PII_REDACTION = 'false';

// Mock fetch globally for tests
global.fetch = jest.fn();

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
