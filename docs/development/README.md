# Development Documentation

This directory contains documentation for developers working on the MCP Server Iru API project.

## Available Documents

### Code Quality & Tooling

- **[LINTING_SETUP.md](./LINTING_SETUP.md)** - ESLint and Prettier configuration guide
  - Current linting status
  - How to run linters
  - Configuration details
  - Troubleshooting common issues

- **[PRE_COMMIT_HOOKS.md](./PRE_COMMIT_HOOKS.md)** - Pre-commit hooks documentation
  - What happens on commit
  - Husky and lint-staged setup
  - How to skip hooks (emergency only)
  - Troubleshooting guide

## Quick Links

### Project Documentation
- [Main README](../../README.md) - Project overview and installation
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Rebranding Notice](../REBRAND.md) - Kandji → Iru transition

### Technical Guides
- [Tools Reference](../TOOLS.md) - All 23 MCP tools documentation
- [API Reference](../API_REFERENCE.md) - Kandji API endpoints
- [Test Suite](../TEST_SUITE.md) - Testing documentation

### Development Workflow

1. **Setup**: Follow [README](../../README.md) installation steps
2. **Code Standards**: Review [LINTING_SETUP.md](./LINTING_SETUP.md)
3. **Pre-commit Hooks**: Understand [PRE_COMMIT_HOOKS.md](./PRE_COMMIT_HOOKS.md)
4. **Contributing**: Read [CONTRIBUTING.md](../CONTRIBUTING.md)
5. **Testing**: See [TEST_SUITE.md](../TEST_SUITE.md)

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build TypeScript

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format code with Prettier
npm run format:check     # Check formatting
npm run check            # Run lint + format check

# Testing
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Generate coverage report
```

## Project Structure

```
mcp-server-iru-api/
├── src/                 # Source code
│   ├── tools/           # MCP tool implementations
│   └── utils/           # Utilities (client, cache, types)
├── test/                # Test suite
│   ├── unit/            # Unit tests (456 tests)
│   └── integration/     # Integration tests
├── docs/                # Documentation
│   └── development/     # Development docs (you are here)
├── config/              # Configuration files
└── dist/                # Build output
```

## Getting Help

- **Issues**: Check existing documentation first
- **Questions**: Open a GitHub issue
- **Contributing**: See [CONTRIBUTING.md](../CONTRIBUTING.md)
