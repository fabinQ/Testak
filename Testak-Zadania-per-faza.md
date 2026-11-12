# Testak — Zadania per faza

Plan wykonawczy do PRD v1.1 (zasady pracy agenta: `CLAUDE.md`). Każde zadanie to osobna, w miarę samodzielna porcja pracy — checklist do odhaczania w trakcie kodowania. Numery w nawiasach (FR-X) odsyłają do pełnego uzasadnienia i kryteriów akceptacji w PRD.

## Faza 0 — Porządki

- [x] Kopia `backend/tasks.db` poza repo (baza jest w `.gitignore` — to jedyna kopia banku)
- [x] `database.py`: absolutna ścieżka do bazy (`Path(__file__)`) zamiast `./tasks.db`
- [x] `requirements.txt`: dopisz `pytest`, `httpx`, `alembic`
- [x] Usuń z katalogu głównego `package.json`, `package-lock.json` i `node_modules` (zaślepka po `npm install node.js`)
- [x] Dodaj `VITE_API_URL` do `frontend/.env` i `frontend/.env.example`
- [x] Zamień sztywne `http://127.0.0.1:8000` w `App.tsx` na `import.meta.env.VITE_API_URL`
- [x] Popraw `get_session`: `db = SessionMaker()` przed `try`, zmień nazwę zmiennej `Session` → `db` (cieniuje import)
- [x] Usuń `autoincrement=True` z `twin_task_id` w `models.py`
- [x] Dodaj do `Task` w `models.py`: `external_id` (z `index=True` — w realnej bazie ma indeks `idx_tasks_external_id`), `date_created`, `updated_at` (reszta pól zgodnie z PRD 5.2)
- [x] Dodaj model `Answer` (`id`, `task_id` FK, `answer_label`, `content_html`, `content_text`, `is_valid`, `display_order`) + `relationship` do `Task`
- [x] Dodaj model `TaskImage` (`task_id`, `image_id`, `context`, PK złożony) + `relationship`
- [x] Zdecyduj i wdróż: `@tailwindcss/typography` czy własna klasa `.task-content` w CSS

## Faza 1 — Bank z filtrami

**Backend**
- [x] `GET /tasks`: parametry `Query` dla `class_level`, `difficulty: list[str]`, `scope: list[str]`, `topic: list[str]`, `task_type`, `source`, plus `limit`/`offset`
- [x] Zastosuj regułę „puste pole = zawsze pasuje" (FR-7/FR-7a) w WHERE dla `difficulty` i `scope`
- [x] Dodaj `response_model` (schematy Pydantic: `TaskOut`, `TaskListOut` z `items`+`total`)
- [x] `GET /tasks/facets` — zadeklaruj PRZED `GET /tasks/{id}`; przyjmuje `class_level`; zwraca wartości z licznikami (zadania z pustym `difficulty`/`scope` liczone w każdym koszyku — suma > liczba zadań jest zamierzona; tematy per klasa)
- [x] `GET /tasks/{id}` — zadanie + `answers` (z `is_valid`, jeden schemat `AnswerOut`)
- [x] `GET /images/{filename}`: nagłówek `ETag` / cache
- [x] Wyszukiwanie tekstowe `q` po `content_text`: własna funkcja casefold zarejestrowana w silniku (zdarzenie `connect`, `create_function`) — `LIKE`/`lower()` w SQLite nie rozumieją polskich znaków; escapowanie `%` i `_`; pomiar < 300 ms

**Frontend**
- [ ] Komponent panelu filtrów (multi-select dla `difficulty`, `scope`, `topic`)
- [ ] Pole wyszukiwania z debounce (np. 300 ms)
- [ ] Stany `loading`/`error` + `AbortController` przy zmianie filtrów w trakcie trwającego fetcha
- [ ] Wydzielenie wywołań API do `src/api.ts`
- [ ] Liczniki przy filtrach z `/tasks/facets` (FR-3)
- [ ] Skonfiguruj Vitest (`npm test`)
- [ ] Funkcja `prepareHtml()`: najpierw `image://` → `/images/`, potem DOMPurify (treść zadania i odpowiedzi) + test tej kolejności
- [ ] Podgląd zadania zamkniętego z listą odpowiedzi (FR-4)

## Faza 2 — Kompozycja, podgląd A4 i undo

**Stan i historia**
- [ ] Zaprojektuj kształt stanu testu (lista `test_items` w pamięci: `task_id`, `position`, `workspace_mm`, `workspace_style`, `locked`, `page_break_before` + pola grup od razu: `group_count`, `group_b_task_id`, `answer_order_a/b`)
- [ ] `useReducer` + `Context` dla stanu testu (akcje: dodaj/usuń/przesuń/zmień miejsce robocze/przypnij) — każda zmiana widoczna dla użytkownika to osobna akcja (undo/redo obejmie też przyszłe przelosowanie i warianty grup)
- [ ] Stos historii (`past`/`present`/`future`) owinięty wokół reducera (D7) + skróty Ctrl+Z / Ctrl+Y

**Kompozycja**
- [ ] Komponent `TaskBank` (lista z banku, dodawanie do testu)
- [ ] Przeciąganie kolejności (`@dnd-kit`, z obsługą klawiatury)
- [ ] Pole nagłówka arkusza: tytuł, klasa, data, „Imię i nazwisko", „Grupa" (FR-14)
- [ ] Podsumowanie testu na żywo (FR-16): suma punktów (adnotacja o zadaniach z `points = 0`) i szacowany czas — czysta funkcja `summarize()` + test

**Podgląd A4**
- [ ] Komponenty `SheetPreview`/`SheetPage` w jednostkach mm (210×297)
- [ ] Style `@media print` + `@page` (marginesy, skala 100%)

## Faza 3 — Miejsce robocze i paginacja

- [ ] Spike druku (na początku fazy): strona A4 z polem 50 mm, wydruk z Chrome (marginesy domyślne, nagłówki/stopki wyłączone), pomiar linijką — cel ±1 mm
- [ ] Kontrolka miejsca roboczego: suwak (`<input type="range">`, 0–250 mm) + pole liczbowe
- [ ] Domyślny styl „kratka" (CSS, siatka ~5 mm) + warianty „puste"/„linie"
- [ ] Przeliczanie mm ↔ px do podglądu na ekranie
- [ ] Pomiar wysokości zadań (`ResizeObserver`)
- [ ] Algorytm podziału na strony jako czysta funkcja `paginate()` (wysokości → strony; `break-inside: avoid` dla pary zadanie + miejsce robocze; parametr granicy grup A/B) + testy Vitest ; ostrzeżenie dla zadania wyższego niż strona (FR-29)
- [ ] Numer strony „x / y" (numeracja od 1 osobno dla każdej grupy) i stopka ze `source` jako opcja w ustawieniach arkusza, domyślnie wyłączona (FR-32)
- [ ] Wymuszony podział strony na granicy grupa A / grupa B (FR-31) — niezależnie od wypełnienia strony
- [ ] Ręczne „wymuś nową stronę" per zadanie
- [ ] Domyślne wartości miejsca roboczego wg `task_type` + akcja „ustaw wszystkim X mm" (FR-25)
- [ ] Przycisk „Dopasuj wysokość" (FR-26): czysta funkcja `fitWorkspace()` — per strona wolne miejsce dzielone po równo między zadania otwarte, zamknięte bez zmian, zaokrąglenie w dół do mm, 0–250, nie zmienia podziałów stron; przy 2 grupach mniejszy wynik z A i B; jedna akcja = jeden krok undo; testy Vitest

## Faza 4 — Losowanie

**Backend**
- [ ] Funkcja `matches_filter(value, wanted)` (FR-6/FR-7/FR-7a) — współdzielona dla `difficulty` i `scope`
- [ ] Czysta funkcja `draw_tasks(class_level, rules, exclude_task_ids, seed)` → wynik + ostrzeżenia o niedoborze (FR-8)
- [ ] BRAMKA: zapytanie sprawdzające symetrię `twin_task_id` (X→Y i Y→X) — zraportuj wynik; jeśli symetryczny, ustal z właścicielem, która strona jest „oryginałem"
- [ ] Wyklucz bliźniaki z puli kandydatów (FR-5a) + test
- [ ] Limity globalne (FR-10): suma punktów (± tolerancja, zadania z `points = 0` oznaczone), maksymalny czas, maks. N zadań z jednego `topic` — losowanie z odrzucaniem (do N prób, powtarzalne przy `seed`); gdy się nie da — najbliższy wynik + ostrzeżenie; testy
- [ ] Sortowanie reguł od najbardziej restrykcyjnej przed losowaniem
- [ ] `POST /draws` (bez zapisu do bazy)
- [ ] Testy `pytest`: dopasowanie trudności/zakresu z pustą wartością, niedobór kandydatów, powtarzalność przy tym samym `seed` ; bliźniak nigdy nie trafia do wyniku

**Frontend**
- [ ] Kreator reguł (dynamiczna lista: typ, trudność, zakres, temat, liczba)
- [ ] Obsługa ostrzeżenia o niedoborze („weź 4" / „zmień kryteria")
- [ ] Pola limitów globalnych w kreatorze reguł (FR-10)
- [ ] Przycisk „Przelosuj" (pojedyncze zadanie) i „Przelosuj wszystko" (z poszanowaniem przypiętych)
- [ ] Przypinanie zadań (checkbox/ikona) w widoku kompozycji

## Faza 5 — Zapis testów (baza + plik)

**Backend**
- [ ] Modele `Test` (`title`, `subject`, `class_level`, `group_count`, `settings` JSON) i `TestItem` (`task_id`, `group_b_task_id`, `position`, `workspace_mm`, `workspace_style`, `answer_order_a/b` JSON, `locked`)
- [ ] Konfiguracja Alembic + pierwsza migracja: jedna `Base`, `env.py` z `include_object` pomijającym tabele banku, `render_as_batch=True` (SQLite)
- [ ] `POST /tests`, `GET /tests`, `GET /tests/{id}`, `PUT /tests/{id}`, `DELETE /tests/{id}`
- [ ] `POST /tests/{id}/duplicate`
- [ ] `GET /tests/{id}/export` (ten sam payload co GET, z nagłówkiem do pobrania pliku)
- [ ] `POST /tests/import` + walidacja, że `task_id` wciąż istnieją w banku

**Frontend**
- [ ] Lista zapisanych testów (tytuł, data, akcje: otwórz/duplikuj/usuń)
- [ ] Wykluczanie zadań użytych we wskazanych wcześniejszych testach (FR-11): wybór testów w kreatorze → ich `task_id` i `group_b_task_id` jako `exclude_task_ids` w `POST /draws`
- [ ] Autozapis stanu testu do bazy (debounce ~1 s)
- [ ] Przycisk „Eksportuj do pliku" / „Importuj z pliku"

## Faza 6 — Grupy A/B i klucz odpowiedzi

- [ ] Wybór liczby grup 1/2 w nagłówku testu (FR-15) — włączenie generuje warianty B dla istniejących pozycji
- [ ] Logika przydziału grupy B per zadanie: bliźniak → `group_b_task_id`; otwarte bez bliźniaka → bez zmian; zamknięte bez bliźniaka → losowa kolejność odpowiedzi
- [ ] Niezależne losowanie kolejności odpowiedzi (A/B/C/D) dla grupy A i grupy B (FR-18)
- [ ] Wygeneruj i zamroź warianty przy tworzeniu pozycji / włączeniu 2 grup: trzymane w stanie reducera (undo je obejmuje), zapisywane bez zmian do `answer_order_a`/`answer_order_b` (D8) + akcja „przelosuj warianty grup"
- [ ] Przełącznik podglądu „Grupa A" / „Grupa B" w kompozycji
- [ ] Podsumowanie (FR-16) osobno dla grupy A i B (bliźniak może mieć inne punkty/czas)
- [ ] Wymuszony podział strony między grupami w wydruku (powiązanie z Fazą 3)
- [ ] `GET /tests/{id}/answer-key`: dla każdego zamkniętego zadania i każdej grupy — litera poprawnej odpowiedzi (pozycja `is_valid=1` w zamrożonej kolejności → litera)
- [ ] Widok/wydruk klucza odpowiedzi (osobny od arkusza ucznia, FR-36)

## Faza 7 — Rozszerzenia (backlog, nie zaczynaj przed MVP)

- [ ] FR-47 — mały formularz do uzupełniania metadanych niekompletnych zadań (`PATCH /tasks/{id}`, tylko pola taksonomii)
- [ ] FR-42 — PDF z serwera (WeasyPrint/Playwright)
- [ ] FR-43 — więcej niż 2 grupy
- [ ] FR-44 — inne przedmioty niż matematyka
