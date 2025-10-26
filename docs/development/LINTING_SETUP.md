# Linting & Formatting Setup

This document describes the ESLint and Prettier configuration for the MCP Server Iru API project.

## Configuration Files

### ESLint (`eslint.config.js`)
- **Format**: ESLint 9.x flat config
- **Parser**: @typescript-eslint/parser
- **Target**: ES2022 modules
- **Scope**: All `src/**/*.ts` files

#### Key Rules Enabled
- `@typescript-eslint/no-explicit-any`: Warn on `any` types
- `@typescript-eslint/no-unused-vars`: Error on unused variables (allows `_` prefix)
- `@typescript-eslint/explicit-function-return-type`: Warn when return types missing
- `@typescript-eslint/prefer-nullish-coalescing`: Prefer `??` over `||`
- `no-console`: Error on console.log (allows console.error, console.warn)
- `no-var`: Error on `var` usage
- `prefer-const`: Prefer const over let when possible

#### Test Files
- Relaxed rules for `test/**/*.ts` files
- `any` types allowed in tests
- `console.log` allowed in tests
- No return type requirements

### Prettier (`.prettierrc`)
- **Semi-colons**: Required (`;`)
- **Quotes**: Single quotes (`'`)
- **Print Width**: 100 characters
- **Tab Width**: 2 spaces
- **Trailing Commas**: ES5 compatible
- **Arrow Parens**: Avoid when possible

## Available Scripts

### Linting
```bash
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting errors
```

### Formatting
```bash
npm run format          # Format all files with Prettier
npm run format:check    # Check formatting without changing files
```

### Combined Check
```bash
npm run check           # Run both lint and format:check
```

## Current Status

### ESLint Findings
- **Total Issues**: 170 (65 errors, 105 warnings)
- **Auto-fixable**: 64 errors + 1 warning

### Common Issues Found
1. **console.log usage**: 1 error in `execute_device_action.ts`
2. **Nullish coalescing**: 105 warnings (prefer `??` over `||`)
3. **any types**: 14 warnings in `types.ts`
4. **Non-null assertions**: 2 warnings in `index.ts`

### Prettier Findings
- **Files needing formatting**: 27 files
- All source files need formatting to match new style guide

## Recommended Next Steps

### 1. Fix Critical Errors (Immediate)
```bash
# Auto-fix what's possible
npm run lint:fix

# Fix remaining errors manually (console.log usage)
# Edit src/tools/execute_device_action.ts:52
```

### 2. Format All Files (Immediate)
```bash
# Format entire codebase
npm run format
```

### 3. Address Warnings (Short-term)
- Replace `||` with `??` for safer null handling
- Remove `any` types and add proper interfaces
- Remove non-null assertions (`!`) where possible

### 4. Integrate into Workflow (Short-term)
Add pre-commit hooks with husky:
```bash
npm install --save-dev husky lint-staged
npx husky init
```

Create `.husky/pre-commit`:
```bash
#!/bin/sh
npm run check
npm test
```

Add to `package.json`:
```json
"lint-staged": {
  "*.ts": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

### 5. CI/CD Integration (Medium-term)
Add to GitHub Actions workflow:
```yaml
- name: Lint
  run: npm run lint

- name: Format Check
  run: npm run format:check
```

## Benefits

### Code Quality
- Catches potential bugs (unused vars, type issues)
- Enforces modern JavaScript/TypeScript patterns
- Prevents console.log in production code

### Consistency
- Uniform code style across team
- Reduces diff noise in PRs
- Easier code reviews

### Safety
- Null-safe with nullish coalescing
- Type safety with minimal `any`
- Prevents common pitfalls

## Troubleshooting

### ESLint not finding config
If you see "ESLint couldn't find an eslint.config.js file":
- Ensure you're using ESLint 9.x: `npm ls eslint`
- Config must be named `eslint.config.js` (not `.eslintrc`)

### Prettier conflicts with ESLint
Current setup is compatible. Both tools have different concerns:
- **ESLint**: Code quality & best practices
- **Prettier**: Code formatting & style

### Performance issues
If linting is slow:
- Add more files to `ignores` in `eslint.config.js`
- Use `.prettierignore` to skip large files

## References

- [ESLint 9.x Flat Config Guide](https://eslint.org/docs/latest/use/configure/configuration-files)
- [TypeScript ESLint Rules](https://typescript-eslint.io/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [ESLint Migration Guide](https://eslint.org/docs/latest/use/configure/migration-guide)
