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
      const stats = await MatchStat.aggregate([
        { $group: {
          _id:           "$player",
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
        { $lookup: { from: "players", localField: "_id", foreignField: "_id", as: "player" } },
        { $unwind: "$player" },
        { $match: { "player.role": "team" } },
        { $sort: { "player.shirt": 1 } },
        { $project: {
          matches:       1,
          goals:         1,
          assists:       1,
          yellow_cards:  1,
          red_cards:     1,
          avg_points:    { $round: ["$avg_points", 2] },
          white_pearl:   1,
          vanilla_pearl: 1,
          ocher_pearl:   1,
          black_pearl:   1,
          "player._id":          1,
          "player.first_name":   1,
          "player.last_name":    1,
          "player.shirt":        1,
          "player.field_position": 1,
        }},
      ]);

      // Batch lookup de profile_picture y nombre real desde users
      const playerIds = stats.map((s) => s._id);
      const users = await User.find(
        { chacho_player: { $in: playerIds } },
        { chacho_player: 1, profile_picture: 1, first_name: 1, last_name: 1 }
      ).lean();
      const userMap = Object.fromEntries(
        users.map((u) => [u.chacho_player.toString(), {
          profile_picture: u.profile_picture ?? null,
          real_first_name: u.first_name,
          real_last_name:  u.last_name,
        }])
      );

      return stats.map((s) => ({
        player: {
          _id:            s.player._id,
          first_name:     s.player.first_name,
          last_name:      s.player.last_name,
          shirt:          s.player.shirt,
          field_position: s.player.field_position,
          profile_picture:  userMap[s._id.toString()]?.profile_picture  ?? null,
          real_first_name:  userMap[s._id.toString()]?.real_first_name  ?? null,
          real_last_name:   userMap[s._id.toString()]?.real_last_name   ?? null,
        },
        career: {
          matches:       s.matches,
          goals:         s.goals,
          assists:       s.assists,
          yellow_cards:  s.yellow_cards,
          red_cards:     s.red_cards,
          avg_points:    s.avg_points,
          white_pearl:   s.white_pearl,
          vanilla_pearl: s.vanilla_pearl,
          ocher_pearl:   s.ocher_pearl,
          black_pearl:   s.black_pearl,
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
      const [careerArr, byYear] = await Promise.all([
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
        { $unwind: { path: "$voter_player", preserveNullAndEmptyArrays: true } },
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
          { $sort: { count: -1 } },
          { $limit: 1 },
          ...voterToPlayerPipeline,
        ]),

        // Mayor fan: quien mayor puntaje promedio te dio
        Vote.aggregate([
          { $unwind: "$evaluation" },
          { $match: { "evaluation.player": pid } },
          { $group: { _id: "$voter", avg: { $avg: "$evaluation.points" }, count: { $sum: 1 } } },
          { $match: { count: { $gte: 3 } } },
          { $sort: { avg: -1 } },
          { $limit: 1 },
          ...voterToPlayerPipeline,
        ]),

        // Mayor crítico: quien menor puntaje promedio te dio
        Vote.aggregate([
          { $unwind: "$evaluation" },
          { $match: { "evaluation.player": pid } },
          { $group: { _id: "$voter", avg: { $avg: "$evaluation.points" }, count: { $sum: 1 } } },
          { $match: { count: { $gte: 3 } } },
          { $sort: { avg: 1 } },
          { $limit: 1 },
          ...voterToPlayerPipeline,
        ]),

        // Te persigue: quien más veces te votó perla negra
        Vote.aggregate([
          { $match: { black_pearl: pid } },
          { $group: { _id: "$voter", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
          ...voterToPlayerPipeline,
        ]),

        // Tu preferido: a quien vos más le votaste perla blanca
        ...(user ? [Vote.aggregate([
          { $match: { voter: user._id, white_pearl: { $ne: null } } },
          { $group: { _id: "$white_pearl", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 1 },
          { $lookup: { from: "players", localField: "_id", foreignField: "_id", as: "player" } },
          { $unwind: "$player" },
          { $project: { count: 1, "player._id": 1, "player.first_name": 1, "player.last_name": 1 } },
        ])] : [Promise.resolve([])]),

        // Tu víctima: a quien vos más le votaste perla negra
        ...(user ? [Vote.aggregate([
          { $match: { voter: user._id, black_pearl: { $ne: null } } },
          { $group: { _id: "$black_pearl", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
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
        social,
        totalRounds,
      };
    } catch (error) {
      throw error;
    }
  };
}
