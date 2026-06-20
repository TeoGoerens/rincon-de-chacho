import mongoose from "mongoose";
import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import Tournament from "../../dao/models/chachos/tournamentModel.js";
import User from "../../dao/models/userModel.js";
import MatchStat from "../../dao/models/chachos/matchStatModel.js";
import baseRepository from "../baseRepository.js";
import { sendBulkEmail } from "../../helpers/sendBulkEmail.js";

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

  // ---------- GET PLAYER PICTURES BY ROUND ----------
  getPlayerPicturesByRound = async (roundId) => {
    try {
      const stats = await MatchStat.find({ round: roundId }, { player: 1 });
      const playerIds = stats.map((s) => s.player).filter(Boolean);
      if (!playerIds.length) return {};

      const users = await User.find(
        { chacho_player: { $in: playerIds } },
        { chacho_player: 1, profile_picture: 1 }
      );

      return Object.fromEntries(
        users.map((u) => [u.chacho_player.toString(), u.profile_picture ?? null])
      );
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET ALL ROUNDS FOR LIST VIEW (optimizado para tab Fechas) ----------
  getAllRoundsForList = async () => {
    try {
      const rounds = await this.model
        .find()
        .sort({ match_date: -1 })
        .select("_id match_date win draw defeat score_chachos score_rival open_for_vote players tournament rival white_pearl vanilla_pearl ocher_pearl black_pearl")
        .populate({ path: "rival",         select: "name" })
        .populate({ path: "tournament",    select: "year" })
        .populate({ path: "white_pearl",   select: "first_name last_name" })
        .populate({ path: "vanilla_pearl", select: "first_name" })
        .populate({ path: "ocher_pearl",   select: "first_name" })
        .populate({ path: "black_pearl",   select: "first_name last_name" })
        .lean();

      // Batch lookup de fotos para perla blanca y perla negra
      const allPearlIds = [...new Set(
        rounds.flatMap((r) => [
          ...(r.white_pearl ?? []).map((p) => p._id?.toString()),
          ...(r.black_pearl ?? []).map((p) => p._id?.toString()),
        ].filter(Boolean))
      )];

      if (allPearlIds.length) {
        const users = await User.find(
          { chacho_player: { $in: allPearlIds } },
          { chacho_player: 1, profile_picture: 1 }
        ).lean();
        const picMap = Object.fromEntries(
          users.map((u) => [u.chacho_player.toString(), u.profile_picture ?? null])
        );
        rounds.forEach((r) => {
          if (r.white_pearl?.length) {
            r.white_pearl = r.white_pearl.map((p) => ({
              ...p,
              profile_picture: picMap[p._id?.toString()] ?? null,
            }));
          }
          if (r.black_pearl?.length) {
            r.black_pearl = r.black_pearl.map((p) => ({
              ...p,
              profile_picture: picMap[p._id?.toString()] ?? null,
            }));
          }
        });
      }

      return rounds;
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

    const subject = "Nueva fecha lista para votar";
    const generateHTML = (user) => `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#0d0d0d; border-radius:16px; overflow:hidden; border:1px solid rgba(168,218,220,0.12);">
            <!-- Top accent bar -->
            <tr>
              <td height="3" bgcolor="#a8dadc" style="background:linear-gradient(to right,#457b9d,#a8dadc,#457b9d); font-size:1px; line-height:1px;">&nbsp;</td>
            </tr>
            <!-- Header -->
            <tr>
              <td align="center" style="padding:30px 24px 22px; border-bottom:1px solid rgba(255,255,255,0.07);">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:10px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="34" height="34" align="center" valign="middle" bgcolor="#457b9d" style="background-color:#457b9d; border-radius:9px; font-family:'Poppins',Arial,sans-serif; font-weight:bold; color:#0a0a0a; font-size:16px;">C</td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle">
                      <span style="font-family:'Poppins',Arial,sans-serif; font-size:15px; font-weight:600; color:#e8e8e8; letter-spacing:0.02em;">El Rincón de <span style="color:#a8dadc;">Chacho</span></span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Icon badge -->
            <tr>
              <td align="center" style="padding:32px 28px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="52" height="52" align="center" valign="middle" bgcolor="#152a30" style="background-color:#152a30; border:1px solid rgba(168,218,220,0.3); border-radius:14px;">
                      <span style="font-family:Arial,sans-serif; font-size:22px; line-height:22px; color:#a8dadc;">&#10003;</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td align="center" style="padding:18px 28px 6px;">
                <p style="margin:0 0 6px; font-family:'Poppins',Arial,sans-serif; font-size:12px; letter-spacing:0.18em; color:#98a8b8; text-transform:uppercase;">Chachos</p>
                <h1 style="margin:0 0 14px; font-family:'Poppins',Arial,sans-serif; font-size:23px; font-weight:700; color:#e8e8e8;">Se abrió la votación</h1>
                <p style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:15px; line-height:1.65; color:#c0cdd8; max-width:360px;">
                  Hola ${user.first_name}, se abrió la votación de la última fecha. Elegí las perlas y puntuá a cada jugador antes de que cierre.
                </p>
              </td>
            </tr>
            <!-- CTA -->
            <tr>
              <td align="center" style="padding:26px 28px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#a8dadc" style="background-color:#a8dadc; border-radius:8px;">
                      <a href="https://elrincondechacho.com/chachos" style="display:inline-block; padding:13px 36px; font-family:'Poppins',Arial,sans-serif; font-size:14px; font-weight:600; color:#0a0a0a; text-decoration:none; letter-spacing:0.02em;">Votar ahora</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:28px 28px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td height="1" style="background:linear-gradient(to right, transparent, rgba(168,218,220,0.35), transparent); font-size:1px; line-height:1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 28px 28px;">
                <p style="margin:0 0 6px; font-family:'Poppins',Arial,sans-serif; font-size:10px; letter-spacing:0.25em; color:#5d7a87; text-transform:uppercase;">amigos &middot; f&uacute;tbol &middot; apuestas &middot; memoria</p>
                <p style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:11px; color:#4a5a6a;">
                  Recib&iacute;s este mail porque est&aacute;s registrado en elrincondechacho.com
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;

    const results = await Promise.allSettled(
      registeredUsers.map((user) =>
        sendBulkEmail({ recipients: [user], subject, generateHTML })
      )
    );
    const failedEmails = [];
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to send vote-request email to ${registeredUsers[index].email}:`,
          result.reason
        );
        failedEmails.push(registeredUsers[index].email);
      }
    });
    return failedEmails;
  };

  // ---------- SEND EMAIL TO USERS TO DISPLAY RESULTS ----------
  sendEmailToAllUsersToDisplayResults = async (tournamentRoundId) => {
    const registeredUsers = await User.find({}, { first_name: 1, email: 1 });

    const subject = "Resultados de la fecha disponibles";
    const generateHTML = (user) => `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#0d0d0d; border-radius:16px; overflow:hidden; border:1px solid rgba(168,218,220,0.12);">
            <!-- Top accent bar -->
            <tr>
              <td height="3" bgcolor="#a8dadc" style="background:linear-gradient(to right,#457b9d,#a8dadc,#457b9d); font-size:1px; line-height:1px;">&nbsp;</td>
            </tr>
            <!-- Header -->
            <tr>
              <td align="center" style="padding:30px 24px 22px; border-bottom:1px solid rgba(255,255,255,0.07);">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:10px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="34" height="34" align="center" valign="middle" bgcolor="#457b9d" style="background-color:#457b9d; border-radius:9px; font-family:'Poppins',Arial,sans-serif; font-weight:bold; color:#0a0a0a; font-size:16px;">C</td>
                        </tr>
                      </table>
                    </td>
                    <td valign="middle">
                      <span style="font-family:'Poppins',Arial,sans-serif; font-size:15px; font-weight:600; color:#e8e8e8; letter-spacing:0.02em;">El Rincón de <span style="color:#a8dadc;">Chacho</span></span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Icon badge -->
            <tr>
              <td align="center" style="padding:32px 28px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="52" height="52" align="center" valign="middle" bgcolor="#152a30" style="background-color:#152a30; border:1px solid rgba(168,218,220,0.3); border-radius:14px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td width="5" height="12" bgcolor="#5d8a93" style="background-color:#5d8a93; border-radius:1px;">&nbsp;</td>
                          <td width="3" style="font-size:1px;">&nbsp;</td>
                          <td width="5" height="18" bgcolor="#83b8bd" style="background-color:#83b8bd; border-radius:1px;">&nbsp;</td>
                          <td width="3" style="font-size:1px;">&nbsp;</td>
                          <td width="5" height="22" bgcolor="#a8dadc" style="background-color:#a8dadc; border-radius:1px;">&nbsp;</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td align="center" style="padding:18px 28px 6px;">
                <p style="margin:0 0 6px; font-family:'Poppins',Arial,sans-serif; font-size:12px; letter-spacing:0.18em; color:#98a8b8; text-transform:uppercase;">Chachos</p>
                <h1 style="margin:0 0 14px; font-family:'Poppins',Arial,sans-serif; font-size:23px; font-weight:700; color:#e8e8e8;">Resultados disponibles</h1>
                <p style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:15px; line-height:1.65; color:#c0cdd8; max-width:360px;">
                  Hola ${user.first_name}, la votación cerró. Ya podés ver quiénes fueron los jugadores más destacados de la fecha.
                </p>
              </td>
            </tr>
            <!-- CTA -->
            <tr>
              <td align="center" style="padding:26px 28px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#a8dadc" style="background-color:#a8dadc; border-radius:8px;">
                      <a href="https://elrincondechacho.com/chachos/tournament-rounds/${tournamentRoundId}/results" style="display:inline-block; padding:13px 36px; font-family:'Poppins',Arial,sans-serif; font-size:14px; font-weight:600; color:#0a0a0a; text-decoration:none; letter-spacing:0.02em;">Ver resultados</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:28px 28px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td height="1" style="background:linear-gradient(to right, transparent, rgba(168,218,220,0.35), transparent); font-size:1px; line-height:1px;">&nbsp;</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 28px 28px;">
                <p style="margin:0 0 6px; font-family:'Poppins',Arial,sans-serif; font-size:10px; letter-spacing:0.25em; color:#5d7a87; text-transform:uppercase;">amigos &middot; f&uacute;tbol &middot; apuestas &middot; memoria</p>
                <p style="margin:0; font-family:Roboto,Arial,sans-serif; font-size:11px; color:#4a5a6a;">
                  Recib&iacute;s este mail porque est&aacute;s registrado en elrincondechacho.com
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `;

    const results = await Promise.allSettled(
      registeredUsers.map((user) =>
        sendBulkEmail({ recipients: [user], subject, generateHTML })
      )
    );
    const failedEmails = [];
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to send results email to ${registeredUsers[index].email}:`,
          result.reason
        );
        failedEmails.push(registeredUsers[index].email);
      }
    });
    return failedEmails;
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
      //Resetear todas las perlas del round antes de reasignarlas, para que una
      //reconsolidacion (tras nuevos votos) no deje perlas viejas en jugadores
      //que ya no ganaron esa categoria
      await MatchStat.updateMany(
        { round: tournamentRoundId },
        {
          white_pearl: false,
          vanilla_pearl: false,
          ocher_pearl: false,
          black_pearl: false,
        }
      );

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
