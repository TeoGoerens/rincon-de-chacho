export const calculateMostWins = (matches) => {
  const winCounts = {};

  matches.forEach((match) => {
    const winner = match.players.find((p) => p.position === 1);
    if (winner && winner.player && winner.player.name) {
      const name = winner.player.name;
      winCounts[name] = (winCounts[name] || 0) + 1;
    }
  });

  const sorted = Object.entries(winCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return sorted.slice(0, 3);
};

export const calculateMostLastPlaces = (matches) => {
  const lastPlaceCounts = {};

  matches.forEach((match) => {
    // Obtener la posición más baja en esa partida
    const maxPosition = Math.max(...match.players.map((p) => p.position));

    const lastPlayer = match.players.find((p) => p.position === maxPosition);

    if (lastPlayer && lastPlayer.player && lastPlayer.player.name) {
      const name = lastPlayer.player.name;
      lastPlaceCounts[name] = (lastPlaceCounts[name] || 0) + 1;
    }
  });

  const topThree = Object.entries(lastPlaceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, value]) => ({ name, value }));

  return topThree;
};

export const calculateBestWinRatio = (matches) => {
  const stats = {};

  matches.forEach((match) => {
    match.players.forEach(({ player, position }) => {
      if (!player || !player.name) return;

      const name = player.name;

      if (!stats[name]) {
        stats[name] = { wins: 0, total: 0 };
      }

      stats[name].total += 1;

      if (position === 1) {
        stats[name].wins += 1;
      }
    });
  });

  const ratios = Object.entries(stats)
    .filter(([_, { total }]) => total > 0)
    .map(([name, { wins, total }]) => ({
      name,
      value: `${Math.round((wins / total) * 100)}%`,
    }));

  const topThree = ratios
    .sort((a, b) => {
      const aVal = parseInt(a.value);
      const bVal = parseInt(b.value);
      return bVal - aVal;
    })
    .slice(0, 3);

  return topThree;
};

export const calculateLongestStreakOnTime = (matches) => {
  const streakMap = {};

  matches.forEach((match) => {
    const streak = match.longestStreakOnTime;

    if (
      streak &&
      streak.player &&
      streak.player.name &&
      typeof streak.count === "number"
    ) {
      const name = streak.player.name;

      if (!streakMap[name] || streak.count > streakMap[name]) {
        streakMap[name] = streak.count;
      }
    }
  });

  const topThree = Object.entries(streakMap)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return topThree;
};

export const calculateLongestStreakFailing = (matches) => {
  const streakMap = {};

  matches.forEach((match) => {
    const streak = match.longestStreakFailing;

    if (
      streak &&
      streak.player &&
      streak.player.name &&
      typeof streak.count === "number"
    ) {
      const name = streak.player.name;

      if (!streakMap[name] || streak.count > streakMap[name]) {
        streakMap[name] = streak.count;
      }
    }
  });

  const topThree = Object.entries(streakMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return topThree;
};

export const calculateHighestHighlight = (matches) => {
  const highlights = [];

  matches.forEach((match) => {
    const highlight = match.highlight;

    if (
      highlight &&
      highlight.player &&
      highlight.player.name &&
      typeof highlight.score === "number"
    ) {
      highlights.push({
        name: highlight.player.name,
        value: highlight.score,
      });
    }
  });

  // Ordenamos por puntaje descendente y tomamos el top 3
  return highlights.sort((a, b) => b.value - a.value).slice(0, 3);
};

export const calculateLongestTimeSinceFirstPlace = (matches, allPlayers) => {
  const lastWinDate = {};

  // Inicializamos todos los jugadores como "Nunca"
  allPlayers.forEach((player) => {
    lastWinDate[player.name] = null;
  });

  // Ordenamos partidas de más reciente a más antigua
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Recorremos para registrar la fecha más reciente en que ganaron
  for (const match of sortedMatches) {
    const winner = match.players.find((p) => p.position === 1);
    if (winner && winner.player && winner.player.name) {
      const name = winner.player.name;
      if (!lastWinDate[name]) {
        lastWinDate[name] = new Date(match.date);
      }
    }
  }

  const now = new Date();

  // Convertimos en array con cálculo de días o "Nunca"
  const result = Object.entries(lastWinDate).map(([name, date]) => ({
    name,
    value: date ? Math.floor((now - date) / (1000 * 60 * 60 * 24)) : "Nunca",
  }));

  // Separar quienes nunca ganaron
  const neverWon = result.filter((r) => r.value === "Nunca");
  const others = result
    .filter((r) => r.value !== "Nunca")
    .sort((a, b) => b.value - a.value); // Ordenamos por días

  // Armamos el top 3
  const top3 = [...neverWon.slice(0, 3)];

  if (top3.length < 3) {
    top3.push(...others.slice(0, 3 - top3.length));
  }

  return top3;
};

export const calculateLongestTimeSinceLastPlace = (matches, allPlayers) => {
  const lastLastPlaceDate = {};

  // Inicializamos todos los jugadores como "Nunca"
  allPlayers.forEach((player) => {
    lastLastPlaceDate[player.name] = null;
  });

  // Ordenamos las partidas de más reciente a más antigua
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  for (const match of sortedMatches) {
    const maxPosition = Math.max(...match.players.map((p) => p.position));
    const lastPlayer = match.players.find((p) => p.position === maxPosition);

    if (lastPlayer && lastPlayer.player && lastPlayer.player.name) {
      const name = lastPlayer.player.name;
      if (!lastLastPlaceDate[name]) {
        lastLastPlaceDate[name] = new Date(match.date);
      }
    }
  }

  const now = new Date();

  const result = Object.entries(lastLastPlaceDate).map(([name, date]) => ({
    name,
    value: date ? Math.floor((now - date) / (1000 * 60 * 60 * 24)) : "Nunca",
  }));

  // Separar quienes nunca salieron últimos
  const never = result.filter((r) => r.value === "Nunca");
  const others = result
    .filter((r) => r.value !== "Nunca")
    .sort((a, b) => b.value - a.value); // más días sin salir últimos

  // Armamos el top 3
  const top3 = [...never.slice(0, 3)];

  if (top3.length < 3) {
    top3.push(...others.slice(0, 3 - top3.length));
  }

  return top3;
};

export const calculateHighestSingleScore = (matches) => {
  const scores = [];

  matches.forEach((match) => {
    match.players.forEach(({ player, score }) => {
      if (!player || !player.name || typeof score !== "number") return;

      scores.push({
        name: player.name,
        value: score,
      });
    });
  });

  if (!scores.length) return [];

  scores.sort((a, b) => b.value - a.value);

  // Tomamos los primeros 3
  return scores.slice(0, 3);
};

export const calculateLowestSingleScore = (matches) => {
  const scores = [];

  matches.forEach((match) => {
    match.players.forEach(({ player, score }) => {
      if (!player || !player.name || typeof score !== "number") return;

      scores.push({
        name: player.name,
        value: score,
      });
    });
  });

  if (!scores.length) return [];

  scores.sort((a, b) => a.value - b.value); // Orden ascendente

  // Tomamos los primeros 3
  return scores.slice(0, 3);
};

export const calculateRanking = (matches) => {
  const playerStats = {};

  matches.forEach((match) => {
    // Determinar la peor posición (último puesto)
    const worstPosition = Math.max(...match.players.map((p) => p.position));

    // Contabilizar a cada jugador en la partida
    match.players.forEach(({ player, position }) => {
      const name = player.name;

      if (!playerStats[name]) {
        playerStats[name] = {
          name,
          played: 0,
          firsts: 0,
          seconds: 0,
          thirds: 0,
          lasts: 0,
          highlights: 0,
        };
      }

      const stats = playerStats[name];
      stats.played += 1;

      if (position === 1) stats.firsts += 1;
      else if (position === 2) stats.seconds += 1;
      else if (position === 3) stats.thirds += 1;
      if (position === worstPosition) stats.lasts += 1;
    });

    // Agregar punto por highlight
    if (
      match.highlight &&
      match.highlight.player &&
      match.highlight.player.name
    ) {
      const name = match.highlight.player.name;
      if (!playerStats[name]) {
        playerStats[name] = {
          name,
          played: 0,
          firsts: 0,
          seconds: 0,
          thirds: 0,
          lasts: 0,
          highlights: 0,
        };
      }
      playerStats[name].highlights += 1;
    }
  });

  // Calcular puntos y promedio
  const rankingArray = Object.values(playerStats).map((stats) => {
    const points =
      stats.firsts * 3 +
      stats.seconds * 2 +
      stats.thirds +
      stats.highlights -
      stats.lasts;

    return {
      ...stats,
      points,
      average: stats.played
        ? parseFloat((points / stats.played).toFixed(2))
        : 0,
    };
  });

  // Ordenar por puntos descendente
  rankingArray.sort((a, b) => b.points - a.points);

  return rankingArray;
};
