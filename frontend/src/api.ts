import type { Facets, Page, TaskDetail, TaskFilters, TaskList } from "./types";

// Adres API z frontend/.env (VITE_API_URL), bez końcowego slasha
export const API_URL = (
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://127.0.0.1:8000"
).replace(/\/$/, "");

export const IMAGES_URL = `${API_URL}/images/`;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Listy idą jako powtórzony parametr (difficulty=a&difficulty=b),
// puste wartości są pomijane — backend traktuje brak parametru jako brak filtra
export function buildQuery(
  params: Record<string, string | number | string[] | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    } else {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { signal });
  if (!res.ok) {
    throw new ApiError(res.status, `Błąd API ${res.status} (${path})`);
  }
  return (await res.json()) as T;
}

export function fetchTasks(
  filters: TaskFilters = {},
  page: Page = {},
  signal?: AbortSignal,
): Promise<TaskList> {
  return getJson(`/tasks/${buildQuery({ ...filters, ...page })}`, signal);
}

export function fetchFacets(
  filters: TaskFilters = {},
  signal?: AbortSignal,
): Promise<Facets> {
  return getJson(`/tasks/facets${buildQuery({ ...filters })}`, signal);
}

export function fetchTask(id: number, signal?: AbortSignal): Promise<TaskDetail> {
  return getJson(`/tasks/${id}`, signal);
}
