/* Puntajes del Gran DT: enteros o con decimales, positivos o negativos.
   Se escriben y se muestran con COMA decimal (formato argentino); el punto
   se rechaza a propósito para que "1.5" nunca se confunda con un separador
   de miles. Ejemplos válidos: 7 · -2 · 7,5 · -0,25 */
const GDT_POINTS_PATTERN = /^-?\d+(,\d+)?$/;

export const isValidGdtPoints = (text) =>
  GDT_POINTS_PATTERN.test((text ?? "").trim());

/* Texto del input → número (null si no es un puntaje válido) */
export const parseGdtPoints = (text) =>
  isValidGdtPoints(text) ? Number(text.trim().replace(",", ".")) : null;

/* Motivo legible de por qué un texto no es un puntaje válido */
export const gdtPointsError = (text) =>
  (text ?? "").includes(".")
    ? "usá coma para los decimales (ej: 7,5)"
    : "debe ser un número (ej: 7, -2 o 7,5)";

/* Número → texto con coma decimal, sin separador de miles. Valor EXACTO:
   es el que se edita en el admin */
export const formatGdtPoints = (points) =>
  points === null || points === undefined
    ? ""
    : String(points).replace(".", ",");

/* Número → texto para MOSTRAR en la sección Prode (regla del dueño,
   2026-11-09): redondo sin decimales; con decimales, redondeado a 1.
   El redondeo es "mitad hacia afuera" (-7,25 → -7,3) y el EPSILON evita
   que el binario tuerza casos como 1,15 → 1,1. Si al redondear queda
   redondo (7,96 → 8), se muestra sin coma. */
export const displayGdtPoints = (points) => {
  if (points === null || points === undefined) return "";
  const rounded =
    (Math.sign(points) * Math.round((Math.abs(points) + Number.EPSILON) * 10)) /
      10 || 0;
  return String(rounded).replace(".", ",");
};
