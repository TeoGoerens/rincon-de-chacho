import mongoose from "mongoose";
import Vote from "../../dao/models/chachos/voteModel.js";
import User from "../../dao/models/userModel.js";
import Player from "../../dao/models/chachos/playerModel.js";
import TournamentRound from "../../dao/models/chachos/tournamentRoundModel.js";
import baseRepository from "../baseRepository.js";

export default class VoteRepository extends baseRepository {
  constructor() {
    super(Vote);
  }

  // ---------- VERIFY IF TOURNAMENT ROUND IS OPEN FOR VOTE ----------
  verifyTournamentRoundOpenForVote = async (tournamentRoundId) => {
    try {
      const document = await TournamentRound.findById(tournamentRoundId);
      if (!document) {
        throw new Error("Element was not found in the database");
      }

      return document.open_for_vote;
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET ALL VOTES ----------
  getAllVotes = async (tournamentId) => {
    try {
      let filter = {};

      // Si tournamentId no es un string vacío, filtrar por tournamentId
      if (tournamentId && tournamentId.trim() !== "") {
        // Encontrar todos los TournamentRounds que corresponden al tournamentId
        const rounds = await TournamentRound.find({ tournament: tournamentId });

        // Extraer los IDs de los TournamentRounds
        const roundIds = rounds.map((round) => round._id);

        // Filtrar los votos por los IDs de los TournamentRounds
        filter = { round: { $in: roundIds } };
      }

      // Obtener todos los votos con el filtro (si existe)
      const allVotes = await Vote.find(filter).populate({
        path: "evaluation",
        populate: { path: "player", model: "Player" },
      });

      return allVotes;
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET VOTE FROM SPECIFIC USER FOR A ROUND ----------
  getVotefromUserByRound = async (tournamentRoundId, voterId, userId) => {
    try {
      const documentExists = await TournamentRound.findById(tournamentRoundId);
      if (!documentExists) {
        throw new Error("Element was not found in the database");
      }

      //Verify if user is admin and if user has already voted for this round
      const user = await User.findOne({ _id: userId });
      const userIsAdmin = user.is_admin;
      const usersVote = await this.model.findOne({
        voter: userId,
        round: tournamentRoundId,
      });

      if (!userIsAdmin && (usersVote == null || usersVote == undefined)) {
        throw new Error(
          "User has not yet voted. Please vote to see round's results"
        );
      }

      //Return vote from requested voter
      const requestedVote = await this.model.find({
        round: tournamentRoundId,
        voter: voterId,
      });

      if (requestedVote.length === 0) {
        throw new Error(
          "The selected voter has not yet submitted results. No information to display"
        );
      }

      return requestedVote;
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET VOTES RECEIVED BY A PLAYER FOR A ROUND ----------
  getVoteForAPlayerByRound = async (tournamentRoundId, playerId, userId) => {
    try {
      const documentExists = await TournamentRound.findById(tournamentRoundId);
      if (!documentExists) {
        throw new Error("Element was not found in the database");
      }

      //Verify if user is admin and if user has already voted for this round
      const user = await User.findOne({ _id: userId });
      const userIsAdmin = user.is_admin;
      const usersVote = await this.model.findOne({
        voter: userId,
        round: tournamentRoundId,
      });

      if (!userIsAdmin && (usersVote == null || usersVote == undefined)) {
        throw new Error(
          "User has not yet voted. Please vote to see round's results"
        );
      }

      //Return votes received for requested player
      const requestedVote = await this.model.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { white_pearl: new mongoose.Types.ObjectId(playerId) },
                  { vanilla_pearl: new mongoose.Types.ObjectId(playerId) },
                  { ocher_pearl: new mongoose.Types.ObjectId(playerId) },
                  { black_pearl: new mongoose.Types.ObjectId(playerId) },
                ],
              },
              { round: new mongoose.Types.ObjectId(tournamentRoundId) },
            ],
          },
        },
        {
          $project: {
            voter: 1,
            round: 1,
            white_pearl: {
              $cond: {
                if: {
                  $eq: ["$white_pearl", new mongoose.Types.ObjectId(playerId)],
                },
                then: "$white_pearl",
                else: null,
              },
            },
            vanilla_pearl: {
              $cond: {
                if: {
                  $eq: [
                    "$vanilla_pearl",
                    new mongoose.Types.ObjectId(playerId),
                  ],
                },
                then: "$vanilla_pearl",
                else: null,
              },
            },
            ocher_pearl: {
              $cond: {
                if: {
                  $eq: ["$ocher_pearl", new mongoose.Types.ObjectId(playerId)],
                },
                then: "$ocher_pearl",
                else: null,
              },
            },
            black_pearl: {
              $cond: {
                if: {
                  $eq: ["$black_pearl", new mongoose.Types.ObjectId(playerId)],
                },
                then: "$black_pearl",
                else: null,
              },
            },

            evaluation: {
              $filter: {
                input: "$evaluation",
                as: "eval",
                cond: {
                  $eq: ["$$eval.player", new mongoose.Types.ObjectId(playerId)],
                },
              },
            },
          },
        },
      ]);
      console.log(requestedVote);

      if (requestedVote.length === 0) {
        throw new Error(
          "The selected player has not been assigned any votes in this round"
        );
      }

      return requestedVote;
    } catch (error) {
      throw error;
    }
  };

  // ---------- GET ALL VOTES FOR ROUND ----------
  getAllVotesForRound = async (tournamentRoundId, userId) => {
    try {
      const documentExists = await TournamentRound.findById(tournamentRoundId);
      if (!documentExists) {
        throw new Error("Element was not found in the database");
      }

      //Verify if user is admin and if user has already voted for this round
      const user = await User.findOne({ _id: userId });
      const userIsAdmin = user.is_admin;
      const usersVote = await this.model.findOne({
        voter: userId,
        round: tournamentRoundId,
      });

      if (
        documentExists.open_for_vote === true &&
        !userIsAdmin &&
        (usersVote == null || usersVote == undefined)
      ) {
        throw new Error(
          "User has not yet voted. Please vote to see round's results"
        );
      }

      //Return all votes
      const allVotes = await this.model
        .find({ round: tournamentRoundId })
        .populate([
          "voter",
          "round",
          "white_pearl",
          "vanilla_pearl",
          "ocher_pearl",
          "black_pearl",
        ])
        .populate({
          path: "evaluation",
          populate: { path: "player", model: "Player" },
        });
      return allVotes;
    } catch (error) {
      throw error;
    }
  };

  // ---------- CREATE VOTE ----------
  createVote = async (vote, userId, roundId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        voter: userId,
        round: roundId,
      });

      if (documentExists) {
        throw new Error(
          `User with id ${userId} has already voted in this tournament round`
        );
      }
      const document = await this.model.create(vote);
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- UPDATE VOTE ----------
  updateVote = async (vote, userId, roundId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        voter: userId,
        round: roundId,
      });

      if (!documentExists) {
        throw new Error(
          `User with id ${userId} has not voted in this tournament round`
        );
      }
      const document = await this.model.updateOne(
        {
          voter: userId,
          round: roundId,
        },
        vote
      );
      return document;
    } catch (error) {
      throw error;
    }
  };

  // ---------- VOTE RECORDS (alter egos) — top 3 por métrica ----------
  getVoteRecords = async () => {
    const voterUserLookup = {
      $lookup: { from: "users", localField: "voter", foreignField: "_id", as: "voterUser" },
    };
    const playerLookup = (localField) => ({
      $lookup: { from: "players", localField, foreignField: "_id", as: "player" },
    });

    // Helper: enriquecer array con profile_picture
    const enrichWithPics = async (arr, getPlayerId) => {
      const ids = arr.map(getPlayerId).filter(Boolean);
      if (!ids.length) return arr;
      const users = await User.find({ chacho_player: { $in: ids } }, { chacho_player: 1, profile_picture: 1 });
      const picMap = Object.fromEntries(users.map((u) => [u.chacho_player.toString(), u.profile_picture]));
      return arr.map((item) => ({ ...item, profile_picture: picMap[getPlayerId(item)?.toString()] ?? null }));
    };

    // ── Pair 1: top 3 max / min avg score per (round, player) ──
    const scoreBase = [
      { $unwind: "$evaluation" },
      { $group: {
        _id: { round: "$round", player: "$evaluation.player" },
        avg: { $avg: "$evaluation.points" },
        count: { $sum: 1 },
      }},
      { $match: { count: { $gte: 1 } } },
      { $lookup: { from: "tournament rounds", localField: "_id.round", foreignField: "_id", as: "round" } },
      { $lookup: { from: "players", localField: "_id.player", foreignField: "_id", as: "player" } },
      { $unwind: "$round" },
      { $unwind: "$player" },
      { $lookup: { from: "rival teams", localField: "round.rival", foreignField: "_id", as: "rival" } },
      { $unwind: "$rival" },
      { $project: { avg: 1, "player.first_name": 1, "player.last_name": 1, "round.match_date": 1, "rival.name": 1 } },
    ];

    const [maxScoresRaw, minScoresRaw] = await Promise.all([
      Vote.aggregate([...scoreBase, { $sort: { avg: -1 } }, { $limit: 3 }]),
      Vote.aggregate([...scoreBase, { $sort: { avg: 1  } }, { $limit: 3 }]),
    ]);
    const [maxScores, minScores] = await Promise.all([
      enrichWithPics(maxScoresRaw, (r) => r._id?.player),
      enrichWithPics(minScoresRaw, (r) => r._id?.player),
    ]);

    // ── Pair 2: top 3 generous / acid (avg given to others) ──
    const giverBase = [
      voterUserLookup,
      { $unwind: "$voterUser" },
      { $match: { "voterUser.chacho_player": { $ne: null } } },
      { $unwind: "$evaluation" },
      { $match: { $expr: { $ne: ["$evaluation.player", "$voterUser.chacho_player"] } } },
      { $group: { _id: "$voterUser.chacho_player", avg: { $avg: "$evaluation.points" }, count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } },
      playerLookup("_id"),
      { $unwind: "$player" },
      { $project: { avg: 1, "player.first_name": 1, "player.last_name": 1 } },
    ];

    const [mostGenerousRaw, mostAcidRaw] = await Promise.all([
      Vote.aggregate([...giverBase, { $sort: { avg: -1 } }, { $limit: 3 }]),
      Vote.aggregate([...giverBase, { $sort: { avg: 1  } }, { $limit: 3 }]),
    ]);
    const [mostGenerousList, mostAcidList] = await Promise.all([
      enrichWithPics(mostGenerousRaw, (r) => r._id),
      enrichWithPics(mostAcidRaw,     (r) => r._id),
    ]);

    // ── Pair 3: top 3 auto-overrated / auto-underrated ──
    const selfVotes = await Vote.aggregate([
      voterUserLookup,
      { $unwind: "$voterUser" },
      { $match: { "voterUser.chacho_player": { $ne: null } } },
      { $unwind: "$evaluation" },
      { $match: { $expr: { $eq: ["$evaluation.player", "$voterUser.chacho_player"] } } },
      { $group: { _id: "$voterUser.chacho_player", selfAvg: { $avg: "$evaluation.points" }, count: { $sum: 1 } } },
      { $match: { count: { $gte: 1 } } },
    ]);
    const othersVotes = await Vote.aggregate([
      voterUserLookup,
      { $unwind: "$voterUser" },
      { $unwind: "$evaluation" },
      { $match: { $expr: { $ne: ["$evaluation.player", { $ifNull: ["$voterUser.chacho_player", new mongoose.Types.ObjectId()] }] } } },
      { $group: { _id: "$evaluation.player", othersAvg: { $avg: "$evaluation.points" } } },
    ]);
    const othersMap = Object.fromEntries(othersVotes.map((o) => [o._id.toString(), o.othersAvg]));
    const diffRows = selfVotes
      .map((s) => ({ playerId: s._id, diff: s.selfAvg - (othersMap[s._id.toString()] ?? s.selfAvg) }))
      .filter((r) => othersMap[r.playerId.toString()] !== undefined);
    diffRows.sort((a, b) => b.diff - a.diff);

    const top3OverratedIds  = diffRows.slice(0, 3).map((r) => r.playerId);
    const top3UnderratedIds = diffRows.slice(-3).reverse().map((r) => r.playerId);
    const allDiffIds = [...new Set([...top3OverratedIds, ...top3UnderratedIds].map((id) => id.toString()))];
    const diffPlayers = await Player.find({ _id: { $in: allDiffIds } }, { first_name: 1, last_name: 1 });
    const playerMap = Object.fromEntries(diffPlayers.map((p) => [p._id.toString(), p]));

    const buildDiffList = (rows) => rows
      .map((r) => ({ player: playerMap[r.playerId.toString()], diff: r.diff }))
      .filter((r) => r.player);

    const overratedListRaw  = buildDiffList(diffRows.slice(0, 3));
    const underratedListRaw = buildDiffList(diffRows.slice(-3).reverse());
    const [overratedList, underratedList] = await Promise.all([
      enrichWithPics(overratedListRaw,  (r) => r.player?._id),
      enrichWithPics(underratedListRaw, (r) => r.player?._id),
    ]);

    // ── Pair 4: top 3 most / least active voter ──
    const voteCounts = await Vote.aggregate([
      voterUserLookup,
      { $unwind: "$voterUser" },
      { $match: { "voterUser.chacho_player": { $ne: null } } },
      { $group: { _id: "$voterUser.chacho_player", voteCount: { $sum: 1 } } },
    ]);
    const matchCounts = await TournamentRound.aggregate([
      { $unwind: "$players" },
      { $group: { _id: "$players", matchCount: { $sum: 1 } } },
    ]);
    const matchMap = Object.fromEntries(matchCounts.map((m) => [m._id.toString(), m.matchCount]));
    const activityRows = voteCounts
      .map((v) => ({
        playerId:   v._id,
        voteCount:  v.voteCount,
        matchCount: matchMap[v._id.toString()] ?? 0,
        pct: matchMap[v._id.toString()] > 0 ? Math.round((v.voteCount / matchMap[v._id.toString()]) * 100) : 0,
      }))
      .filter((r) => r.matchCount >= 1);
    activityRows.sort((a, b) => b.pct - a.pct);

    const top3ActiveIds      = activityRows.slice(0, 3).map((r) => r.playerId);
    const top3LeastActiveIds = activityRows.slice(-3).reverse().map((r) => r.playerId);
    const allActivityIds = [...new Set([...top3ActiveIds, ...top3LeastActiveIds].map((id) => id.toString()))];
    const activityPlayers = await Player.find({ _id: { $in: allActivityIds } }, { first_name: 1, last_name: 1 });
    const activityPlayerMap = Object.fromEntries(activityPlayers.map((p) => [p._id.toString(), p]));

    const buildActivityList = (rows) => rows
      .map((r) => ({ player: activityPlayerMap[r.playerId.toString()], pct: r.pct }))
      .filter((r) => r.player);

    const mostActiveListRaw  = buildActivityList(activityRows.slice(0, 3));
    const leastActiveListRaw = buildActivityList(activityRows.slice(-3).reverse());
    const [mostActiveList, leastActiveList] = await Promise.all([
      enrichWithPics(mostActiveListRaw,  (r) => r.player?._id),
      enrichWithPics(leastActiveListRaw, (r) => r.player?._id),
    ]);

    // ── Pair 5: top 3 self white / black pearl ──
    const selfPearlBase = (pearlField) => [
      voterUserLookup,
      { $unwind: "$voterUser" },
      { $match: { "voterUser.chacho_player": { $ne: null }, $expr: { $eq: [`$${pearlField}`, "$voterUser.chacho_player"] } } },
      { $group: { _id: "$voterUser.chacho_player", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      playerLookup("_id"),
      { $unwind: "$player" },
      { $project: { count: 1, "player.first_name": 1, "player.last_name": 1 } },
    ];

    const [selfWhiteRaw, selfBlackRaw] = await Promise.all([
      Vote.aggregate(selfPearlBase("white_pearl")),
      Vote.aggregate(selfPearlBase("black_pearl")),
    ]);
    const [selfWhiteList, selfBlackList] = await Promise.all([
      enrichWithPics(selfWhiteRaw, (r) => r._id),
      enrichWithPics(selfBlackRaw, (r) => r._id),
    ]);

    return {
      maxScores,
      minScores,
      mostGenerousList,
      mostAcidList,
      overratedList,
      underratedList,
      mostActiveList,
      leastActiveList,
      selfWhiteList,
      selfBlackList,
    };
  };

  // ---------- DELETE VOTE ----------
  deleteVoteById = async (voteId) => {
    try {
      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne({
        _id: voteId,
      });

      if (!documentExists) {
        throw new Error(
          `El voto que desea eliminar no existe en la base de datos`
        );
      }
      const document = await this.model.deleteOne({
        _id: voteId,
      });
      return document;
    } catch (error) {
      throw error;
    }
  };
}
