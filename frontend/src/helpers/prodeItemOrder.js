/* ORDEN CANÓNICO de los ítems de una fecha del Prode (decisión del dueño
   2026-07-26). Mismo criterio en TODAS las pantallas — carga del
   participante, vistas comparativas y carga de resultados del admin:

     ① partidos del catálogo, en orden cronológico de kickoff
     ② partidos manuales, en orden cronológico de kickoff
     ③ preguntas, en el orden en que las cargó el admin

   Antes cada pantalla mostraba el orden de inserción del array, que depende
   de en qué orden el admin tildó los partidos en el carrito. Con la ventana
   de 15 días una fecha puede mezclar jornadas distintas (recuperados,
   adelantados), y el kickoff es funcionalmente relevante: en la reapertura
   de rezagados los partidos ya empezados quedan bloqueados. */

export const byKickoff = (a, b) =>
  new Date(a.kickoffAt ?? 0) - new Date(b.kickoffAt ?? 0);

/* Los 3 grupos por separado (los usa el admin, que los muestra con banda
   propia). filter() ya devuelve un array nuevo → sort() no muta el original */
export const groupProdeItems = (items = []) => ({
  apiMatches: items
    .filter((item) => item.kind === "match" && item.source === "api")
    .sort(byKickoff),
  manualMatches: items
    .filter((item) => item.kind === "match" && item.source !== "api")
    .sort(byKickoff),
  questions: items.filter((item) => item.kind === "question"),
});

/* Lista plana en el orden canónico */
export const orderProdeItems = (items = []) => {
  const { apiMatches, manualMatches, questions } = groupProdeItems(items);
  return [...apiMatches, ...manualMatches, ...questions];
};
