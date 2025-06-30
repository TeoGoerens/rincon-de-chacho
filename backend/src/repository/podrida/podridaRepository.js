import mongoose from "mongoose";
import User from "../../dao/models/userModel.js";
import PodridaPlayer from "../../dao/models/podrida/podridaPlayerModel.js";
import PodridaMatch from "../../dao/models/podrida/podridaMatchModel.js";
import baseRepository from "../baseRepository.js";

// Helper para enviar correos
import { sendBulkEmail } from "../../helpers/sendBulkEmail.js";
import {
  calculateMostWins,
  calculateMostLastPlaces,
  calculateBestWinRatio,
  calculateLongestStreakOnTime,
  calculateLongestStreakFailing,
  calculateHighestHighlight,
  calculateLongestTimeSinceFirstPlace,
  calculateLongestTimeSinceLastPlace,
  calculateHighestSingleScore,
  calculateLowestSingleScore,
  calculateRanking,
} from "../../helpers/podrida/recordCalculators.js";

export default class PodridaRepository extends baseRepository {
  constructor() {
    super(PodridaPlayer);
  }

  /* --------------- CREATE PODRIDA PLAYER --------------- */
  createPodridaPlayer = async (data) => {
    const { name, email } = data;

    const existingPlayer = await PodridaPlayer.findOne({ name });
    if (existingPlayer) {
      throw new Error("A player with this name already exists");
    }

    const newPlayer = await PodridaPlayer.create({ name, email });
    return newPlayer;
  };

  /* --------------- GET ALL PODRIDA PLAYERS --------------- */
  getAllPodridaPlayers = async () => {
    const players = await PodridaPlayer.find().sort({ name: 1 });
    return players;
  };

  /* --------------- CREATE PODRIDA MATCH --------------- */
  createPodridaMatch = async (matchData) => {
    const {
      date,
      players,
      highlight,
      longestStreakOnTime,
      longestStreakFailing,
    } = matchData;

    // Validar que todos los IDs de jugadores existan
    const allPlayerIds = [
      ...players.map((p) => p.player),
      highlight.player,
      longestStreakOnTime.player,
      longestStreakFailing.player,
    ];

    const uniquePlayerIds = [
      ...new Set(allPlayerIds.map((id) => id.toString())),
    ];

    const existingPlayers = await PodridaPlayer.find({
      _id: { $in: uniquePlayerIds },
    });

    if (existingPlayers.length !== uniquePlayerIds.length) {
      throw new Error("One or more player IDs are invalid");
    }

    // Crear y guardar el match
    const newMatch = await PodridaMatch.create({
      date,
      players,
      highlight,
      longestStreakOnTime,
      longestStreakFailing,
    });

    return newMatch;
  };

  /* --------------- GET LAST PODRIDA MATCH --------------- */
  getLastPodridaMatch = async () => {
    const lastMatch = await PodridaMatch.findOne({})
      .sort({ date: -1 }) // ordenar por fecha descendente
      .populate("players.player")
      .populate("highlight.player")
      .populate("longestStreakOnTime.player")
      .populate("longestStreakFailing.player");

    if (!lastMatch) {
      throw new Error("No matches found in the database");
    }

    return lastMatch;
  };

  /* --------------- GET PODRIDA MATCH BY YEAR --------------- */
  getMatchesByYear = async (year) => {
    // Rango de fechas del año completo
    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const matches = await PodridaMatch.find({
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: -1 })
      .populate("players.player")
      .populate("highlight.player")
      .populate("longestStreakOnTime.player")
      .populate("longestStreakFailing.player");

    return matches;
  };

  /* --------------- GET ALL PODRIDA MATCHES --------------- */
  getAllPodridaMatches = async () => {
    const matches = await PodridaMatch.find({})
      .sort({ date: -1 })
      .populate("players.player")
      .populate("highlight.player")
      .populate("longestStreakOnTime.player")
      .populate("longestStreakFailing.player");

    return matches;
  };

  /* --------------- GET PODRIDA RECORDS --------------- */
  getPodridaRecords = async (year) => {
    let matchFilter = {};

    if (year) {
      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 3000) {
        throw new Error("Invalid year provided");
      }

      matchFilter.date = {
        $gte: new Date(`${year}-01-01`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`),
      };
    }

    const matches = await PodridaMatch.find(matchFilter)
      .populate("players.player")
      .populate("highlight.player")
      .populate("longestStreakOnTime.player")
      .populate("longestStreakFailing.player");

    if (!matches.length) {
      throw new Error("No matches found for the given filter");
    }

    // Buscamos todos los jugadores registrados para evaluar las rachas mas largas sin salir primero y ultimo
    const players = await PodridaPlayer.find();

    // Acá más adelante vamos a calcular todos los records
    return [
      {
        title: "🎯 Más partidas ganadas",
        type: "positivo",
        name: calculateMostWins(matches).name,
        value: calculateMostWins(matches).value,
      },
      {
        title: "💀 Más últimos puestos",
        type: "negativo",
        name: calculateMostLastPlaces(matches).name,
        value: calculateMostLastPlaces(matches).value,
      },
      {
        title: "🏆 Mejor ratio de victorias",
        type: "positivo",
        name: calculateBestWinRatio(matches).name,
        value: calculateBestWinRatio(matches).value,
      },
      {
        title: "🔥 Racha más larga cumpliendo",
        type: "positivo",
        name: calculateLongestStreakOnTime(matches).name,
        value: calculateLongestStreakOnTime(matches).value,
      },
      {
        title: "🧊 Racha más larga sin cumplir",
        type: "negativo",
        name: calculateLongestStreakFailing(matches).name,
        value: calculateLongestStreakFailing(matches).value,
      },
      {
        title: "🌟 Mayor highlight",
        type: "positivo",
        name: calculateHighestHighlight(matches).name,
        value: calculateHighestHighlight(matches).value,
      },
      {
        title: "⌛ Días sin ganar",
        type: "negativo",
        name: calculateLongestTimeSinceFirstPlace(matches, players).name,
        value: calculateLongestTimeSinceFirstPlace(matches, players).value,
      },
      {
        title: "💪 Días sin salir último",
        type: "positivo",
        name: calculateLongestTimeSinceLastPlace(matches, players).name,
        value: calculateLongestTimeSinceLastPlace(matches, players).value,
      },
      {
        title: "🚀 Máximo puntaje en una partida",
        type: "positivo",
        name: calculateHighestSingleScore(matches).name,
        value: calculateHighestSingleScore(matches).value,
      },
      {
        title: "🐢 Mínimo puntaje en una partida",
        type: "negativo",
        name: calculateLowestSingleScore(matches).name,
        value: calculateLowestSingleScore(matches).value,
      },
    ];
  };

  /* --------------- GET PODRIDA RANKING --------------- */
  getRanking = async (year) => {
    let matches;

    if (year && year !== "all") {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${parseInt(year) + 1}-01-01`);
      matches = await PodridaMatch.find({
        date: { $gte: start, $lt: end },
      })
        .populate("players.player")
        .populate("highlight.player");
    } else {
      matches = await PodridaMatch.find()
        .populate("players.player")
        .populate("highlight.player");
    }

    return calculateRanking(matches);
  };

  /* --------------- DELETE PODRIDA MATCH --------------- */
  deletePodridaMatch = async (id) => {
    const match = await PodridaMatch.findById(id);

    if (!match) {
      return null;
    }

    await match.deleteOne();
    return match;
  };

  /* --------------- UPDATE PODRIDA MATCH --------------- */
  updatePodridaMatch = async (matchId, matchData) => {
    const match = await PodridaMatch.findById(matchId);
    if (!match) {
      throw new Error("La partida no existe");
    }

    // Actualizamos los campos principales
    match.date = matchData.date;
    match.players = matchData.players;
    match.highlight = matchData.highlight;
    match.longestStreakOnTime = matchData.longestStreakOnTime;
    match.longestStreakFailing = matchData.longestStreakFailing;

    await match.save();
    return match;
  };

  /* --------------- GET PODRIDA MATCH BY ID --------------- */
  getPodridaMatchById = async (id) => {
    return await PodridaMatch.findById(id)
      .populate("players.player")
      .populate("highlight.player")
      .populate("longestStreakOnTime.player")
      .populate("longestStreakFailing.player");
  };

  /* --------------- GET PLAYER BY ID --------------- */
  getPodridaPlayerById = async (id) => {
    return await PodridaPlayer.findById(id);
  };

  /* --------------- UPDATE PLAYER --------------- */
  updatePodridaPlayer = async (id, data) => {
    const player = await PodridaPlayer.findById(id);
    if (!player) {
      throw new Error("Jugador no encontrado");
    }

    player.name = data.name;
    player.email = data.email;

    await player.save();
    return player;
  };

  /* --------------- DELETE PLAYER --------------- */
  deletePodridaPlayer = async (id) => {
    const player = await PodridaPlayer.findById(id);
    if (!player) return null;

    await player.deleteOne();
    return player;
  };
}
