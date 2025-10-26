# Claude Desktop Configuration

> **Note:** Kandji has been rebranded as **Iru**. This documentation references "Kandji" as that remains the current API naming convention. All functionality works identically with the Iru platform.

This folder contains example configuration files for integrating the Kandji MCP Server with Anthropic Claude Desktop.

## Quick Setup

### 1. Locate Your Claude Desktop Config

The Claude Desktop configuration file is located at:

**macOS:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Windows:**
```
%APPDATA%\Claude\claude_desktop_config.json
```

**Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 2. Build the MCP Server

Before configuring Claude Desktop, build the server:

```bash
cd /path/to/mcp-server-kandji-api
npm install
npm run build
```

This creates the `dist/index.js` file that Claude Desktop will run.

### 3. Configure Claude Desktop

#### Option A: Copy Example Config

1. Copy the example configuration:
   ```bash
   cp config/claude_desktop_config.example.json ~/Desktop/kandji-config.json
   ```

2. Edit the file and replace:
   - `/ABSOLUTE/PATH/TO/mcp-server-kandji-api/dist/index.js` with your actual path
   - `your_api_token_here` with your Kandji API token
   - `your_subdomain_here` with your Kandji subdomain

3. Merge into your Claude Desktop config:
   - Open `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Add the `kandji` server configuration to the `mcpServers` section

#### Option B: Manual Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kandji": {
      "command": "node",
      "args": [
        "/Users/yourname/path/to/mcp-server-kandji-api/dist/index.js"
      ],
      "env": {
        "KANDJI_API_TOKEN": "your_api_token_here",
        "KANDJI_SUBDOMAIN": "your_subdomain_here",
        "KANDJI_REGION": "us"
      }
    }
  }
}
```

### 4. Get Your Kandji API Token

1. Log in to your Kandji tenant: `https://your_subdomain.kandji.io`
2. Navigate to **Settings** → **Access** → **API Token**
3. Click **"Create API Token"**
4. Give it a name (e.g., "Claude Desktop MCP")
5. Enable **ALL permissions** (required for full functionality)
6. Copy the generated token
7. Paste into your Claude Desktop config

### 5. Restart Claude Desktop

After saving the configuration:

1. Quit Claude Desktop completely
2. Relaunch Claude Desktop
3. The Kandji MCP server will start automatically

## Configuration Options

### Required Settings

| Setting | Description | Example |
|---------|-------------|---------|
| `KANDJI_API_TOKEN` | Your Kandji API token | `eyJhbGc...` |
| `KANDJI_SUBDOMAIN` | Your Kandji subdomain | `mycompany` |
| `KANDJI_REGION` | Kandji region (`us` or `eu`) | `us` |

### Optional Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `ENABLE_PII_REDACTION` | `false` | Redact user emails/names in responses |
| `CACHE_TTL_DEVICES` | `300` | Device cache TTL in seconds (5 min) |
| `CACHE_TTL_COMPLIANCE` | `120` | Compliance cache TTL in seconds (2 min) |
| `CACHE_TTL_BLUEPRINTS` | `1800` | Blueprint cache TTL in seconds (30 min) |

### Example with All Options

```json
{
  "mcpServers": {
    "kandji": {
      "command": "node",
      "args": [
        "/Users/yourname/Projects/mcp-server-kandji-api/dist/index.js"
      ],
      "env": {
        "KANDJI_API_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "KANDJI_SUBDOMAIN": "acme-corp",
        "KANDJI_REGION": "us",
        "ENABLE_PII_REDACTION": "true",
        "CACHE_TTL_DEVICES": "600",
        "CACHE_TTL_COMPLIANCE": "120",
        "CACHE_TTL_BLUEPRINTS": "1800"
      }
    }
  }
}
```

## Troubleshooting

### "MCP server 'kandji' not found"

**Issue:** Claude Desktop can't find the server

**Solutions:**
1. Verify the path in `args` is absolute and correct
2. Ensure `dist/index.js` exists (run `npm run build`)
3. Check file permissions: `chmod +x dist/index.js`

### "Authentication failed"

**Issue:** API token is invalid or missing permissions

**Solutions:**
1. Verify token is correct (no extra spaces)
2. Regenerate token with **ALL permissions** enabled
3. Check subdomain is correct (without `.kandji.io`)

### "Module not found" errors

**Issue:** Dependencies not installed

**Solutions:**
```bash
cd /path/to/mcp-server-kandji-api
npm install
npm run build
```

### Server crashes on startup

**Issue:** Configuration error

**Solutions:**
1. Check Claude Desktop logs:
   ```bash
   # macOS
   tail -f ~/Library/Logs/Claude/mcp*.log
   ```
2. Test server manually:
   ```bash
   cd /path/to/mcp-server-kandji-api
   npm start
   # Should show no errors
   ```

### Changes not taking effect

**Issue:** Claude Desktop caching old config

**Solutions:**
1. Quit Claude Desktop completely (not just close window)
2. Wait 5 seconds
3. Restart Claude Desktop
4. Verify config file was saved correctly

## Multiple MCP Servers

You can run multiple MCP servers simultaneously. Example with Kandji + others:

```json
{
  "mcpServers": {
    "kandji": {
      "command": "node",
      "args": ["/path/to/mcp-server-kandji-api/dist/index.js"],
      "env": {
        "KANDJI_API_TOKEN": "your_token",
        "KANDJI_SUBDOMAIN": "your_subdomain",
        "KANDJI_REGION": "us"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/yourname/Documents"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token"
      }
    }
  }
}
```

## Verifying Setup

After restarting Claude Desktop, test the integration:

1. Start a new conversation in Claude Desktop
2. Type: "List all Kandji blueprints"
3. Claude should show available blueprints from your Kandji tenant

If successful, you'll see Claude using the Kandji MCP tools!

## Security Notes

- **Never commit** `claude_desktop_config.json` to version control
- **API tokens** are stored in Claude Desktop's config (encrypted at rest by macOS)
- **PII Redaction**: Enable if working with sensitive user data
- **Token rotation**: Regenerate tokens periodically for security

## Getting Help

- **Documentation**: See main [README.md](../README.md)
- **Quick Start**: See [QUICKSTART.md](../docs/QUICKSTART.md)
- **Tool Reference**: See [TOOLS.md](../docs/TOOLS.md)
- **Issues**: Report problems in the GitHub repository

## Advanced Configuration

### Using .env File (Alternative)

Instead of environment variables in Claude Desktop config, you can use a `.env` file:

1. Create `.env` in project root:
   ```bash
   KANDJI_API_TOKEN=your_token
   KANDJI_SUBDOMAIN=your_subdomain
   KANDJI_REGION=us
   ```

2. Simplified Claude Desktop config:
   ```json
   {
     "mcpServers": {
       "kandji": {
         "command": "node",
         "args": ["/path/to/mcp-server-kandji-api/dist/index.js"]
       }
     }
   }
   ```

**Note:** The server will automatically load `.env` if no environment variables are provided.

### Development Mode

For development with auto-reload:

```json
{
  "mcpServers": {
    "kandji-dev": {
      "command": "npm",
      "args": ["run", "dev"],
      "cwd": "/path/to/mcp-server-kandji-api",
      "env": {
        "KANDJI_API_TOKEN": "your_token",
        "KANDJI_SUBDOMAIN": "your_subdomain",
        "KANDJI_REGION": "us"
      }
    }
  }
}
```
