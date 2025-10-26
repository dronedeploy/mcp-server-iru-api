# Pre-commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to enforce code quality standards before commits.

## What Happens on Commit

When you run `git commit`, the pre-commit hook automatically:

1. **Runs lint-staged** on staged files:
   - **Source files (`src/**/*.ts`)**: Runs ESLint with auto-fix, then Prettier formatting
   - **Test files (`test/**/*.ts`)**: Runs Prettier formatting

2. **Runs the test suite** (`npm test`):
   - Executes all 456 unit tests
   - Ensures code coverage meets the 80% threshold
   - Prevents broken code from being committed

## Benefits

- **Automatic code formatting**: Never worry about code style inconsistencies
- **Catch errors early**: Find issues before they reach code review
- **Consistent quality**: All commits meet minimum quality standards
- **Fast feedback**: Only processes staged files (lint-staged), not entire codebase

## How It Works

### lint-staged Configuration

Defined in `package.json`:

```json
{
  "lint-staged": {
    "src/**/*.ts": [
      "eslint --fix",
      "prettier --write"
    ],
    "test/**/*.ts": [
      "prettier --write"
    ]
  }
}
```

### Pre-commit Hook

Located at `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run lint-staged for staged files
npx lint-staged

# Run tests to ensure nothing breaks
npm test
```

## Skipping Hooks (Not Recommended)

In rare cases where you need to bypass the pre-commit hook:

```bash
git commit --no-verify -m "Emergency fix"
```

**⚠️ WARNING**: Only use `--no-verify` in emergencies. Bypassing hooks can introduce broken code.

## Troubleshooting

### Hook not running

If the pre-commit hook doesn't run:

1. Verify hook is executable:
   ```bash
   chmod +x .husky/pre-commit
   ```

2. Ensure husky is initialized:
   ```bash
   npm run prepare
   ```

### Tests failing

If tests fail during commit:

1. Run tests manually to see the issue:
   ```bash
   npm test
   ```

2. Fix the failing tests

3. Stage your changes and commit again

### ESLint errors

If ESLint finds unfixable errors:

1. Review the ESLint output
2. Fix the errors manually
3. Stage your changes and commit again

## Performance

- **lint-staged**: Only processes files you're committing (fast)
- **Tests**: Full test suite runs to ensure no regressions (~5 seconds)

Average pre-commit hook execution time: **5-10 seconds**

## Maintenance

### Update Husky

```bash
npm install --save-dev husky@latest
```

### Update lint-staged

```bash
npm install --save-dev lint-staged@latest
```

### Modify Hook Behavior

Edit `.husky/pre-commit` to customize what runs before commits.

Edit `package.json` lint-staged section to customize file processing.

## Related Documentation

- [LINTING_SETUP.md](./LINTING_SETUP.md) - ESLint and Prettier configuration
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
