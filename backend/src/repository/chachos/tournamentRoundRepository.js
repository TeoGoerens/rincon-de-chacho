import mongoose from "mongoose";
import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import Tournament from "../../dao/models/chachos/tournamentModel.js";
import User from "../../dao/models/userModel.js";
import MatchStat from "../../dao/models/chachos/matchStatModel.js";
import baseRepository from "../baseRepository.js";
import transport from "../../config/email/nodemailer.js";

export default class TournamentRoundRepository extends baseRepository {
  constructor() {
    super(TournamentRound);
  }

  // ---------- GET CURRENT CONTEXT (last round + season rounds + last round stats) ----------
  getCurrentContext = async () => {
    try {
      const lastRound = await this.model
        .findOne()
        .sort({ match_date: -1 })
        .populate(["tournament", "rival", "players", "white_pearl", "vanilla_pearl", "ocher_pearl", "black_pearl"]);

      if (!lastRound) return { lastRound: null, seasonRounds: [], lastRoundStats: [] };

      const allPlayerIds = (lastRound.players ?? []).map((p) => p._id).filter(Boolean);

      const rankingsPipeline = [
        { $match: { tournament: lastRound.tournament._id } },
        { $group: {
          _id:                 "$player",
          matches:             { $sum: 1 },
          goals:               { $sum: "$goals" },
          assists:             { $sum: "$assists" },
          yellow_cards:        { $sum: "$yellow_cards" },
          red_cards:           { $sum: "$red_cards" },
          avg_points:          { $avg: "$points" },
          white_pearl_count:   { $sum: { $cond: ["$white_pearl",   1, 0] } },
          vanilla_pearl_count: { $sum: { $cond: ["$vanilla_pearl", 1, 0] } },
          ocher_pearl_count:   { $sum: { $cond: ["$ocher_pearl",   1, 0] } },
          black_pearl_count:   { $sum: { $cond: ["$black_pearl",   1, 0] } },
        }},
        { $match: { $or: [
          { goals:        { $gt: 0 } },
          { assists:      { $gt: 0 } },
          { yellow_cards: { $gt: 0 } },
          { red_cards:    { $gt: 0 } },
          { avg_points:   { $ne: null } },
        ]}},
        { $lookup: { from: "players", localField: "_id", foreignField: "_id", as: "player" } },
        { $unwind: "$player" },
        { $project: {
          _id:          0,
          matches:      1,
          goals:        1,
          assists:      1,
          yellow_cards: 1,
          red_cards:    1,
          avg_points:          { $round: ["$avg_points", 2] },
          white_pearl_count:   1,
          vanilla_pearl_count: 1,
          ocher_pearl_count:   1,
          black_pearl_count:   1,
          "player._id":        1,
          "player.first_name": 1,
          "player.last_name":  1,
        }},
      ];

      const [seasonRounds, lastRoundStats, playerUsers, rankings] = await Promise.all([
        this.model
          .find({ tournament: lastRound.tournament._id })
          .sort({ match_date: -1 })
          .select("_id win draw defeat score_chachos score_rival match_date complete_stats open_for_vote")
          .populate({ path: "rival", select: "name" }),
        MatchStat.find({ round: lastRound._id }).populate({
          path: "player",
          select: { first_name: 1, last_name: 1, shirt: 1, field_position: 1, _id: 1 },
        }),
        allPlayerIds.length > 0
          ? User.find({ chacho_player: { $in: allPlayerIds } }, { chacho_player: 1, profile_picture: 1 })
          : Promise.resolve([]),
        MatchStat.aggregate(rankingsPipeline),
      ]);

      const playerPictures = Object.fromEntries(
        playerUsers.map((u) => [u.chacho_player.toString(), u.profile_picture])
      );

      return { lastRound, seasonRounds, lastRoundStats, playerPictures, rankings };
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET STATS SUMMARY (team + individual + H2H) ----------
  getStatsSummary = async (year) => {
    try {
      let roundMatch = {};
      let statMatch  = {};

      if (year) {
        const tournaments = await Tournament.find({ year: Number(year) }, { _id: 1 });
        const ids = tournaments.map((t) => t._id);
        roundMatch = { tournament: { $in: ids } };
        statMatch  = { tournament: { $in: ids } };
      }

      const [teamArr, individualRankings, h2h] = await Promise.all([
        TournamentRound.aggregate([
          { $match: roundMatch },
          { $group: {
            _id:            null,
            matches:        { $sum: 1 },
            wins:           { $sum: { $cond: ["$win",    1, 0] } },
            draws:          { $sum: { $cond: ["$draw",   1, 0] } },
            defeats:        { $sum: { $cond: ["$defeat", 1, 0] } },
            goals_for:      { $sum: "$score_chachos" },
            goals_against:  { $sum: "$score_rival" },
          }},
          { $project: { _id: 0, matches: 1, wins: 1, draws: 1, defeats: 1, goals_for: 1, goals_against: 1 } },
        ]),

        MatchStat.aggregate([
          { $match: statMatch },
          { $group: {
            _id:            "$player",
            matches:        { $sum: 1 },
            goals:          { $sum: "$goals" },
            assists:        { $sum: "$assists" },
            yellow_cards:   { $sum: "$yellow_cards" },
            red_cards:      { $sum: "$red_cards" },
            avg_points:     { $avg: "$points" },
            white_pearl:    { $sum: { $cond: ["$white_pearl",   1, 0] } },
            vanilla_pearl:  { $sum: { $cond: ["$vanilla_pearl", 1, 0] } },
            ocher_pearl:    { $sum: { $cond: ["$ocher_pearl",   1, 0] } },
            black_pearl:    { $sum: { $cond: ["$black_pearl",   1, 0] } },
          }},
          { $lookup: { from: "players", localField: "_id", foreignField: "_id", as: "player" } },
          { $unwind: "$player" },
          { $project: {
            _id:            0,
            matches:        1,
            goals:          1,
            assists:        1,
            yellow_cards:   1,
            red_cards:      1,
            avg_points:     { $round: ["$avg_points", 2] },
            white_pearl:    1,
            vanilla_pearl:  1,
            ocher_pearl:    1,
            black_pearl:    1,
            "player._id":        1,
            "player.first_name": 1,
            "player.last_name":  1,
          }},
          { $sort: { avg_points: -1 } },
        ]),

        TournamentRound.aggregate([
          { $match: roundMatch },
          { $group: {
            _id:            "$rival",
            matches:        { $sum: 1 },
            wins:           { $sum: { $cond: ["$win",    1, 0] } },
            draws:          { $sum: { $cond: ["$draw",   1, 0] } },
            defeats:        { $sum: { $cond: ["$defeat", 1, 0] } },
            goals_for:      { $sum: "$score_chachos" },
            goals_against:  { $sum: "$score_rival" },
          }},
          { $lookup: { from: "rival teams", localField: "_id", foreignField: "_id", as: "rival" } },
          { $unwind: "$rival" },
          { $addFields: { _pts: { $add: [{ $multiply: ["$wins", 3] }, "$draws"] } } },
          { $sort: { _pts: -1 } },
          { $project: {
            _id:            0,
            matches:        1,
            wins:           1,
            draws:          1,
            defeats:        1,
            goals_for:      1,
            goals_against:  1,
            "rival._id":    1,
            "rival.name":   1,
          }},
        ]),
      ]);

      return {
        teamSummary: teamArr[0] ?? { matches: 0, wins: 0, draws: 0, defeats: 0, goals_for: 0, goals_against: 0 },
        individualRankings,
        h2h,
      };
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET ROUNDS BY TOURNAMENT ----------
  getTournamentRoundsByTournament = async (tournamentRoundId) => {
    try {
      const document = await this.model
        .find({ tournament: tournamentRoundId })
        .populate([
          "tournament",
          "rival",
          "players",
          "white_pearl",
          "vanilla_pearl",
          "ocher_pearl",
          "black_pearl",
        ]);
      if (!document) {
        throw new Error("Element was not found in the database");
      }
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- PLAYERS DETAILS FROM TOURNAMENT ROUND ----------
  getPlayersDetailFromTournamentRound = async (tournamentRoundId) => {
    try {
      const document = await this.model
        .findById(tournamentRoundId)
        .populate("players");
      if (!document) {
        throw new Error("Element was not found in the database");
      }
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- SEND EMAIL TO USERS REQUESTING VOTES ----------
  sendEmailToAllUsersToRequestVotes = async (tournamentRoundId) => {
    const registeredUsers = await User.find({}, { first_name: 1, email: 1 });

    const mailOptionsList = registeredUsers.map((user) => ({
      from: "chacho@elrincondechacho.com",
      to: user.email,
      subject: "¡Atención chacal! Nueva fecha para votar",
      html: `
      <h1>Hola ${user.first_name},</h1>
      <h3>Se abrió la votación para una nueva fecha de Chachos.</h3>
      <p>No te pierdas la posibilidad de elegir las perlas y puntuar a cada uno de los jugadores.</p>
      <p>Apurate e ingresá en el link debajo para dejar tu voto:</p>
      <a href="https://elrincondechacho.com/chachos/tournament-rounds/${tournamentRoundId}/vote">Ver Fecha</a>
    `,
    }));

    await Promise.all(
      mailOptionsList.map((mailOptions) => transport.sendMail(mailOptions))
    );
  };

  // ---------- SEND EMAIL TO USERS TO DISPLAY RESULTS ----------
  sendEmailToAllUsersToDisplayResults = async (tournamentRoundId) => {
    const registeredUsers = await User.find({}, { first_name: 1, email: 1 });

    const mailOptionsList = registeredUsers.map((user) => ({
      from: "chacho@elrincondechacho.com",
      to: user.email,
      subject: "¡Se cerró la votación! Mirá los resultados",
      html: `
        <h1>Hola ${user.first_name},</h1>
        <h3>Espero que no te hayas dormido y hayas dejado tu voto a tiempo.</h3>
        <p>Ya cerró la fecha así que vas a poder consultar quiénes fueron los jugadores más destacados.</p>
        <p>Ingresá en el link debajo para ver los resultados:</p>
        <a href="https://elrincondechacho.com/chachos/tournament-rounds/${tournamentRoundId}/results">Ver Fecha</a>
      `,
    }));

    await Promise.all(
      mailOptionsList.map((mailOptions) => transport.sendMail(mailOptions))
    );
  };

  // ---------- UPDATE MATCH STATS FROM VOTES ----------
  updateMatchStatsFromVotes = async (
    tournamentRoundId,
    whitePearl,
    vanillaPearl,
    ocherPearl,
    blackPearl
  ) => {
    try {
      //Update white pearl
      const whitePearlUpdate = await MatchStat.find({
        round: tournamentRoundId,
        player: whitePearl,
      });
      if (!whitePearlUpdate.length) {
        throw new Error(
          "Match stat for player chosen as white pearl has not been created"
        );
      } else {
        whitePearlUpdate[0].white_pearl = true;
        await whitePearlUpdate[0].save();
      }

      //Update vanilla pearl
      const vanillaPearlUpdate = await MatchStat.find({
        round: tournamentRoundId,
        player: vanillaPearl,
      });
      if (!vanillaPearlUpdate.length) {
        throw new Error(
          "Match stat for player chosen as vanilla pearl has not been created"
        );
      } else {
        vanillaPearlUpdate[0].vanilla_pearl = true;
        await vanillaPearlUpdate[0].save();
      }

      //Update ocher pearl
      const ocherPearlUpdate = await MatchStat.find({
        round: tournamentRoundId,
        player: ocherPearl,
      });
      if (!ocherPearlUpdate.length) {
        throw new Error(
          "Match stat for player chosen as ocher pearl has not been created"
        );
      } else {
        ocherPearlUpdate[0].ocher_pearl = true;
        await ocherPearlUpdate[0].save();
      }

      //Update black pearl
      const blackPearlUpdate = await MatchStat.find({
        round: tournamentRoundId,
        player: blackPearl,
      });
      if (!blackPearlUpdate.length) {
        throw new Error(
          "Match stat for player chosen as white pearl has not been created"
        );
      } else {
        blackPearlUpdate[0].black_pearl = true;
        await blackPearlUpdate[0].save();
      }

      return [
        whitePearlUpdate,
        vanillaPearlUpdate,
        ocherPearlUpdate,
        blackPearlUpdate,
      ];
    } catch (error) {
      throw error;
    }
  };

  // ---------- UPDATE MATCH STATS FROM POINTS ----------
  updateMatchStatsFromPoints = async (tournamentRoundId, pointsArray) => {
    try {
      //Creo una variable para almacenar los match stats actualizados
      let updatedMatchStats = [];

      //Recorro el array de puntos y actualizo la coleccion match stat
      for (const element of pointsArray) {
        const matchStatToUpdate = await MatchStat.find({
          round: tournamentRoundId,
          player: element.player,
        });
        if (!matchStatToUpdate.length) {
          throw new Error("Match stat for player chosen has not been created");
        } else {
          matchStatToUpdate[0].points = element.averagePoints;
          await matchStatToUpdate[0].save();

          updatedMatchStats.push(matchStatToUpdate[0]);
        }
      }

      return updatedMatchStats;
    } catch (error) {
      throw error;
    }
  };
}
