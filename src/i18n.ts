export interface NoteLabels {
  example: string;
  mnemonic: string;
  components: string;
  relations: string;
  newWords: string;
  reviewed: string;
  sessionNotes: string;
  noNewWords: string;
  noReviewed: string;
}

const labels: Record<string, NoteLabels> = {
  pl: {
    example: "Przykład",
    mnemonic: "Mnemonik",
    components: "Komponenty",
    relations: "Powiązania",
    newWords: "Nowe słowa",
    reviewed: "Powtórzone",
    sessionNotes: "Notatki sesji",
    noNewWords: "Brak nowych słów.",
    noReviewed: "Brak powtórek.",
  },
  en: {
    example: "Example",
    mnemonic: "Mnemonic",
    components: "Components",
    relations: "Related words",
    newWords: "New words",
    reviewed: "Reviewed",
    sessionNotes: "Session notes",
    noNewWords: "No new words.",
    noReviewed: "No reviews.",
  },
  de: {
    example: "Beispiel",
    mnemonic: "Eselsbrücke",
    components: "Komponenten",
    relations: "Verwandte Wörter",
    newWords: "Neue Wörter",
    reviewed: "Wiederholt",
    sessionNotes: "Sitzungsnotizen",
    noNewWords: "Keine neuen Wörter.",
    noReviewed: "Keine Wiederholungen.",
  },
  es: {
    example: "Ejemplo",
    mnemonic: "Mnemónico",
    components: "Componentes",
    relations: "Palabras relacionadas",
    newWords: "Palabras nuevas",
    reviewed: "Repasadas",
    sessionNotes: "Notas de la sesión",
    noNewWords: "Sin palabras nuevas.",
    noReviewed: "Sin repasos.",
  },
  fr: {
    example: "Exemple",
    mnemonic: "Mnémotechnique",
    components: "Composants",
    relations: "Mots associés",
    newWords: "Nouveaux mots",
    reviewed: "Révisés",
    sessionNotes: "Notes de session",
    noNewWords: "Aucun nouveau mot.",
    noReviewed: "Aucune révision.",
  },
  zh: {
    example: "例句",
    mnemonic: "记忆技巧",
    components: "组成部分",
    relations: "相关词",
    newWords: "新词",
    reviewed: "复习",
    sessionNotes: "课堂笔记",
    noNewWords: "没有新词。",
    noReviewed: "没有复习。",
  },
  ja: {
    example: "例文",
    mnemonic: "覚え方",
    components: "構成要素",
    relations: "関連語",
    newWords: "新しい単語",
    reviewed: "復習済み",
    sessionNotes: "セッションメモ",
    noNewWords: "新しい単語はありません。",
    noReviewed: "復習はありません。",
  },
};

export function getLabels(notesLanguage: string): NoteLabels {
  return labels[notesLanguage] ?? labels["en"]!;
}
