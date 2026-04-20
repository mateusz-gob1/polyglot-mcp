import type { UpdateWordProgressResult, WordLevel } from "../types.js";
import { readWord, readStats, readAllWords } from "../vault/reader.js";
import { writeWord, writeStats } from "../vault/writer.js";
import { calculateNextReview } from "../srs/scheduler.js";
import { wordToSlug } from "../vault/paths.js";

export interface UpdateWordProgressParams {
  language: string;
  results: Array<{
    word: string;
    correct: boolean;
  }>;
}

export async function updateWordProgress(
  params: UpdateWordProgressParams,
  vaultRoot: string
): Promise<UpdateWordProgressResult> {
  const today = new Date().toISOString().slice(0, 10);
  const updated: UpdateWordProgressResult["updated"] = [];

  for (const result of params.results) {
    // Try slug from original word first, then fallback to scanning all words
    // (handles CJK characters where slug = romanization, not the original word)
    const slug = wordToSlug(result.word);
    let word = readWord(vaultRoot, params.language, slug);

    if (!word) {
      // Fallback: scan all words and match by word field
      const allWords = readAllWords(vaultRoot, params.language);
      word = allWords.find((w) => w.word === result.word) ?? null;
    }

    if (!word) continue;

    const old_level = word.level;
    const changes = calculateNextReview(word, result.correct, today);
    const updatedWord = { ...word, ...changes };

    writeWord(vaultRoot, updatedWord);

    const new_level = updatedWord.level as WordLevel;
    updated.push({
      word: result.word,
      old_level,
      new_level,
      promoted: isPromotion(old_level, new_level),
      demoted: isDemotion(old_level, new_level),
    });
  }

  // Recalculate stats from actual files
  const stats = readStats(vaultRoot);
  const words = readAllWords(vaultRoot, params.language);

  if (!stats.languages[params.language]) {
    stats.languages[params.language] = {
      total_words: 0, weak: 0, medium: 0, strong: 0,
      sessions_count: 0, streak: 0, last_session: null,
    };
  }

  stats.languages[params.language].total_words = words.length;
  stats.languages[params.language].weak = words.filter((w) => w.level === "weak").length;
  stats.languages[params.language].medium = words.filter((w) => w.level === "medium").length;
  stats.languages[params.language].strong = words.filter((w) => w.level === "strong").length;
  stats.last_updated = today;
  writeStats(vaultRoot, stats);

  return { updated, stats_updated: true };
}

function isPromotion(old: WordLevel, next: WordLevel): boolean {
  const order: WordLevel[] = ["weak", "medium", "strong"];
  return order.indexOf(next) > order.indexOf(old);
}

function isDemotion(old: WordLevel, next: WordLevel): boolean {
  const order: WordLevel[] = ["weak", "medium", "strong"];
  return order.indexOf(next) < order.indexOf(old);
}
