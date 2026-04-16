# polyglot-mcp

Zamień swój Obsidian vault w centrum nauki języków — Claude zostaje Twoim osobistym nauczycielem, który pamięta Twój postęp między sesjami.

> **Demo GIF** — *do nagrania po pierwszej sesji*

## Jak to działa

MCP przechowuje Twoje słówka, postęp i statystyki jako pliki Markdown w vault. Claude czyta je przy każdej sesji i wie dokładnie gdzie jesteś — bez pytania.

```
MCP = pamięć i system plików
Claude = nauczyciel
```

## Wymagania

- Node.js 18+
- Claude Desktop lub Claude Code
- Obsidian (opcjonalne)

## Instalacja

```bash
git clone https://github.com/mateusz-gob1/polyglot-mcp.git
cd polyglot-mcp
npm install && npm run build
```

## Konfiguracja

Dodaj do `claude_desktop_config.json` (lub `.mcp.json` dla Claude Code):

```json
{
  "mcpServers": {
    "polyglot": {
      "command": "node",
      "args": ["/sciezka/do/polyglot-mcp/dist/index.js"],
      "env": {
        "VAULT_PATH": "/sciezka/do/vault"
      }
    }
  }
}
```

Pełna instrukcja: [docs/setup.md](docs/setup.md)

## System prompt

Skopiuj [`system-prompt/POLYGLOT.md`](system-prompt/POLYGLOT.md) do Claude jako Custom Instructions. To "dusza nauczyciela" — definiuje jak Claude prowadzi sesje, reaguje na postęp i zarządza powtórkami.

## Wspierane języki i egzaminy

| Egzamin | Język | Słowa |
|---|---|---|
| HSK 1 | Chiński (zh) | 157 |
| HSK 2 | Chiński (zh) | 135 |
| JLPT N5 | Japoński (ja) | 103 |
| DELE A1 | Hiszpański (es) | 100 |
| DELE A2 | Hiszpański (es) | 98 |
| Goethe A1 | Niemiecki (de) | 98 |
| Goethe A2 | Niemiecki (de) | 100 |

Możesz uczyć się dowolnego języka bez wordlisty — tryb egzaminacyjny jest opcjonalny.

## Struktura vault

MCP tworzy i zarządza folderem `polyglot/` w Twoim vault:

```
polyglot/
├── profile.md       # Twoje profile językowe
├── stats.md         # Statystyki i streaki
├── sessions/        # Notatki z każdej sesji
└── words/
    ├── es/          # Słówka per język
    ├── de/
    └── ...
```

Każde słówko to osobny plik Markdown — możesz je ręcznie edytować, MCP respektuje zmiany.

## Roadmap

- [ ] Anki sync przez AnkiConnect
- [ ] SQLite backend (bez Obsidiana)
- [ ] Pobieranie definicji z Wiktionary
- [ ] Więcej wordlist (JLPT N4, DALF, Cambridge)
- [ ] CLI do onboardingu

## Licencja

MIT
