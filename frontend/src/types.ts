// Typy zgodne ze schematami API (backend/schemas.py)

export interface Task {
  id: number;
  external_id: number;
  subject: string;
  class_level: number | null;
  difficulty: string | null;
  task_type: string;
  scope: string | null;
  topic: string | null;
  points: number | null;
  time_minutes: number | null;
  source: string | null;
  content_html: string;
  content_text: string | null;
  twin_task_id: number | null;
}

export interface Answer {
  id: number;
  task_id: number;
  answer_label: string | null;
  content_html: string;
  content_text: string | null;
  // Uwaga: komponenty arkusza nie mogą tego renderować (klucz to osobny widok)
  is_valid: boolean;
  display_order: number;
}

export interface TaskDetail extends Task {
  answers: Answer[];
}

export interface TaskList {
  items: Task[];
  // Liczba zadań pasujących do filtrów, przed limit/offset
  total: number;
}

export interface FacetValue {
  value: string;
  count: number;
}

export interface Facets {
  // Zadania pasujące do aktualnych filtrów
  total: number;
  // Wszystkie zadania w banku, bez filtrów
  bank_total: number;
  difficulty: FacetValue[];
  scope: FacetValue[];
  topic: FacetValue[];
  task_type: FacetValue[];
  source: FacetValue[];
}

// Filtry wspólne dla listy zadań i liczników
export interface TaskFilters {
  class_level?: number;
  difficulty?: string[];
  scope?: string[];
  topic?: string[];
  task_type?: string;
  source?: string;
  q?: string;
}

export interface Page {
  limit?: number;
  offset?: number;
}
