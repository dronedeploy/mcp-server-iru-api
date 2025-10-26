# Contributing to Kandji MCP Server

> **Note:** Kandji has been rebranded as **Iru**. This documentation references "Kandji" as that remains the current API naming convention. All functionality works identically with the Iru platform.

Thank you for your interest in contributing to the Kandji MCP Server!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/mangopudding/mcp-server-iru-api.git
   cd mcp-server-iru-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Kandji API credentials
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## Project Structure

```
mcp-server-kandji-api/
├── src/
│   ├── tools/              # MCP tool implementations (23 tools)
│   ├── utils/              # Core utilities (client, cache, types)
│   └── index.ts            # Server entry point
├── test/
│   ├── unit/               # Jest unit tests
│   ├── integration/        # Integration tests
│   └── scripts/            # Test utilities
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── coverage/               # Test coverage reports
```

## Making Changes

### Adding a New Tool

1. **Create the tool file** in `src/tools/`
   ```typescript
   // src/tools/your_new_tool.ts
   import { z } from 'zod';
   import { KandjiClient } from '../utils/client.js';
   import { cache, CacheTTL } from '../utils/cache.js';
   import { MCPResponse } from '../utils/types.js';

   const YourToolSchema = z.object({
     param: z.string().describe('Parameter description'),
   });

   export async function yourNewTool(
     client: KandjiClient,
     params: z.infer<typeof YourToolSchema>
   ): Promise<MCPResponse<YourReturnType>> {
     // Implementation following the standard pattern
   }
   ```

2. **Register the tool** in `src/index.ts`
   ```typescript
   import { yourNewTool } from './tools/your_new_tool.js';

   server.addTool({
     name: 'your_new_tool',
     description: 'Clear description for AI',
     parameters: YourToolSchema,
     execute: async (params) => {
       const result = await yourNewTool(kandjiClient, params);
       return JSON.stringify(result, null, 2);
     },
   });
   ```

3. **Add tests** in `test/unit/tools.test.ts`
   ```typescript
   describe('yourNewTool', () => {
     it('should return valid response envelope', async () => {
       // Test implementation
     });
   });
   ```

4. **Update documentation** in `docs/TOOLS.md`

### Response Envelope Format

All tools MUST return a standardized response envelope:

```typescript
{
  success: boolean,
  summary?: string,
  table?: {
    columns: string[],
    rows: Record<string, any>[]
  },
  data?: T,
  metadata?: {
    totalCount?: number,
    elapsedMs?: number,
    cached?: boolean,
    source?: string
  },
  suggestions?: string[],
  errors?: ErrorDetail[]
}
```

### Error Handling

Categorize all errors properly:
- `validation`: Bad/missing parameters
- `auth`: Authentication failures
- `rate_limit`: API throttling
- `network`: Connection issues
- `server`: Kandji API errors

Each error must include recovery suggestions.

## Testing Requirements

### Unit Tests
- All new tools must have unit tests
- Test both success and error cases
- Test caching behavior
- Test parameter validation

### Coverage Targets
- Lines: 80%+
- Branches: 80%+
- Functions: 80%+
- Statements: 80%+

### Running Tests
```bash
npm test                # Unit tests
npm run test:coverage   # With coverage
npm run test:watch      # Watch mode
```

## Code Style

### TypeScript
- Use TypeScript strict mode
- Define proper types for all data
- Use Zod for runtime validation
- Avoid `any` types

### Naming Conventions
- Tools: `snake_case` (MCP standard)
- Functions: `camelCase`
- Types: `PascalCase`
- Constants: `UPPER_CASE`

### Comments
- Add JSDoc comments for public functions
- Explain complex logic
- No emoji in code or logs

## Documentation

When adding features, update:
1. `README.md` - If it affects usage
2. `docs/TOOLS.md` - For new tools
3. `docs/CLAUDE.md` - For development guidelines
4. `test/README.md` - For test changes

## Pull Request Process

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow code style guidelines
   - Add tests
   - Update documentation

3. **Run tests**
   ```bash
   npm test
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

Example:
```
feat: add get_device_activity tool with pagination support

- Implement activity history retrieval
- Add pagination parameters (limit, offset)
- Include comprehensive tests
- Update TOOLS.md documentation
```

## Questions?

- Check existing code for examples
- Review `docs/CLAUDE.md` for patterns
- Open an issue for discussion

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
