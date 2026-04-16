import type { Word, WordLevel } from "../types.js";

const INTERVALS: Record<WordLevel, number> = {
  weak: 1,
  medium: 3,
  strong: 7,
};

const PROMOTION_THRESHOLD: Record<WordLevel, number> = {
  weak: 3,
  medium: 5,
  strong: Infinity,
};

const DEMOTION: Record<WordLevel, WordLevel> = {
  weak: "weak",
  medium: "weak",
  strong: "medium",
};

const PROMOTION: Record<WordLevel, WordLevel> = {
  weak: "medium",
  medium: "strong",
  strong: "strong",
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function calculateNextReview(word: Word, correct: boolean, today: string): Partial<Word> {
  if (!correct) {
    const newLevel = DEMOTION[word.level];
    return {
      level: newLevel,
      srs_correct_streak: 0,
      srs_interval: INTERVALS[newLevel],
      srs_due: addDays(today, INTERVALS[newLevel]),
      last_reviewed: today,
    };
  }

  const newStreak = word.srs_correct_streak + 1;
  const threshold = PROMOTION_THRESHOLD[word.level];
  const newLevel: WordLevel = newStreak >= threshold ? PROMOTION[word.level] : word.level;
  const interval = INTERVALS[newLevel];

  return {
    level: newLevel,
    srs_correct_streak: newStreak,
    srs_interval: interval,
    srs_due: addDays(today, interval),
    last_reviewed: today,
  };
}

export function isDue(word: Word, today: string): boolean {
  return word.srs_due <= today;
}

export function getDueWords(words: Word[], today: string, limit: number): Word[] {
  const due = words.filter((w) => isDue(w, today));
  due.sort((a, b) => {
    const aNew = a.last_reviewed === null ? 0 : 1;
    const bNew = b.last_reviewed === null ? 0 : 1;
    if (aNew !== bNew) return aNew - bNew;
    return a.srs_due.localeCompare(b.srs_due);
  });
  return due.slice(0, limit);
}

export function filterSprintWords(words: Word[], sprintWordList: string[]): Word[] {
  const set = new Set(sprintWordList.map((w) => w.toLowerCase()));
  const sprint = words.filter(
    (w) => set.has(w.word.toLowerCase()) || set.has(w.slug)
  );
  sprint.sort((a, b) => {
    const aWeak = a.level === "weak" || a.last_reviewed === null ? 0 : 1;
    const bWeak = b.level === "weak" || b.last_reviewed === null ? 0 : 1;
    return aWeak - bWeak;
  });
  return sprint;
}

export function filterExamWords(
  words: Word[],
  examWordlist: string,
  daysLeft: number,
  limit: number
): Word[] {
  const examWords = words.filter((w) => w.exam_wordlist === examWordlist);
  const otherWords = words.filter((w) => w.exam_wordlist !== examWordlist);

  const maxDays = 30;
  const examRatio = Math.min(1, (maxDays - daysLeft) / maxDays);
  const examCount = Math.round(limit * examRatio);
  const otherCount = limit - examCount;

  const due = getDueWords(examWords, new Date().toISOString().slice(0, 10), examCount);
  const fill = getDueWords(otherWords, new Date().toISOString().slice(0, 10), otherCount);

  return [...due, ...fill];
}
