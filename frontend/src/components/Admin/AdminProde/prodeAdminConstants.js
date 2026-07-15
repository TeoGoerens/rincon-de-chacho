export const PRODE_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const TOURNAMENT_STATUSES = [
  { value: "draft", label: "Borrador" },
  { value: "active", label: "Activo" },
  { value: "finished", label: "Finalizado" },
];

/* Resúmenes del trigger del desplegable de selección múltiple del form de
   torneo: "Julio – Diciembre · 6 meses" / "8 participantes" */
export const monthsSummary = (months) => {
  const ordered = PRODE_MONTHS.filter((m) => months.includes(m));
  if (ordered.length === 0) return "";
  if (ordered.length === 1) return ordered[0];
  return `${ordered[0]} – ${ordered[ordered.length - 1]} · ${ordered.length} meses`;
};

export const participantsSummary = (participants) =>
  participants.length === 1
    ? "1 participante"
    : `${participants.length} participantes`;

export const GDT_POSITION_OPTIONS = [
  { value: "ARQ", label: "Arquero" },
  { value: "DEF", label: "Defensor" },
  { value: "VOL", label: "Volante" },
  { value: "DEL", label: "Delantero" },
];

export const GDT_POSITION_LABELS = Object.fromEntries(
  GDT_POSITION_OPTIONS.map(({ value, label }) => [value, label]),
);

export const GDT_DRAFT_STATUS = {
  setup: { label: "En preparación", badge: "pri-badge--draft" },
  open: { label: "Draft abierto", badge: "pri-badge--active" },
  revealed: { label: "Revelado", badge: "pri-badge--inplay" },
  resolving: { label: "Resolviendo quemas", badge: "pri-badge--inplay" },
  final: { label: "Definitivo", badge: "pri-badge--finished" },
};

export const MATCHDAY_PHASES = {
  draft: { label: "Borrador", badge: "pri-badge--draft" },
  open: { label: "Abierta", badge: "pri-badge--active" },
  in_play: { label: "En juego", badge: "pri-badge--inplay" },
  consolidated: { label: "Consolidada", badge: "pri-badge--finished" },
};

/* Date (ISO) → valor para <input type="datetime-local"> en hora local */
export const toDatetimeLocalValue = (isoDate) => {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatDeadline = (isoDate) => {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* Versión corta armada por partes, hour12:false (nunca "p. m."):
   "sáb 12/07 · 21:00" — mismo formato que los kickoffs del sitio */
export const formatShortDateTime = (isoDate) => {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const weekday = date.toLocaleDateString("es-AR", { weekday: "short" });
  const dayMonth = date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
  const time = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${weekday} ${dayMonth} · ${time}`;
};
