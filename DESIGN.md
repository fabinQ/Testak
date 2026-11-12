# DESIGN — Testak (interfejs)

**Wersja:** 1.0 · **Data:** 2026-11-12 · **Styl:** B „Tablica szkolna"
Źródło prawdy dla wyglądu i układu ekranów. Wymagania funkcjonalne (FR-x) są w `PRD-Testak.md`; ten plik mówi, **jak to ma wyglądać i gdzie leży**. Makiety: płótno „Testak — style i logo".

## 1. Zasady ogólne

- Prosto i przejrzyście: dużo światła, jedna kolumna treści na raz, bez ozdobników. Ramki 1 px zamiast cieni.
- Aplikacja dla jednego nauczyciela, **bez logowania** (PRD sekcja 3). Ekran logowania jest opisany w 5.1 tylko na przyszłość.
- W interfejsie mówimy **„klasówka"** (w PRD i kodzie: `test`). „Zadanie", „Baza zadań", „Tablica", „Pomoc".
- Projektujemy pod **laptop (≥ 1280 px)**. Tablet ma działać w pełni, telefon — w ograniczonym zakresie (sekcja 6).
- Arkusz A4 (podgląd i druk) ma własne zasady z PRD (6.4–6.5); styl aplikacji **nie wchodzi** na arkusz: arkusz jest zawsze biały, czarny tekst, czcionka szeryfowa.
- Akcent ASCII: identyfikatory i liczby (`#16864`, punkty, minuty, mm) czcionką maszynową. Nic więcej.

## 2. Tokeny

Definiować raz w `frontend/src/index.css` w bloku `@theme` (Tailwind 4), używać przez klasy (`bg-board`, `text-ink-muted`…). Nie wpisywać kolorów szesnastkowo w komponentach.

### 2.1 Kolory

| Token | Wartość | Użycie |
|---|---|---|
| `--color-board` | `#1E3A32` | menu boczne, ciemne powierzchnie, obrys przycisku drugorzędnego |
| `--color-board-raised` | `#2D5246` | aktywna pozycja menu, hover w menu |
| `--color-chalk` | `#EEF4F0` | tekst na `board` |
| `--color-chalk-muted` | `#B5CCC2` | tekst drugorzędny na `board` |
| `--color-amber` | `#F2B544` | wypełnienie przycisku głównego, znak logo |
| `--color-amber-hover` | `#E5A52E` | hover przycisku głównego |
| `--color-amber-text` | `#F7C866` | aktywna pozycja menu (tylko na `board`) |
| `--color-bg` | `#F2F4F0` | tło strony |
| `--color-surface` | `#FFFFFF` | karty, pola, arkusz |
| `--color-ink` | `#17231F` | tekst główny |
| `--color-ink-muted` | `#55625C` | tekst drugorzędny, metadane |
| `--color-line` | `#D5DCD2` | ramki kart i pól |
| `--color-line-strong` | `#B9C6BD` | ramki chipów, separator sekcji |
| `--color-link` | `#1F6B55` | linki, obrys fokusu, stan „zrobione" |
| `--color-link-hover` | `#154B3C` | hover linku |
| `--color-danger` | `#A32A1C` | usuwanie, błędy |
| `--color-danger-bg` | `#FBEDEA` | tło komunikatu błędu |
| `--color-warn-ink` / `--color-warn-bg` | `#6B4700` / `#FFF4D6` | ostrzeżenia (np. losowanie nie spełniło limitu) |

Reguły: bursztyn jest **tylko wypełnieniem** z ciemnym tekstem `ink` — nigdy tekstem ani ikoną na białym (za mały kontrast). Tekst ma kontrast ≥ 4,5:1. Stanu nie przekazujemy samym kolorem (zawsze też tekst lub ikona).

### 2.2 Typografia

| Rola | Czcionka | Rozmiar / grubość |
|---|---|---|
| h1 strony | Space Grotesk | 32 px / 700, `letter-spacing: -0.02em` |
| h2 sekcji | Space Grotesk | 19 px / 600 |
| h3 karty | Inter | 16 px / 600 |
| tekst | Inter | 15 px / 400, `line-height: 1.5` |
| etykiety pól, metadane | Inter | 13 px / 500 |
| chip | Inter | 12,5 px / 500 |
| identyfikatory, liczby | `ui-monospace, 'Cascadia Mono', Consolas, monospace` | 13 px |
| treść zadania (listy, podgląd) | `Cambria, 'Times New Roman', serif` | 17 px, `line-height: 1.45` (klasa `.task-content`) |

Czcionki Space Grotesk i Inter: pliki `woff2` w `frontend/public/fonts/` + `@font-face` (aplikacja działa lokalnie, bez internetu; bez nowej zależności npm). Zapas: `system-ui, sans-serif`.

### 2.3 Kształt i odstępy

- Promienie: chip 4 px · przycisk, pole, pozycja menu 6 px · karta, okno 8 px · arkusz A4 0.
- Siatka odstępów co 4 px. Odstęp między kartami 12 px, między sekcjami 28 px. Margines treści: 40 px (laptop), 24 px (tablet), 16 px (telefon).
- Cień tylko dla: arkusza A4 w podglądzie, menu rozwijanych, okien dialogowych.
- Cel dotyku / kliknięcia min. 44 × 44 px.
- Fokus klawiatury: obrys 2 px `link` z odstępem 2 px (na `board`: `amber-text`). Nigdy nie usuwać.
- Animacje ≤ 150 ms, tylko `opacity`/`transform`; wyłączone przy `prefers-reduced-motion`.

## 3. Logo

- Znak: bursztynowy kwadrat (r = 6) z ciemnym symbolem pierwiastka, który jest zarazem „ptaszkiem". Pliki: `frontend/public/favicon.svg` (sam znak), `frontend/public/logo.svg` (znak + napis).
- W aplikacji: znak 32 px + napis `testak` (Space Grotesk 700, 23 px, małe litery) jako tekst HTML. Na `board` napis biały, na jasnym tle `ink`.
- Wersja tekstowa (stopka, e-mail z Pomocy): `[√] testak`.
- Pole ochronne: pół szerokości znaku z każdej strony. Nie rozciągać, nie zmieniać kolorów.

## 4. Szkielet aplikacji i komponenty

### 4.1 Szkielet

```
┌──────────┬──────────────────────────────────────────────┐
│ logo     │ okruszki (opcjonalnie)          [akcje strony]│
│ Tablica  │ h1                                            │
│ Zadania  │                                               │
│  ├ Nowe  │ treść strony (max-width 1200 px)              │
│  └ Baza  │                                               │
│ Klasówki │                                               │
│ Pomoc    │                                               │
└──────────┴──────────────────────────────────────────────┘
```

- Menu boczne 232 px, `board`. Pozycje: **Tablica**, **Zadania** (Nowe zadanie, Baza zadań), **Klasówki** (Nowa klasówka, Moje klasówki), **Pomoc**. Podpozycje widać tylko w aktywnej sekcji.
- Nagłówek strony: h1 po lewej, akcje strony po prawej (przycisk główny maksymalnie jeden na ekran).
- Brak górnego paska z użytkownikiem (nie ma kont).

### 4.2 Komponenty

| Komponent | Wygląd i zachowanie |
|---|---|
| **Przycisk główny** | tło `amber`, tekst `ink` 15/600, wys. 44, r 6. Jeden na widok. |
| **Przycisk drugorzędny** | białe tło, obrys i tekst `board`. |
| **Przycisk tekstowy** | bez tła, kolor `link`. |
| **Przycisk niebezpieczny** | obrys i tekst `danger`; wypełniony `danger` tylko w oknie potwierdzenia. |
| **Karta** | `surface`, ramka `line`, r 8, padding 18/20. |
| **Akcje karty** (edytuj / usuń / inne) | w prawym górnym rogu karty; ikony 44 × 44 z `aria-label`. Pojawiają się przy `:hover` i `:focus-within`. Na ekranach dotykowych (`@media (hover: none)`) **widoczne zawsze**. |
| **Chip metadanych** | obrys `line-strong`, r 4, tekst 12,5. Kolejność: klasa · dział/temat · typ · zakres · trudność · punkty · czas. Puste pole → chip „brak" w kolorze `warn`. |
| **Pole formularza** | etykieta nad polem (13/500), wys. 44, ramka `line`, fokus `link`. Błąd: ramka `danger` + komunikat pod polem. Pola opcjonalne mają dopisek „(opcjonalne)", nie gwiazdki przy wymaganych. |
| **Filtr wielokrotny** | przycisk z nazwą i licznikiem wybranych („Dział · 2"), po kliknięciu lista z polami wyboru i licznikami zadań (FR-3). Wybrane filtry jako chipy z „×" pod paskiem, „Wyczyść filtry". |
| **Wyszukiwarka** | pole z ikoną lupy, szukanie po 300 ms od ostatniego znaku (FR-2). |
| **Przełącznik segmentowy** | 2–3 opcje (np. liczba grup 1/2, Grupa A/B, Ręcznie/Losuj). |
| **Kroki kreatora** | 4 kroki w rzędzie: numer w kwadracie + nazwa. Aktywny: `board` z białym tekstem; ukończony: znak ✓ w kolorze `link`, klikalny; przyszły: wyszarzony, nieklikalny. Na telefonie: „Krok 2 z 4 · Dodawanie zadań". |
| **Okno potwierdzenia** | tylko dla usuwania i utraty zmian. Tytuł mówi, co się stanie („Usunąć klasówkę «Diagnoza 3b»?"), przyciski „Usuń" / „Anuluj". |
| **Powiadomienie (toast)** | prawy dolny róg, 4 s, np. „Zapisano", „Usunięto · Cofnij". |
| **Stan pusty** | jedno zdanie + przycisk akcji („Nie masz jeszcze klasówek. [Nowa klasówka]"). |
| **Wskaźnik zapisu** | przy tytule klasówki: „Zapisywanie…" / „Zapisano" (FR-41). |
| **Treść zadania** | zawsze przez `prepareHtml` (podmiana `image://`, potem DOMPurify) w `.task-content`. |
| **Arkusz A4** | biała kartka z cieniem na tle `bg`, skalowana `transform: scale()`; wymiary w mm. Nigdy nie pokazuje `is_valid`. |

## 5. Ekrany

Trasy (propozycja): `/` Tablica · `/zadania` Baza zadań · `/zadania/nowe` · `/zadania/:id/edycja` · `/klasowki` Moje klasówki · `/klasowki/nowa` · `/klasowki/:id/edycja` (kreator) · `/pomoc`.

### 5.1 Logowanie — poza MVP

Nie budujemy teraz. Gdy przyjdą konta: wyśrodkowana karta 400 px na tle `board` — logo, e-mail, hasło, przycisk główny „Zaloguj", pod spodem miejsce na komunikat błędu.

### 5.2 Tablica (`/`)

- Nagłówek: h1 „Tablica"; akcje: **Nowa klasówka** (główny), **Nowe zadanie** (drugorzędny).
- Dwie kolumny równej szerokości (na telefonie jedna pod drugą, w tej kolejności):
  1. **Twoje klasówki** — 5 ostatnio zmienionych. Karta: nazwa, wiersz `#id · Matematyka · klasa · dział`, status „robocza" jeśli nieukończona. Kliknięcie karty otwiera kreator. Link „Wszystkie klasówki".
  2. **Twoje zadania** — 5 ostatnio dodanych lub edytowanych w Testaku. Karta: chipy, treść, rozwijana „Odpowiedź". Link „Baza zadań".
- Każda karta ma akcje **Edytuj** i **Usuń** (4.2 „Akcje karty"). Usuwanie zawsze z oknem potwierdzenia.

### 5.3 Baza zadań (`/zadania`)

- Nagłówek: h1 „Baza zadań", liczba wyników („128 z 5043"); akcja **Nowe zadanie**.
- Pasek: wyszukiwarka + filtry: Klasa, Dział/Temat (lista zależna od klasy), Typ, Zakres, Trudność, Źródło (FR-1, FR-3).
- Lista kart zadań, 20 na stronę, paginacja na dole. Karta: chipy, treść, dla zamkniętych odpowiedzi A–D (poprawna oznaczona ✓ i słowem „poprawna" — to widok nauczyciela), rozwijana „Odpowiedź" dla otwartych.
- Akcje karty: **Edytuj**, **Usuń**. Zadania z brakami w metadanych mają chip „brak" — kliknięcie prowadzi do edycji.
- Zadania-bliźniaki (strona B pary) nie są na liście; w edycji oryginału jest link „Wersja dla grupy B".

### 5.4 Nowe zadanie / edycja zadania (`/zadania/nowe`, `/zadania/:id/edycja`)

Jedna strona, trzy ponumerowane sekcje, po prawej (≥ 1280 px) przyklejony **podgląd** zadania tak, jak wyjdzie na arkuszu. Na dole przyklejony pasek: „Zapisz zadanie" (główny), „Anuluj".

1. **Kategoria** — siatka 3 kolumn: Przedmiot (Matematyka, zablokowane), Klasa, Dział, Temat lekcji, Typ (otwarte / zamknięte), Zakres, Poziom trudności, Punktacja, Czas (min), dla zamkniętych: Odpowiedzi w rzędzie (1 / 2 / 4). Wymagane: Typ i treść; reszta opcjonalna (puste pola pasują do każdego filtra — CLAUDE.md).
2. **Treść** — edytor z paskiem: pogrubienie, kursywa, podkreślenie, indeks dolny/górny, listy, tabela, obraz, **symbole matematyczne** (paleta: √ ² ³ ± ≤ ≥ ≠ π ∞ ∈ ułamek, potęga), cofnij/ponów.
3. **Odpowiedzi** — dla zamkniętych: lista odpowiedzi (mały edytor + pole wyboru „poprawna"), „Dodaj odpowiedź", usuwanie; domyślnie 4. Dla otwartych: jedno pole „Odpowiedź / rozwiązanie" (opcjonalne).

Wyjście z niezapisanymi zmianami → okno potwierdzenia. Po zapisie: toast „Zapisano" i powrót do Bazy zadań.

### 5.5 Kreator klasówki (`/klasowki/nowa`, `/klasowki/:id/edycja`)

Wspólne dla 4 kroków: h1 = nazwa klasówki (lub „Nowa klasówka"), wskaźnik zapisu, kroki kreatora, na dole pasek „Wstecz" / „Dalej". Stan klasówki to reducer z undo/redo (Ctrl+Z / Ctrl+Y i przyciski) — każda widoczna zmiana jest akcją.

#### Krok 1 — Nagłówek

Lewa kolumna: formularz. Prawa (≥ 1024 px): **podgląd nagłówka arkusza** na żywo.

| Pole | Typ | Pole „pokaż na arkuszu" | Uwagi |
|---|---|---|---|
| Nazwa klasówki | tekst, **jedyne wymagane** | tak (domyślnie wł.) | np. „Klasówka 3B", „Diagnoza 1a" |
| Przedmiot | lista (tylko Matematyka) | tak | |
| Klasa | 1–4 | tak | ustawia domyślny filtr w kroku 2 |
| Dział, Temat | wielokrotny wybór | tak | domyślne filtry w kroku 2 |
| Zakres | podstawowy / rozszerzony | **nie ma** | tylko domyślny filtr, nigdy na arkuszu |
| Liczba grup | 1 / 2 | — | przy 2 arkusz sam dostaje „Grupa A/B" |
| Mieszaj odpowiedzi | przełącznik | — | aktywne przy 2 grupach (zadania zamknięte bez bliźniaka, FR-17/18) |
| Czas trwania | minuty, opcjonalne | tak | puste = brak limitu; później posłuży do dopasowania liczby zadań |
| Punktacja | — | „suma punktów w nagłówku", „punkty przy zadaniach" | |
| Pola ucznia | Imię i nazwisko, Klasa, Data | każde osobno | puste linie do wpisania |

Zasada: **zaznaczone = widać na wydruku**. Pole wyboru stoi po lewej stronie etykiety parametru.

#### Krok 2 — Dodawanie zadań

Laptop (≥ 1280 px): dwie kolumny — lewa (ok. 55%) **źródło zadań**, prawa **podgląd arkusza** (przyklejony, przewijany osobno).

Lewa kolumna, przełącznik **Wybierz ręcznie | Wylosuj**:
- *Wybierz ręcznie*: wyszukiwarka + filtry jak w Bazie zadań, wstępnie ustawione z kroku 1 (można zmienić). Karta zadania z przyciskiem **Dodaj** (hover / zawsze na dotyku); dodane zadanie ma znacznik „Na arkuszu" i przycisk „Usuń z arkusza".
- *Wylosuj* (FR-5–FR-12): wiersze reguł „**ile** × **typ** × **trudność**" z „Dodaj regułę"; limity: suma punktów ± tolerancja, maks. czas (podpowiedź z kroku 1), maks. N zadań z jednego tematu; pole wyboru „Pomiń zadania z wcześniejszych klasówek" (FR-11). Przycisk główny **Wylosuj**. Gdy reguł nie da się spełnić: komunikat `warn` z najbliższym wynikiem (FR-8).

Prawa kolumna — podgląd:
- Pasek: liczba zadań, suma punktów, czas (czerwienieje po przekroczeniu limitu), przełącznik Grupa A/B (przy 2 grupach), cofnij/ponów, **Dopasuj wysokość** (FR-26).
- Kliknięcie zadania na arkuszu zaznacza je i pokazuje pasek narzędzi pozycji: przenieś wyżej/niżej, **miejsce na rozwiązanie** (brak / kratka / linie / gładkie + suwak 0–250 mm z polem liczbowym), nowa strona przed zadaniem, **przypnij** (kłódka — losowanie go nie rusza), **wymień** (losuje jedno inne zadanie o tych samych kryteriach), usuń.
- Przy losowaniu: „Przelosuj wszystko" (nie rusza przypiętych).

#### Krok 3 — Akceptacja układu

Cała szerokość na arkusz: wszystkie strony pod sobą (przy 2 grupach najpierw A, potem B od nowej strony — FR-31), suwak powiększenia.
- Lewy wąski panel: **lista pozycji** (numer, początek treści, punkty) — przeciąganie zmienia kolejność (dnd-kit; z klawiatury strzałki).
- Prawy panel **Zaznaczone zadanie**: miejsce na rozwiązanie (styl + mm), nowa strona przed, przypięcie, dla grupy B: informacja „bliźniak" / „inna kolejność odpowiedzi".
- Pasek: Dopasuj wysokość, „Ustaw wszystkim … mm" (FR-25), cofnij/ponów, Grupa A/B, **Przelosuj warianty grup** (jedyne miejsce, gdzie zmienia się kolejność odpowiedzi — CLAUDE.md „A/B freeze").
- Ostrzeżenia nad arkuszem: zadanie wyższe niż strona, zadanie z 0 pkt, przekroczony czas.

#### Krok 4 — Generowanie klasówki

- Podsumowanie: nazwa, klasa, liczba grup, zadań, punktów, czas, liczba stron.
- Co wydrukować (pola wyboru, karty):
  1. **Klasówka z pytaniami** (domyślnie wł.)
  2. **Klucz odpowiedzi dla nauczyciela** (domyślnie wł.; osobne strony, FR-35/36)
  3. *Karta odpowiedzi dla ucznia* — później; na razie nie pokazujemy.
- Przyciski: **Drukuj / Zapisz jako PDF** (główny; okno druku przeglądarki), „Eksportuj do pliku .json" (FR-39), „Zakończ" (wraca do Moich klasówek).
- Krótka podpowiedź druku: Chrome, A4 pionowo, skala 100%, nagłówki i stopki wyłączone.

### 5.6 Moje klasówki (`/klasowki`)

- Nagłówek: h1 „Moje klasówki"; akcje: **Nowa klasówka** (główny), „Importuj z pliku" (FR-40).
- Pasek: wyszukiwarka po nazwie + filtry: Klasa, Dział, Zakres, Status (robocza / gotowa).
- Lista kart: nazwa, `#id · Matematyka · klasa · dział · liczba zadań · data zmiany`, chip „robocza". Kliknięcie otwiera kreator na ostatnim kroku.
- Akcje karty: **Edytuj**, **Duplikuj**, **Drukuj**, **Usuń** (FR-38).

### 5.7 Pomoc (`/pomoc`)

- Formularz „Napisz do autora": Rodzaj (Błąd / Pytanie / Pomysł), Temat, Opis (pole wielowierszowe), opcjonalnie „Dołącz informacje techniczne" (wersja aplikacji, przeglądarka). Przycisk główny **Wyślij**.
- Pod spodem krótkie „Najczęstsze problemy": druk w skali 100%, zapis do PDF, brak obrazków w zadaniu.

## 6. Urządzenia

| Funkcja | Laptop ≥ 1280 | Tablet 768–1279 | Telefon < 768 |
|---|---|---|---|
| Menu | boczne, stałe | zwinięte do ikon (64 px), rozwijane | górny pasek + wysuwane menu |
| Tablica, Baza zadań, Moje klasówki | 2 kolumny / lista | lista, filtry zawijają się | jedna kolumna, filtry w wysuwanym panelu |
| Akcje karty | po najechaniu | zawsze widoczne | zawsze widoczne (menu „⋯" gdy > 2) |
| Nowe zadanie | formularz + podgląd obok | formularz, podgląd pod spodem | formularz; podgląd na żądanie |
| Kreator, krok 2 | źródło + podgląd obok siebie, pełna edycja pozycji | zakładki „Zadania \| Arkusz"; edycja pozycji suwakiem i przyciskami (bez przeciągania) | **tylko wybór i losowanie**; pasek na dole „3 zadania · 12 pkt"; bez zmiany rozmiaru i kolejności |
| Kreator, krok 3 | arkusz + dwa panele | arkusz + panel wysuwany po zaznaczeniu | strony na szerokość ekranu; dotknięcie zadania otwiera dolny panel: wyżej/niżej, miejsce ± 5 mm |
| Druk | tak | tak | tak (z okna druku telefonu) |

Zasada: nic nie zależy wyłącznie od `:hover` ani od przeciągania — zawsze jest przycisk lub klawiatura.

## 7. Dostępność i teksty

- Prawdziwe `<button>`, `<a href>`, `<label for>`; ikony bez tekstu mają `aria-label` z nazwą obiektu („Usuń klasówkę Diagnoza 3b").
- Kolejność fokusu = kolejność wizualna; okna dialogowe zamykają fokus w sobie, Esc zamyka.
- Teksty krótkie, w formie osobowej, po polsku: przycisk mówi, co zrobi („Zapisz zadanie", nie „OK"). Błąd mówi, co się stało i co zrobić.
- Liczby z jednostką: „3 pkt", „45 min", „60 mm".

## 8. Otwarte decyzje (zapytać przed implementacją)

1. **Edytor treści zadań** (5.4): biblioteka edytora i sposób zapisu wzorów — nowa zależność.
2. **Zapis edycji zadań w banku**: nadpisanie wiersza czy osobna tabela zmian; co z `updated_at`; co z usuwaniem zadania użytego w zapisanej klasówce (PRD FR-48).
3. **Wysyłka z Pomocy**: link `mailto:` czy wysyłka przez serwer.
4. **„Twoje zadania" na Tablicy**: po czym rozpoznać zadania dodane/edytowane w Testaku.
