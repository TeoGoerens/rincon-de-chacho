/* Busca un equipo en API-Football para conseguir su ID — el dato que pide
   API_FOOTBALL_TEAM_ALIASES cuando un import reporta un equipo sin resolver.

     node src/scripts/searchApiFootballTeam.js "nombre del equipo"

   Imprime los candidatos con su ID, país y una marca si parece filial
   (reserva/juveniles). Gasta 1 request de la cuota diaria. */

import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.API_FOOTBALL_KEY;
const searchTerm = process.argv.slice(2).join(" ").trim();

if (!API_KEY) {
  console.error("Falta API_FOOTBALL_KEY en el .env");
  process.exit(1);
}
if (searchTerm.length < 3) {
  console.error('Uso: node src/scripts/searchApiFootballTeam.js "nombre del equipo"');
  process.exit(1);
}

const normalized = searchTerm
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .toLowerCase()
  .replace(/['’]/g, "")
  .replace(/[^a-z0-9 ]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const looksLikeYouthOrReserve = (name) =>
  /\bu-?\d{2}\b|\bres\.?$|\breserves?\b|\bfem/i.test(name ?? "");

const main = async () => {
  const url = new URL("https://v3.football.api-sports.io/teams");
  url.searchParams.set("search", normalized);
  const response = await fetch(url, {
    headers: { "x-apisports-key": API_KEY },
  });
  const data = await response.json();

  const results = data.response ?? [];
  if (results.length === 0) {
    console.log(
      `Sin resultados para "${searchTerm}". Probá con menos palabras (ej: solo el nombre principal del club).`,
    );
    return;
  }

  console.log(`=== Candidatos para "${searchTerm}" ===`);
  for (const item of results) {
    const marks = [];
    if (looksLikeYouthOrReserve(item.team.name)) marks.push("FILIAL/JUVENIL");
    console.log(
      `  [${item.team.id}] ${item.team.name} · ${item.team.country}${marks.length ? ` · ⚠ ${marks.join(", ")}` : ""}`,
    );
  }
  console.log(
    '\nEl alias se agrega en backend/src/config/sportsProvider/apiFootballConfig.js:\n  "nombre normalizado (minúsculas, sin tildes ni apóstrofes)": ID,',
  );
};

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
