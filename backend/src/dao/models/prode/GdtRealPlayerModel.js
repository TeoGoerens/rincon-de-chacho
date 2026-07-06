import mongoose from "mongoose";
import { GDT_POSITIONS } from "./prodeConstants.js";

/* Catálogo de jugadores reales para GDT, agrupado por liga. Cómo se puebla
   (a demanda / carga completa / import API) es una decisión pendiente de la
   Etapa 4 — la estructura es la misma en cualquier caso. */
const gdtRealPlayerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    club: {
      type: String,
      required: true,
      trim: true,
    },
    position: {
      type: String,
      enum: GDT_POSITIONS,
      required: true,
    },
    league: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

gdtRealPlayerSchema.index({ name: 1, club: 1, league: 1 }, { unique: true });
gdtRealPlayerSchema.index({ league: 1, club: 1 });

const GdtRealPlayer = mongoose.model("GdtRealPlayer", gdtRealPlayerSchema);
export default GdtRealPlayer;
