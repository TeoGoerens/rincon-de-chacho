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
