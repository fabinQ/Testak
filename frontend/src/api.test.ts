import { describe, expect, it } from "vitest";
import { buildQuery } from "./api";

describe("buildQuery", () => {
  it("zwraca pusty ciąg bez parametrów", () => {
    expect(buildQuery({})).toBe("");
    expect(buildQuery({ q: "", topic: undefined, difficulty: [] })).toBe("");
  });

  it("powtarza parametr dla każdej wartości listy", () => {
    expect(buildQuery({ difficulty: ["łatwe", "trudne"], class_level: 2 })).toBe(
      "?difficulty=%C5%82atwe&difficulty=trudne&class_level=2",
    );
  });

  it("koduje znaki specjalne w wyszukiwaniu", () => {
    expect(buildQuery({ q: "50% & a_b" })).toBe("?q=50%25+%26+a_b");
  });
});
