import mongoose from "mongoose";
import { PICK_1X2 } from "./prodeConstants.js";

/* Un pick por ítem de la fecha. pick1x2 y marcador exacto son INDEPENDIENTES
   (regla de negocio: pueden ser deliberadamente inconsistentes para
   diversificar y se puntúan por separado). */
const pickSchema = new mongoose.Schema(
  {
    /* _id del ítem embebido en ProdeMatchday.items */
    item: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    /* ---- kind: "match" ---- */
    pick1x2: {
      type: String,
      enum: [...PICK_1X2, null],
      default: null,
    },
    predictedHome: { type: Number, default: null },
    predictedAway: { type: Number, default: null },

    /* ---- kind: "question" ---- */
    answerText: { type: String, default: "", trim: true },
    /* Arbitraje manual del admin sobre la respuesta (null = sin arbitrar). */
    isCorrect: { type: Boolean, default: null },
  },
  { _id: false },
);

/* Un documento por participante por fecha. Los puntos NO se guardan por pick:
   los parciales se calculan al vuelo y los definitivos se escriben en
   duels[].challenges durante la consolidación (única fuente de verdad). */
const prodePredictionSchema = new mongoose.Schema(
  {
    matchday: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdeMatchday",
      required: true,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      required: true,
    },
    picks: {
      type: [pickSchema],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

prodePredictionSchema.index({ matchday: 1, player: 1 }, { unique: true });
prodePredictionSchema.index({ player: 1 });

const ProdePrediction = mongoose.model(
  "ProdePrediction",
  prodePredictionSchema,
);

export default ProdePrediction;
