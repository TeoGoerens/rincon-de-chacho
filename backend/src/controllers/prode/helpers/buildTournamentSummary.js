import ProdeMatchday from "../../../dao/models/prode/ProdeMatchdayModel.js";

export const buildTournamentSummary = async (tournamentId) => {
  const matchdays = await ProdeMatchday.find({
    tournament: tournamentId,
    status: "played",
  }).populate("duels.playerA duels.playerB", "name");

  const rowsMap = new Map();
  const monthlyMap = new Map();

  const createEmptyRow = (id, name) => ({
    playerId: id,
    name: name || "—",
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    basePoints: 0,
    bonusPoints: 0,
    totalPoints: 0,
    challengesStats: {
      GDT: { played: 0, wins: 0, draws: 0, losses: 0 },
      ARG: { played: 0, wins: 0, draws: 0, losses: 0 },
      MISC: { played: 0, wins: 0, draws: 0, losses: 0 },
    },
  });

  for (const md of matchdays) {
    const monthName = md.month;
    if (!monthName) continue;

    if (!monthlyMap.has(monthName)) {
      monthlyMap.set(monthName, new Map());
    }
    const currentMonthMap = monthlyMap.get(monthName);

    for (const d of md.duels) {
      if (!d?.playerA || !d?.playerB) continue;

      const players = [
        { key: "A", data: d.playerA },
        { key: "B", data: d.playerB },
      ];

      players.forEach((p) => {
        const id = String(p.data._id || p.data);
        const name = p.data.name || "";

        if (!rowsMap.has(id)) rowsMap.set(id, createEmptyRow(id, name));
        const rowTotal = rowsMap.get(id);

        if (!currentMonthMap.has(id))
          currentMonthMap.set(id, createEmptyRow(id, name));
        const rowMonth = currentMonthMap.get(id);

        const points = d.points || {};
        const base = Number(points[`player${p.key}`] ?? 0);
        const bonus = Number(points[`bonus${p.key}`] ?? 0);
        const result = d.duelResult;

        [rowTotal, rowMonth].forEach((row) => {
          row.basePoints += base;
          row.bonusPoints += bonus;
          row.played += 1;

          if (result === p.key) {
            row.wins += 1;
          } else if (result === (p.key === "A" ? "B" : "A")) {
            row.losses += 1;
          } else {
            row.draws += 1;
          }
          row.totalPoints = row.basePoints + row.bonusPoints;

          d.challenges.forEach((ch) => {
            const type = ch.type;
            if (row.challengesStats[type]) {
              row.challengesStats[type].played += 1;
              if (ch.result === p.key) {
                row.challengesStats[type].wins += 1;
              } else if (ch.result === "draw") {
                row.challengesStats[type].draws += 1;
              } else {
                row.challengesStats[type].losses += 1;
              }
            }
          });
        });
      });
    }
  }

  // --- LÓGICA DE ORDENAMIENTO UNIFICADA AQUÍ ---
  const finalizeTable = (map) => {
    return Array.from(map.values()).sort((x, y) => {
      // 1° Criterio: Puntos Totales
      if (y.totalPoints !== x.totalPoints) return y.totalPoints - x.totalPoints;
      // 2° Criterio: Puntos Base (Desempate)
      return y.basePoints - x.basePoints;
    });
  };

  const byMonth = {};
  for (const [monthName, map] of monthlyMap.entries()) {
    byMonth[monthName] = finalizeTable(map);
  }

  const table = finalizeTable(rowsMap);

  return {
    table,
    byMonth,
    championPlayerId: table.length ? table[0].playerId : null,
    lastPlacePlayerId: table.length ? table[table.length - 1].playerId : null,
  };
};
