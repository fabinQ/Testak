import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FacetValue } from "../types";

interface FilterMenuProps {
  label: string;
  options: FacetValue[];
  selected: string[];
  // false = jedna wartość naraz (Klasa, Typ, Źródło)
  multiple: boolean;
  formatValue: (value: string) => string;
  onChange: (values: string[]) => void;
}

// Filtr z DESIGN.md 4.2: przycisk z nazwą i liczbą wybranych, po kliknięciu
// lista pól wyboru z licznikami zadań (FR-3).
export function FilterMenu({
  label,
  options,
  selected,
  multiple,
  formatValue,
  onChange,
}: FilterMenuProps) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const groupName = useId();

  // Zamknięcie kliknięciem poza filtrem lub klawiszem Esc
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = (value: string) => {
    if (!multiple) {
      onChange(selected.includes(value) ? [] : [value]);
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }
    onChange(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
  };

  const active = selected.length > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={`flex h-11 items-center gap-2 rounded-control border bg-surface px-3 text-[14px] font-medium ${
          active ? "border-board text-ink" : "border-line text-ink hover:border-line-strong"
        }`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          // Przycisk w prawej połowie okna: lista rozwija się do lewej, żeby nie wyjść poza ekran
          const rect = buttonRef.current?.getBoundingClientRect();
          setAlignRight(rect !== undefined && rect.left > window.innerWidth / 2);
          setOpen((value) => !value);
        }}
      >
        <span>{label}</span>
        {/* Wielokrotny: liczba wybranych („Dział · 2"). Jednokrotny: sama wartość —
            „Klasa · 1" czytałoby się jak klasa pierwsza. */}
        {active && multiple && (
          <span className="font-mono text-[13px] text-ink-muted">· {selected.length}</span>
        )}
        {active && !multiple && (
          <span className="max-w-[160px] truncate font-normal text-ink-muted">
            · {formatValue(selected[0])}
          </span>
        )}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`text-ink-muted transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={label}
          className={`absolute top-12 ${alignRight ? "right-0" : "left-0"} z-20 max-h-[360px] w-max max-w-[min(420px,calc(100vw-32px))] min-w-[220px] overflow-y-auto rounded-card border border-line bg-surface p-1 shadow-lg`}
        >
          {options.length === 0 && (
            <p className="px-3 py-2 text-[13px] text-ink-muted">Brak wartości</p>
          )}
          {options.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 py-1 hover:bg-bg has-[:focus-visible]:bg-bg"
              >
                <input
                  type="checkbox"
                  name={groupName}
                  className="size-4 shrink-0 accent-board"
                  checked={checked}
                  onChange={() => toggle(option.value)}
                />
                <span className={`flex-1 text-[14px] ${option.count === 0 && !checked ? "text-ink-muted" : ""}`}>
                  {formatValue(option.value)}
                </span>
                <span className="font-mono text-[13px] text-ink-muted">{option.count}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
