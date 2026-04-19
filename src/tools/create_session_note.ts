import type { CreateSessionNoteResult } from "../types.js";
import { readStats, readProfileByLanguage } from "../vault/reader.js";
import { writeStats, appendSession } from "../vault/writer.js";
import { wordToSlug, sessionFilePath } from "../vault/paths.js";
import { getLabels } from "../i18n.js";

export interface CreateSessionNoteParams {
  language: string;
  new_words: string[];
  reviewed_words: string[];
  correct_count: number;
  duration_minutes?: number;
  notes?: string;
}

export async function createSessionNote(
  params: CreateSessionNoteParams,
  vaultRoot: string
): Promise<CreateSessionNoteResult> {
  const today = new Date().toISOString().slice(0, 10);

  const profile = readProfileByLanguage(vaultRoot, params.language);
  const notesLanguage = profile?.notes_language ?? "en";
  const labels = getLabels(notesLanguage);

  const frontmatter = [
    "---",
    `date: ${today}`,
    `language: ${params.language}`,
    `duration_minutes: ${params.duration_minutes ?? null}`,
    `new_words: ${params.new_words.length}`,
    `reviewed: ${params.reviewed_words.length}`,
    `correct: ${params.correct_count}`,
    "---",
    "",
  ].join("\n");

  const newWordsSection = params.new_words.length > 0
    ? `## ${labels.newWords}\n\n${params.new_words.map((w) => `- [[${wordToSlug(w)}]] — ${w}`).join("\n")}\n`
    : `## ${labels.newWords}\n\n${labels.noNewWords}\n`;

  const reviewedSection = params.reviewed_words.length > 0
    ? `## ${labels.reviewed}\n\n${params.reviewed_words.map((w) => `[[${wordToSlug(w)}]]`).join(", ")}\n`
    : `## ${labels.reviewed}\n\n${labels.noReviewed}\n`;

  const notesSection = params.notes
    ? `## ${labels.sessionNotes}\n\n${params.notes}\n`
    : "";

  const content = [frontmatter, newWordsSection, reviewedSection, notesSection]
    .filter(Boolean)
    .join("\n");

  appendSession(vaultRoot, today, content);

  // Update stats
  const stats = readStats(vaultRoot);
  if (!stats.languages[params.language]) {
    stats.languages[params.language] = {
      total_words: 0, weak: 0, medium: 0, strong: 0,
      sessions_count: 0, streak: 0, last_session: null,
    };
  }

  const langStats = stats.languages[params.language];
  langStats.sessions_count += 1;

  const yesterday = getYesterday(today);
  if (langStats.last_session === today) {
    // Already counted today
  } else if (langStats.last_session === yesterday || langStats.last_session === null) {
    langStats.streak += 1;
  } else {
    langStats.streak = 1;
  }

  langStats.last_session = today;
  stats.last_updated = today;
  writeStats(vaultRoot, stats);

  return {
    success: true,
    file_path: sessionFilePath(vaultRoot, today),
    streak: langStats.streak,
  };
}

function getYesterday(today: string): string {
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
