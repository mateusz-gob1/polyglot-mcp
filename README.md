# polyglot-mcp

Turn your Obsidian vault into a language learning hub — Claude becomes your personal tutor that remembers your progress between sessions.

> **Demo GIF** — *coming soon*

## How it works

The MCP server stores your words, progress and stats as Markdown files in your vault. Claude reads them at the start of every session and knows exactly where you left off — without asking.

```
MCP = memory & file system
Claude = teacher
```

## Requirements

- Node.js 18+
- Claude Desktop or Claude Code
- Obsidian (optional — any folder works)

## Installation

```bash
git clone https://github.com/mateusz-gob1/polyglot-mcp.git
cd polyglot-mcp
npm install && npm run build
```

## Configuration

### Claude Desktop

Open the config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the following entry (use the absolute path to where you cloned the repo):

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

> The vault folder will be created automatically if it doesn't exist.

### Claude Code

Create or edit `.mcp.json` in your project root:

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

## System prompt

Copy the contents of [`system-prompt/POLYGLOT.md`](system-prompt/POLYGLOT.md) and paste it as project instructions:

- **Claude Desktop:** Create a new Project → paste into project instructions
- **Claude Code:** Add to `CLAUDE.md` in your project root

This is the "soul" of the tutor — it defines how Claude runs sessions, handles progress, and manages reviews.

## Supported languages & exams

| Exam | Language | Words |
|---|---|---|
| HSK 1 | Chinese (zh) | 157 |
| HSK 2 | Chinese (zh) | 135 |
| JLPT N5 | Japanese (ja) | 103 |
| DELE A1 | Spanish (es) | 100 |
| DELE A2 | Spanish (es) | 98 |
| Goethe A1 | German (de) | 98 |
| Goethe A2 | German (de) | 100 |

You can learn any language without a wordlist — exam mode is optional.

## Vault structure

The MCP creates and manages a `polyglot/` folder inside your vault:

```
polyglot/
├── profile.md       # your language profiles
├── stats.md         # stats & streaks
├── sessions/        # session notes (one file per day)
└── words/
    ├── es/          # word notes per language
    ├── de/
    └── ...
```

Every word is a standalone Markdown file — you can edit them manually, the MCP respects your changes.

## Roadmap

- [ ] Anki sync via AnkiConnect
- [ ] SQLite backend (Obsidian-free mode)
- [ ] Auto-fetch definitions from Wiktionary
- [ ] More wordlists (JLPT N4, DALF, Cambridge)
- [ ] CLI onboarding wizard

## License

MIT
