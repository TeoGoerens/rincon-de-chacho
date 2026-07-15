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

/* setup = universo recién creado, el admin prepara el pool; el draft
   arranca cuando lo ABRE explícitamente (fija deadline + mail). */
export const GDT_DRAFT_STATUSES = [
  "setup",
  "open",
  "revealed",
  "resolving",
  "final",
];

/* Un jugador presente en ESTE número (o más) de planteles al revelar se
   QUEMA para todo el torneo; con 2-3 planteles se comparte válidamente. */
export const GDT_BURN_THRESHOLD = 4;

/* Formación FIJA del plantel GDT (1-4-4-2): la posición de cada slot no se
   elige — lo estratégico es qué jugador va en qué slot de su posición,
   porque los mini-duelos se resuelven slot contra slot. Índice+1 = slot. */
export const GDT_SLOT_LAYOUT = [
  "ARQ",
  "DEF",
  "DEF",
  "DEF",
  "DEF",
  "VOL",
  "VOL",
  "VOL",
  "VOL",
  "DEL",
  "DEL",
];

/* Bonus fijo por acertar el marcador exacto — regla de negocio: SIEMPRE 5,
   no configurable por partido. */
export const EXACT_SCORE_BONUS = 5;
