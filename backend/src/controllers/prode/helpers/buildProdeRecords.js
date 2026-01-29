import ProdeMatchday from "../../../dao/models/prode/ProdeMatchdayModel.js";
import ProdeTournament from "../../../dao/models/prode/ProdeTournamentModel.js";
import ProdePlayer from "../../../dao/models/prode/ProdePlayerModel.js";

export const buildProdeRecords = async (tournamentId = null) => {
  const tQuery = tournamentId ? { _id: tournamentId } : {};

  const tournaments = await ProdeTournament.find(tQuery)
    .populate("champion lastPlace")
    .populate({
      path: "monthlyWinners.winnerPlayerIds",
      model: "ProdePlayer",
    });

  const tIds = tournaments.map((t) => t._id);

  const matchdays = await ProdeMatchday.find({
    tournament: { $in: tIds },
    status: "played",
  }).populate("duels.playerA duels.playerB");

  const statsMap = new Map();

  const getInitialStats = (id, name) => ({
    id,
    name,
    pj: 0,
    pg: 0,
    pe: 0,
    pp: 0,
    basePoints: 0,
    bonusPoints: 0,
    totalPoints: 0,
    gdtWins: 0,
    argWins: 0,
    miscWins: 0,
    gdtPj: 0,
    argPj: 0,
    miscPj: 0,
  });

  // --- GANADORES MENSUALES ---
  const monthlyWinnersCount = {};
  tournaments.forEach((t) => {
    t.monthlyWinners?.forEach((mw) => {
      mw.winnerPlayerIds?.forEach((p) => {
        const name = p?.name || "Desconocido";
        monthlyWinnersCount[name] = (monthlyWinnersCount[name] || 0) + 1;
      });
    });
  });

  // --- PROCESAR DUELOS ---
  matchdays.forEach((md) => {
    md.duels.forEach((d) => {
      const players = [
        { key: "A", data: d.playerA },
        { key: "B", data: d.playerB },
      ];
      players.forEach((side) => {
        if (!side.data) return;
        const id = String(side.data._id);
        if (!statsMap.has(id))
          statsMap.set(id, getInitialStats(id, side.data.name));

        const s = statsMap.get(id);
        const pBase = Number(d.points[`player${side.key}`] || 0);
        const pBonus = Number(d.points[`bonus${side.key}`] || 0);

        s.pj += 1;
        s.basePoints += pBase;
        s.bonusPoints += pBonus;
        s.totalPoints += pBase + pBonus;

        if (d.duelResult === side.key) s.pg += 1;
        else if (d.duelResult === "draw") s.pe += 1;
        else s.pp += 1;

        d.challenges?.forEach((ch) => {
          const typeKey = ch.type.toLowerCase();
          s[`${typeKey}Pj`] += 1; // Contamos PJ por desafío
          if (ch.result === side.key) s[`${typeKey}Wins`] += 1;
        });
      });
    });
  });

  const allStats = Array.from(statsMap.values());

  return {
    historicalTable: allStats.sort(
      (a, b) => b.totalPoints - a.totalPoints || b.basePoints - a.basePoints,
    ),

    topChampions: Object.entries(
      tournaments.reduce((acc, t) => {
        if (t.champion?.name)
          acc[t.champion.name] = (acc[t.champion.name] || 0) + 1;
        return acc;
      }, {}),
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),

    topLastPlaces: Object.entries(
      tournaments.reduce((acc, t) => {
        if (t.lastPlace?.name)
          acc[t.lastPlace.name] = (acc[t.lastPlace.name] || 0) + 1;
        return acc;
      }, {}),
    )
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),

    topMonthlyWinners: Object.entries(monthlyWinnersCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),

    efficiency: allStats
      .filter((s) => s.pg > 0)
      .map((s) => ({
        name: s.name,
        ratio: Number(((s.pg / s.pj) * 100).toFixed(1)),
        count: s.pg,
      }))
      .sort((a, b) => b.ratio - a.ratio),

    inefficiency: allStats
      .filter((s) => s.pp > 0)
      .map((s) => ({
        name: s.name,
        ratio: Number(((s.pp / s.pj) * 100).toFixed(1)),
        count: s.pp,
      }))
      .sort((a, b) => b.ratio - a.ratio),

    bonusRank: allStats
      .filter((s) => s.bonusPoints > 0)
      .map((s) => ({ name: s.name, count: s.bonusPoints }))
      .sort((a, b) => b.count - a.count),

    experts: {
      GDT: allStats
        .filter((s) => s.gdtWins > 0)
        .map((s) => ({
          name: s.name,
          count: s.gdtWins,
          ratio: Number(((s.gdtWins / s.gdtPj) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.count - a.count || b.ratio - a.ratio)
        .slice(0, 5),
      ARG: allStats
        .filter((s) => s.argWins > 0)
        .map((s) => ({
          name: s.name,
          count: s.argWins,
          ratio: Number(((s.argWins / s.argPj) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.count - a.count || b.ratio - a.ratio)
        .slice(0, 5),
      MISC: allStats
        .filter((s) => s.miscWins > 0)
        .map((s) => ({
          name: s.name,
          count: s.miscWins,
          ratio: Number(((s.miscWins / s.miscPj) * 100).toFixed(1)),
        }))
        .sort((a, b) => b.count - a.count || b.ratio - a.ratio)
        .slice(0, 5),
    },
  };
};
