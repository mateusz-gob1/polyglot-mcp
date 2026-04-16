import type { GetStatsResult, LanguageStats } from "../types.js";
import { readProfile, readStats, readAllWords } from "../vault/reader.js";
import { writeProfile, writeStats } from "../vault/writer.js";
import { isDue } from "../srs/scheduler.js";

export interface GetStatsParams {
  language?: string;
}

export async function getStats(params: GetStatsParams, vaultRoot: string): Promise<GetStatsResult> {
  const today = new Date().toISOString().slice(0, 10);
  let profiles = readProfile(vaultRoot);
  const stats = readStats(vaultRoot);

  // Auto-clean expired exams and sprints
  let profilesChanged = false;
  profiles = profiles.map((profile) => {
    let changed = false;
    const updated = { ...profile };
    if (profile.exam && profile.exam.date < today) {
      updated.exam = null;
      changed = true;
    }
    if (profile.sprint && profile.sprint.deadline < today) {
      updated.sprint = null;
      changed = true;
    }
    if (changed) profilesChanged = true;
    return updated;
  });

  if (profilesChanged) {
    writeProfile(vaultRoot, profiles);
  }

  const activeProfile = profiles.find((p) => p.active) ?? null;
  const allLanguages = profiles.map((p) => p.language);
  const inactiveLanguages = profiles.filter((p) => !p.active).map((p) => p.language);

  const first_session = profiles.length === 0 && Object.keys(stats.languages).length === 0;

  const per_language: GetStatsResult["per_language"] = {};

  const languagesToProcess = params.language
    ? profiles.filter((p) => p.language === params.language)
    : profiles;

  for (const profile of languagesToProcess) {
    const lang = profile.language;
    const langStats: LanguageStats = stats.languages[lang] ?? {
      total_words: 0, weak: 0, medium: 0, strong: 0,
      sessions_count: 0, streak: 0, last_session: null,
    };

    const words = readAllWords(vaultRoot, lang);
    const due_today = words.filter((w) => isDue(w, today)).length;

    // Recalculate counts from actual files
    const weak = words.filter((w) => w.level === "weak").length;
    const medium = words.filter((w) => w.level === "medium").length;
    const strong = words.filter((w) => w.level === "strong").length;

    if (langStats.weak !== weak || langStats.medium !== medium || langStats.strong !== strong) {
      stats.languages[lang] = { ...langStats, weak, medium, strong, total_words: words.length };
      writeStats(vaultRoot, stats);
    }

    per_language[lang] = {
      total_words: words.length,
      weak,
      medium,
      strong,
      sessions_count: langStats.sessions_count,
      streak: langStats.streak,
      last_session: langStats.last_session,
      active: profile.active,
      exam: profile.exam ?? undefined,
      sprint: profile.sprint ?? undefined,
      due_today,
    };
  }

  return {
    profiles,
    active_language: activeProfile?.language ?? null,
    all_languages: allLanguages,
    inactive_languages: inactiveLanguages,
    per_language,
    first_session,
  };
}
