import DOMPurify from "dompurify";
import { IMAGES_URL } from "./api";

// Przygotowuje HTML z banku (treść zadania ORAZ odpowiedzi) do wstawienia w stronę.
//
// KOLEJNOŚĆ JEST ISTOTNA:
// 1. image://plik.svg -> <API>/images/plik.svg
// 2. dopiero potem sanityzacja
// DOMPurify usuwa atrybuty z nieznanym schematem URI, więc przy odwrotnej
// kolejności obrazki zniknęłyby, zanim zdążylibyśmy podmienić adres.
export function prepareHtml(html: string, imagesUrl: string = IMAGES_URL): string {
  const withImages = html.replace(/image:\/\//g, imagesUrl);
  return DOMPurify.sanitize(withImages, {
    // Wzory z edytora WIRIS mają <annotation> z ustawieniami w JSON-ie.
    // DOMPurify usuwa ten znacznik, ale domyślnie zostawia jego tekst —
    // bez tej opcji JSON pojawiałby się na arkuszu obok wzoru.
    FORBID_CONTENTS: ["annotation"],
  });
}
