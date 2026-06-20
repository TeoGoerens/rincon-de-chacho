import mongoose from "mongoose";
import User from "../../dao/models/userModel.js";
import PodridaPlayer from "../../dao/models/podrida/podridaPlayerModel.js";
import PodridaMatch from "../../dao/models/podrida/podridaMatchModel.js";
import baseRepository from "../baseRepository.js";

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
  calculatePlayerDroughts,
  calculatePlayerByYear,
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

    // Build name → playerId map directly from the PodridaPlayer collection
    // (es la fuente de verdad: pocos documentos, nombres únicos, no cambia por partida)
    const allPodridaPlayers = await PodridaPlayer.find({}, { name: 1 });
    const nameToPlayerId = Object.fromEntries(
      allPodridaPlayers.map((p) => [p.name, p._id.toString()])
    );

    const playerObjectIds = Object.values(nameToPlayerId).map((id) => new mongoose.Types.ObjectId(id));
    const usersWithPhotos = await User.find({ podrida_player: { $in: playerObjectIds } }, { podrida_player: 1, profile_picture: 1 });
    const photoByPlayerId = Object.fromEntries(usersWithPhotos.map((u) => [u.podrida_player.toString(), u.profile_picture]));

    const hasValidPhoto = (url) => !!url && !url.includes("pixabay") && !url.includes("avatar-1577909");
    const getPhoto = (name) => {
      const pid = nameToPlayerId[name];
      const url = pid ? photoByPlayerId[pid] : null;
      return hasValidPhoto(url) ? url : null;
    };

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

    const enrichedRecords = records.map((r) => ({
      ...r,
      top: r.top.map((item) => ({ ...item, photo: getPhoto(item.name) })),
    }));

    return { records: enrichedRecords, players: playerProfiles, yearlyActivity };
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

  /* --------------- GET PODRIDA PLAYER PROFILE --------------- */
  getPodridaPlayerProfile = async (playerId) => {
    const player = await PodridaPlayer.findById(playerId);
    if (!player) throw new Error("Podrida player not found");

    const matches = await PodridaMatch.find({})
      .sort({ date: 1 })
      .populate("players.player")
      .populate("highlight.player");

    const rankedProfiles = calculatePlayerProfiles(matches).sort((a, b) => b.points - a.points);
    const rank = rankedProfiles.findIndex((p) => p.id === playerId) + 1;
    const profile = rankedProfiles.find((p) => p.id === playerId);
    if (!profile) throw new Error("This player has no matches yet");

    const droughts = calculatePlayerDroughts(matches, playerId);
    const byYear = calculatePlayerByYear(matches, playerId);

    const user = await User.findOne({ podrida_player: playerId }, { profile_picture: 1 });
    const hasValidPhoto = (url) => !!url && !url.includes("pixabay") && !url.includes("avatar-1577909");
    const photo = hasValidPhoto(user?.profile_picture) ? user.profile_picture : null;

    return {
      player: { id: player._id.toString(), name: player.name, photo },
      profile,
      rank,
      totalPlayers: rankedProfiles.length,
      droughts,
      byYear,
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
