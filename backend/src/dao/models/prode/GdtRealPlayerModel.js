import mongoose from "mongoose";
import { GDT_POSITIONS } from "./prodeConstants.js";

/* POOL de jugadores reales de un universo GDT (decisión canónica 2026-07-10:
   pool por universo, no catálogo global). Se puebla importando los planteles
   de la liga DENTRO del universo (foto fresca por torneo) + altas manuales
   del admin scoped al universo. Los participantes NUNCA crean jugadores:
   eligen de acá — la identidad única del registro es lo que hace funcionar
   las quemas. providerPlayerId da identidad cross-torneo para stats. */
const gdtRealPlayerSchema = new mongoose.Schema(
  {
    gdtUniverse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GdtUniverse",
      required: true,
    },
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
    /* null = importado con posición no mapeable: queda en el pool para que
       el admin la complete (nunca se descarta un jugador del import). Un
       jugador sin posición no es elegible en el draft. */
    position: {
      type: String,
      enum: [...GDT_POSITIONS, null],
      default: null,
    },
    league: {
      type: String,
      required: true,
      trim: true,
    },
    /* null = alta manual del admin; con valor = vino del import */
    providerPlayerId: {
      type: String,
      default: null,
    },
    nationality: {
      type: String,
      default: "",
      trim: true,
    },
    photoUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

/* Unicidad DENTRO del universo: el mismo jugador puede (y debe poder)
   existir en universos de torneos distintos como registros separados */
gdtRealPlayerSchema.index({ gdtUniverse: 1, name: 1, club: 1 }, { unique: true });
gdtRealPlayerSchema.index({ gdtUniverse: 1, club: 1 });

const GdtRealPlayer = mongoose.model("GdtRealPlayer", gdtRealPlayerSchema);
export default GdtRealPlayer;
