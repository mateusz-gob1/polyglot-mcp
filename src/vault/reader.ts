import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { LanguageProfile, Word, StatsFile, WordLevel } from "../types.js";
import { getVaultPaths, wordFilePath, wordsDirForLang, wordToSlug } from "./paths.js";

function parseFrontmatter(content: string): { data: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: content };
  const data = yaml.load(match[1], { schema: yaml.JSON_SCHEMA }) as Record<string, unknown> ?? {};
  return { data, body: match[2] };
}

function toString(val: unknown): string {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  if (typeof val === "string") return val;
  return String(val ?? "");
}

function toStringOrNull(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  return toString(val);
}

export function readProfile(vaultRoot: string): LanguageProfile[] {
  const { profileFile } = getVaultPaths(vaultRoot);
  if (!fs.existsSync(profileFile)) return [];
  const content = fs.readFileSync(profileFile, "utf-8");
  const { data } = parseFrontmatter(content);
  const profiles = data["profiles"];
  if (!Array.isArray(profiles)) return [];
  return profiles.map((p: Record<string, unknown>) => ({
    language: toString(p["language"]),
    language_name: toString(p["language_name"]),
    current_level: toString(p["current_level"]),
    target_level: toString(p["target_level"]),
    vocab_mode: (p["vocab_mode"] as "strict" | "loose") ?? "loose",
    active: Boolean(p["active"]),
    created: toString(p["created"]),
    exam: p["exam"] ? {
      name: toString((p["exam"] as Record<string, unknown>)["name"]),
      date: toString((p["exam"] as Record<string, unknown>)["date"]),
      wordlist: toStringOrNull((p["exam"] as Record<string, unknown>)["wordlist"]) ?? undefined,
    } : null,
    sprint: p["sprint"] ? {
      topic: toString((p["sprint"] as Record<string, unknown>)["topic"]),
      deadline: toString((p["sprint"] as Record<string, unknown>)["deadline"]),
      words: Array.isArray((p["sprint"] as Record<string, unknown>)["words"])
        ? ((p["sprint"] as Record<string, unknown>)["words"] as unknown[]).map(toString)
        : [],
    } : null,
  }));
}

export function readActiveProfile(vaultRoot: string): LanguageProfile | null {
  return readProfile(vaultRoot).find((p) => p.active) ?? null;
}

export function readProfileByLanguage(vaultRoot: string, language: string): LanguageProfile | null {
  return readProfile(vaultRoot).find((p) => p.language === language) ?? null;
}

export function readWord(vaultRoot: string, language: string, slug: string): Word | null {
  const filePath = wordFilePath(vaultRoot, language, slug);
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, "utf-8");
  return parseWordFile(content, slug);
}

function parseWordFile(content: string, slug: string): Word {
  const { data, body } = parseFrontmatter(content);
  return {
    word: toString(data["word"]),
    language: toString(data["language"]),
    translation: toString(data["translation"]),
    romanization: toStringOrNull(data["romanization"]),
    level: (data["level"] as WordLevel) ?? "weak",
    cefr: toString(data["cefr"] ?? ""),
    exam_wordlist: toStringOrNull(data["exam_wordlist"]),
    srs_due: toString(data["srs_due"]),
    srs_interval: Number(data["srs_interval"] ?? 1),
    srs_correct_streak: Number(data["srs_correct_streak"] ?? 0),
    created: toString(data["created"]),
    last_reviewed: toStringOrNull(data["last_reviewed"]),
    tags: Array.isArray(data["tags"]) ? (data["tags"] as unknown[]).map(toString) : [],
    slug,
    body,
  };
}

export function readAllWords(vaultRoot: string, language: string): Word[] {
  const dir = wordsDirForLang(vaultRoot, language);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  return files.map((f) => {
    const slug = f.replace(/\.md$/, "");
    const content = fs.readFileSync(path.join(dir, f), "utf-8");
    return parseWordFile(content, slug);
  });
}

export function readStats(vaultRoot: string): StatsFile {
  const { statsFile } = getVaultPaths(vaultRoot);
  if (!fs.existsSync(statsFile)) {
    return { last_updated: new Date().toISOString().slice(0, 10), languages: {} };
  }
  const content = fs.readFileSync(statsFile, "utf-8");
  const { data } = parseFrontmatter(content);
  const languages: StatsFile["languages"] = {};
  const langs = data["languages"] as Record<string, unknown> | undefined;
  if (langs) {
    for (const [lang, stats] of Object.entries(langs)) {
      const s = stats as Record<string, unknown>;
      languages[lang] = {
        total_words: Number(s["total_words"] ?? 0),
        weak: Number(s["weak"] ?? 0),
        medium: Number(s["medium"] ?? 0),
        strong: Number(s["strong"] ?? 0),
        sessions_count: Number(s["sessions_count"] ?? 0),
        streak: Number(s["streak"] ?? 0),
        last_session: toStringOrNull(s["last_session"]),
      };
    }
  }
  return {
    last_updated: toString(data["last_updated"] ?? new Date().toISOString().slice(0, 10)),
    languages,
  };
}
