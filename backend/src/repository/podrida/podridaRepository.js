import mongoose from "mongoose";
import User from "../../dao/models/userModel.js";
import PodridaPlayer from "../../dao/models/podrida/podridaPlayerModel.js";
import PodridaMatch from "../../dao/models/podrida/podridaMatchModel.js";
import baseRepository from "../baseRepository.js";

import { sendBulkEmail } from "../../helpers/sendBulkEmail.js";
import {
  calculateMostWins,
  calculateMostLastPlaces,
  calculateMostHighlights,
  calculateHighestHighlight,
  calculateLongestStreakOnTime,
  calculateLongestStreakFailing,
  calculateHighestSingleScore,
  calculateLowestSingleScore,
  calculateDroughtSinceFirstPlace,
  calculateDroughtSinceLastPlace,
  calculateRanking,
  calculatePlayerProfiles,
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

    return await PodridaPlayer.create({ name, email });
  };

  /* --------------- GET ALL PODRIDA PLAYERS --------------- */
  getAllPodridaPlayers = async () => {
    return await PodridaPlayer.find().sort({ name: 1 });
  };

  /* --------------- CREATE PODRIDA MATCH --------------- */
  createPodridaMatch = async (matchData) => {
    const { date, players, highlight, longestStreakOnTime, longestStreakFailing } = matchData;

    const allPlayerIds = [
      ...players.map((p) => p.player),
      highlight.player,
      longestStreakOnTime.player,
      longestStreakFailing.player,
    ];

    const uniquePlayerIds = [...new Set(allPlayerIds.map((id) => id.toString()))];
    const existingPlayers = await PodridaPlayer.find({ _id: { $in: uniquePlayerIds } });

    if (existingPlayers.length !== uniquePlayerIds.length) {
      throw new Error("One or more player IDs are invalid");
    }

    return await PodridaMatch.create({ date, players, highlight, longestStreakOnTime, longestStreakFailing });
  };

  /* --------------- GET LAST PODRIDA MATCH --------------- */
  getLastPodridaMatch = async () => {
    const lastMatch = await PodridaMatch.findOne({})
      .sort({ date: -1 })
      .populate("players.player")
      .populate("highlight.player")
      .populate("longestStreakOnTime.player")
      .populate("longestStreakFailing.player");

    if (!lastMatch) throw new Error("No matches found in the database");

    const playerIds = lastMatch.players.map((p) => p.player._id);
    const users = await User.find(
      { podrida_player: { $in: playerIds } },
      { podrida_player: 1, profile_picture: 1 }
    );
    const playerPictures = Object.fromEntries(
      users.map((u) => [u.podrida_player.toString(), u.profile_picture])
    );

    return { lastMatch, playerPictures };
  };

  /* --------------- GET ALL PODRIDA MATCHES --------------- */
  getAllPodridaMatches = async () => {
    return await PodridaMatch.find({})
      .sort({ date: -1 })
      .populate("players.player")
      .populate("highlight.player")
      .populate("longestStreakOnTime.player")
      .populate("longestStreakFailing.player");
  };

  /* --------------- GET PODRIDA STATS --------------- */
  getPodridaStats = async () => {
    const matches = await PodridaMatch.find({})
      .sort({ date: 1 })
      .populate("players.player")
      .populate("highlight.player")
      .populate("longestStreakOnTime.player")
      .populate("longestStreakFailing.player");

    if (!matches.length) throw new Error("No matches found in the database");

    // --- Dominio histórico ---
    // --- Noches épicas ---
    // --- Sequías ---
    const records = [
      { group: "dominio",  title: "Más partidas ganadas",              type: "positivo", top: calculateMostWins(matches) },
      { group: "dominio",  title: "Más últimos puestos",               type: "negativo", top: calculateMostLastPlaces(matches) },
      { group: "dominio",  title: "Más highlights acumulados",         type: "positivo", top: calculateMostHighlights(matches) },
      { group: "epicas",   title: "Mayor highlight en una partida",    type: "positivo", top: calculateHighestHighlight(matches) },
      { group: "epicas",   title: "Racha más larga cumpliendo",        type: "positivo", top: calculateLongestStreakOnTime(matches) },
      { group: "epicas",   title: "Racha más larga sin cumplir",       type: "negativo", top: calculateLongestStreakFailing(matches) },
      { group: "epicas",   title: "Máximo puntaje en una partida",     type: "positivo", top: calculateHighestSingleScore(matches) },
      { group: "epicas",   title: "Mínimo puntaje en una partida",     type: "negativo", top: calculateLowestSingleScore(matches) },
      { group: "sequias",  title: "Más partidas sin salir último",     type: "positivo", top: calculateDroughtSinceLastPlace(matches) },
      { group: "sequias",  title: "Más partidas sin ganar",            type: "negativo", top: calculateDroughtSinceFirstPlace(matches) },
    ];

    const playerProfiles = calculatePlayerProfiles(matches);

    // Partidas por año para gráfico de actividad
    const yearlyActivity = Object.entries(
      matches.reduce((acc, m) => {
        const year = new Date(m.date).getFullYear();
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {})
    )
      .map(([year, count]) => ({ year: parseInt(year), count }))
      .sort((a, b) => a.year - b.year);

    return { records, players: playerProfiles, yearlyActivity };
  };

  /* --------------- GET PODRIDA RANKING --------------- */
  getRanking = async (year) => {
    let matches;

    if (year && year !== "all") {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${parseInt(year) + 1}-01-01`);
      matches = await PodridaMatch.find({ date: { $gte: start, $lt: end } })
        .populate("players.player")
        .populate("highlight.player");
    } else {
      matches = await PodridaMatch.find()
        .populate("players.player")
        .populate("highlight.player");
    }

    const allMatchesMeta = await PodridaMatch.find({}, { date: 1 }).lean();
    const totalMatches = allMatchesMeta.length;
    const availableYears = [
      ...new Set(allMatchesMeta.map((m) => new Date(m.date).getFullYear())),
    ].sort((a, b) => b - a);

    return {
      ranking: calculateRanking(matches),
      totalMatches,
      filteredMatches: matches.length,
      availableYears,
    };
  };

  /* --------------- DELETE PODRIDA MATCH --------------- */
  deletePodridaMatch = async (id) => {
    const match = await PodridaMatch.findById(id);
    if (!match) return null;
    await match.deleteOne();
    return match;
  };

  /* --------------- UPDATE PODRIDA MATCH --------------- */
  updatePodridaMatch = async (matchId, matchData) => {
    const match = await PodridaMatch.findById(matchId);
    if (!match) throw new Error("La partida no existe");

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
    if (!player) throw new Error("Jugador no encontrado");

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
