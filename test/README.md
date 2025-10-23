# Kandji MCP Server Test Suite

This directory contains comprehensive tests for the Kandji MCP Server.

## Directory Structure

```
test/
├── unit/              # Jest unit tests
│   ├── cache.test.ts       # Cache utility tests (TTL, expiration, cleanup)
│   ├── client.test.ts      # HTTP client tests (error handling, PII redaction)
│   └── tools.test.ts       # MCP tools tests (response envelopes, validation)
├── integration/       # Integration tests
│   ├── test-all-tools.ts
│   ├── test-users.ts
│   ├── test-vulnerabilities.ts
│   ├── test-threats.ts
│   ├── test-tags.ts
│   └── test-licensing.ts
├── scripts/           # Test utilities
│   ├── run-all-tests.sh
│   └── fix-tool-variables.sh
└── setup.ts          # Jest global setup
```

## Running Tests

### Unit Tests (Jest)

```bash
npm test                  # Run all unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

### Integration Tests

```bash
npm run test:all          # Test all tools
npm run test:users        # Test user management tools
npm run test:vulnerabilities  # Test vulnerability tools
npm run test:threats      # Test threat detection tools
npm run test:tags         # Test tag management
npm run test:licensing    # Test licensing endpoint
```

## Coverage Targets

- **Lines**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Statements**: 80%+

**Current Coverage:**
- Overall: 32%
- Utils (cache.ts, client.ts): 80%+
- New tools (device, audit): 60-80%
- Older tools: 0-20% (needs coverage improvement)

## Test Categories

### Cache Tests
- TTL-based expiration
- Pattern invalidation
- Cleanup mechanisms
- Statistics tracking

### Client Tests
- Error categorization (auth, rate_limit, validation, network, server)
- PII redaction (enabled/disabled)
- API endpoint calls
- Request parameter handling

### Tool Tests
- Response envelope validation
- Error handling and recovery strategies
- Caching behavior
- Parameter validation (Zod schemas)
- Tool-specific functionality

## Writing New Tests

When adding new MCP tools, ensure tests cover:

1. **Success Case**: Valid response envelope structure
2. **Error Cases**: All error categories with proper recovery suggestions
3. **Validation**: Zod schema validation errors
4. **Caching**: Cache hit/miss behavior
5. **Edge Cases**: Empty responses, pagination, etc.

## Test Utilities

- **Mock Fetch**: All tests use mocked `fetch()` for API calls
- **Cache Cleanup**: Cache is cleared before each test
- **Environment**: Test environment variables set in `setup.ts`
