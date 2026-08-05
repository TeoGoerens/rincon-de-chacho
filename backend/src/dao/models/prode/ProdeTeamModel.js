import mongoose from "mongoose";

/* Equipos del Gran DT con su identidad EDITABLE por el admin.
   Existe por LIGA y no por universo: cada torneo crea universos nuevos, así
   que scopearlo por universo obligaría a recargar los mismos códigos todos
   los torneos. La liga, en cambio, es estable.

   apiName es el nombre tal cual lo devuelve el proveedor y NO se edita nunca:
   es la clave con la que GdtRealPlayer.club guarda el equipo, la que usa la
   regla 1-por-club y contra la que compara el detector de transferencias.
   Editarlo desvincularía al equipo de todos sus jugadores. */
const prodeTeamSchema = new mongoose.Schema(
  {
    league: {
      type: String,
      required: true,
      trim: true,
    },
    /* Nombre del proveedor: clave de vínculo, solo lectura para el admin */
    apiName: {
      type: String,
      required: true,
      trim: true,
    },
    /* Lo que se muestra en el sitio. Nace igual al apiName y el admin lo
       acorta ("Central Córdoba de Santiago del Estero" → "Central Córdoba") */
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    /* Código de 3 letras que define el admin a mano. Vacío = todavía sin
       asignar: la UI muestra el nombre solo, nunca un "(???)" */
    code: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
  },
  { timestamps: true },
);

prodeTeamSchema.index({ league: 1, apiName: 1 }, { unique: true });

/* Códigos únicos DENTRO de la liga, no globales: San Lorenzo y Santos pueden
   querer "SAN" cada uno en su liga. Una fecha corre sobre un solo universo y
   por lo tanto una sola liga, así que nunca conviven en la misma pantalla.
   partialFilterExpression: los equipos sin código todavía no colisionan. */
prodeTeamSchema.index(
  { league: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: { code: { $gt: "" } },
  },
);

const ProdeTeam = mongoose.model("ProdeTeam", prodeTeamSchema);
export default ProdeTeam;
