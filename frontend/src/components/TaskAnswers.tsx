import { useMemo } from "react";
import { Check } from "lucide-react";
import { prepareHtml } from "../prepareHtml";
import type { Answer, TaskDetail } from "../types";

function AnswerHtml({ html }: { html: string }) {
  // Ta sama ścieżka co treść zadania: podmiana image://, potem sanityzacja.
  // Część odpowiedzi to same obrazki.
  const safe = useMemo(() => prepareHtml(html), [html]);
  return <div className="task-content min-w-0" dangerouslySetInnerHTML={{ __html: safe }} />;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function ClosedAnswers({ answers }: { answers: Answer[] }) {
  return (
    <ol className="mt-4 grid gap-x-6 gap-y-2 border-t border-line pt-4 md:grid-cols-2">
      {answers.map((answer, index) => {
        const letter = answer.answer_label ?? LETTERS[index] ?? String(index + 1);
        return (
          <li key={answer.id} className="flex items-baseline gap-2">
            <span className="font-task text-[17px] font-bold">{letter}.</span>
            <AnswerHtml html={answer.content_html} />
            {/* WIDOK NAUCZYCIELA: poprawna odpowiedź oznaczona znakiem i słowem
                (nie samym kolorem). Komponenty arkusza nie mogą tego pokazywać. */}
            {answer.is_valid && (
              <span className="flex shrink-0 items-center gap-1 self-center rounded-chip border border-link px-[6px] py-[1px] text-[12.5px] font-medium text-link">
                <Check size={13} aria-hidden="true" />
                poprawna
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function OpenAnswer({ answers }: { answers: Answer[] }) {
  return (
    <details className="group mt-4 border-t border-line pt-2">
      <summary className="flex min-h-11 cursor-pointer items-center rounded-control text-[14px] font-medium text-link hover:text-link-hover">
        <span className="group-open:hidden">Pokaż odpowiedź</span>
        <span className="hidden group-open:inline">Ukryj odpowiedź</span>
      </summary>
      <div className="flex flex-col gap-2 pb-1">
        {answers.map((answer) => (
          <AnswerHtml key={answer.id} html={answer.content_html} />
        ))}
      </div>
    </details>
  );
}

// Odpowiedzi na karcie w Bazie zadań (DESIGN.md 5.3, FR-4):
// zamknięte — lista A–D z oznaczoną poprawną; otwarte — rozwijana „Odpowiedź".
export function TaskAnswers({ task }: { task: TaskDetail }) {
  const closed = task.task_type === "zamknięte";

  if (task.answers.length === 0) {
    if (!closed) return null;
    return (
      <p className="mt-4 border-t border-line pt-3 text-[13px] font-medium text-warn-ink">
        <span className="rounded-chip bg-warn-bg px-2 py-[2px]">
          odpowiedzi: brak
        </span>
      </p>
    );
  }

  return closed ? (
    <ClosedAnswers answers={task.answers} />
  ) : (
    <OpenAnswer answers={task.answers} />
  );
}
