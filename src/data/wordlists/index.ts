import { createRequire } from "module";
import type { Wordlist } from "../../types.js";

const require = createRequire(import.meta.url);

export const SUPPORTED_WORDLISTS: Record<string, { exam: string; language: string }> = {
  HSK_1: { exam: "HSK 1", language: "zh" },
  HSK_2: { exam: "HSK 2", language: "zh" },
  HSK_3: { exam: "HSK 3", language: "zh" },
  JLPT_N5: { exam: "JLPT N5", language: "ja" },
  JLPT_N4: { exam: "JLPT N4", language: "ja" },
  DELE_A1: { exam: "DELE A1", language: "es" },
  DELE_A2: { exam: "DELE A2", language: "es" },
  GOETHE_A1: { exam: "Goethe A1", language: "de" },
  GOETHE_A2: { exam: "Goethe A2", language: "de" },
};

export function getWordlist(key: string): Wordlist | null {
  switch (key) {
    case "HSK_1":
      return require("./HSK_1.json") as Wordlist;
    case "HSK_2":
      return require("./HSK_2.json") as Wordlist;
    case "HSK_3":
      return require("./HSK_3.json") as Wordlist;
    case "JLPT_N5":
      return require("./JLPT_N5.json") as Wordlist;
    case "JLPT_N4":
      return require("./JLPT_N4.json") as Wordlist;
    case "DELE_A1":
      return require("./DELE_A1.json") as Wordlist;
    case "DELE_A2":
      return require("./DELE_A2.json") as Wordlist;
    case "GOETHE_A1":
      return require("./GOETHE_A1.json") as Wordlist;
    case "GOETHE_A2":
      return require("./GOETHE_A2.json") as Wordlist;
    default:
      return null;
  }
}
