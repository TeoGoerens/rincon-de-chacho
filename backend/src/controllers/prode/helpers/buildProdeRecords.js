import ProdeMatchday from "../../../dao/models/prode/ProdeMatchdayModel.js";
import ProdeTournament from "../../../dao/models/prode/ProdeTournamentModel.js";

export const buildProdeRecords = async (tournamentId = null) => {
  // Cambiamos el filtro: Si no hay ID, traemos TODOS para que "Historia Completa" siempre tenga data
  const tQuery = tournamentId ? { _id: tournamentId } : {};
  const tournaments =
    await ProdeTournament.find(tQuery).populate("champion lastPlace");
  const tIds = tournaments.map((t) => t._id);

  const matchdays = await ProdeMatchday.find({
    tournament: { $in: tIds },
    status: "played",
  }).populate("duels.playerA duels.playerB");

  const statsMap = new Map();
  // Ahora guardamos objeto con valor y nombre del jugador
  const maxScores = {
    GDT: { value: 0, player: "—" },
    ARG: { value: 0, player: "—" },
    MISC: { value: 0, player: "—" },
  };

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
  });

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

        s.pj += 1;
        s.basePoints += d.points[`player${side.key}`] || 0;
        s.bonusPoints += d.points[`bonus${side.key}`] || 0;
        s.totalPoints = s.basePoints + s.bonusPoints;

        if (d.duelResult === side.key) s.pg += 1;
        else if (d.duelResult === "draw") s.pe += 1;
        else s.pp += 1;

        d.challenges.forEach((ch) => {
          const score = ch[`score${side.key}`] || 0;
          // Guardamos el récord y quién lo hizo
          if (score > maxScores[ch.type].value) {
            maxScores[ch.type] = { value: score, player: side.data.name };
          }
          if (ch.result === side.key) {
            if (ch.type === "GDT") s.gdtWins += 1;
            if (ch.type === "ARG") s.argWins += 1;
            if (ch.type === "MISC") s.miscWins += 1;
          }
        });
      });
    });
  });

  const champCount = {};
  const lastCount = {};
  tournaments.forEach((t) => {
    if (t.champion)
      champCount[t.champion.name] = (champCount[t.champion.name] || 0) + 1;
    if (t.lastPlace)
      lastCount[t.lastPlace.name] = (lastCount[t.lastPlace.name] || 0) + 1;
  });

  const allStats = Array.from(statsMap.values());
  const getTop3 = (arr, key) =>
    [...arr].sort((a, b) => b[key] - a[key]).slice(0, 3);

  return {
    historicalTable: [...allStats].sort(
      (a, b) => b.totalPoints - a.totalPoints,
    ),
    topChampions: Object.entries(champCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    topLastPlaces: Object.entries(lastCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
    efficiency: allStats
      .filter((s) => s.pj >= 1)
      .map((s) => ({ name: s.name, ratio: ((s.pg / s.pj) * 100).toFixed(1) }))
      .sort((a, b) => b.ratio - a.ratio),
    inefficiency: allStats
      .filter((s) => s.pj >= 1)
      .map((s) => ({ name: s.name, ratio: ((s.pp / s.pj) * 100).toFixed(1) }))
      .sort((a, b) => b.ratio - a.ratio),
    bonusRank: getTop3(allStats, "bonusPoints"),
    experts: {
      GDT: getTop3(allStats, "gdtWins"),
      ARG: getTop3(allStats, "argWins"),
      MISC: getTop3(allStats, "miscWins"),
    },
    maxScores,
  };
};
