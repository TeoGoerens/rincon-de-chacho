import mongoose from "mongoose";
import { PRODE_MONTHS, GDT_POSITIONS } from "./prodeConstants.js";

/* Slot del plantel: la posición Y el número de slot son estratégicos porque
   los mini-duelos se resuelven slot contra slot. El orden es fijo todo el
   torneo; en un cambio, el entrante hereda el slot del saliente. */
const squadSlotSchema = new mongoose.Schema(
  {
    slotNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 11,
    },
    position: {
      type: String,
      enum: GDT_POSITIONS,
      required: true,
    },
    realPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GdtRealPlayer",
      required: true,
    },
  },
  { _id: false },
);

/* Plantel de un participante en un equipo GDT, VERSIONADO POR MES:
   la fecha de un mes se calcula con la versión de ese mes, "máx. 2 cambios"
   se valida comparando versiones consecutivas, y el saliente queda ocupado
   hasta el mes siguiente. Equipos suplentes (fijos): una sola versión con
   month = null. */
const gdtSquadSchema = new mongoose.Schema(
  {
    gdtTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GdtTeam",
      required: true,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      required: true,
    },
    month: {
      type: String,
      enum: [...PRODE_MONTHS, null],
      default: null,
    },
    slots: {
      type: [squadSlotSchema],
      default: [],
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length <= 11;
        },
        message: "A squad cannot have more than 11 slots",
      },
    },
    status: {
      type: String,
      enum: ["pending", "final"],
      default: "pending",
    },
    submittedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

gdtSquadSchema.index({ gdtTeam: 1, player: 1, month: 1 }, { unique: true });

const GdtSquad = mongoose.model("GdtSquad", gdtSquadSchema);
export default GdtSquad;
