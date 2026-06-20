import mongoose from "mongoose";
import Player from "../../dao/models/chachos/playerModel.js";
import User from "../../dao/models/userModel.js";
import MatchStat from "../../dao/models/chachos/matchStatModel.js";
import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import Vote from "../../dao/models/chachos/voteModel.js";
import baseRepository from "../baseRepository.js";

export default class PlayerRepository extends baseRepository {
  constructor() {
    super(Player);
  }

  // ---------- GET SQUAD (grid view) ----------
  getSquad = async () => {
    try {
      const players = await MatchStat.aggregate([
        { $group: { _id: "$player" } },
        { $lookup: { from: "players", localField: "_id", foreignField: "_id", as: "player" } },
        { $unwind: "$player" },
        { $sort: { "player.last_name": 1, "player.first_name": 1 } },
        { $project: {
          "player._id":        1,
          "player.first_name": 1,
          "player.last_name":  1,
        }},
      ]);

      const playerIds = players.map((p) => p._id);
      const users = await User.find(
        { chacho_player: { $in: playerIds } },
        { chacho_player: 1, profile_picture: 1 }
      ).lean();
      const userMap = Object.fromEntries(
        users.map((u) => [u.chacho_player.toString(), u.profile_picture ?? null])
      );

      return players.map((p) => ({
        player: {
          _id:             p.player._id,
          first_name:      p.player.first_name,
          last_name:       p.player.last_name,
          profile_picture: userMap[p._id.toString()] ?? null,
        },
      }));
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET PLAYER PROFILE (detail view) ----------
  getPlayerProfile = async (playerId) => {
    try {
      const pid = new mongoose.Types.ObjectId(playerId);

      // Player info + User info
      const [player, user] = await Promise.all([
        Player.findById(pid).lean(),
        User.findOne({ chacho_player: pid }, {
          _id: 1, first_name: 1, last_name: 1, profile_picture: 1,
        }).lean(),
      ]);

      if (!player) throw new Error("Player not found");

      // Total de fechas jugadas en la historia del equipo
      const totalRounds = await TournamentRound.countDocuments();

      // Career totals + by-year (match_stats.year exists directly)
      const [careerArr, byYear, vsRivals] = await Promise.all([
        MatchStat.aggregate([
          { $match: { player: pid } },
          { $group: {
            _id:           null,
            matches:       { $sum: 1 },
            goals:         { $sum: "$goals" },
            assists:       { $sum: "$assists" },
            yellow_cards:  { $sum: "$yellow_cards" },
            red_cards:     { $sum: "$red_cards" },
            avg_points:    { $avg: "$points" },
            white_pearl:   { $sum: { $cond: ["$white_pearl",   1, 0] } },
            vanilla_pearl: { $sum: { $cond: ["$vanilla_pearl", 1, 0] } },
            ocher_pearl:   { $sum: { $cond: ["$ocher_pearl",   1, 0] } },
            black_pearl:   { $sum: { $cond: ["$black_pearl",   1, 0] } },
          }},
          { $project: {
            _id: 0, matches: 1, goals: 1, assists: 1, yellow_cards: 1, red_cards: 1,
            avg_points: { $round: ["$avg_points", 2] },
            white_pearl: 1, vanilla_pearl: 1, ocher_pearl: 1, black_pearl: 1,
          }},
        ]),

        MatchStat.aggregate([
          { $match: { player: pid } },
          { $group: {
            _id:          "$year",
            matches:      { $sum: 1 },
            goals:        { $sum: "$goals" },
            assists:      { $sum: "$assists" },
            yellow_cards: { $sum: "$yellow_cards" },
            red_cards:    { $sum: "$red_cards" },
            avg_points:   { $avg: "$points" },
            white_pearl:  { $sum: { $cond: ["$white_pearl",  1, 0] } },
            black_pearl:  { $sum: { $cond: ["$black_pearl",  1, 0] } },
          }},
          { $sort: { _id: 1 } },
          { $project: {
            _id: 0, year: "$_id", matches: 1, goals: 1, assists: 1,
            yellow_cards: 1, red_cards: 1,
            avg_points:  { $round: ["$avg_points", 2] },
            white_pearl: 1, black_pearl: 1,
          }},
        ]),

        // Performance vs rivales
        MatchStat.aggregate([
          { $match: { player: pid } },
          { $lookup: { from: "tournament rounds", localField: "round", foreignField: "_id", as: "round" } },
          { $unwind: "$round" },
          { $group: {
            _id:     "$round.rival",
            matches: { $sum: 1 },
            goals:   { $sum: "$goals" },
            assists: { $sum: "$assists" },
            wins:    { $sum: { $cond: ["$round.win",    1, 0] } },
            draws:   { $sum: { $cond: ["$round.draw",   1, 0] } },
            losses:  { $sum: { $cond: ["$round.defeat", 1, 0] } },
          }},
          { $lookup: { from: "rival teams", localField: "_id", foreignField: "_id", as: "rival" } },
          { $unwind: "$rival" },
          { $addFields: { hypo_points: { $add: [{ $multiply: ["$wins", 3] }, "$draws"] } } },
          { $sort: { hypo_points: -1, "rival.name": 1 } },
          { $project: {
            _id: 0,
            rival: { _id: "$rival._id", name: "$rival.name", avatar: "$rival.avatar" },
            matches: 1, goals: 1, assists: 1, wins: 1, draws: 1, losses: 1,
          }},
        ]),
      ]);

      // Social stats from votes
      let social = {
        mayor_aliado:    null,
        mayor_fan:       null,
        mayor_critico:   null,
        tu_preferido:    null,
        te_persigue:     null,
        tu_victima:      null,
      };

      // Helper: enriquecer un resultado con profile_picture del jugador
      const enrichPic = async (item, getPlayerId) => {
        if (!item) return null;
        const id = getPlayerId(item);
        if (!id) return item;
        const u = await User.findOne({ chacho_player: id }, { profile_picture: 1 }).lean();
        return { ...item, profile_picture: u?.profile_picture ?? null };
      };

      // Reutilizable: lookup voter → user → player
      const voterToPlayerPipeline = [
        { $lookup: { from: "users",   localField: "_id",            foreignField: "_id",           as: "voter_user"   } },
        { $unwind: "$voter_user" },
        { $lookup: { from: "players", localField: "voter_user.chacho_player", foreignField: "_id", as: "voter_player" } },
        { $unwind: "$voter_player" },
        { $project: {
          count:                           1,
          avg:                             1,
          "voter_player._id":              1,
          "voter_player.first_name":       1,
          "voter_player.last_name":        1,
        }},
      ];

      const [
        mayorAliadoRaw,
        mayorFanRaw,
        mayorCriticoRaw,
        tePersiqueRaw,
        tuPreferidoRaw,
        tuVictimaRaw,
      ] = await Promise.all([
        // Mayor aliado: quien más veces te votó perla blanca
        Vote.aggregate([
          { $match: { white_pearl: pid } },
          { $group: { _id: "$voter", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 1 },
          ...voterToPlayerPipeline,
        ]),

        // Mayor fan: quien mayor puntaje promedio te dio (mín. 3 votos)
        Vote.aggregate([
          { $unwind: "$evaluation" },
          { $match: { "evaluation.player": pid } },
          { $group: { _id: "$voter", avg: { $avg: "$evaluation.points" }, count: { $sum: 1 } } },
          { $match: { count: { $gte: 3 } } },
          { $sort: { avg: -1, count: -1, _id: 1 } },
          { $limit: 1 },
          ...voterToPlayerPipeline,
        ]),

        // Mayor crítico: quien menor puntaje promedio te dio (mín. 3 votos)
        Vote.aggregate([
          { $unwind: "$evaluation" },
          { $match: { "evaluation.player": pid } },
          { $group: { _id: "$voter", avg: { $avg: "$evaluation.points" }, count: { $sum: 1 } } },
          { $match: { count: { $gte: 3 } } },
          { $sort: { avg: 1, count: -1, _id: 1 } },
          { $limit: 1 },
          ...voterToPlayerPipeline,
        ]),

        // Te persigue: quien más veces te votó perla negra
        Vote.aggregate([
          { $match: { black_pearl: pid } },
          { $group: { _id: "$voter", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 1 },
          ...voterToPlayerPipeline,
        ]),

        // Tu preferido: a quien vos más le votaste perla blanca
        ...(user ? [Vote.aggregate([
          { $match: { voter: user._id, white_pearl: { $ne: null } } },
          { $group: { _id: "$white_pearl", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 1 },
          { $lookup: { from: "players", localField: "_id", foreignField: "_id", as: "player" } },
          { $unwind: "$player" },
          { $project: { count: 1, "player._id": 1, "player.first_name": 1, "player.last_name": 1 } },
        ])] : [Promise.resolve([])]),

        // Tu víctima: a quien vos más le votaste perla negra
        ...(user ? [Vote.aggregate([
          { $match: { voter: user._id, black_pearl: { $ne: null } } },
          { $group: { _id: "$black_pearl", count: { $sum: 1 } } },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 1 },
          { $lookup: { from: "players", localField: "_id", foreignField: "_id", as: "player" } },
          { $unwind: "$player" },
          { $project: { count: 1, "player._id": 1, "player.first_name": 1, "player.last_name": 1 } },
        ])] : [Promise.resolve([])]),
      ]);

      // Enriquecer con fotos
      const [mayorAliado, mayorFan, mayorCritico, tePersigue] = await Promise.all([
        enrichPic(mayorAliadoRaw[0]  ?? null, (r) => r.voter_player?._id),
        enrichPic(mayorFanRaw[0]     ?? null, (r) => r.voter_player?._id),
        enrichPic(mayorCriticoRaw[0] ?? null, (r) => r.voter_player?._id),
        enrichPic(tePersiqueRaw[0]   ?? null, (r) => r.voter_player?._id),
      ]);
      const tuPreferidoItem = tuPreferidoRaw[0] ?? null;
      const tuPreferido = tuPreferidoItem
        ? await enrichPic(tuPreferidoItem, (r) => r.player?._id)
        : null;
      const tuVictimaItem = tuVictimaRaw[0] ?? null;
      const tuVictima = tuVictimaItem
        ? await enrichPic(tuVictimaItem, (r) => r.player?._id)
        : null;

      social = { mayor_aliado: mayorAliado, mayor_fan: mayorFan, mayor_critico: mayorCritico, tu_preferido: tuPreferido, te_persigue: tePersigue, tu_victima: tuVictima };

      return {
        player: {
          _id:            player._id,
          first_name:     player.first_name,
          last_name:      player.last_name,
          shirt:          player.shirt,
          field_position: player.field_position,
          profile_picture:  user?.profile_picture  ?? null,
          real_first_name:  user?.first_name        ?? null,
          real_last_name:   user?.last_name         ?? null,
        },
        career:      careerArr[0] ?? null,
        byYear,
        vsRivals,
        social,
        totalRounds,
      };
    } catch (error) {
      throw error;
    }
  };

  // ---------- DELETE PLAYER (bloqueado si tiene partidos jugados) ----------
  deletePlayerById = async (playerId) => {
    const playerExists = await this.model.findById(playerId);
    if (!playerExists) {
      throw new Error("Player was not found in the database");
    }

    const hasMatchStats = await MatchStat.exists({ player: playerId });
    if (hasMatchStats) {
      throw new Error(
        "No se puede eliminar este jugador porque tiene partidos jugados registrados"
      );
    }

    const playerDeleted = await this.model.findOneAndDelete({ _id: playerId });
    return playerDeleted;
  };
}
