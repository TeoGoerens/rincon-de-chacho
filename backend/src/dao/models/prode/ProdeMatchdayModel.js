import mongoose from "mongoose";

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
    status: {
      type: String,
      enum: ["scheduled", "played"],
      default: "scheduled",
    },

    // ✅ Fixture permitido: puede estar vacío al crear
    duels: {
      type: [duelSchema],
      default: [],
    },
  },
  { timestamps: true },
);

const ProdeMatchday = mongoose.model("ProdeMatchday", prodeMatchdaySchema);
export default ProdeMatchday;
