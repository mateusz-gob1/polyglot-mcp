# Setup — polyglot-mcp

## Wymagania

- Node.js 18+
- Claude Desktop lub Claude Code
- Obsidian (opcjonalne — vault może być zwykłym folderem)

## Instalacja

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/mateusz-gob1/polyglot-mcp.git
cd polyglot-mcp

# 2. Zainstaluj zależności i skompiluj
npm install
npm run build
```

## Konfiguracja

### Claude Desktop

Otwórz plik konfiguracyjny:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Dodaj wpis:

```json
{
  "mcpServers": {
    "polyglot": {
      "command": "node",
      "args": ["/bezwzgledna/sciezka/do/polyglot-mcp/dist/index.js"],
      "env": {
        "VAULT_PATH": "/sciezka/do/twojego/vault"
      }
    }
  }
}
```

### Claude Code

W katalogu projektu utwórz lub edytuj `.mcp.json`:

```json
{
  "mcpServers": {
    "polyglot": {
      "command": "node",
      "args": ["/bezwzgledna/sciezka/do/polyglot-mcp/dist/index.js"],
      "env": {
        "VAULT_PATH": "/sciezka/do/twojego/vault"
      }
    }
  }
}
```

## System prompt

Skopiuj zawartość pliku `system-prompt/POLYGLOT.md` i wklej jako:
- **Claude Desktop:** Settings → Custom Instructions
- **Claude Code:** Dodaj do `CLAUDE.md` w katalogu projektu

## Weryfikacja

Uruchom Claude i napisz cokolwiek — Claude powinien automatycznie wywołać `get_stats` i zainicjować onboarding jeśli to pierwsza sesja.

Możesz też sprawdzić czy serwer startuje poprawnie:

```bash
VAULT_PATH=/sciezka/do/vault node dist/index.js
```

Powinieneś zobaczyć: `Polyglot MCP ready. Vault: /sciezka/do/vault`
