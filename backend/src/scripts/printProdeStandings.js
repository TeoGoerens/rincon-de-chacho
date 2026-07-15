/* Prueba de oro de la tabla de posiciones del Prode (Etapa 3.2): imprime la
 * tabla EXACTA que devuelve el repository (el mismo código que sirve el
 * endpoint) para cotejarla contra el Excel histórico campo por campo.
 *
 * Uso (el target es OBLIGATORIO, no hay default):
 *   node src/scripts/printProdeStandings.js --target=dev
 *       → lista los torneos con su id para elegir
 *   node src/scripts/printProdeStandings.js --target=dev --tournament=<id>
 *       → tabla acumulada del torneo
 *   node src/scripts/printProdeStandings.js --target=dev --tournament=<id> --month=Febrero
 *       → tabla de ese mes
 *   node src/scripts/printProdeStandings.js --target=dev --tournament=all
 *       → tabla histórica (todos los torneos sumados)
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import ProdeTournament from "../dao/models/prode/ProdeTournamentModel.js";
import ProdeStatsRepository from "../repository/prode/prodeStatsRepository.js";
dotenv.config();

const getArg = (name) => {
  const raw = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return raw ? raw.split("=").slice(1).join("=") : null;
};

const target = getArg("target");
if (target !== "dev" && target !== "prod") {
  console.error(
    "❌ Debés indicar la base de datos explícitamente: --target=dev o --target=prod",
  );
  process.exit(1);
}

const MONGO_ATLAS_URL =
  target === "dev"
    ? process.env.MONGO_ATLAS_URL_DEV
    : process.env.MONGO_ATLAS_URL_PROD;

if (!MONGO_ATLAS_URL) {
  console.error(`❌ Falta la variable de entorno para el target "${target}"`);
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(`${MONGO_ATLAS_URL}/app`, {
    serverSelectionTimeoutMS: 30000,
  });
  console.log(`✅ Conectado a la base de datos (${target})\n`);

  const tournamentId = getArg("tournament");

  if (!tournamentId) {
    const tournaments = await ProdeTournament.find(
      {},
      { name: 1, year: 1, status: 1 },
    )
      .sort({ year: 1 })
      .lean();
    console.log("Torneos disponibles (pasá el id con --tournament=<id>):\n");
    for (const t of tournaments) {
      console.log(`  ${t._id}  ${t.name} ${t.year} · ${t.status}`);
    }
    await mongoose.disconnect();
    return;
  }

  const repository = new ProdeStatsRepository();
  const result =
    tournamentId === "all"
      ? await repository.getAllTimeStandings()
      : await repository.getTournamentStandings(tournamentId, {
          month: getArg("month"),
        });

  if (result.allTime) {
    console.log(
      `Histórico total · ${result.tournamentCount} torneos · ${result.matchdayCount} fechas consolidadas\n`,
    );
  } else {
    const scope = result.month ? `Mes: ${result.month}` : "Acumulada";
    console.log(
      `${result.tournament.name} ${result.tournament.year} · ${scope} · ${result.matchdayCount} fechas consolidadas`,
    );
    console.log(
      `Meses con fechas: ${result.availableMonths.join(", ") || "—"}\n`,
    );
  }

  const header = `${"#".padStart(2)}  ${"Participante".padEnd(20)} ${"PJ".padStart(3)} ${"G".padStart(3)} ${"E".padStart(3)} ${"P".padStart(3)} ${"Bonus".padStart(6)} ${"Pts".padStart(4)}`;
  console.log(header);
  console.log("-".repeat(header.length));
  for (const row of result.standings) {
    console.log(
      `${String(row.position).padStart(2)}  ${row.player.name.padEnd(20)} ${String(row.played).padStart(3)} ${String(row.won).padStart(3)} ${String(row.drawn).padStart(3)} ${String(row.lost).padStart(3)} ${String(row.bonus).padStart(6)} ${String(row.points).padStart(4)}`,
    );
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
