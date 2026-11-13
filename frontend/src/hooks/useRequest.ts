import { useCallback, useEffect, useState } from "react";
import { getJson } from "../api";

interface Settled<T> {
  // Klucz żądania, którego dotyczy wynik (ścieżka + numer próby)
  key: string;
  data: T | undefined;
  error: string | null;
}

export interface RequestState<T> {
  // Ostatnie poprawnie pobrane dane — zostają na ekranie w trakcie kolejnego pobierania
  data: T | undefined;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

// Pobiera JSON spod `path` i pilnuje, żeby na ekran trafił wynik OSTATNIEGO żądania.
// Zmiana ścieżki w trakcie pobierania anuluje poprzednie żądanie (AbortController),
// więc wolniejsza, starsza odpowiedź nie nadpisze nowszej.
export function useRequest<T>(path: string): RequestState<T> {
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<Settled<T>>({
    key: "",
    data: undefined,
    error: null,
  });
  const key = `${attempt}:${path}`;

  useEffect(() => {
    const controller = new AbortController();
    getJson<T>(path, controller.signal)
      .then((data) => setSettled({ key, data, error: null }))
      .catch((err: unknown) => {
        // Anulowanie to nie błąd — po prostu przyszło nowsze żądanie
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Nieznany błąd";
        setSettled((prev) => ({ key, data: prev.data, error: message }));
      });
    return () => controller.abort();
  }, [path, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // "Ładowanie" wynika z porównania kluczy, bez osobnej flagi do pilnowania
  const loading = settled.key !== key;
  return {
    data: settled.data,
    loading,
    error: loading ? null : settled.error,
    retry,
  };
}
