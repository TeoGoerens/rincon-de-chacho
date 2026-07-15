/* Backfill de `participants` en torneos de Prode históricos (Etapa 3.2).
 *
 * Los torneos creados antes del rebuild tienen participants=[] porque el
 * campo no existía. Este script deriva los participantes de los duelos de
 * sus fechas y los escribe en el torneo, para que las agregaciones públicas
 * (tabla, records, H2H, honores) puedan confiar siempre en participants[].
 *
 * Es idempotente: solo toca torneos con participants vacío. Un torneo sin
 * fechas con duelos se informa y se saltea.
 *
 * Uso (el target es OBLIGATORIO, no hay default):
 *   node src/scripts/backfillProdeTournamentParticipants.js --target=dev
 *   node src/scripts/backfillProdeTournamentParticipants.js --target=prod
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import ProdeTournament from "../dao/models/prode/ProdeTournamentModel.js";
import ProdeMatchday from "../dao/models/prode/ProdeMatchdayModel.js";
import ProdePlayer from "../dao/models/prode/ProdePlayerModel.js";
dotenv.config();

const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
const target = targetArg ? targetArg.split("=")[1] : null;

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

  const tournaments = await ProdeTournament.find({}).lean();

  for (const tournament of tournaments) {
    const label = `${tournament.name} ${tournament.year}`;

    if ((tournament.participants ?? []).length > 0) {
      console.log(
        `⏭️  ${label}: ya tiene ${tournament.participants.length} participantes — sin cambios`,
      );
      continue;
    }

    const matchdays = await ProdeMatchday.find(
      { tournament: tournament._id },
      { duels: 1 },
    ).lean();

    const playerIds = new Set();
    for (const md of matchdays) {
      for (const duel of md.duels ?? []) {
        if (duel.playerA) playerIds.add(String(duel.playerA));
        if (duel.playerB) playerIds.add(String(duel.playerB));
      }
    }

    if (playerIds.size === 0) {
      console.log(`⚠️  ${label}: sin duelos de los que derivar — se saltea`);
      continue;
    }

    const ids = [...playerIds];
    await ProdeTournament.updateOne(
      { _id: tournament._id },
      { $set: { participants: ids } },
    );

    const names = await ProdePlayer.find(
      { _id: { $in: ids } },
      { name: 1 },
    ).lean();
    console.log(
      `✅ ${label}: ${ids.length} participantes escritos → ${names
        .map((p) => p.name)
        .sort((a, b) => a.localeCompare(b, "es"))
        .join(", ")}`,
    );
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Error en el backfill:", err.message);
  process.exit(1);
});
