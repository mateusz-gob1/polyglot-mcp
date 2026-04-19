import type { Word, CreateWordNoteResult } from "../types.js";
import { readWord, readStats, readProfileByLanguage } from "../vault/reader.js";
import { writeWord, writeStats } from "../vault/writer.js";
import { wordToSlug, wordFilePath } from "../vault/paths.js";
import { getLabels } from "../i18n.js";

export interface CreateWordNoteParams {
  language: string;
  word: string;
  translation: string;
  romanization?: string;
  example_sentence: string;
  example_translation: string;
  mnemonic?: string;
  components?: string;
  cefr?: string;
  exam_wordlist?: string;
  tags?: string[];
}

export async function createWordNote(
  params: CreateWordNoteParams,
  vaultRoot: string
): Promise<CreateWordNoteResult> {
  const today = new Date().toISOString().slice(0, 10);
  const slug = wordToSlug(params.word, params.romanization);

  const existing = readWord(vaultRoot, params.language, slug);
  if (existing) {
    return {
      success: true,
      word: existing,
      file_path: wordFilePath(vaultRoot, params.language, slug),
      already_existed: true,
    };
  }

  const profile = readProfileByLanguage(vaultRoot, params.language);
  const notesLanguage = profile?.notes_language ?? "en";
  const labels = getLabels(notesLanguage);

  const srs_due = addDay(today);

  const word: Word = {
    word: params.word,
    language: params.language,
    translation: params.translation,
    romanization: params.romanization ?? null,
    level: "weak",
    cefr: params.cefr ?? "",
    exam_wordlist: params.exam_wordlist ?? null,
    srs_due,
    srs_interval: 1,
    srs_correct_streak: 0,
    created: today,
    last_reviewed: null,
    tags: params.tags ?? [],
    slug,
    body: buildBody(params, labels),
  };

  writeWord(vaultRoot, word);

  // Update stats
  const stats = readStats(vaultRoot);
  if (!stats.languages[params.language]) {
    stats.languages[params.language] = {
      total_words: 0, weak: 0, medium: 0, strong: 0,
      sessions_count: 0, streak: 0, last_session: null,
    };
  }
  stats.languages[params.language].total_words += 1;
  stats.languages[params.language].weak += 1;
  stats.last_updated = today;
  writeStats(vaultRoot, stats);

  return {
    success: true,
    word,
    file_path: wordFilePath(vaultRoot, params.language, slug),
    already_existed: false,
  };
}

function addDay(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function buildBody(params: CreateWordNoteParams, labels: ReturnType<typeof getLabels>): string {
  const lines: string[] = [];

  lines.push(`## ${labels.example}\n`);
  lines.push(params.example_sentence);
  lines.push(`*${params.example_translation}*\n`);

  lines.push(`## ${labels.mnemonic}\n`);
  lines.push(params.mnemonic ?? "—\n");

  if (params.components) {
    lines.push(`## ${labels.components}\n`);
    lines.push(params.components + "\n");
  }

  lines.push(`## ${labels.relations}\n`);
  lines.push("—\n");

  return lines.join("\n");
}
