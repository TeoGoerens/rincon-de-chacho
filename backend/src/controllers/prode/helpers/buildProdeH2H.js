import mongoose from "mongoose";
import ProdeMatchday from "../../../dao/models/prode/ProdeMatchdayModel.js";
import ProdeTournament from "../../../dao/models/prode/ProdeTournamentModel.js";
import { buildProdeRecords } from "./buildProdeRecords.js";

export const buildProdeH2H = async (playerId, tournamentId = "") => {
  if (!playerId) return null;

  // --- 1. RANKINGS ---
  const historicalData = await buildProdeRecords();
  const rankHistorical =
    historicalData.historicalTable.findIndex(
      (p) => String(p.id) === String(playerId),
    ) + 1;

  const targetTournamentId =
    tournamentId || (await ProdeTournament.findOne({ status: "active" }))?._id;

  let rankActive = "N/A";
  if (targetTournamentId) {
    const activeData = await buildProdeRecords(targetTournamentId);
    const pos = activeData.historicalTable.findIndex(
      (p) => String(p.id) === String(playerId),
    );
    if (pos !== -1) rankActive = pos + 1;
  }

  // --- 2. VICTORIAS MENSUALES ---
  const tourneyFilter = tournamentId
    ? { _id: new mongoose.Types.ObjectId(tournamentId) }
    : {};
  const tournaments = await ProdeTournament.find(tourneyFilter).populate(
    "monthlyWinners.winnerPlayerIds",
  );

  let monthlyWinsCount = 0;
  tournaments.forEach((t) => {
    t.monthlyWinners?.forEach((mw) => {
      if (mw.winnerPlayerIds?.some((p) => String(p._id) === String(playerId))) {
        monthlyWinsCount++;
      }
    });
  });

  // --- 3. DUELOS H2H ---
  const playerOid = new mongoose.Types.ObjectId(playerId);
  const mdFilter = {
    status: "played",
    $or: [{ "duels.playerA": playerOid }, { "duels.playerB": playerOid }],
  };

  if (tournamentId && tournamentId !== "") {
    mdFilter.tournament = new mongoose.Types.ObjectId(tournamentId);
  }

  // CRITERIO CORREGIDO: Ordenamos por _id descendente (el ID de MongoDB incluye el timestamp)
  // Esto garantiza que la fecha jugada más recientemente sea la primera, sin importar el roundNumber.
  const matchdays = await ProdeMatchday.find(mdFilter)
    .sort({ _id: -1 })
    .populate("duels.playerA duels.playerB");

  const opponentsMap = new Map();
  let totalPg = 0;
  let totalPj = 0;
  const playerStreak = [];
  const chStats = {
    GDT: { pg: 0, pj: 0 },
    ARG: { pg: 0, pj: 0 },
    MISC: { pg: 0, pj: 0 },
  };

  matchdays.forEach((md) => {
    const duel = md.duels.find(
      (d) =>
        String(d.playerA?._id) === String(playerId) ||
        String(d.playerB?._id) === String(playerId),
    );

    if (duel) {
      const isPlayerA = String(duel.playerA?._id) === String(playerId);
      const side = isPlayerA ? "A" : "B";
      const oppSide = isPlayerA ? "B" : "A";
      const opponent = isPlayerA ? duel.playerB : duel.playerA;

      // Capturamos los 5 resultados más recientes de la lista ya ordenada por tiempo
      if (playerStreak.length < 5) {
        if (duel.duelResult === side) playerStreak.push("G");
        else if (duel.duelResult === "draw") playerStreak.push("E");
        else playerStreak.push("P");
      }

      if (opponent) {
        const oppId = String(opponent._id);
        if (!opponentsMap.has(oppId)) {
          opponentsMap.set(oppId, {
            opponentId: oppId,
            opponentName: opponent.name,
            pj: 0,
            pg: 0,
            pe: 0,
            pp: 0,
            balance: 0,
            totalPointsFor: 0,
            totalPointsAgainst: 0,
            lastResults: [],
            challenges: {
              GDT: { wins: 0, losses: 0, maxDiffFor: 0, maxDiffAgainst: 0 },
              ARG: { wins: 0, losses: 0, maxDiffFor: 0, maxDiffAgainst: 0 },
              MISC: { wins: 0, losses: 0, maxDiffFor: 0, maxDiffAgainst: 0 },
            },
          });
        }

        const o = opponentsMap.get(oppId);
        o.pj++;
        totalPj++;
        const pFor =
          (duel.points[`player${side}`] || 0) +
          (duel.points[`bonus${side}`] || 0);
        const pAgainst =
          (duel.points[`player${oppSide}`] || 0) +
          (duel.points[`bonus${oppSide}`] || 0);
        o.totalPointsFor += pFor;
        o.totalPointsAgainst += pAgainst;

        if (duel.duelResult === side) {
          o.pg++;
          totalPg++;
          o.balance++;
          o.lastResults.push({ res: "G" });
        } else if (duel.duelResult === "draw") {
          o.pe++;
          o.lastResults.push({ res: "E" });
        } else {
          o.pp++;
          o.balance--;
          o.lastResults.push({ res: "P" });
        }

        // Lógica de desafíos (se mantiene igual)
        duel.challenges?.forEach((ch) => {
          const type = ch.type;
          if (chStats[type]) {
            chStats[type].pj++;
            if (ch.result === side) {
              chStats[type].pg++;
              o.challenges[type].wins++;
            } else if (ch.result === oppSide) {
              o.challenges[type].losses++;
            }
            const diff =
              (ch[`score${side}`] || 0) - (ch[`score${oppSide}`] || 0);
            if (diff > o.challenges[type].maxDiffFor)
              o.challenges[type].maxDiffFor = diff;
            if (diff < 0 && Math.abs(diff) > o.challenges[type].maxDiffAgainst)
              o.challenges[type].maxDiffAgainst = Math.abs(diff);
          }
        });
      }
    }
  });

  // El reverse() es para que el usuario lea de izquierda (más viejo) a derecha (último jugado)
  const finalStreak = [...playerStreak].reverse();

  const opponents = Array.from(opponentsMap.values())
    .map((o) => ({
      ...o,
      winRatio: o.pj > 0 ? ((o.pg / o.pj) * 100).toFixed(1) : "0",
      // Para cada oponente, también mostramos sus últimos resultados en orden cronológico
      lastResults: o.lastResults.slice(0, 5).reverse(),
    }))
    .sort((a, b) => b.balance - a.balance || b.pg - a.pg);

  return {
    playerSummary: {
      totalPj,
      totalPg,
      monthlyWins: monthlyWinsCount,
      rankActive,
      rankHistorical,
      playerStreak: finalStreak,
      biggestVictim: opponents[0]?.opponentName || "Nadie",
      toughestRival: opponents[opponents.length - 1]?.opponentName || "Nadie",
      challenges: chStats,
    },
    opponents,
  };
};
