/* Drop del índice único LEGACY de gdtsquads (rename GdtTeam→GdtUniverse).
 *
 * El modelo viejo creó el índice único {gdtTeam, player, month}. Tras el
 * rename, los documentos usan gdtUniverse y para el índice viejo TODOS
 * valen gdtTeam: null → el segundo plantel de un mismo participante
 * (otro universo, mismo month null) choca con E11000 aunque sea válido.
 *
 * Este script borra SOLO los índices cuya clave incluya gdtTeam; los
 * documentos y el índice nuevo {gdtUniverse, player, month} quedan
 * intactos (Mongoose lo crea/mantiene vía autoIndex). Idempotente.
 *
 * Uso (el target es OBLIGATORIO, no hay default):
 *   node src/scripts/dropLegacyGdtSquadIndex.js --target=dev
 *   node src/scripts/dropLegacyGdtSquadIndex.js --target=prod   ← al deployar la Etapa 4
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

  const collection = mongoose.connection.collection("gdtsquads");

  let indexes;
  try {
    indexes = await collection.indexes();
  } catch (error) {
    if (error.codeName === "NamespaceNotFound") {
      console.log("ℹ La colección gdtsquads no existe todavía, nada que hacer.");
      await mongoose.disconnect();
      return;
    }
    throw error;
  }

  const legacy = indexes.filter((idx) =>
    Object.keys(idx.key).includes("gdtTeam"),
  );

  if (legacy.length === 0) {
    console.log("ℹ No hay índices legacy con gdtTeam, nada que borrar.");
  } else {
    for (const idx of legacy) {
      await collection.dropIndex(idx.name);
      console.log(`🧹 Índice legacy eliminado: ${idx.name}`);
    }
  }

  const remaining = await collection.indexes();
  console.log(
    "Índices vigentes:",
    remaining.map((idx) => idx.name).join(", "),
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("ERROR:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
