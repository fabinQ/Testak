import { useMemo } from "react";
import { prepareHtml } from "../prepareHtml";
import type { Task } from "../types";

function Chip({ children, title }: { children: string; title?: string }) {
  return (
    <span
      className="max-w-[260px] truncate rounded-chip border border-line-strong px-2 py-[2px] text-[12.5px] font-medium text-ink-muted"
      title={title}
    >
      {children}
    </span>
  );
}

// Puste pole metadanych: chip ostrzegawczy z nazwą pola (stan nie tylko kolorem)
function MissingChip({ field }: { field: string }) {
  return (
    <span className="rounded-chip border border-warn-ink/30 bg-warn-bg px-2 py-[2px] text-[12.5px] font-medium text-warn-ink">
      {field}: brak
    </span>
  );
}

function MetaChip({
  field,
  value,
  mono = false,
}: {
  field: string;
  value: string | null;
  mono?: boolean;
}) {
  if (value === null || value === "") return <MissingChip field={field} />;
  if (mono) {
    return (
      <span className="rounded-chip border border-line-strong px-2 py-[2px] font-mono text-[13px] text-ink-muted">
        {value}
      </span>
    );
  }
  return <Chip title={value}>{value}</Chip>;
}

const withUnit = (value: number | null, unit: string) =>
  value === null ? null : `${value} ${unit}`;

export function TaskCard({ task }: { task: Task }) {
  // Sanityzacja jest kosztowna — raz na treść, nie przy każdym renderze listy
  const html = useMemo(() => prepareHtml(task.content_html), [task.content_html]);

  return (
    <article
      className="rounded-card border border-line bg-surface px-5 py-[18px]"
      aria-label={`Zadanie ${task.id}`}
    >
      {/* Kolejność chipów wg DESIGN.md 4.2 */}
      <div className="mb-3 flex flex-wrap items-center gap-[6px]">
        <span className="mr-1 font-mono text-[13px] text-ink-muted">#{task.id}</span>
        <MetaChip
          field="klasa"
          value={task.class_level === null ? null : `klasa ${task.class_level}`}
        />
        <MetaChip field="dział" value={task.topic} />
        <MetaChip field="typ" value={task.task_type} />
        <MetaChip field="zakres" value={task.scope} />
        <MetaChip field="trudność" value={task.difficulty} />
        <MetaChip field="punkty" value={withUnit(task.points, "pkt")} mono />
        <MetaChip field="czas" value={withUnit(task.time_minutes, "min")} mono />
      </div>
      <div className="task-content" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
