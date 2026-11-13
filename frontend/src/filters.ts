import type { FacetValue, Facets, TaskFilters } from "./types";

// Stan filtrów Bazy zadań. Pola jednokrotnego wyboru: "" = dowolna wartość.
export interface BankFilters {
  class_level: string;
  topic: string[];
  task_type: string;
  scope: string[];
  difficulty: string[];
  source: string;
}

export type FilterKey = keyof BankFilters;

export const EMPTY_FILTERS: BankFilters = {
  class_level: "",
  topic: [],
  task_type: "",
  scope: [],
  difficulty: [],
  source: "",
};

// Kolejność na pasku wg DESIGN.md 5.3
export const FILTER_DEFS: { key: FilterKey; label: string; multiple: boolean }[] = [
  { key: "class_level", label: "Klasa", multiple: false },
  { key: "topic", label: "Dział", multiple: true },
  { key: "task_type", label: "Typ", multiple: false },
  { key: "scope", label: "Zakres", multiple: true },
  { key: "difficulty", label: "Trudność", multiple: true },
  { key: "source", label: "Źródło", multiple: false },
];

export function selectedValues(filters: BankFilters, key: FilterKey): string[] {
  const value = filters[key];
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export function setFilter(
  filters: BankFilters,
  key: FilterKey,
  values: string[],
): BankFilters {
  const next = {
    ...filters,
    [key]: Array.isArray(filters[key]) ? values : (values[0] ?? ""),
  } as BankFilters;
  // Lista działów zależy od klasy — po zmianie klasy stare zaznaczenie nie ma sensu
  if (key === "class_level") next.topic = [];
  return next;
}

export function hasAnyFilter(filters: BankFilters, q: string): boolean {
  return (
    q.trim() !== "" || FILTER_DEFS.some((def) => selectedValues(filters, def.key).length > 0)
  );
}

export function toApiFilters(filters: BankFilters, q: string): TaskFilters {
  return {
    class_level: filters.class_level ? Number(filters.class_level) : undefined,
    topic: filters.topic,
    task_type: filters.task_type || undefined,
    scope: filters.scope,
    difficulty: filters.difficulty,
    source: filters.source || undefined,
    q: q.trim() || undefined,
  };
}

const DIFFICULTY_ORDER = ["łatwe", "średnie", "trudne"];
const collator = new Intl.Collator("pl", { numeric: true });

// Trudność rosnąco (łatwe → trudne), reszta alfabetycznie po polsku
export function orderFacetValues(key: FilterKey, values: FacetValue[]): FacetValue[] {
  const sorted = [...values].sort((a, b) => collator.compare(a.value, b.value));
  if (key !== "difficulty") return sorted;
  const rank = (value: string) => {
    const index = DIFFICULTY_ORDER.indexOf(value);
    return index === -1 ? DIFFICULTY_ORDER.length : index;
  };
  return sorted.sort((a, b) => rank(a.value) - rank(b.value));
}

export function facetOptions(facets: Facets | undefined, key: FilterKey): FacetValue[] {
  return facets ? orderFacetValues(key, facets[key]) : [];
}

export function valueLabel(key: FilterKey, value: string): string {
  return key === "class_level" ? `klasa ${value}` : value;
}
