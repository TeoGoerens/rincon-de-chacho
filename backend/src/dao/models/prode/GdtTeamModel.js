import mongoose from "mongoose";
import { PRODE_MONTHS, GDT_DRAFT_STATUSES } from "./prodeConstants.js";

/* Ventana mensual de cambios (máx. 2 por participante, a ciegas). Solo el
   equipo primario las tiene; los suplentes quedan fijos tras su draft. */
const changeWindowSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      enum: PRODE_MONTHS,
      required: true,
    },
    deadline: { type: Date, default: null },
    status: {
      type: String,
      enum: GDT_DRAFT_STATUSES,
      default: "open",
    },
  },
  { _id: false },
);

/* Un "equipo GDT" del torneo (hasta 3: argentino primario + suplentes de
   otras ligas). Cada uno es un universo independiente: su pool de jugadores,
   sus quemados y su draft a ciegas propios. */
const gdtTeamSchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdeTournament",
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    league: {
      type: String,
      required: true,
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    draftStatus: {
      type: String,
      enum: GDT_DRAFT_STATUSES,
      default: "open",
    },
    draftDeadline: {
      type: Date,
      default: null,
    },

    /* Jugadores quemados PARA TODO EL TORNEO en este universo (elegidos por
       4+ participantes en el draft o en una ventana de cambios). */
    burned: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "GdtRealPlayer",
        },
      ],
      default: [],
    },

    changeWindows: {
      type: [changeWindowSchema],
      default: [],
    },
  },
  { timestamps: true },
);

gdtTeamSchema.index({ tournament: 1 });

const GdtTeam = mongoose.model("GdtTeam", gdtTeamSchema);
export default GdtTeam;
