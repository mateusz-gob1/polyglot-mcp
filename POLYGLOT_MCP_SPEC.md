# Polyglot MCP — Specyfikacja MVP

## Kontekst i cel

Polyglot MCP to serwer MCP (Model Context Protocol) który zamienia Obsidian vault w centrum systemu nauki języków. Claude staje się spersonalizowanym nauczycielem który **pamięta** postęp ucznia między sesjami — nie przez własną pamięć, ale przez odczyt vaultu przy każdej sesji.

Kluczowa zasada: **MCP jest pamięcią i systemem plików. Claude jest nauczycielem.** Podział ról musi być zachowany.

Projekt ma być open source na GitHubie, docelowo używany przez społeczność Obsidian + Claude Code/Desktop.

---

## Stack

- **Język:** TypeScript
- **Runtime:** Node.js 18+
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **Storage:** bezpośredni filesystem (Obsidian vault przez ścieżkę)
- **Format danych:** Markdown z YAML frontmatter
- **Bez zewnętrznych baz danych** — zero dodatkowych zależności dla usera

---

## Struktura repozytorium

```
polyglot-mcp/
├── src/
│   ├── index.ts              # entry point, rejestracja serwera i tools
│   ├── tools/
│   │   ├── set_language_profile.ts
│   │   ├── get_due_words.ts
│   │   ├── create_word_note.ts
│   │   ├── update_word_progress.ts
│   │   ├── create_session_note.ts
│   │   └── get_stats.ts
│   ├── vault/
│   │   ├── reader.ts         # odczyt plików z vault
│   │   ├── writer.ts         # zapis plików do vault
│   │   └── paths.ts          # stałe ścieżki w vault
│   ├── srs/
│   │   └── scheduler.ts      # logika SRS (weak/medium/strong)
│   └── types.ts              # wspólne typy TypeScript
├── system-prompt/
│   └── POLYGLOT.md             # system prompt dla Claude (nauczyciel)
├── docs/
│   ├── setup.md              # poradnik instalacji
│   ├── obsidian-structure.md # opis struktury vault
│   └── language-profiles.md  # lista wspieranych języków i egzaminów
├── package.json
├── tsconfig.json
└── README.md
```

---

## Struktura vault (Obsidian)

MCP tworzy i zarządza następującymi plikami/folderami w vault użytkownika:

```
<vault_root>/
└── polyglot/
    ├── profile.md                    # profil(e) językowe użytkownika
    ├── stats.md                      # agregowane statystyki
    ├── sessions/
    │   ├── 2026-04-16.md
    │   └── ...
    └── words/
        └── es/                       # folder per język (ISO 639-1)
            ├── hola.md
            ├── gracias.md
            └── ...
```

Wszystkie pliki tworzone przez MCP. User może je ręcznie edytować — MCP respektuje zmiany.

---

## Format plików

### `polyglot/profile.md`

```yaml
---
profiles:
  - language: es
    language_name: Español
    current_level: A1
    target_level: A2
    vocab_mode: strict        # strict | loose
    active: true
    created: 2026-04-16
    exam:
      name: DELE A2
      date: 2026-06-15
      wordlist: DELE_A2       # klucz do wbudowanej listy słówek
    sprint:
      topic: "rozdział 5 — jedzenie i restauracja"
      deadline: 2026-04-23
      words:
        - el menú
        - la cuenta
        - pedir
        - la mesa
  - language: zh
    language_name: 中文
    current_level: HSK1
    target_level: HSK3
    vocab_mode: strict
    active: false
    created: 2026-01-10
    exam: null
    sprint: null
---
```

### `polyglot/words/<lang>/<word>.md`

Nazwa pliku: słowo w formie bazowej, spaces → underscore, lowercase.

```markdown
---
word: hola
language: es
translation: cześć / dzień dobry
romanization: null            # używane dla zh (pinyin), ja (romaji), ar (transliteracja)
level: weak                   # weak | medium | strong
cefr: A1                      # A1 | A2 | B1 | B2 | C1 | C2 | extra
exam_wordlist: DELE_A2        # null jeśli nie powiązane z egzaminem
srs_due: 2026-04-17           # data następnej powtórki (ISO 8601)
srs_interval: 1               # dni do następnej powtórki
srs_correct_streak: 0         # liczba poprawnych odpowiedzi z rzędu
created: 2026-04-16
last_reviewed: null
tags: []
---

## Przykład

Hola, ¿cómo estás?
*Cześć, jak się masz?*

## Mnemonik

HOLA brzmi jak "hola!" — radosne powitanie, nie pomylisz.

## Komponenty

Słowo proste, brak komponentów.

## Powiązania

- Temat: [[adios]], [[buenos_dias]]
- Antonim: [[adios]]
```

**Zasady nazewnictwa plików:**
- Spacje → underscore: `buenos días` → `buenos_dias.md`
- Znaki specjalne zachowane w metadanych, uproszczone w nazwie pliku
- Dla języków nielatynskich (zh, ja, ar): nazwa pliku = romanizacja (np. `xuexi.md`), znak w polu `word`

### `polyglot/sessions/YYYY-MM-DD.md`

```markdown
---
date: 2026-04-16
language: es
duration_minutes: 25
new_words: 3
reviewed: 14
correct: 11
---

## Nowe słowa

- [[hola]] — cześć
- [[gracias]] — dziękuję
- [[por_favor]] — proszę

## Powtórzone

[[casa]], [[libro]], [[gato]] — wszystkie poprawne
[[agua]], [[comer]] — błędy, cofnięte do weak

## Notatki sesji

Użytkownik dobrze radzi sobie z powitaniami. Problem z czasownikami.
```

### `polyglot/stats.md`

```markdown
---
last_updated: 2026-04-16
languages:
  es:
    total_words: 27
    weak: 15
    medium: 8
    strong: 4
    sessions_count: 6
    streak: 4
    last_session: 2026-04-14
---
```

---

## Tools MCP — specyfikacja

### 1. `set_language_profile`

**Kiedy wywoływany:** Na początku pierwszej sesji (gdy profil = null), gdy user chce zmienić język/cel, przełączyć aktywny język, zrezygnować z języka lub wspomina egzamin/sprawdzian.

**Parametry:**
```typescript
{
  action: "create" | "update" | "switch" | "deactivate",
  // create   — nowy język, którego jeszcze nie ma w profilu
  // update   — zmiana celu/egzaminu/sprintu dla istniejącego języka
  // switch   — przełączenie aktywnego języka (dane zachowane)
  // deactivate — zawieszenie języka (dane zachowane, active: false)

  language: string,           // ISO 639-1: "es", "zh", "ja", "de", "fr", "ar", ...
  language_name?: string,     // wymagane tylko dla action: "create"
  current_level?: string,     // A1/A2/B1/B2/C1/C2 lub HSK1-6 lub JLPT N5-N1
  target_level?: string,
  vocab_mode?: "strict" | "loose",
  exam?: {
    name: string,             // "DELE A2", "HSK 3", "JLPT N3", "Matura", ...
    date: string,             // ISO 8601
    wordlist?: string         // klucz do wbudowanej listy (jeśli obsługiwana)
  } | null,
  sprint?: {
    topic: string,
    deadline: string,         // ISO 8601
    words: string[]
  } | null
}
```

**Zachowanie:**
- `create` — dodaje nowy profil językowy, ustawia `active: true`, pozostałe języki `active: false`
- `update` — nadpisuje tylko podane pola, reszta profilu nienaruszona
- `switch` — ustawia `active: true` na wskazanym języku, `active: false` na pozostałych. Dane słówek i sesji nienaruszone.
- `deactivate` — ustawia `active: false`, wszystkie dane zachowane. User może wrócić za miesiąc i kontynuować.
- Jeśli `exam.date` jest w przeszłości — czyści pole exam i informuje Claude
- Jeśli `sprint.deadline` minął — czyści sprint automatycznie
- Wiele języków może współistnieć jednocześnie w `profile.md`

**Zwraca:**
```typescript
{
  success: boolean,
  action_performed: "create" | "update" | "switch" | "deactivate",
  active_language: string,
  profile: LanguageProfile,
  all_languages: string[],    // lista wszystkich języków w vault (aktywnych i uśpionych)
  message: string             // np. "Przełączono na Español. Chiński zawieszony — dane zachowane."
}
```

---

### 2. `get_due_words`

**Kiedy wywoływany:** Na początku każdej sesji, gdy Claude chce wiedzieć co powtórzyć. Język musi być podany explicite — nigdy inferowany z pola `active`.

**Parametry:**
```typescript
{
  language: string,            // WYMAGANE — zawsze explicite, np. "es". Nigdy nie inferuj z active.
  limit?: number,              // domyślnie 20
  include_known_list?: boolean // czy zwrócić pełną listę znanych słów (dla trybu strict)
}
```

**Logika SRS:**

Standardowy tryb:
- `weak`: due każdego dnia
- `medium`: due co 3 dni
- `strong`: due co 7 dni

Tryb sprint (gdy `sprint != null` i deadline nie minął):
- Ignoruje normalny SRS
- Zwraca TYLKO słowa z `sprint.words`
- Priorytet: słowa których `level = weak` lub `last_reviewed = null`

Tryb exam prep (gdy `exam != null` i deadline < 30 dni):
- Priorytetyzuje słowa z `exam.wordlist`
- Im bliżej egzaminu tym więcej słów z listy (liniowa interpolacja)

**Zwraca:**
```typescript
{
  due_words: Word[],
  known_words: string[],      // pełna lista słów ze znanych (gdy include_known_list=true)
  mode: "normal" | "sprint" | "exam_prep",
  sprint_info?: { topic: string, deadline: string, days_left: number },
  exam_info?: { name: string, date: string, days_left: number },
  stats_summary: { total: number, weak: number, medium: number, strong: number }
}
```

---

### 3. `create_word_note`

**Kiedy wywoływany:** Gdy Claude wprowadza nowe słowo podczas sesji.

**Parametry:**
```typescript
{
  language: string,
  word: string,
  translation: string,
  romanization?: string,      // pinyin, romaji, transliteracja
  example_sentence: string,   // zdanie po docelowemu języku
  example_translation: string,// polskie tłumaczenie zdania
  mnemonic?: string,
  components?: string,        // dla zh/ja: opis radykałów/kantokomponentów
  cefr?: string,
  exam_wordlist?: string,
  tags?: string[]
}
```

**Zachowanie:**
- Tworzy plik `polyglot/words/<language>/<word_slug>.md`
- Ustawia `level: weak`, `srs_due: dzisiaj+1`, `srs_interval: 1`
- Aktualizuje `polyglot/stats.md` (inkrementuje total_words, weak)
- Jeśli plik już istnieje — nie nadpisuje, zwraca istniejące dane

**Zwraca:**
```typescript
{
  success: boolean,
  word: Word,
  file_path: string,
  already_existed: boolean
}
```

---

### 4. `update_word_progress`

**Kiedy wywoływany:** Na końcu sesji, po każdej powtórce.

**Parametry:**
```typescript
{
  language: string,
  results: Array<{
    word: string,
    correct: boolean
  }>
}
```

**Logika awansowania poziomów:**

```
weak → medium:   3 poprawne z rzędu (streak >= 3)
medium → strong: 5 poprawnych z rzędu (streak >= 5)

Błąd na medium → cofa do weak, streak = 0
Błąd na strong → cofa do medium, streak = 0
Błąd na weak   → zostaje weak, streak = 0

Interwały SRS po poprawnej odpowiedzi:
weak:   srs_interval = 1 dzień
medium: srs_interval = 3 dni
strong: srs_interval = 7 dni
srs_due = dzisiaj + srs_interval
```

**Zwraca:**
```typescript
{
  updated: Array<{
    word: string,
    old_level: string,
    new_level: string,
    promoted: boolean,
    demoted: boolean
  }>,
  stats_updated: boolean
}
```

---

### 5. `create_session_note`

**Kiedy wywoływany:** Na końcu każdej sesji.

**Parametry:**
```typescript
{
  language: string,
  new_words: string[],
  reviewed_words: string[],
  correct_count: number,
  duration_minutes?: number,
  notes?: string              // opcjonalne obserwacje Claude o sesji
}
```

**Zachowanie:**
- Tworzy `polyglot/sessions/YYYY-MM-DD.md`
- Jeśli plik dla danego dnia istnieje — appenduje (możliwe dwie sesje jednego dnia)
- Aktualizuje `streak` w stats.md (inkrementuje jeśli sesja dziś lub wczoraj)

**Zwraca:**
```typescript
{
  success: boolean,
  file_path: string,
  streak: number
}
```

---

### 6. `get_stats`

**Kiedy wywoływany:** Na początku każdej sesji (żeby Claude wiedział gdzie uczeń jest).

**Parametry:**
```typescript
{
  language?: string           // null = zwraca stats dla wszystkich języków
}
```

**Zwraca:**
```typescript
{
  profiles: LanguageProfile[],
  active_language: string | null,
  all_languages: string[],        // wszystkie języki: aktywne i uśpione
  inactive_languages: string[],   // języki z danymi, ale active: false
  per_language: {
    [lang: string]: {
      total_words: number,
      weak: number,
      medium: number,
      strong: number,
      sessions_count: number,
      streak: number,
      last_session: string | null,
      active: boolean,
      exam?: ExamInfo,
      sprint?: SprintInfo,
      due_today: number       // liczba słów do powtórki dziś
    }
  },
  first_session: boolean      // true jeśli brak jakichkolwiek danych
}
```

---

## Konfiguracja serwera

Użytkownik ustawia jedną zmienną środowiskową:

```json
{
  "mcpServers": {
    "polyglot": {
      "command": "node",
      "args": ["/path/to/polyglot-mcp/dist/index.js"],
      "env": {
        "VAULT_PATH": "/path/to/obsidian/vault"
      }
    }
  }
}
```

Serwer przy starcie:
1. Sprawdza czy `VAULT_PATH` istnieje
2. Tworzy folder `polyglot/` jeśli nie istnieje
3. Tworzy `polyglot/profile.md` z null profilem jeśli nie istnieje
4. Loguje gotowość

---

## System prompt dla Claude (`system-prompt/POLYGLOT.md`)

Ten plik to instrukcja dla użytkownika — wkleja go jako system prompt lub custom instructions. To jest "dusza nauczyciela" analogiczna do Twojego CLAUDE.md, ale uogólniona.

```markdown
# Polyglot — system prompt

## Tożsamość
Jesteś osobistym nauczycielem języków. Komunikujesz się z uczniem w jego ojczystym języku.
Docelowy język ćwiczysz tylko w ćwiczeniach i przykładach.

## Protokół: START SESJI
1. Wywołaj `get_stats` bez parametru — sprawdź wszystkie języki i statystyki
2. Jeśli `first_session: true` → przeprowadź onboarding (patrz niżej)
3. Jeśli `active_language: null` → zapytaj który język dziś
4. Jeśli jest jeden aktywny język → przywitaj się i zaproponuj plan
5. Jeśli jest wiele aktywnych profili → zapytaj "dziś [język A] czy [język B]?"
6. Wywołaj `get_due_words` z **explicite podanym językiem** wybranym w kroku 4/5
7. NIE pytaj ucznia gdzie skończył — sprawdź sam w stats

## Protokół: ONBOARDING (first_session: true)
Zadaj te pytania po kolei (nie wszystkie naraz):
1. Jakiego języka chcesz się uczyć?
2. Jaki masz aktualny poziom? (zupełny początkujący / znam trochę / komunikuję się podstawowo)
3. Jaki jest Twój cel? (egzamin, podróż, praca, hobby)
4. Czy przygotowujesz się do konkretnego egzaminu? Jeśli tak — jakiego i kiedy?

Po zebraniu odpowiedzi wywołaj `set_language_profile`.

## Protokół: KONIEC SESJI
1. Wywołaj `update_word_progress` z wynikami powtórek
2. Wywołaj `create_session_note`
3. Podsumuj sesję krótko (ile słów, wynik, co szło dobrze/słabo)

## Tryb strict (vocab_mode: strict)
Gdy `get_due_words` zwraca `known_words`, ZAWSZE używaj TYLKO tych słów w:
- ćwiczeniach uzupełniania luk
- przykładowych zdaniach do nowych słów
- dialogach sytuacyjnych

Nowe słowa wprowadzasz stopniowo — jedno na raz, zawsze z przykładem z known_words.

## Tryb loose (vocab_mode: loose)
Możesz używać słów spoza listy, ale priorytetyzuj known_words.
Gdy użyjesz nieznanego słowa — zaproponuj jego dodanie do vault.

## Sprint mode
Gdy `get_due_words` zwraca `mode: sprint`:
- Skupiasz się WYŁĄCZNIE na słowach z sprintu
- Przypominaj o deadline na początku sesji
- Bardziej intensywne powtórki

## Exam prep mode  
Gdy `mode: exam_prep`:
- Priorytet dla słów z wordlisty egzaminacyjnej
- Informuj o liczbie dni do egzaminu
- Dopasuj typ ćwiczeń do formatu egzaminu (jeśli znasz)

## Zasady nauczania
- Nowe słowo ZAWSZE z przykładowym zdaniem w kontekście
- Mnemonik gdy tylko możliwy — kreatywny, w języku ucznia
- Max 5 nowych słów na sesję (chyba że uczeń prosi o więcej)
- Błędy koryguj dyskretnie — nie przerywaj flow
- Gramatykę wprowadzaj przy okazji, nie jako osobne lekcje

## Czego NIE robisz
- NIE pytasz o rzeczy które możesz sprawdzić w stats
- NIE wymyślasz postępu — zawsze pobierasz go toolem
- NIE używasz słów spoza known_words w trybie strict
- NIE kończysz sesji bez wywołania create_session_note
```

---

## Obsługiwane egzaminy i wordlisty (v1)

W MVP wbudowane listy słówek dla:

| Egzamin | Język | Słowa |
|---|---|---|
| HSK 1 | zh | 150 |
| HSK 2 | zh | 300 |
| HSK 3 | zh | 600 |
| JLPT N5 | ja | 800 |
| JLPT N4 | ja | 1500 |
| DELE A1 | es | ~500 |
| DELE A2 | es | ~1000 |
| Goethe A1 | de | ~500 |
| Goethe A2 | de | ~1000 |

Listy jako JSON w `src/data/wordlists/`. Format:
```json
{
  "id": "HSK_1",
  "exam": "HSK 1",
  "language": "zh",
  "words": [
    { "word": "你好", "romanization": "nǐ hǎo", "translation": "cześć", "cefr_equiv": "A1" }
  ]
}
```

---

## Zachowania edge case

| Sytuacja | Zachowanie |
|---|---|
| Anki jest zamknięte | Nie dotyczy MVP — Anki w v2 |
| Vault path nie istnieje | Błąd przy starcie serwera z czytelnym komunikatem |
| Plik słówka już istnieje | `create_word_note` zwraca existing + `already_existed: true` |
| Sprint deadline minął | `get_due_words` automatycznie czyści sprint, wraca do normalnego SRS |
| Exam date minął | `get_stats` czyści exam, Claude gratuluje/pyta o wynik |
| Dwie sesje jednego dnia | `create_session_note` appenduje do istniejącego pliku |
| Brak słów do powtórki | `get_due_words` zwraca pustą listę, Claude proponuje nowe słowa |
| User edytuje plik ręcznie | MCP respektuje zmiany — odczytuje aktualny stan pliku przy każdym wywołaniu |
| User chce uczyć się dwóch języków | Dwa profile w `profile.md`, Claude pyta na początku sesji który język dziś |
| User przełącza język | `set_language_profile` z `action: "switch"` — dane poprzedniego języka nienaruszone |
| User rezygnuje z języka | `set_language_profile` z `action: "deactivate"` — vault zachowany, można wrócić |
| User wraca do zawieszonego języka | `set_language_profile` z `action: "switch"` — wszystkie dane z poprzednich sesji dostępne |
| `get_due_words` bez podania języka | Błąd — język zawsze wymagany explicite, nigdy inferowany z `active` |
| Wszystkie języki inactive | `get_stats` zwraca `active_language: null`, Claude przeprowadza onboarding |

---

## README (struktura dla GitHub)

README powinno zawierać:

1. **Hook** — jedno zdanie co to robi
2. **Demo GIF** — 30s screencast pierwszej sesji (do nagrania po implementacji)
3. **Wymagania** — Node 18+, Claude Desktop lub Claude Code, Obsidian (opcjonalne)
4. **Instalacja** — 3 kroki max
5. **Konfiguracja** — jeden blok JSON do wklejenia
6. **System prompt** — link do pliku + instrukcja jak użyć
7. **Wspierane języki** — tabela
8. **Roadmap** — Anki sync, SQLite backend, web wordlists

---

## Co NIE wchodzi do MVP (v2+)

- Anki sync przez AnkiConnect
- SQLite backend (dla użytkowników bez Obsidiana)
- Fetch z zewnętrznych słowników (Wiktionary, Forvo audio)
- Migracja danych między backendami
- CLI do onboardingu
- Obsidian plugin (jeśli kiedykolwiek)

---

## Checklist implementacji

### Setup
- [ ] `npm init` + TypeScript config
- [ ] Instalacja `@modelcontextprotocol/sdk`
- [ ] Struktura folderów
- [ ] `src/types.ts` — wszystkie interfejsy TypeScript
- [ ] `src/vault/paths.ts` — stałe ścieżki
- [ ] `src/vault/reader.ts` — odczyt i parsowanie YAML frontmatter
- [ ] `src/vault/writer.ts` — zapis plików markdown z frontmatter
- [ ] `src/srs/scheduler.ts` — logika SRS

### Tools
- [ ] `set_language_profile` — action: create
- [ ] `set_language_profile` — action: update
- [ ] `set_language_profile` — action: switch (multi-language)
- [ ] `set_language_profile` — action: deactivate
- [ ] `get_stats` — single language
- [ ] `get_stats` — all languages (multi-language overview)
- [ ] `get_due_words` (bez sprint/exam priority)
- [ ] `create_word_note`
- [ ] `update_word_progress`
- [ ] `create_session_note`
- [ ] `get_due_words` — sprint mode
- [ ] `get_due_words` — exam prep mode

### Dane
- [ ] Wordlisty HSK 1-3
- [ ] Wordlisty JLPT N5-N4
- [ ] Wordlisty DELE A1-A2
- [ ] Wordlisty Goethe A1-A2

### Finalizacja
- [ ] `src/index.ts` — rejestracja serwera i tools
- [ ] Error handling + czytelne komunikaty
- [ ] `system-prompt/POLYGLOT.md`
- [ ] `docs/setup.md` z instalacją krok po kroku
- [ ] `README.md`
- [ ] Build + test manualny z Claude Code
