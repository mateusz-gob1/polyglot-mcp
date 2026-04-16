export type WordLevel = "weak" | "medium" | "strong";
export type VocabMode = "strict" | "loose";
export type DueMode = "normal" | "sprint" | "exam_prep";

export interface ExamInfo {
  name: string;
  date: string;
  wordlist?: string;
}

export interface SprintInfo {
  topic: string;
  deadline: string;
  words: string[];
}

export interface LanguageProfile {
  language: string;
  language_name: string;
  current_level: string;
  target_level: string;
  vocab_mode: VocabMode;
  active: boolean;
  created: string;
  exam: ExamInfo | null;
  sprint: SprintInfo | null;
}

export interface Word {
  word: string;
  language: string;
  translation: string;
  romanization: string | null;
  level: WordLevel;
  cefr: string;
  exam_wordlist: string | null;
  srs_due: string;
  srs_interval: number;
  srs_correct_streak: number;
  created: string;
  last_reviewed: string | null;
  tags: string[];
  slug: string;
  body: string;
}

export interface SessionNote {
  date: string;
  language: string;
  duration_minutes: number | null;
  new_words: number;
  reviewed: number;
  correct: number;
}

export interface LanguageStats {
  total_words: number;
  weak: number;
  medium: number;
  strong: number;
  sessions_count: number;
  streak: number;
  last_session: string | null;
}

export interface StatsFile {
  last_updated: string;
  languages: Record<string, LanguageStats>;
}

export interface WordlistEntry {
  word: string;
  romanization?: string;
  translation: string;
  cefr_equiv: string;
}

export interface Wordlist {
  id: string;
  exam: string;
  language: string;
  words: WordlistEntry[];
}

// Tool response types

export interface SetLanguageProfileResult {
  success: boolean;
  action_performed: "create" | "update" | "switch" | "deactivate";
  active_language: string | null;
  profile: LanguageProfile | null;
  all_languages: string[];
  message: string;
}

export interface GetDueWordsResult {
  due_words: Word[];
  known_words: string[];
  mode: DueMode;
  sprint_info?: { topic: string; deadline: string; days_left: number };
  exam_info?: { name: string; date: string; days_left: number };
  stats_summary: { total: number; weak: number; medium: number; strong: number };
}

export interface CreateWordNoteResult {
  success: boolean;
  word: Word;
  file_path: string;
  already_existed: boolean;
}

export interface UpdateWordProgressResult {
  updated: Array<{
    word: string;
    old_level: WordLevel;
    new_level: WordLevel;
    promoted: boolean;
    demoted: boolean;
  }>;
  stats_updated: boolean;
}

export interface CreateSessionNoteResult {
  success: boolean;
  file_path: string;
  streak: number;
}

export interface GetStatsResult {
  profiles: LanguageProfile[];
  active_language: string | null;
  all_languages: string[];
  inactive_languages: string[];
  per_language: Record<string, {
    total_words: number;
    weak: number;
    medium: number;
    strong: number;
    sessions_count: number;
    streak: number;
    last_session: string | null;
    active: boolean;
    exam?: ExamInfo;
    sprint?: SprintInfo;
    due_today: number;
  }>;
  first_session: boolean;
}
