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

export const PRODE_CHALLENGES = ["GDT", "ARG", "MISC"];

export const MATCHDAY_PHASES = ["draft", "open", "in_play", "consolidated"];

export const ITEM_KINDS = ["match", "question"];

export const ITEM_SOURCES = ["api", "manual"];

export const ITEM_STATUSES = ["scheduled", "finished", "annulled"];

export const PICK_1X2 = ["home", "draw", "away"];

export const GDT_POSITIONS = ["ARQ", "DEF", "VOL", "DEL"];

export const GDT_DRAFT_STATUSES = ["open", "revealed", "resolving", "final"];

/* Bonus fijo por acertar el marcador exacto — regla de negocio: SIEMPRE 5,
   no configurable por partido. */
export const EXACT_SCORE_BONUS = 5;
