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
    /* BLOQUEO PUNTUAL del admin (regla canónica): un conflicto sobrevenido
       por el mercado de pases (transferencia a un club del que el dueño ya
       tiene otro jugador) no se corrige — se sanciona: el jugador bloqueado
       suma 0 en los mini-duelos mientras dure. Reversible, discrecional. */
    blocked: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

/* Plantel de un participante en un universo GDT, VERSIONADO POR MES:
   la fecha de un mes se calcula con la versión de ese mes, "máx. 2 cambios"
   se valida comparando versiones consecutivas, y el saliente queda ocupado
   hasta el mes siguiente. Equipos suplentes (fijos): una sola versión con
   month = null. */
const gdtSquadSchema = new mongoose.Schema(
  {
    gdtUniverse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GdtUniverse",
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
    /* Staging A CIEGAS de elecciones pendientes de cierre — jamás se
       expone a otros participantes. Lo usan DOS procesos que nunca se
       superponen en el tiempo: las rondas de reemplazo del draft (sobre la
       versión base) y los cambios de la ventana mensual (sobre la versión
       vigente). Al cerrar, se aplican o se descartan si el entrante se
       quema por colisión de 4+. */
    pendingReplacements: {
      type: [
        {
          slotNumber: { type: Number, required: true, min: 1, max: 11 },
          realPlayer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GdtRealPlayer",
            required: true,
          },
          _id: false,
        },
      ],
      default: [],
    },

    /* "Confirmar sin cambios": acción expresa y OPCIONAL del participante
       durante la ventana — informativa, para que el admin distinga
       "decidió no cambiar" de "no entró" y pueda cerrar anticipado */
    windowNoChanges: {
      type: Boolean,
      default: false,
    },

    /* Slots cuyo cambio de ventana fue DESCARTADO por una quema nueva al
       cerrar: sus dueños re-eligen a ciegas en la ronda de la ventana
       (vive en la versión del MES creada al primer cierre) */
    windowRetrySlots: {
      type: [{ type: Number, min: 1, max: 11 }],
      default: [],
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

gdtSquadSchema.index({ gdtUniverse: 1, player: 1, month: 1 }, { unique: true });

const GdtSquad = mongoose.model("GdtSquad", gdtSquadSchema);
export default GdtSquad;
