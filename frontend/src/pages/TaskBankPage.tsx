import { useState } from "react";
import { Search, X } from "lucide-react";
import { facetsPath, tasksPath } from "../api";
import { FilterMenu } from "../components/FilterMenu";
import { TaskCard } from "../components/TaskCard";
import {
  EMPTY_FILTERS,
  FILTER_DEFS,
  facetOptions,
  hasAnyFilter,
  selectedValues,
  setFilter,
  toApiFilters,
  valueLabel,
  type BankFilters,
  type FilterKey,
} from "../filters";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useRequest } from "../hooks/useRequest";
import type { Facets, TaskList } from "../types";

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

const secondaryButton =
  "h-11 rounded-control border border-board bg-surface px-4 text-[15px] font-semibold text-board hover:bg-bg disabled:cursor-not-allowed disabled:border-line disabled:text-ink-muted";
const textButton =
  "min-h-11 rounded-control px-2 text-[14px] font-medium text-link hover:text-link-hover";

// Baza zadań (DESIGN.md 5.3): wyszukiwarka, filtry z licznikami, lista kart, paginacja.
export function TaskBankPage() {
  const [filters, setFilters] = useState<BankFilters>(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DELAY_MS);

  const apiFilters = toApiFilters(filters, debouncedSearch);
  const tasks = useRequest<TaskList>(
    tasksPath(apiFilters, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
  );
  const facets = useRequest<Facets>(facetsPath(apiFilters));

  // Każda zmiana kryteriów wraca na pierwszą stronę
  const changeFilter = (key: FilterKey, values: string[]) => {
    setFilters((current) => setFilter(current, key, values));
    setPage(0);
  };
  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };
  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setSearch("");
    setPage(0);
  };
  const goToPage = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0 });
  };

  const total = tasks.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = tasks.data?.items ?? [];
  const anyFilter = hasAnyFilter(filters, search);
  const firstLoad = tasks.loading && tasks.data === undefined;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="font-display text-[32px] leading-tight font-bold tracking-[-0.02em]">
          Baza zadań
        </h1>
        <p className="text-[13px] font-medium text-ink-muted" aria-live="polite">
          {facets.data ? (
            <>
              <span className="font-mono">{facets.data.total}</span> z{" "}
              <span className="font-mono">{facets.data.bank_total}</span> zadań
            </>
          ) : (
            " "
          )}
        </p>
      </header>

      <section aria-label="Wyszukiwanie i filtry" className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full md:w-[320px]">
            <label htmlFor="szukaj-zadania" className="sr-only">
              Szukaj w treści zadań
            </label>
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted"
            />
            <input
              id="szukaj-zadania"
              type="search"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Szukaj w treści zadań"
              maxLength={200}
              autoComplete="off"
              className="h-11 w-full rounded-control border border-line bg-surface pr-3 pl-10 text-[15px] placeholder:text-ink-muted focus:border-link"
            />
          </div>
          {FILTER_DEFS.map((def) => (
            <FilterMenu
              key={def.key}
              label={def.label}
              multiple={def.multiple}
              options={facetOptions(facets.data, def.key)}
              selected={selectedValues(filters, def.key)}
              formatValue={(value) => valueLabel(def.key, value)}
              onChange={(values) => changeFilter(def.key, values)}
            />
          ))}
        </div>

        {anyFilter && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {FILTER_DEFS.flatMap((def) =>
              selectedValues(filters, def.key).map((value) => {
                const text = `${def.label}: ${valueLabel(def.key, value)}`;
                return (
                  <button
                    key={`${def.key}:${value}`}
                    type="button"
                    className="flex min-h-8 max-w-full items-center gap-1 rounded-chip border border-line-strong bg-surface py-1 pr-1 pl-2 text-[12.5px] font-medium hover:border-board"
                    aria-label={`Usuń filtr ${text}`}
                    title={text}
                    onClick={() =>
                      changeFilter(
                        def.key,
                        selectedValues(filters, def.key).filter((item) => item !== value),
                      )
                    }
                  >
                    <span className="truncate">{text}</span>
                    <X size={14} aria-hidden="true" className="shrink-0 text-ink-muted" />
                  </button>
                );
              }),
            )}
            <button type="button" className={textButton} onClick={clearAll}>
              Wyczyść filtry
            </button>
          </div>
        )}
      </section>

      {tasks.error && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger-bg px-5 py-4 text-danger"
        >
          <p>
            <strong className="font-semibold">Nie udało się pobrać zadań.</strong> Sprawdź,
            czy serwer API jest uruchomiony, i spróbuj ponownie.
          </p>
          <button
            type="button"
            className="h-11 rounded-control border border-danger bg-surface px-4 font-semibold text-danger"
            onClick={() => {
              tasks.retry();
              facets.retry();
            }}
          >
            Spróbuj ponownie
          </button>
        </div>
      )}

      {firstLoad && <p className="py-10 text-center text-ink-muted">Ładowanie zadań…</p>}

      {!firstLoad && !tasks.error && items.length === 0 && (
        <div className="rounded-card border border-line bg-surface px-5 py-10 text-center">
          <p className="mb-3">Żadne zadanie nie pasuje do tych kryteriów.</p>
          {anyFilter && (
            <button type="button" className={secondaryButton} onClick={clearAll}>
              Wyczyść filtry
            </button>
          )}
        </div>
      )}

      {items.length > 0 && (
        <>
          <p className="sr-only" role="status">
            {tasks.loading ? "Ładowanie zadań…" : `Wczytano ${items.length} zadań`}
          </p>
          <ul
            className={`flex flex-col gap-3 transition-opacity duration-150 ${tasks.loading ? "opacity-50" : ""}`}
            aria-busy={tasks.loading}
          >
            {items.map((task) => (
              <li key={task.id}>
                <TaskCard task={task} />
              </li>
            ))}
          </ul>

          <nav
            aria-label="Strony listy zadań"
            className="mt-6 flex flex-wrap items-center justify-between gap-3"
          >
            <button
              type="button"
              className={secondaryButton}
              disabled={page === 0}
              onClick={() => goToPage(page - 1)}
            >
              Poprzednia
            </button>
            <p className="text-[13px] font-medium text-ink-muted">
              Strona <span className="font-mono">{page + 1}</span> z{" "}
              <span className="font-mono">{pageCount}</span>
            </p>
            <button
              type="button"
              className={secondaryButton}
              disabled={page + 1 >= pageCount}
              onClick={() => goToPage(page + 1)}
            >
              Następna
            </button>
          </nav>
        </>
      )}
    </>
  );
}
