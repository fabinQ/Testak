import { useState, type ReactNode } from "react";
import {
  FileText,
  LayoutDashboard,
  Library,
  LifeBuoy,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavChild {
  label: string;
  active?: boolean;
  // Ekran jeszcze nie istnieje — pozycja widoczna, ale nieaktywna
  disabled?: boolean;
}

interface NavSection {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  children?: NavChild[];
}

// Menu z DESIGN.md 4.1. Na razie działa tylko Baza zadań (faza 1);
// pozostałe pozycje dojdą razem ze swoimi ekranami.
const NAV: NavSection[] = [
  { label: "Tablica", icon: LayoutDashboard, disabled: true },
  {
    label: "Zadania",
    icon: Library,
    active: true,
    children: [
      { label: "Nowe zadanie", disabled: true },
      { label: "Baza zadań", active: true },
    ],
  },
  { label: "Klasówki", icon: FileText, disabled: true },
  { label: "Pomoc", icon: LifeBuoy, disabled: true },
];

const SOON = "wkrótce";

function NavList({ compact }: { compact: boolean }) {
  // compact = pasek 64 px z samymi ikonami (tablet)
  const text = compact ? "sr-only" : "";
  return (
    <ul className="flex flex-col gap-1">
      {NAV.map((section) => {
        const Icon = section.icon;
        const state = section.active
          ? "bg-board-raised text-amber-text"
          : "text-chalk-muted";
        return (
          <li key={section.label}>
            <span
              className={`flex min-h-11 items-center gap-3 rounded-control px-3 font-medium ${state} ${compact ? "justify-center" : ""}`}
              aria-current={section.active ? "true" : undefined}
              aria-disabled={section.disabled ? "true" : undefined}
              title={section.disabled ? `${section.label} — ${SOON}` : section.label}
            >
              <Icon size={20} aria-hidden="true" className="shrink-0" />
              <span className={text}>{section.label}</span>
              {section.disabled && (
                <span className={`ml-auto text-[12.5px] font-normal ${text}`}>
                  {SOON}
                </span>
              )}
            </span>
            {section.active && section.children && !compact && (
              <ul className="mt-1 mb-2 ml-[22px] flex flex-col gap-1 border-l border-board-raised pl-3">
                {section.children.map((child) => (
                  <li key={child.label}>
                    <span
                      className={`flex min-h-11 items-center rounded-control px-3 text-[14px] ${
                        child.active ? "font-medium text-amber-text" : "text-chalk-muted"
                      }`}
                      aria-current={child.active ? "page" : undefined}
                      aria-disabled={child.disabled ? "true" : undefined}
                    >
                      {child.label}
                      {child.disabled && (
                        <span className="ml-auto text-[12.5px]">{SOON}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Logo({ markOnly = false }: { markOnly?: boolean }) {
  return (
    <span className="flex items-center gap-[10px]">
      <img src="/favicon.svg" alt="" width={32} height={32} />
      <span
        className={`font-display text-[23px] leading-none font-bold tracking-[-0.02em] text-white ${markOnly ? "sr-only" : ""}`}
      >
        testak
      </span>
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex">
      {/* Telefon: górny pasek z wysuwanym menu */}
      <header className="on-board bg-board text-chalk md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Logo />
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-control hover:bg-board-raised"
            aria-expanded={menuOpen}
            aria-controls="menu-mobilne"
            aria-label={menuOpen ? "Zamknij menu" : "Otwórz menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
        {menuOpen && (
          <nav id="menu-mobilne" aria-label="Menu główne" className="px-3 pb-3">
            <NavList compact={false} />
          </nav>
        )}
      </header>

      {/* Tablet: pasek 64 px z ikonami */}
      <aside className="on-board sticky top-0 hidden h-screen w-16 shrink-0 flex-col gap-6 bg-board px-2 py-5 text-chalk md:flex xl:hidden">
        <div className="flex justify-center">
          <Logo markOnly />
        </div>
        <nav aria-label="Menu główne">
          <NavList compact />
        </nav>
      </aside>

      {/* Laptop: stałe menu boczne 232 px */}
      <aside className="on-board sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col gap-7 overflow-y-auto bg-board px-3 py-6 text-chalk xl:flex">
        <div className="px-3">
          <Logo />
        </div>
        <nav aria-label="Menu główne">
          <NavList compact={false} />
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-6 xl:px-10 xl:py-8">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  );
}
