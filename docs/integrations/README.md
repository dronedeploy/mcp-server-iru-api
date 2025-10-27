# Platform Integrations

> **📋 Planning Phase:** This directory contains integration guides for using the Iru API MCP Server with various AI platforms. **Currently, only Claude Desktop is production-ready.** The guides for other platforms represent detailed planning and technical specifications for future implementations.

This directory contains integration guides for using the Iru API MCP Server with various AI platforms.

## Available Integrations

### ✅ Production Ready
- **[Claude Desktop](../../config/README.md)** - Native MCP support, currently implemented

### 📝 Planning Phase (Zero Code Changes Required)
- **[Google Gemini CLI](GEMINI_CLI.md)** - Detailed implementation guide for native MCP support
- **[Ollama](OLLAMA.md)** - Planning document for local AI via community bridge tools

### 🔧 Advanced (Requires HTTP Transport)
- **[OpenAI ChatGPT](CHATGPT.md)** - Web-based interface, requires HTTP refactoring
- **[Microsoft Copilot Studio](COPILOT_STUDIO.md)** - Enterprise integration, requires Azure deployment

## Platform Comparison

| Platform | Transport | Code Changes | Setup Time | Cost/Month | Status |
|----------|-----------|--------------|------------|------------|--------|
| Claude Desktop | stdio | None | 5 min | $20 | ✅ Ready |
| Google Gemini CLI | stdio | None | 30 min | $0-20 | 📝 Documented |
| Ollama | stdio (bridge) | None | 2 hours | $0 | 📝 Documented |
| OpenAI ChatGPT | HTTP | Extensive | 3-4 weeks | $12-65 | 📋 Planned |
| Microsoft Copilot Studio | HTTP | Extensive | 3-4 weeks | $320-500 | 📋 Planned |

## Quick Decision Guide

### Choose **Claude Desktop** if:
- ✅ You want the best MCP experience today
- ✅ You're okay with cloud-based AI
- ✅ You need production-ready stability

### Choose **Google Gemini CLI** if:
- ✅ You want zero code changes
- ✅ You want a free tier option
- ✅ You want command-line interface
- ✅ You need large context windows (1M tokens)

### Choose **Ollama** if:
- ✅ You require 100% local/offline operation
- ✅ You prioritize privacy
- ✅ You have sufficient hardware (8GB+ RAM)
- ✅ You're okay with slightly lower accuracy

### Choose **OpenAI ChatGPT** if:
- ✅ You need web-based interface
- ✅ You have budget for hosting ($12-65/month)
- ✅ You have 3-4 weeks for implementation
- ✅ Gemini CLI doesn't meet your needs

### Choose **Microsoft Copilot Studio** if:
- ✅ You have existing M365/Azure infrastructure
- ✅ You need enterprise compliance features
- ✅ You have budget ($300-500/month)
- ✅ You require Power Platform integration

## Getting Started

1. **Review the [Roadmap](../../ROADMAP.md)** to understand implementation phases
2. **Choose your platform** based on the decision guide above
3. **Follow the integration guide** for your chosen platform
4. **Test with example queries** provided in each guide

## Contributing

If you've successfully integrated with a new platform, please contribute:
1. Add your integration guide to this directory
2. Update the comparison table above
3. Submit a pull request with your changes

## Support

For questions or issues:
- Open an issue on GitHub
- Check the [troubleshooting sections](../../README.md#troubleshooting) in each guide
- Review the [main documentation](../../README.md)

## Related Documentation

- [ROADMAP.md](../../ROADMAP.md) - Multi-platform integration roadmap
- [README.md](../../README.md) - Main project documentation
- [TOOLS.md](../TOOLS.md) - Available MCP tools reference
- [API_REFERENCE.md](../API_REFERENCE.md) - API documentation
