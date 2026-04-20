# polyglot-mcp

Turn your Obsidian vault into a language learning hub — Claude becomes your personal tutor that **remembers your progress between sessions**.

No accounts. No subscriptions. No app to install. Just Claude, your vault, and a conversation.

> **Demo GIF** — *coming soon*

---

## What is this?

polyglot-mcp is a [Model Context Protocol](https://modelcontextprotocol.io) server that gives Claude persistent memory for language learning. Every word you study, every session you complete, every mistake you make — it all gets stored as plain Markdown files in a folder on your computer.

When you start a new conversation, Claude reads your vault and picks up exactly where you left off. It knows what words you've learned, which ones you struggle with, how many days you've been on a streak, and what's due for review today.

```
MCP server  =  memory, file system, spaced repetition logic
Claude      =  teacher, conversation partner, exercise generator
```

---

## How it works

### Spaced Repetition System (SRS)

Every word you learn gets a file in your vault with metadata:

```yaml
word: gracias
language: es
level: weak        # weak | medium | strong
srs_due: 2026-04-21
srs_interval: 1
srs_correct_streak: 2
```

After each session Claude calls `update_word_progress` with your results. Words you got right move toward `medium` and `strong`, words you got wrong get pushed back to `weak`. Review intervals:

| Level | Interval | Promoted after |
|---|---|---|
| weak | 1 day | 3 correct in a row |
| medium | 3 days | 5 correct in a row |
| strong | 7 days | — |

### Session flow

1. You open Claude and say anything
2. Claude calls `get_stats` — checks your vault, sees what's due today
3. Claude proposes a plan (review due words, learn new ones, or both)
4. You study — Claude introduces words, runs exercises, corrects mistakes
5. When **you** decide to finish, Claude saves everything to your vault
6. Next session, Claude reads the vault and continues from where you stopped

### Word notes

Each word gets its own Markdown file with context, an example sentence, and a mnemonic:

```markdown
---
word: gracias
translation: thank you
level: weak
srs_due: 2026-04-21
---

## Example

¡Gracias! Eres muy amable.
*Thank you! You're very kind.*

## Mnemonic

Sounds like "gracja" (grace) — you're thanking someone for their grace.
```

You can open and edit these files in Obsidian. The MCP respects your changes.

---

## Modes

### Normal mode
Default. Claude shows you words that are due today based on the SRS schedule.

### Sprint mode
Set a topic, a word list, and a deadline. Claude focuses exclusively on those words until the deadline passes, then returns to normal SRS.

**Example:** "I'm traveling to Mexico in 5 days — drill me on restaurant vocabulary: mesero, cuenta, menú, reservación."

### Exam prep mode
Set an exam and a date. When fewer than 30 days remain, Claude gradually shifts the session toward words from the official exam wordlist. The closer the exam, the higher the ratio of exam words.

**Example:** "I'm taking HSK 1 in 3 weeks."

---

## Supported languages & exams

You can study **any language** — exam mode is optional.

| Exam | Language | Words |
|---|---|---|
| HSK 1 | Chinese (zh) | 157 |
| HSK 2 | Chinese (zh) | 135 |
| HSK 3 | Chinese (zh) | 150 |
| JLPT N5 | Japanese (ja) | 103 |
| JLPT N4 | Japanese (ja) | 150 |
| DELE A1 | Spanish (es) | 100 |
| DELE A2 | Spanish (es) | 98 |
| Goethe A1 | German (de) | 98 |
| Goethe A2 | German (de) | 100 |

---

## Requirements

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Claude Desktop** or **Claude Code**
- **Obsidian** — optional, but gives you a nice UI for your word notes

---

## Installation

```bash
git clone https://github.com/mateusz-gob1/polyglot-mcp.git
cd polyglot-mcp
npm install && npm run build
```

---

## Configuration

### Claude Desktop

Open the config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add the `mcpServers` block (keep any existing content):

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

> The vault folder will be **created automatically** if it doesn't exist.

Restart Claude Desktop after saving the config.

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

---

## System prompt

polyglot-mcp needs a system prompt to work — it tells Claude how to behave as a tutor, when to call which tools, and how to handle sessions.

Copy the contents of [`system-prompt/POLYGLOT.md`](system-prompt/POLYGLOT.md) and paste it as project instructions:

- **Claude Desktop:** Create a new **Project** → paste into project instructions → use only that project for language learning
- **Claude Code:** Add to `CLAUDE.md` in your project root

This keeps the tutor behavior isolated to one project. Your other Claude conversations are unaffected.

---

## Vault structure

The MCP creates and manages a `polyglot/` folder inside your vault:

```
polyglot/
├── profile.md          # your language profiles (one per language)
├── stats.md            # stats, streaks, session counts
├── sessions/
│   ├── 2026-04-19.md   # session note (one file per day)
│   └── 2026-04-20.md
└── words/
    ├── es/
    │   ├── gracias.md
    │   ├── hola.md
    │   └── ...
    ├── zh/
    │   ├── ni_hao.md
    │   └── ...
    └── ...
```

Every file is plain Markdown with YAML frontmatter — human-readable, version-controllable, and fully editable by hand. The MCP reads changes you make in Obsidian.

---

## Note language

During onboarding Claude asks what language you want your vault notes written in. Section headers (`## Example`, `## Mnemonic`, etc.) will appear in your chosen language.

Currently supported: 🇬🇧 English, 🇵🇱 Polish, 🇩🇪 German, 🇪🇸 Spanish, 🇫🇷 French, 🇨🇳 Chinese, 🇯🇵 Japanese.

---

## Full setup guide

See [docs/setup.md](docs/setup.md) for a step-by-step walkthrough including how to verify the server is running and how to check logs.

---

## License

MIT
