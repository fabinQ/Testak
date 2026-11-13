import DOMPurify from "dompurify";
import { describe, expect, it } from "vitest";
import { prepareHtml } from "./prepareHtml";

const IMAGES = "http://api.test/images/";

function parse(html: string): HTMLElement {
  const box = document.createElement("div");
  box.innerHTML = html;
  return box;
}

describe("prepareHtml", () => {
  it("podmienia image:// na adres API i obrazek przeżywa sanityzację", () => {
    const out = prepareHtml('<p>Rysunek: <img src="image://2647.svg"></p>', IMAGES);
    const img = parse(out).querySelector("img");
    expect(img?.getAttribute("src")).toBe("http://api.test/images/2647.svg");
  });

  it("odwrotna kolejność gubi obrazek — dlatego podmiana jest pierwsza", () => {
    // Sama sanityzacja: nieznany schemat image:// zostaje wycięty z src
    const sanitizedFirst = DOMPurify.sanitize('<img src="image://2647.svg">');
    expect(sanitizedFirst).not.toContain("2647.svg");
    // Właściwa kolejność zachowuje plik
    expect(prepareHtml('<img src="image://2647.svg">', IMAGES)).toContain("2647.svg");
  });

  it("podmienia wszystkie obrazki w treści", () => {
    const out = prepareHtml(
      '<img src="image://a.svg"><span>x</span><img src="image://b.png">',
      IMAGES,
    );
    const sources = [...parse(out).querySelectorAll("img")].map((i) =>
      i.getAttribute("src"),
    );
    expect(sources).toEqual([
      "http://api.test/images/a.svg",
      "http://api.test/images/b.png",
    ]);
  });

  it("działa dla odpowiedzi, która jest samym obrazkiem", () => {
    const out = prepareHtml('<img src="image://odp-a.svg">', IMAGES);
    expect(parse(out).querySelector("img")?.getAttribute("src")).toBe(
      "http://api.test/images/odp-a.svg",
    );
  });

  it("usuwa skrypty i atrybuty zdarzeń", () => {
    const out = prepareHtml(
      '<p onclick="alert(1)">tekst</p><script>alert(2)</script>' +
        '<img src="image://x.svg" onerror="alert(3)">',
      IMAGES,
    );
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onerror");
    expect(out).toContain("tekst");
    expect(out).toContain("x.svg");
  });

  it("usuwa adresy javascript:", () => {
    const out = prepareHtml('<a href="javascript:alert(1)">link</a>', IMAGES);
    expect(out).not.toContain("javascript:");
  });

  it("zachowuje wzór MathML, ale bez tekstu z <annotation>", () => {
    const out = prepareHtml(
      '<p>Liczba <math xmlns="http://www.w3.org/1998/Math/MathML"><semantics>' +
        "<mrow><mi>a</mi><mo>=</mo><msub><mi>log</mi><mn>2</mn></msub></mrow>" +
        '<annotation encoding="application/vnd.wiris.mtweb-params+json">' +
        '{"fontFamily":"Times New Roman"}</annotation></semantics></math>.</p>',
      IMAGES,
    );
    expect(out).not.toContain("fontFamily");
    const math = parse(out).querySelector("math");
    expect(math?.querySelector("msub")).not.toBeNull();
    expect(math?.textContent).toBe("a=log2");
  });

  it("zachowuje obrazek osadzony jako data:", () => {
    const out = prepareHtml('<img src="data:image/png;base64,AAAA" alt="r">', IMAGES);
    expect(out).toContain('src="data:image/png;base64,AAAA"');
  });

  it("zostawia zwykłe formatowanie bez zmian", () => {
    const html = "<p>Oblicz <strong>pole</strong> trójkąta o boku <em>a</em>.</p>";
    expect(prepareHtml(html, IMAGES)).toBe(html);
  });
});
