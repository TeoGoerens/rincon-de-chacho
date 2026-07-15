// Verificación de la key premium de TheSportsDB (paso 4.1).
// Uso: node src/scripts/testSportsDbPremiumKey.js
// Con key free ("123") River devuelve 10 jugadores alfabéticos (A-G);
// con key premium deben aparecer ~37, incluyendo Montiel y Paulo Díaz.
import {
  THESPORTSDB_API_KEY,
  THESPORTSDB_BASE_URL,
} from "../config/sportsProvider/theSportsDbConfig.js";

const RIVER_TEAM_ID = "135171";

const run = async () => {
  const usingDefaultKey = THESPORTSDB_API_KEY === "123";
  console.log(
    `Key en uso: ${usingDefaultKey ? '"123" (pública gratuita — falta THESPORTSDB_API_KEY en backend/.env)' : `propia (${THESPORTSDB_API_KEY.slice(0, 3)}...${THESPORTSDB_API_KEY.slice(-3)})`}`,
  );

  const response = await fetch(
    `${THESPORTSDB_BASE_URL}/${THESPORTSDB_API_KEY}/lookup_all_players.php?id=${RIVER_TEAM_ID}`,
  );
  if (!response.ok) {
    throw new Error(
      `TheSportsDB respondió ${response.status} — ¿key inválida o todavía no activa?`,
    );
  }

  const players = (await response.json()).player ?? [];
  console.log(`\nPlantel de River Plate: ${players.length} jugadores`);
  players.forEach((p) =>
    console.log(`  ${p.strPlayer} | ${p.strPosition ?? "—"}`),
  );

  const hasDeepSquad = players.length > 15;
  console.log(
    hasDeepSquad
      ? "\n✔ PREMIUM ACTIVO: plantel completo disponible, listos para el import del catálogo."
      : "\n✘ Todavía se ve el recorte del tier gratuito (10 alfabéticos). Revisar la key en backend/.env y reiniciar.",
  );
};

run().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
