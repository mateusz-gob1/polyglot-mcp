import type { GetDueWordsResult } from "../types.js";
import { readProfile, readAllWords, readStats } from "../vault/reader.js";
import { writeProfile } from "../vault/writer.js";
import { getDueWords, filterSprintWords, filterExamWords } from "../srs/scheduler.js";

export interface GetDueWordsParams {
  language: string;
  limit?: number;
  include_known_list?: boolean;
}

export async function getDueWordsHandler(
  params: GetDueWordsParams,
  vaultRoot: string
): Promise<GetDueWordsResult> {
  const today = new Date().toISOString().slice(0, 10);
  const limit = params.limit ?? 20;

  const profiles = readProfile(vaultRoot);
  const profile = profiles.find((p) => p.language === params.language);

  if (!profile) {
    throw new Error(`Nie znaleziono profilu dla języka "${params.language}". Użyj set_language_profile aby go utworzyć.`);
  }

  let words = readAllWords(vaultRoot, params.language);
  const stats = readStats(vaultRoot);
  const langStats = stats.languages[params.language] ?? {
    total_words: 0, weak: 0, medium: 0, strong: 0,
    sessions_count: 0, streak: 0, last_session: null,
  };

  const stats_summary = {
    total: words.length,
    weak: words.filter((w) => w.level === "weak").length,
    medium: words.filter((w) => w.level === "medium").length,
    strong: words.filter((w) => w.level === "strong").length,
  };

  // Check sprint
  let sprint = profile.sprint;
  if (sprint && sprint.deadline < today) {
    sprint = null;
    const updatedProfiles = profiles.map((p) =>
      p.language === params.language ? { ...p, sprint: null } : p
    );
    writeProfile(vaultRoot, updatedProfiles);
  }

  // Check exam
  let exam = profile.exam;
  if (exam && exam.date < today) {
    exam = null;
    const updatedProfiles = profiles.map((p) =>
      p.language === params.language ? { ...p, exam: null } : p
    );
    writeProfile(vaultRoot, updatedProfiles);
  }

  const known_words = params.include_known_list
    ? words.map((w) => w.slug)
    : [];

  // Sprint mode
  if (sprint) {
    const daysLeft = daysBetween(today, sprint.deadline);
    const due_words = filterSprintWords(words, sprint.words);
    return {
      due_words: due_words.slice(0, limit),
      known_words,
      mode: "sprint",
      sprint_info: { topic: sprint.topic, deadline: sprint.deadline, days_left: daysLeft },
      stats_summary,
    };
  }

  // Exam prep mode (within 30 days)
  if (exam) {
    const daysLeft = daysBetween(today, exam.date);
    if (daysLeft <= 30 && exam.wordlist) {
      const due_words = filterExamWords(words, exam.wordlist, daysLeft, limit, today);
      return {
        due_words,
        known_words,
        mode: "exam_prep",
        exam_info: { name: exam.name, date: exam.date, days_left: daysLeft },
        stats_summary,
      };
    }
  }

  // Normal SRS mode
  const due_words = getDueWords(words, today, limit);
  return {
    due_words,
    known_words,
    mode: "normal",
    ...(exam && { exam_info: { name: exam.name, date: exam.date, days_left: daysBetween(today, exam.date) } }),
    stats_summary,
  };
}

function daysBetween(from: string, to: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / msPerDay);
}
