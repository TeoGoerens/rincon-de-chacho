import ProdeMatchday from "../../../dao/models/prode/ProdeMatchdayModel.js";
import ProdeTournament from "../../../dao/models/prode/ProdeTournamentModel.js";
import ProdePlayer from "../../../dao/models/prode/ProdePlayerModel.js";
import { buildProdeRecords } from "./buildProdeRecords.js"; // Reutilizamos la lógica de la tabla

export const buildProdeH2H = async (playerId) => {
  if (!playerId) return null;

  // --- 1. CÁLCULO DE RANKINGS ---
  // Obtenemos la tabla histórica completa para saber la posición
  const historicalData = await buildProdeRecords();
  const rankHistorical =
    historicalData.historicalTable.findIndex(
      (p) => String(p.id) === String(playerId),
    ) + 1;

  // Obtenemos el torneo activo para el ranking actual
  const activeTournament = await ProdeTournament.findOne({ status: "active" });
  let rankActive = "N/A";
  if (activeTournament) {
    const activeData = await buildProdeRecords(activeTournament._id);
    const pos = activeData.historicalTable.findIndex(
      (p) => String(p.id) === String(playerId),
    );
    if (pos !== -1) rankActive = pos + 1;
  }

  // --- 2. VICTORIAS MENSUALES ---
  const tournaments = await ProdeTournament.find().populate(
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
  const matchdays = await ProdeMatchday.find({
    status: "played",
    $or: [{ "duels.playerA": playerId }, { "duels.playerB": playerId }],
  }).populate("duels.playerA duels.playerB");

  const opponentsMap = new Map();
  let totalPg = 0;
  let totalPj = 0;
  const chStats = {
    GDT: { pg: 0, pj: 0 },
    ARG: { pg: 0, pj: 0 },
    MISC: { pg: 0, pj: 0 },
  };

  matchdays.forEach((md) => {
    md.duels.forEach((d) => {
      const isPlayerA = String(d.playerA?._id) === String(playerId);
      const isPlayerB = String(d.playerB?._id) === String(playerId);
      if (!isPlayerA && !isPlayerB) return;

      const side = isPlayerA ? "A" : "B";
      const oppSide = isPlayerA ? "B" : "A";
      const opponent = isPlayerA ? d.playerB : d.playerA;
      if (!opponent) return;

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
        (d.points[`player${side}`] || 0) + (d.points[`bonus${side}`] || 0);
      const pAgainst =
        (d.points[`player${oppSide}`] || 0) +
        (d.points[`bonus${oppSide}`] || 0);
      o.totalPointsFor += pFor;
      o.totalPointsAgainst += pAgainst;

      if (d.duelResult === side) {
        o.pg++;
        totalPg++;
        o.balance++;
        o.lastResults.push({ res: "G" });
      } else if (d.duelResult === "draw") {
        o.pe++;
        o.lastResults.push({ res: "E" });
      } else {
        o.pp++;
        o.balance--;
        o.lastResults.push({ res: "P" });
      }

      d.challenges?.forEach((ch) => {
        const type = ch.type;
        if (chStats[type]) {
          chStats[type].pj++;
          if (ch.result === side) {
            chStats[type].pg++;
            o.challenges[type].wins++;
          } else if (ch.result === oppSide) {
            o.challenges[type].losses++;
          }
          const diff = (ch[`score${side}`] || 0) - (ch[`score${oppSide}`] || 0);
          if (diff > o.challenges[type].maxDiffFor)
            o.challenges[type].maxDiffFor = diff;
          if (diff < 0 && Math.abs(diff) > o.challenges[type].maxDiffAgainst)
            o.challenges[type].maxDiffAgainst = Math.abs(diff);
        }
      });
    });
  });

  const opponents = Array.from(opponentsMap.values())
    .map((o) => ({
      ...o,
      winRatio: ((o.pg / o.pj) * 100).toFixed(1),
      lastResults: o.lastResults.slice(-5).reverse(),
    }))
    .sort((a, b) => b.balance - a.balance);

  return {
    playerSummary: {
      totalPj,
      totalPg,
      monthlyWins: monthlyWinsCount,
      rankActive: rankActive,
      rankHistorical: rankHistorical,
      biggestVictim:
        [...opponents].sort((a, b) => b.balance - a.balance)[0]?.opponentName ||
        "Nadie",
      toughestRival:
        [...opponents].sort((a, b) => a.balance - b.balance)[0]?.opponentName ||
        "Nadie",
      challenges: chStats,
    },
    opponents,
  };
};
