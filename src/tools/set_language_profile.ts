import type { LanguageProfile, SetLanguageProfileResult, ExamInfo, SprintInfo } from "../types.js";
import { readProfile } from "../vault/reader.js";
import { writeProfile } from "../vault/writer.js";

export interface SetLanguageProfileParams {
  action: "create" | "update" | "switch" | "deactivate";
  language: string;
  language_name?: string;
  current_level?: string;
  target_level?: string;
  vocab_mode?: "strict" | "loose";
  exam?: ExamInfo | null;
  sprint?: SprintInfo | null;
}

export async function setLanguageProfile(
  params: SetLanguageProfileParams,
  vaultRoot: string
): Promise<SetLanguageProfileResult> {
  const today = new Date().toISOString().slice(0, 10);
  let profiles = readProfile(vaultRoot);

  let message = "";
  let profile: LanguageProfile | null = null;

  if (params.action === "create") {
    const existing = profiles.find((p) => p.language === params.language);
    if (existing) {
      return {
        success: false,
        action_performed: "create",
        active_language: profiles.find((p) => p.active)?.language ?? null,
        profile: existing,
        all_languages: profiles.map((p) => p.language),
        message: `Profil dla języka "${params.language}" już istnieje. Użyj action: "update" aby go zmienić.`,
      };
    }

    const exam = validateExam(params.exam, today);
    const sprint = validateSprint(params.sprint, today);

    const newProfile: LanguageProfile = {
      language: params.language,
      language_name: params.language_name ?? params.language,
      current_level: params.current_level ?? "A1",
      target_level: params.target_level ?? "A2",
      vocab_mode: params.vocab_mode ?? "loose",
      active: true,
      created: today,
      exam,
      sprint,
    };

    profiles = profiles.map((p) => ({ ...p, active: false }));
    profiles.push(newProfile);
    profile = newProfile;
    message = `Dodano profil: ${newProfile.language_name}. Aktywny język: ${newProfile.language}.`;

  } else if (params.action === "update") {
    const idx = profiles.findIndex((p) => p.language === params.language);
    if (idx === -1) {
      return {
        success: false,
        action_performed: "update",
        active_language: profiles.find((p) => p.active)?.language ?? null,
        profile: null,
        all_languages: profiles.map((p) => p.language),
        message: `Nie znaleziono profilu dla języka "${params.language}".`,
      };
    }

    const existing = profiles[idx];
    const exam = params.exam !== undefined ? validateExam(params.exam, today) : existing.exam;
    const sprint = params.sprint !== undefined ? validateSprint(params.sprint, today) : existing.sprint;

    profiles[idx] = {
      ...existing,
      ...(params.current_level && { current_level: params.current_level }),
      ...(params.target_level && { target_level: params.target_level }),
      ...(params.vocab_mode && { vocab_mode: params.vocab_mode }),
      ...(params.language_name && { language_name: params.language_name }),
      exam,
      sprint,
    };
    profile = profiles[idx];
    message = `Zaktualizowano profil: ${profile.language_name}.`;

  } else if (params.action === "switch") {
    const target = profiles.find((p) => p.language === params.language);
    if (!target) {
      return {
        success: false,
        action_performed: "switch",
        active_language: profiles.find((p) => p.active)?.language ?? null,
        profile: null,
        all_languages: profiles.map((p) => p.language),
        message: `Nie znaleziono profilu dla języka "${params.language}".`,
      };
    }

    profiles = profiles.map((p) => ({ ...p, active: p.language === params.language }));
    profile = profiles.find((p) => p.language === params.language) ?? null;
    message = `Przełączono na ${target.language_name}. Dane innych języków zachowane.`;

  } else if (params.action === "deactivate") {
    const idx = profiles.findIndex((p) => p.language === params.language);
    if (idx === -1) {
      return {
        success: false,
        action_performed: "deactivate",
        active_language: profiles.find((p) => p.active)?.language ?? null,
        profile: null,
        all_languages: profiles.map((p) => p.language),
        message: `Nie znaleziono profilu dla języka "${params.language}".`,
      };
    }

    profiles[idx] = { ...profiles[idx], active: false };
    profile = profiles[idx];
    message = `Zawieszono naukę: ${profile.language_name}. Dane zachowane — możesz wrócić w dowolnym momencie.`;
  }

  writeProfile(vaultRoot, profiles);

  const activeLanguage = profiles.find((p) => p.active)?.language ?? null;

  return {
    success: true,
    action_performed: params.action,
    active_language: activeLanguage,
    profile,
    all_languages: profiles.map((p) => p.language),
    message,
  };
}

function validateExam(exam: ExamInfo | null | undefined, today: string): ExamInfo | null {
  if (!exam) return null;
  if (exam.date < today) return null;
  return exam;
}

function validateSprint(sprint: SprintInfo | null | undefined, today: string): SprintInfo | null {
  if (!sprint) return null;
  if (sprint.deadline < today) return null;
  return sprint;
}
