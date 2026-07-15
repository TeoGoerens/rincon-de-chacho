import dotenv from "dotenv";
dotenv.config();

// Key pública gratuita de TheSportsDB ("123", 30 req/min). Para migrar a una
// key premium propia alcanza con definir THESPORTSDB_API_KEY en el .env
export const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY || "123";
export const THESPORTSDB_BASE_URL = "https://www.thesportsdb.com/api/v1/json";

// Separación mínima entre requests. Con key premium propia (lifetime,
// 2026-07-09) el límite es 100 req/min → 700ms deja margen; el retry queda
// como red de seguridad ante 503 esporádicos
export const REQUEST_GAP_MS = 700;
export const RETRY_DELAY_MS = 2500;
export const UPCOMING_CACHE_TTL_MS = 5 * 60 * 1000;

// La fecha en curso del torneo se ofrece SIEMPRE en el catálogo; la fecha
// siguiente solo si sus partidos caen dentro de esta ventana (evita llenar
// la lista con partidos lejanos que ninguna fecha del Prode va a usar)
export const NEXT_ROUND_WINDOW_DAYS = 14;

// Catálogo de ligas ofrecidas en el carrito del admin (IDs verificados contra
// la API el 2026-07-08). Agregar una liga = agregar una línea acá.
// Orden pedido por el dueño: torneos locales de Argentina → Brasileirão →
// copas internacionales de América → ligas europeas → competiciones
// internacionales de clubes europeos → competiciones de selecciones.
export const SUPPORTED_LEAGUES = [
  { id: "4406", name: "Primera División · Argentina" },
  { id: "4500", name: "Copa Argentina" },
  { id: "4351", name: "Brasileirão · Brasil" },
  { id: "4346", name: "MLS · Estados Unidos" },
  { id: "4501", name: "Copa Libertadores" },
  { id: "4724", name: "Copa Sudamericana" },
  { id: "4328", name: "Premier League · Inglaterra" },
  { id: "4335", name: "La Liga · España" },
  { id: "4332", name: "Serie A · Italia" },
  { id: "4331", name: "Bundesliga · Alemania" },
  { id: "4334", name: "Ligue 1 · Francia" },
  { id: "4480", name: "UEFA Champions League" },
  { id: "4481", name: "UEFA Europa League" },
  { id: "4429", name: "Mundial FIFA" },
  { id: "4499", name: "Copa América" },
  { id: "4502", name: "Eurocopa" },
];
