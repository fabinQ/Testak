import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";
import { useRequest, type RequestState } from "./useRequest";

// Bez dodatkowej biblioteki testowej: komponent-sonda zapisuje wynik hooka do zmiennej
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("useDebouncedValue", () => {
  let seen = "";
  const report = (value: string) => {
    seen = value;
  };
  function Probe({ value }: { value: string }) {
    const debounced = useDebouncedValue(value, 300);
    useEffect(() => report(debounced));
    return null;
  }

  it("przepuszcza wartość dopiero po 300 ms ciszy", () => {
    vi.useFakeTimers();
    act(() => root.render(<Probe value="" />));
    act(() => root.render(<Probe value="t" />));
    act(() => vi.advanceTimersByTime(200));
    act(() => root.render(<Probe value="tr" />));
    act(() => vi.advanceTimersByTime(200));
    // 400 ms od "t", ale tylko 200 ms od "tr" — jeszcze nic
    expect(seen).toBe("");
    act(() => vi.advanceTimersByTime(100));
    expect(seen).toBe("tr");
  });
});

describe("useRequest", () => {
  let state: RequestState<{ id: string }>;
  const report = (value: RequestState<{ id: string }>) => {
    state = value;
  };
  function Probe({ path }: { path: string }) {
    const request = useRequest<{ id: string }>(path);
    useEffect(() => report(request));
    return null;
  }

  // Sztuczny fetch: każde żądanie czeka, aż test je rozstrzygnie
  interface Call {
    url: string;
    signal: AbortSignal;
    resolve: (res: Response) => void;
  }
  let calls: Call[];

  function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status });
  }

  beforeEach(() => {
    calls = [];
    vi.stubGlobal("fetch", (url: string, init: { signal: AbortSignal }) => {
      return new Promise<Response>((resolve, reject) => {
        init.signal.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
        calls.push({ url, signal: init.signal, resolve });
      });
    });
  });

  it("pokazuje ładowanie, a potem dane", async () => {
    act(() => root.render(<Probe path="/a" />));
    expect(state.loading).toBe(true);
    expect(state.data).toBeUndefined();
    await act(async () => calls[0].resolve(json({ id: "a" })));
    expect(state.loading).toBe(false);
    expect(state.data).toEqual({ id: "a" });
    expect(state.error).toBeNull();
  });

  it("anuluje stare żądanie i nie pokazuje tego jako błędu", async () => {
    act(() => root.render(<Probe path="/wolne" />));
    act(() => root.render(<Probe path="/szybkie" />));
    expect(calls[0].signal.aborted).toBe(true);
    expect(calls[1].signal.aborted).toBe(false);
    await act(async () => calls[1].resolve(json({ id: "szybkie" })));
    expect(state.data).toEqual({ id: "szybkie" });
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  it("przy błędzie zostawia poprzednie dane, a 'ponów' pobiera jeszcze raz", async () => {
    act(() => root.render(<Probe path="/a" />));
    await act(async () => calls[0].resolve(json({ id: "a" })));
    act(() => root.render(<Probe path="/b" />));
    await act(async () => calls[1].resolve(json({ detail: "x" }, 500)));
    expect(state.error).toContain("500");
    expect(state.data).toEqual({ id: "a" });

    act(() => state.retry());
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
    await act(async () => calls[2].resolve(json({ id: "b" })));
    expect(state.data).toEqual({ id: "b" });
    expect(state.error).toBeNull();
  });
});
