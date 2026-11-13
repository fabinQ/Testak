import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  hasAnyFilter,
  orderFacetValues,
  selectedValues,
  setFilter,
  toApiFilters,
} from "./filters";

const facet = (...values: string[]) => values.map((value) => ({ value, count: 1 }));
const names = (values: { value: string }[]) => values.map((v) => v.value);

describe("orderFacetValues", () => {
  it("ustawia trudność rosnąco, a nie alfabetycznie", () => {
    const ordered = orderFacetValues("difficulty", facet("trudne", "łatwe", "średnie"));
    expect(names(ordered)).toEqual(["łatwe", "średnie", "trudne"]);
  });

  it("sortuje po polsku (Ś po S, nie na końcu)", () => {
    const ordered = orderFacetValues("topic", facet("Trygonometria", "Średnie", "Stereometria"));
    expect(names(ordered)).toEqual(["Stereometria", "Średnie", "Trygonometria"]);
  });
});

describe("setFilter", () => {
  it("zmiana klasy czyści zaznaczone działy", () => {
    const withTopic = setFilter(EMPTY_FILTERS, "topic", ["Ciągi"]);
    const next = setFilter(withTopic, "class_level", ["2"]);
    expect(next.class_level).toBe("2");
    expect(next.topic).toEqual([]);
  });

  it("filtr jednokrotny przyjmuje jedną wartość albo pustą", () => {
    const set = setFilter(EMPTY_FILTERS, "task_type", ["otwarte"]);
    expect(selectedValues(set, "task_type")).toEqual(["otwarte"]);
    expect(selectedValues(setFilter(set, "task_type", []), "task_type")).toEqual([]);
  });

  it("nie zmienia obiektu wejściowego", () => {
    setFilter(EMPTY_FILTERS, "difficulty", ["łatwe"]);
    expect(EMPTY_FILTERS.difficulty).toEqual([]);
  });
});

describe("toApiFilters / hasAnyFilter", () => {
  it("pomija puste pola i przycina wyszukiwanie", () => {
    expect(toApiFilters(EMPTY_FILTERS, "  ")).toEqual({
      class_level: undefined,
      topic: [],
      task_type: undefined,
      scope: [],
      difficulty: [],
      source: undefined,
      q: undefined,
    });
    expect(toApiFilters(setFilter(EMPTY_FILTERS, "class_level", ["3"]), " pole ")).toMatchObject({
      class_level: 3,
      q: "pole",
    });
  });

  it("rozpoznaje, czy cokolwiek jest ustawione", () => {
    expect(hasAnyFilter(EMPTY_FILTERS, " ")).toBe(false);
    expect(hasAnyFilter(EMPTY_FILTERS, "x")).toBe(true);
    expect(hasAnyFilter(setFilter(EMPTY_FILTERS, "scope", ["podstawowy"]), "")).toBe(true);
  });
});
