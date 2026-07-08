import mongoose from "mongoose";
import prodeItemSchema from "./schemas/prodeItemSchema.js";
import { MATCHDAY_PHASES } from "./prodeConstants.js";

/* -------- Challenge -------- */
const challengeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["GDT", "ARG", "MISC"],
      required: true,
    },

    // ✅ Fixture: opcionales
    scoreA: { type: Number, default: null },
    scoreB: { type: Number, default: null },

    // ✅ Se calcula cuando está played (o lo podés setear manual si querés)
    result: {
      type: String,
      enum: ["A", "B", "draw"],
      default: null,
    },
  },
  { _id: false },
);

/* -------- Duel -------- */
const duelSchema = new mongoose.Schema(
  {
    playerA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      required: true,
    },
    playerB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      required: true,
    },

    // ✅ Siempre 3 challenges, pero los scores pueden venir vacíos si scheduled
    challenges: {
      type: [challengeSchema],
      required: true,
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length === 3;
        },
        message: "Each duel must have exactly 3 challenges",
      },
    },

    // ✅ Se calcula cuando played
    duelResult: {
      type: String,
      enum: ["A", "B", "draw"],
      default: null,
    },

    // ✅ Defaults para no forzar results en fixture
    points: {
      playerA: { type: Number, default: 0 },
      playerB: { type: Number, default: 0 },
      bonusA: { type: Number, default: 0 },
      bonusB: { type: Number, default: 0 },
    },
  },
  { _id: false },
);

/* -------- Matchday -------- */
const prodeMatchdaySchema = new mongoose.Schema(
  {
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdeTournament",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    roundNumber: {
      type: Number,
      required: true,
    },

    /* Ciclo de vida de la fecha (rebuild 2026). Única fuente de verdad del
       estado: el campo legacy `status` (scheduled/played) fue retirado y las
       fechas históricas reciben phase:"consolidated" vía script de backfill. */
    phase: {
      type: String,
      enum: MATCHDAY_PHASES,
      default: "draft",
    },

    /* Deadline oficial de carga de pronósticos, lo fija el admin al crear. */
    predictionsDeadline: {
      type: Date,
      default: null,
    },

    /* Recordatorios de deadline ya enviados (cron cada 15 min). Persistidos
       en Mongo para que un reinicio del proceso nunca duplique el mail. */
    reminder24SentAt: {
      type: Date,
      default: null,
    },
    reminder3SentAt: {
      type: Date,
      default: null,
    },

    /* Partidos y preguntas de ARG + MISC (schema compartido). */
    items: {
      type: [prodeItemSchema],
      default: [],
    },

    /* Con qué equipo GDT se juega esta fecha. */
    gdtTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GdtTeam",
      default: null,
    },

    /* Puntaje GDT por jugador real: se carga UNA vez y se replica en todos
       los planteles que lo incluyen. */
    gdtScores: {
      type: [
        {
          _id: false,
          realPlayer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GdtRealPlayer",
            required: true,
          },
          points: { type: Number, required: true },
        },
      ],
      default: [],
    },

    /* Participantes con la carga reabierta por el admin post-deadline.
       Los ítems con kickoff pasado igual quedan bloqueados para ellos. */
    reopenedFor: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProdePlayer",
        },
      ],
      default: [],
    },

    // ✅ Fixture permitido: puede estar vacío al crear
    duels: {
      type: [duelSchema],
      default: [],
    },
  },
  { timestamps: true },
);

prodeMatchdaySchema.index({ tournament: 1, roundNumber: 1 });

const ProdeMatchday = mongoose.model("ProdeMatchday", prodeMatchdaySchema);
export default ProdeMatchday;
