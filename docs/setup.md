# Setup guide

## Requirements

- Node.js 18+
- Claude Desktop or Claude Code
- Obsidian (optional)

## Step 1 — Clone and build

```bash
git clone https://github.com/mateusz-gob1/polyglot-mcp.git
cd polyglot-mcp
npm install
npm run build
```

## Step 2 — Configure Claude Desktop

Open the config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the `mcpServers` block (keep any existing keys):

**macOS / Linux:**
```json
{
  "mcpServers": {
    "polyglot": {
      "command": "node",
      "args": ["/absolute/path/to/polyglot-mcp/dist/index.js"],
      "env": {
        "VAULT_PATH": "/absolute/path/to/your/vault"
      }
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "polyglot": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\polyglot-mcp\\dist\\index.js"],
      "env": {
        "VAULT_PATH": "C:\\Users\\YourName\\my-vault"
      }
    }
  }
}
```

> **Note:** Use double backslashes `\\` in Windows paths inside JSON.

> **Note:** The vault folder is created automatically if it doesn't exist.

## Step 3 — Add the system prompt

1. Open Claude Desktop
2. Create a new **Project** (e.g. "Polyglot")
3. Paste the contents of `system-prompt/POLYGLOT.md` as the project instructions
4. Restart Claude Desktop

## Step 4 — Verify

Restart Claude Desktop, open the Polyglot project and type anything. Claude should automatically call `get_stats` and start the onboarding flow.

To verify the server started correctly, check the logs:
- **macOS:** `~/Library/Logs/Claude/mcp-server-polyglot.log`
- **Windows:** `%APPDATA%\Claude\logs\mcp-server-polyglot.log`

You should see: `Polyglot MCP ready. Vault: <your path>`

## Claude Code setup

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "polyglot": {
      "command": "node",
      "args": ["/absolute/path/to/polyglot-mcp/dist/index.js"],
      "env": {
        "VAULT_PATH": "/absolute/path/to/your/vault"
      }
    }
  }
}
```

Then add the contents of `system-prompt/POLYGLOT.md` to your `CLAUDE.md`.
