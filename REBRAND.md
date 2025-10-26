# Kandji → Iru Rebranding Notice

## Overview

**Kandji has officially rebranded as Iru** in 2025. This MCP server continues to provide full compatibility with the Iru platform (formerly Kandji).

## What Changed

- **Company Name**: Kandji → Iru
- **Product Name**: The MDM platform is now called Iru
- **Website**: [iru.com](https://iru.com)

## What Stayed the Same

All technical infrastructure remains unchanged:

- **API Endpoints**: Still use `*.api.kandji.io` domains
- **API Version**: `/api/v1` unchanged
- **Authentication**: Same Bearer token authentication
- **Functionality**: All features work identically
- **Documentation**: API docs at api-docs.kandji.io remain current

## Why This Codebase References "Kandji"

This MCP server maintains "Kandji" naming throughout the codebase for the following reasons:

### 1. **API Alignment**
The Iru API infrastructure continues to use "Kandji" naming conventions:
- Base URLs: `https://{subdomain}.api.kandji.io`
- Environment variables: `KANDJI_API_TOKEN`, `KANDJI_SUBDOMAIN`
- API documentation: https://api-docs.kandji.io

### 2. **Backward Compatibility**
Maintaining "Kandji" naming ensures:
- Existing deployments continue working without changes
- Configuration files remain valid
- Environment variables don't need updating
- No breaking changes for users

### 3. **Code Consistency**
TypeScript classes and interfaces mirror the API structure:
- `KandjiClient` - API client wrapper
- `KandjiDevice` - Device data model
- `KandjiConfig` - Configuration interface
- `KandjiBlueprint` - Blueprint data structure

Changing these names would:
- Break semantic alignment with the API
- Require extensive refactoring
- Potentially introduce bugs
- Confuse developers familiar with the API

## For Users

### If You're New to This Project

Think of "Kandji" in this codebase as the **technical API name** for the Iru platform. Everything works seamlessly with your Iru tenant.

### If You're Migrating Existing Code

No changes needed! Your existing:
- Environment variables (`KANDJI_API_TOKEN`, etc.)
- Configuration files
- API credentials
- Deployed instances

All continue working without modification.

## For Developers

### Adding New Features

When implementing new features:

1. **Follow existing naming conventions**: Use `Kandji*` prefixes for types/classes
2. **Match the API**: Name things as the API documentation describes them
3. **Add comments**: Explain that Kandji refers to the Iru platform API
4. **Update docs**: Reference both "Iru (formerly Kandji)" in user-facing documentation

### Code Comments

Key files include explanatory comments about the rebranding:

- `src/utils/types.ts` - TypeScript type definitions
- `src/utils/client.ts` - API client implementation
- `src/index.ts` - Server entry point

## Documentation Strategy

### User-Facing Documentation
All README and docs files include a prominent notice:
> **Note:** Kandji has been rebranded as **Iru**. This documentation references "Kandji" as that remains the current API naming convention.

### Code Documentation
Inline comments explain why "Kandji" naming is preserved:
```typescript
// Note: "Kandji" naming maintained for API alignment.
// Iru platform continues to use kandji.io API endpoints.
```

## Timeline

- **October 2025**: Repository renamed from `mcp-server-kandji-api` to `mcp-server-iru-api`
- **October 2025**: Rebranding notices added to all documentation
- **Future**: Code naming may update if/when Iru migrates API infrastructure

## Questions?

### "Should I use Kandji or Iru in my code?"

**In your application code**: Use "Iru" when referring to the platform in user-facing text.

**In API integration code**: Use "Kandji" to match the API (this MCP server's approach).

### "Will the API change to iru.io?"

As of October 2025, the API continues using `kandji.io` domains. If Iru migrates the API infrastructure in the future, this codebase will be updated accordingly with proper deprecation notices.

### "Is this project officially supported by Iru?"

This is a community-maintained open-source project. It integrates with the official Iru (formerly Kandji) public API.

## Resources

- **Iru Website**: [iru.com](https://iru.com)
- **API Documentation**: [api-docs.kandji.io](https://api-docs.kandji.io)
- **This Project**: [github.com/mangopudding/mcp-server-iru-api](https://github.com/mangopudding/mcp-server-iru-api)
- **Model Context Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io)

## Summary

**Bottom Line**: The name changed from Kandji to Iru, but the technology didn't. This codebase uses "Kandji" naming because that's what the API uses. Everything works perfectly with your Iru platform.
