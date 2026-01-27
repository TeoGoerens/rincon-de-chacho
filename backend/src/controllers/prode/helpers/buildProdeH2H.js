import ProdeMatchday from "../../../dao/models/prode/ProdeMatchdayModel.js";

export const buildProdeH2H = async (playerId) => {
  if (!playerId) return [];

  // Buscamos todas las fechas jugadas
  const matchdaysA = await ProdeMatchday.find({
    "duels.playerA": playerId,
    status: "played",
  }).populate("duels.playerA duels.playerB tournament");

  const matchdaysB = await ProdeMatchday.find({
    "duels.playerB": playerId,
    status: "played",
  }).populate("duels.playerA duels.playerB tournament");

  const allMatchdays = [...matchdaysA, ...matchdaysB];
  const h2hMap = new Map();

  allMatchdays.forEach((md) => {
    md.duels.forEach((d) => {
      const isA = String(d.playerA?._id) === String(playerId);
      const isB = String(d.playerB?._id) === String(playerId);
      if (!isA && !isB) return;

      const opponent = isA ? d.playerB : d.playerA;
      if (!opponent) return;

      const oppId = String(opponent._id);
      if (!h2hMap.has(oppId)) {
        h2hMap.set(oppId, {
          opponentName: opponent.name,
          opponentId: oppId,
          pj: 0,
          pg: 0,
          pe: 0,
          pp: 0,
          totalPointsFor: 0,
          totalPointsAgainst: 0,
          bonusFor: 0,
          bonusAgainst: 0,
          challenges: {
            GDT: { wins: 0, losses: 0, maxDiffFor: 0, maxDiffAgainst: 0 },
            ARG: { wins: 0, losses: 0, maxDiffFor: 0, maxDiffAgainst: 0 },
            MISC: { wins: 0, losses: 0, maxDiffFor: 0, maxDiffAgainst: 0 },
          },
          lastResults: [],
        });
      }

      const h = h2hMap.get(oppId);
      const myKey = isA ? "A" : "B";
      const oppKey = isA ? "B" : "A";

      h.pj += 1;
      const ptsFor =
        (d.points[`player${myKey}`] || 0) + (d.points[`bonus${myKey}`] || 0);
      const ptsAgainst =
        (d.points[`player${oppKey}`] || 0) + (d.points[`bonus${oppKey}`] || 0);

      h.totalPointsFor += ptsFor;
      h.totalPointsAgainst += ptsAgainst;
      h.bonusFor += d.points[`bonus${myKey}`] || 0;
      h.bonusAgainst += d.points[`bonus${oppKey}`] || 0;

      if (d.duelResult === myKey) {
        h.pg += 1;
        h.lastResults.push({
          res: "W",
          date: md.createdAt,
          round: md.roundNumber,
          tournament: md.tournament?.name,
        });
      } else if (d.duelResult === "draw") {
        h.pe += 1;
        h.lastResults.push({
          res: "D",
          date: md.createdAt,
          round: md.roundNumber,
          tournament: md.tournament?.name,
        });
      } else {
        h.pp += 1;
        h.lastResults.push({
          res: "L",
          date: md.createdAt,
          round: md.roundNumber,
          tournament: md.tournament?.name,
        });
      }

      d.challenges.forEach((ch) => {
        const myChScore = ch[`score${myKey}`] || 0;
        const oppChScore = ch[`score${oppKey}`] || 0;
        const diff = myChScore - oppChScore;

        if (ch.result === myKey) h.challenges[ch.type].wins += 1;
        else if (ch.result === oppKey) h.challenges[ch.type].losses += 1;

        if (diff > 0 && diff > h.challenges[ch.type].maxDiffFor) {
          h.challenges[ch.type].maxDiffFor = diff;
        }
        if (diff < 0 && Math.abs(diff) > h.challenges[ch.type].maxDiffAgainst) {
          h.challenges[ch.type].maxDiffAgainst = Math.abs(diff);
        }
      });
    });
  });

  return Array.from(h2hMap.values())
    .map((item) => ({
      ...item,
      winRatio: ((item.pg / item.pj) * 100).toFixed(1),
      lastResults: item.lastResults
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    }))
    .sort((a, b) => b.pg - a.pg || a.pp - b.pp);
};
