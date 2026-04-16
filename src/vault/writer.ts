import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import type { LanguageProfile, Word, StatsFile } from "../types.js";
import { getVaultPaths, wordFilePath, sessionFilePath } from "./paths.js";

function serializeFrontmatter(data: unknown): string {
  return `---\n${yaml.dump(data, { lineWidth: -1, noRefs: true })}---\n`;
}

export function ensureVaultStructure(vaultRoot: string): void {
  const { polyglotDir, profileFile, statsFile, sessionsDir, wordsDir } = getVaultPaths(vaultRoot);

  fs.mkdirSync(polyglotDir, { recursive: true });
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.mkdirSync(wordsDir, { recursive: true });

  if (!fs.existsSync(profileFile)) {
    fs.writeFileSync(profileFile, serializeFrontmatter({ profiles: [] }), "utf-8");
  }

  if (!fs.existsSync(statsFile)) {
    const today = new Date().toISOString().slice(0, 10);
    fs.writeFileSync(statsFile, serializeFrontmatter({ last_updated: today, languages: {} }), "utf-8");
  }
}

export function writeProfile(vaultRoot: string, profiles: LanguageProfile[]): void {
  const { profileFile } = getVaultPaths(vaultRoot);
  fs.writeFileSync(profileFile, serializeFrontmatter({ profiles }), "utf-8");
}

export function writeWord(vaultRoot: string, word: Word): void {
  const langDir = path.join(vaultRoot, "polyglot", "words", word.language);
  fs.mkdirSync(langDir, { recursive: true });

  const frontmatterData = {
    word: word.word,
    language: word.language,
    translation: word.translation,
    romanization: word.romanization,
    level: word.level,
    cefr: word.cefr || null,
    exam_wordlist: word.exam_wordlist,
    srs_due: word.srs_due,
    srs_interval: word.srs_interval,
    srs_correct_streak: word.srs_correct_streak,
    created: word.created,
    last_reviewed: word.last_reviewed,
    tags: word.tags,
  };

  const content = serializeFrontmatter(frontmatterData) + (word.body || "");
  const filePath = wordFilePath(vaultRoot, word.language, word.slug);
  fs.writeFileSync(filePath, content, "utf-8");
}

export function writeStats(vaultRoot: string, stats: StatsFile): void {
  const { statsFile } = getVaultPaths(vaultRoot);
  fs.writeFileSync(statsFile, serializeFrontmatter(stats), "utf-8");
}

export function appendSession(vaultRoot: string, date: string, content: string): void {
  const filePath = sessionFilePath(vaultRoot, date);
  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, `\n---\n\n${content}`, "utf-8");
  } else {
    fs.writeFileSync(filePath, content, "utf-8");
  }
}
