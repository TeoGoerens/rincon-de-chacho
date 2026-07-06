import mongoose from "mongoose";
import {
  PRODE_CHALLENGES,
  ITEM_KINDS,
  ITEM_SOURCES,
  ITEM_STATUSES,
} from "../prodeConstants.js";

/* Ítem pronosticable de una fecha. ARG y MISC comparten este schema:
   la pertenencia a uno u otro desafío es puramente temática (challenge). */
const prodeItemSchema = new mongoose.Schema({
  challenge: {
    type: String,
    enum: PRODE_CHALLENGES.filter((c) => c !== "GDT"),
    required: true,
  },
  kind: {
    type: String,
    enum: ITEM_KINDS,
    required: true,
  },
  status: {
    type: String,
    enum: ITEM_STATUSES,
    default: "scheduled",
  },

  /* ---- kind: "match" ---- */
  source: {
    type: String,
    enum: ITEM_SOURCES,
    default: "manual",
  },
  providerEventId: { type: String, default: null },
  leagueName: { type: String, default: "", trim: true },
  homeName: { type: String, default: "", trim: true },
  awayName: { type: String, default: "", trim: true },
  kickoffAt: { type: Date, default: null },
  scoreHome: { type: Number, default: null },
  scoreAway: { type: Number, default: null },
  pointsHome: { type: Number, default: 5 },
  pointsDraw: { type: Number, default: 5 },
  pointsAway: { type: Number, default: 5 },

  /* ---- kind: "question" ---- */
  questionText: { type: String, default: "", trim: true },
  officialAnswer: { type: String, default: "", trim: true },
  pointsCorrect: { type: Number, default: 5 },
});

export default prodeItemSchema;
