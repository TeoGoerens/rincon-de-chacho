/* Backfill de `phase` en fechas de Prode históricas (rebuild 2026).
 *
 * Las fechas creadas antes del rebuild tienen el campo legacy `status`
 * (scheduled/played) y no tienen `phase`. Este script les escribe la phase
 * equivalente SIN modificar ni borrar ningún campo existente:
 *   - status "played"  → phase "consolidated"
 *   - resto sin phase  → phase "draft"
 *
 * Es idempotente: solo toca documentos que aún no tienen `phase`, por lo que
 * puede correrse las veces que haga falta.
 *
 * Uso (el target es OBLIGATORIO, no hay default):
 *   node src/scripts/backfillProdeMatchdayPhase.js --target=dev
 *   node src/scripts/backfillProdeMatchdayPhase.js --target=prod
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

  /* Colección nativa: el campo legacy `status` ya no existe en el schema de
     Mongoose, así que operamos directo sobre los documentos crudos. */
  const collection = mongoose.connection.collection("prodematchdays");

  const total = await collection.countDocuments();
  const sinPhase = await collection.countDocuments({
    phase: { $exists: false },
  });
  console.log(`📊 Fechas totales: ${total} — sin phase: ${sinPhase}`);

  const played = await collection.updateMany(
    { phase: { $exists: false }, status: "played" },
    { $set: { phase: "consolidated" } },
  );
  const rest = await collection.updateMany(
    { phase: { $exists: false } },
    { $set: { phase: "draft" } },
  );

  console.log(
    `✅ Backfill listo: ${played.modifiedCount} fechas → "consolidated", ${rest.modifiedCount} fechas → "draft"`,
  );

  const verificacion = await collection
    .aggregate([{ $group: { _id: "$phase", count: { $sum: 1 } } }])
    .toArray();
  console.log("📋 Distribución final de phase:", JSON.stringify(verificacion));

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Error en el backfill:", err.message);
  process.exit(1);
});
