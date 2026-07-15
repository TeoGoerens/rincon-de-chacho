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
    /* Reapertura por participante de una ventana YA cerrada (excepción
       discrecional del admin, one-shot): el reabierto edita su versión del
       mes viendo todo — sin ciego ni quemas — dentro del tope de 2 cambios
       totales del mes y con los salientes de la ventana igualmente vedados */
    reopenedFor: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProdePlayer",
        },
      ],
      default: [],
    },
  },
  { _id: false },
);

/* Un "universo GDT" del torneo (hasta 3: argentino primario + suplentes de
   otras ligas). Cada uno es un universo independiente: su pool de jugadores,
   sus quemados y su draft a ciegas propios. */
const gdtUniverseSchema = new mongoose.Schema(
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
    /* ID de la liga en el sportsProvider: habilita el import del pool
       dentro del universo (decisión pool-por-universo, 2026-07-10) */
    leagueProviderId: {
      type: String,
      default: null,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    /* Nace en setup (el admin prepara el pool); pasa a "open" cuando el
       admin ABRE el draft explícitamente (fija deadline + mail) */
    draftStatus: {
      type: String,
      enum: GDT_DRAFT_STATUSES,
      default: "setup",
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

    /* CORRECCIÓN habilitada por el admin (one-shot): tras corregir un error
       de DATOS del pool (posición/club que la API trajo mal), el afectado
       repone SOLO sus slots inconsistentes, sin gastar cambios mensuales.
       Distinto del bloqueo (transferencia real = sanción) y de la
       reapertura de ventana (cambios estratégicos). */
    correctionsFor: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProdePlayer",
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

gdtUniverseSchema.index({ tournament: 1 });

const GdtUniverse = mongoose.model("GdtUniverse", gdtUniverseSchema);
export default GdtUniverse;
