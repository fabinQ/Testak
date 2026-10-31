# Testak — agent instructions

Teacher web app: compose A4 math tests from a task bank, draw by criteria, A/B groups, print/PDF via browser.
Stack: FastAPI + SQLAlchemy + SQLite (`backend/`), React 19 + TS + Vite + Tailwind 4 (`frontend/`).
Specs: `PRD-Testak.md` (FR-x ids), `Testak-Zadania-per-faza.md` (checklist). **Decisions below override the PRD.**

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
- `backend/tasks.db` is the only copy of the bank and is gitignored. Bank tables (`tasks`, `answers`, `images`, `task_images`) are READ-ONLY: no INSERT/UPDATE/DELETE/ALTER, no `create_all` on them. Before Phase 0 ask me to confirm a backup of the file exists.
- DB path must be absolute (`Path(__file__)`), never `./tasks.db` (wrong cwd silently creates an empty DB).
- Never read: `frontend/package-lock.json`, `node_modules/`, `*.db`, `__pycache__/`. Never dump BLOBs or `content_html` of many rows; use LIMIT / `length()`.
- No new dependency without asking. Pre-approved: alembic, pytest, httpx, dompurify, @dnd-kit/*, vitest.

## Decisions
- **Twin tasks** (rows referenced by another row's `twin_task_id`) are never in the draw pool. With `group_count=2` they become group B content. GATE: before any twin/draw work, run a query checking whether `twin_task_id` is symmetric (A->B and B->A), report the result, and if symmetric ask me which side is the "original".
- **Blank difficulty/scope** (NULL or "") matches every filter (FR-7/7a) — in draws, `GET /tasks` and facet counts. So count(łatwe) = łatwe + blank; counts don't sum to total (by design).
- **Facets** take `class_level`; topic list is per class.
- **Search (FR-2):** SQLite LIKE/lower() are ASCII-only. Register a Python casefold function on the engine `connect` event (`create_function`), compare against the casefolded query, escape `%` `_`. Check it stays <300 ms.
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
