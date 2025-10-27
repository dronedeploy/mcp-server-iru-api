# Ollama Integration

Use the Iru API MCP Server with local Ollama models for 100% private, offline AI-driven device management.

## Overview

Ollama integration is achieved through community bridge tools that connect your stdio-based MCP server to local Ollama models. This provides complete privacy with no cloud dependencies.

### Benefits
- ✅ **100% local and offline** - No data leaves your machine
- ✅ **Zero code changes** - Uses existing stdio server
- ✅ **No API costs** - Completely free
- ✅ **Privacy-focused** - Perfect for sensitive environments
- ✅ **Multiple model options** - Qwen, Llama, Mistral, and more
- ✅ **Two integration methods** - TypeScript bridge or Python TUI

## Quick Start

> **📝 Note**: Complete Ollama integration documentation is coming soon as part of Phase 2 of the [roadmap](../../ROADMAP.md).
>
> For now, refer to the [ROADMAP - Phase 2: Ollama](../../ROADMAP.md#phase-2-ollama-local-ai) section for detailed implementation tasks.

### Prerequisites
- Ollama installed (`brew install ollama` on macOS)
- 8GB+ RAM recommended (16GB+ for 7B models)
- This MCP server built (`npm run build`)

### Recommended Models
- `qwen2.5-coder:7b-instruct` - Best for tool calling
- `llama3.2:3b` - Lightweight alternative
- `mistral:7b-instruct` - Good balance

### Bridge Options

**Option A: ollama-mcp-bridge** (TypeScript)
- https://github.com/patruff/ollama-mcp-bridge
- Multi-server support
- Smart tool routing

**Option B: mcp-client-for-ollama** (Python TUI)
- https://github.com/jonigl/mcp-client-for-ollama
- Beautiful terminal interface
- Human-in-the-loop approvals
- Hot-reloading servers

## Coming Soon

This integration guide will include:
- [ ] Step-by-step setup for both bridge options
- [ ] Model comparison and benchmarks
- [ ] Performance optimization tips
- [ ] Troubleshooting guide for OOM errors
- [ ] Offline workflow examples
- [ ] System requirements and recommendations

## Related Documentation

- [ROADMAP - Phase 2](../../ROADMAP.md#phase-2-ollama-local-ai) - Complete implementation plan
- [Gemini CLI Integration](GEMINI_CLI.md) - Alternative cloud-based option
- [Main README](../../README.md) - Project overview

## Timeline

**Target Completion**: 2-4 weeks after Phase 1 (Gemini CLI) completion

**Estimated Setup Time**: 1-2 hours once documented

---

*Last Updated: 2025-10-27*
