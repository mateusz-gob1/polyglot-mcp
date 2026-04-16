import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";

import { ensureVaultStructure } from "./vault/writer.js";
import { getStats } from "./tools/get_stats.js";
import { setLanguageProfile } from "./tools/set_language_profile.js";
import { createWordNote } from "./tools/create_word_note.js";
import { updateWordProgress } from "./tools/update_word_progress.js";
import { getDueWordsHandler } from "./tools/get_due_words.js";
import { createSessionNote } from "./tools/create_session_note.js";

const vaultPath = process.env["VAULT_PATH"];

if (!vaultPath) {
  console.error("ERROR: VAULT_PATH environment variable is not set.");
  console.error('Set it in your MCP config: "env": { "VAULT_PATH": "/path/to/your/vault" }');
  process.exit(1);
}

if (!fs.existsSync(vaultPath)) {
  console.error(`ERROR: VAULT_PATH does not exist: ${vaultPath}`);
  console.error("Make sure the path points to an existing directory.");
  process.exit(1);
}

ensureVaultStructure(vaultPath);
console.error(`Polyglot MCP ready. Vault: ${vaultPath}`);

const server = new Server(
  { name: "polyglot-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_stats",
      description: "Pobiera statystyki nauki. Wywołuj na początku każdej sesji.",
      inputSchema: {
        type: "object",
        properties: {
          language: { type: "string", description: "Kod ISO 639-1 języka (opcjonalne — brak = wszystkie języki)" },
        },
      },
    },
    {
      name: "set_language_profile",
      description: "Tworzy lub aktualizuje profil językowy użytkownika.",
      inputSchema: {
        type: "object",
        required: ["action", "language"],
        properties: {
          action: { type: "string", enum: ["create", "update", "switch", "deactivate"] },
          language: { type: "string" },
          language_name: { type: "string" },
          current_level: { type: "string" },
          target_level: { type: "string" },
          vocab_mode: { type: "string", enum: ["strict", "loose"] },
          exam: {
            type: ["object", "null"],
            properties: {
              name: { type: "string" },
              date: { type: "string" },
              wordlist: { type: "string" },
            },
          },
          sprint: {
            type: ["object", "null"],
            properties: {
              topic: { type: "string" },
              deadline: { type: "string" },
              words: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
    },
    {
      name: "get_due_words",
      description: "Zwraca słowa do powtórki na dziś. Język musi być podany explicite.",
      inputSchema: {
        type: "object",
        required: ["language"],
        properties: {
          language: { type: "string", description: "Kod ISO 639-1 — ZAWSZE podawaj explicite, nigdy nie inferuj z active" },
          limit: { type: "number", default: 20 },
          include_known_list: { type: "boolean", default: false },
        },
      },
    },
    {
      name: "create_word_note",
      description: "Tworzy notatkę nowego słówka w vault.",
      inputSchema: {
        type: "object",
        required: ["language", "word", "translation", "example_sentence", "example_translation"],
        properties: {
          language: { type: "string" },
          word: { type: "string" },
          translation: { type: "string" },
          romanization: { type: "string" },
          example_sentence: { type: "string" },
          example_translation: { type: "string" },
          mnemonic: { type: "string" },
          components: { type: "string" },
          cefr: { type: "string" },
          exam_wordlist: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    },
    {
      name: "update_word_progress",
      description: "Aktualizuje postęp słówek po sesji powtórek.",
      inputSchema: {
        type: "object",
        required: ["language", "results"],
        properties: {
          language: { type: "string" },
          results: {
            type: "array",
            items: {
              type: "object",
              required: ["word", "correct"],
              properties: {
                word: { type: "string" },
                correct: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    {
      name: "create_session_note",
      description: "Zapisuje notatkę z zakończonej sesji nauki. Wywołuj na końcu każdej sesji.",
      inputSchema: {
        type: "object",
        required: ["language", "new_words", "reviewed_words", "correct_count"],
        properties: {
          language: { type: "string" },
          new_words: { type: "array", items: { type: "string" } },
          reviewed_words: { type: "array", items: { type: "string" } },
          correct_count: { type: "number" },
          duration_minutes: { type: "number" },
          notes: { type: "string" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    const a = (args ?? {}) as Record<string, unknown>;

    switch (name) {
      case "get_stats":
        result = await getStats(a as never, vaultPath);
        break;
      case "set_language_profile":
        result = await setLanguageProfile(a as never, vaultPath);
        break;
      case "get_due_words":
        result = await getDueWordsHandler(a as never, vaultPath);
        break;
      case "create_word_note":
        result = await createWordNote(a as never, vaultPath);
        break;
      case "update_word_progress":
        result = await updateWordProgress(a as never, vaultPath);
        break;
      case "create_session_note":
        result = await createSessionNote(a as never, vaultPath);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isError: true,
      content: [{ type: "text", text: `Error: ${message}` }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
