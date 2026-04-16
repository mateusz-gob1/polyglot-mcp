import path from "path";

export function getVaultPaths(vaultRoot: string) {
  const polyglotDir = path.join(vaultRoot, "polyglot");
  return {
    polyglotDir,
    profileFile: path.join(polyglotDir, "profile.md"),
    statsFile: path.join(polyglotDir, "stats.md"),
    sessionsDir: path.join(polyglotDir, "sessions"),
    wordsDir: path.join(polyglotDir, "words"),
  };
}

export function wordFilePath(vaultRoot: string, language: string, slug: string): string {
  return path.join(vaultRoot, "polyglot", "words", language, `${slug}.md`);
}

export function wordsDirForLang(vaultRoot: string, language: string): string {
  return path.join(vaultRoot, "polyglot", "words", language);
}

export function sessionFilePath(vaultRoot: string, date: string): string {
  return path.join(vaultRoot, "polyglot", "sessions", `${date}.md`);
}

export function wordToSlug(word: string, romanization?: string | null): string {
  const base = romanization ?? word;
  return base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
