# Testak — agent instructions

Teacher web app: compose A4 math tests from a task bank, draw by criteria, A/B groups, print/PDF via browser.
Stack: FastAPI + SQLAlchemy + SQLite (`backend/`), React 19 + TS + Vite + Tailwind 4 (`frontend/`).
Specs: `PRD-Testak.md` (FR-x ids), `Testak-Zadania-per-faza.md` (checklist), `DESIGN.md` (UI). **Decisions below override the PRD.**

## Frontend / design
- Before ANY frontend work read the relevant part of `DESIGN.md`: section 2 (tokens), 4 (shell + components) and the screen you are touching in section 5 (`grep -n "### 5\." DESIGN.md`). It is the source of truth for look, layout and per-device behaviour.
- Colors, fonts, radii come only from the tokens in `DESIGN.md` 2 (Tailwind `@theme` in `frontend/src/index.css`); no hard-coded hex values in components.
- If a task needs UI that `DESIGN.md` does not describe, or it conflicts with the PRD, stop and ask; after I decide, update `DESIGN.md` in the same change.
- Logo: `frontend/public/favicon.svg` (mark), `frontend/public/logo.svg` (mark + wordmark).

## Language
Talk to me in Polish. Code identifiers, commits, this file: English. UI strings and code comments: Polish.

## Workflow (human in the loop)
1. One checklist item (or a tight group) at a time. Never start the next phase on your own. Work on a branch per phase.
2. Plan first, <=8 lines: files, approach, risks. Wait for my "ok" before editing. Skip the plan only for trivial edits (one file, <10 lines).
3. Stop and ask on: ambiguity, any decision not listed here, new dependency, schema change, file deletion.
4. After implementing run the checks (below), then report in <=10 lines: what changed, how I verify it manually, and a "Learn" note (<=3 lines, the one concept worth understanding in this change). Longer explanations only when I ask.
5. Tick the checklist item only after checks pass and I confirm. Do not commit — propose a commit message.
6. At the end of each phase ask me that phase's "Pytanie kontrolne" (PRD sec. 11), one question, and give brief feedback.

## Commands (cwd matters)
- API: `cd backend && uvicorn main:app --reload` — imports are flat (`from database import ...`); never run from repo root.
- Backend tests: `cd backend && pytest -q`
- Web: `cd frontend && npm run dev`; checks: `npm run lint && npm run build`; unit tests: `npm test` (Vitest, add when first needed).
- `noUnusedLocals` is on: an unused variable fails the build.
- Phase 0 adds to `requirements.txt`: pytest, httpx, alembic.

## Hard rules
- `backend/tasks.db` is the only copy of the bank and is gitignored. Bank tables (`tasks`, `answers`, `images`, `task_images`) may be written (INSERT/UPDATE/DELETE of rows) ONLY through the app's task-edit API endpoints (decided 2026-11-12, PRD FR-48: every task is editable). Still forbidden: ALTER / `create_all` / Alembic on bank tables, and any write from scripts, migrations or ad-hoc SQL. Tests that write must use a temporary copy or in-memory DB, never `tasks.db`.
- Before the first write endpoint runs against `tasks.db`, ask me to confirm a fresh backup of the file. The open points in FR-48 (in-place vs. separate table, `updated_at`, deleting tasks used in saved tests, twins) are still "stop and ask".
- DB path must be absolute (`Path(__file__)`), never `./tasks.db` (wrong cwd silently creates an empty DB).
- Never read: `frontend/package-lock.json`, `node_modules/`, `*.db`, `__pycache__/`. Never dump BLOBs or `content_html` of many rows; use LIMIT / `length()`.
- No new dependency without asking. Pre-approved: alembic, pytest, httpx, dompurify, @dnd-kit/*, vitest.

## Decisions
- **Single user, no login** (confirmed 2026-11-12). The login screen in `DESIGN.md` 5.1 is a placeholder for later; do not build it.
- **Twin tasks** (rows referenced by another row's `twin_task_id`) are never in the draw pool. With `group_count=2` they become group B content. GATE: before any twin/draw work, run a query checking whether `twin_task_id` is symmetric (A->B and B->A), report the result, and if symmetric ask me which side is the "original".
- **Twin original (GATE resolved 2026-11-10):** `twin_task_id` is fully symmetric (2191 pairs). The lower `id` is the original; the higher-`id` side is hidden from `GET /tasks`, facets and draws (`is_original()` in `backend/main.py`) and activates only as group B content.
- **Blank difficulty/scope** (NULL or "") matches every filter (FR-7/7a) — in draws, `GET /tasks` and facet counts. So count(łatwe) = łatwe + blank; counts don't sum to total (by design).
- **Blank class_level** (NULL) also matches every class filter, same as difficulty/scope (decided 2026-11-11; 1 such task today). A bank-editing feature to fill in missing fields comes later.
- **Facets** take the same filters as `GET /tasks` (`TaskFilters`). Each facet is counted with all OTHER filters applied (its own is skipped); the value list depends on `class_level` only, so values stay listed with count 0. Response has `total` (current filters) and `bank_total` (no filters). Topic list is per class.
- **`GET /tasks/{id}`** returns hidden twins too (group B needs them by id). Legacy `GET /answers/{id}` stays until the frontend is switched to `/tasks/{id}`, then propose removal.
- **Search (FR-2):** SQLite LIKE/lower() are ASCII-only. Register a Python casefold function on the engine `connect` event (`create_function`), compare against the casefolded query, escape `%` `_`. Check it stays <300 ms.
- **Search semantics:** `q` is one phrase matched as a substring (trimmed, max 200 chars), not split into words. It lives in `TaskFilters`, so facets follow it.
- **Image cache:** `ETag` from `id`+`file_size`+`created_at` (no BLOB read), `Cache-Control: private, max-age=86400`, 304 on matching `If-None-Match`.
- **`is_valid` is exposed** by the API (single-user teacher app); one answer schema. Sheet components must never render it; the answer key is a separate view. Revisit if the app is ever hosted for others.
- **HTML pipeline order:** replace `image://` -> `/images/` FIRST, then DOMPurify (it drops unknown URI schemes). Applies to tasks AND answers.
- **A/B freeze:** answer order and twin assignment are generated when an item is created / groups are enabled, stored in reducer state (undo covers it) and persisted as-is (`answer_order_a/b`). Never re-randomize on render, print or save; only the explicit "reshuffle groups" action does.
- **State shape (Phase 2)** already has the group fields: `group_count`, `group_b_task_id`, `answer_order_a/b`, `locked`, `workspace_mm`, `workspace_style`, `page_break_before`. Every user-visible change is a reducer action (undo/redo).
- **Alembic:** single `Base`; `env.py` uses `include_object` to skip bank tables; `render_as_batch=True` (SQLite). Never autogenerate against bank tables.
- **Pagination:** pure function (items + measured heights + page height + group boundary -> pages) in its own module, unit-tested with Vitest. Forced page break before group B (FR-31).
- **Print spike** at the start of Phase 3: one A4 page with a 50 mm grid box, print from Chrome (default margins, headers/footers off), measure with a ruler (target ±1 mm).

## Fit workspace button (FR-26, now Must, Phase 3)
Per page: free = content height − sum of task heights (incl. closed tasks' workspace). Split free equally among OPEN tasks on that page; floor to whole mm, clamp 0–250. Closed tasks keep their value. Applies to the last page too. Never changes page breaks. With 2 groups use the smaller result of A and B per item (one shared `workspace_mm`). One undo step.

## Token discipline
- Don't read the PRD or task list in full: `grep -n "FR-31" PRD-Testak.md`, then read ~30 lines around it. Read only the current phase of the task list.
- Prefer grep/glob and line ranges over whole-file reads; don't re-read files you just wrote.
- Short replies: don't restate the task, don't summarize unchanged files, don't paste code the diff already shows.
- Truncate noisy output (`| tail -30`, `pytest -q`); `git diff --stat` before a full diff.
- Boilerplate (schemas, CRUD, config): just do it. Core logic (reducer+undo, paginate, draw_tasks, matches_filter): plan, implement, "Learn" note.
- Suggest `/clear` between unrelated checklist items.
