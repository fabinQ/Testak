import { useEffect, useState } from "react";

// Zwraca wartość dopiero, gdy przestała się zmieniać na `delayMs`.
// Wyszukiwarka: żądanie idzie po 300 ms od ostatniego znaku, a nie po każdym (FR-2).
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    // Kolejna zmiana przed upływem czasu kasuje poprzedni zegar
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
