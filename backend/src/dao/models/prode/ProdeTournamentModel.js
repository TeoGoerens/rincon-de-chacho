import mongoose from "mongoose";

const monthlyWinnerSchema = new mongoose.Schema(
  {
    month: {
      type: String,
      required: true,
      enum: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ],
    },
    winnerPlayerIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProdePlayer",
          required: true,
        },
      ],
      required: true,
      validate: {
        validator: function (arr) {
          return Array.isArray(arr) && arr.length === 4;
        },
        message: "winnerPlayerIds must have exactly 4 players",
      },
    },

    monthlyLoser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      default: null, // Puede no haber perdedor cargado aún
    },

    note: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const prodeTournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    months: {
      type: [String],
      required: true,
      enum: [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ],
    },
    status: {
      type: String,
      enum: ["draft", "active", "finished"],
      default: "draft",
    },
    champion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      default: null,
    },
    lastPlace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProdePlayer",
      default: null,
    },

    monthlyWinners: {
      type: [monthlyWinnerSchema],
      default: [],
    },

    /* Participantes habilitados a jugar este torneo (rebuild 2026).
       Los torneos históricos quedan con [] y las estadísticas no lo usan. */
    participants: {
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

const ProdeTournament = mongoose.model(
  "ProdeTournament",
  prodeTournamentSchema,
);

export default ProdeTournament;
