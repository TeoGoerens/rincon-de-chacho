/* Reset del pool GDT (paso 4.2 del rebuild, decisión pool-por-universo).
 *
 * El 4.1 creó jugadores SIN gdtUniverse y un índice único viejo
 * {name, club, league} que Mongo conserva aunque el schema cambió.
 * Este script dropea la colección completa (documentos + índices);
 * Mongoose la recrea con los índices nuevos en el próximo uso.
 *
 * SEGURO mientras el GDT no esté en producción: la colección solo tiene
 * datos de prueba del import del 4.1. NO tocar una vez que existan
 * planteles/quemas reales.
 *
 * Uso (el target es OBLIGATORIO, no hay default):
 *   node src/scripts/resetGdtRealPlayers.js --target=dev
 *   node src/scripts/resetGdtRealPlayers.js --target=prod
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
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
  console.log(`✅ Conectado a la base de datos (${target})`);

  const collection = mongoose.connection.collection("gdtrealplayers");
  const total = await collection.countDocuments();

  /* Guardia dura: si algún plantel ya referencia jugadores, NO se resetea */
  const squads = await mongoose.connection
    .collection("gdtsquads")
    .countDocuments();
  if (squads > 0) {
    console.error(
      `❌ Hay ${squads} plantel(es) GDT en la base: el pool ya tiene historia y no puede resetearse.`,
    );
    process.exit(1);
  }

  await collection.drop().catch((error) => {
    if (error.codeName === "NamespaceNotFound") {
      console.log("ℹ La colección no existía, nada que borrar.");
      return;
    }
    throw error;
  });

  console.log(
    `🧹 Colección gdtrealplayers eliminada (${total} documentos + índices viejos).`,
  );
  console.log(
    "Mongoose la recrea con los índices nuevos en el próximo uso del pool.",
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("ERROR:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
