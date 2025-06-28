export const calculateMostWins = (matches) => {
  const winCounts = {};

  matches.forEach((match) => {
    const winner = match.players.find((p) => p.position === 1);
    if (winner && winner.player && winner.player.name) {
      const name = winner.player.name;
      winCounts[name] = (winCounts[name] || 0) + 1;
    }
  });

  const top = Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0];

  if (!top) return null;

  return {
    name: top[0],
    value: top[1],
  };
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

  const top = Object.entries(lastPlaceCounts).sort((a, b) => b[1] - a[1])[0];

  if (!top) return null;

  return {
    name: top[0],
    value: top[1],
  };
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

  const ratios = Object.entries(stats).map(([name, { wins, total }]) => ({
    name,
    value: Math.round((wins / total) * 100), // porcentaje entero
  }));

  if (!ratios.length) return null;

  ratios.sort((a, b) => b.value - a.value);

  return {
    name: ratios[0].name,
    value: `${ratios[0].value}%`,
  };
};

export const calculateLongestStreakOnTime = (matches) => {
  let max = null;

  matches.forEach((match) => {
    const streak = match.longestStreakOnTime;

    if (
      streak &&
      streak.player &&
      streak.player.name &&
      typeof streak.count === "number"
    ) {
      if (!max || streak.count > max.value) {
        max = {
          name: streak.player.name,
          value: streak.count,
        };
      }
    }
  });

  return max;
};

export const calculateLongestStreakFailing = (matches) => {
  let max = null;

  matches.forEach((match) => {
    const streak = match.longestStreakFailing;

    if (
      streak &&
      streak.player &&
      streak.player.name &&
      typeof streak.count === "number"
    ) {
      if (!max || streak.count > max.value) {
        max = {
          name: streak.player.name,
          value: streak.count,
        };
      }
    }
  });

  return max;
};

export const calculateHighestHighlight = (matches) => {
  let max = null;

  matches.forEach((match) => {
    const highlight = match.highlight;

    if (
      highlight &&
      highlight.player &&
      highlight.player.name &&
      typeof highlight.score === "number"
    ) {
      if (!max || highlight.score > max.value) {
        max = {
          name: highlight.player.name,
          value: highlight.score,
        };
      }
    }
  });

  return max;
};

export const calculateLongestTimeSinceFirstPlace = (matches, allPlayers) => {
  const lastWinDate = {};

  // Inicializar todos los jugadores como "Nunca"
  allPlayers.forEach((player) => {
    lastWinDate[player.name] = null;
  });

  // Ordenar partidas de más reciente a más antigua
  const sortedMatches = [...matches].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

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

  const result = Object.entries(lastWinDate).map(([name, date]) => ({
    name,
    value: date ? Math.floor((now - date) / (1000 * 60 * 60 * 24)) : "Nunca",
  }));

  // Si hay al menos uno con "Nunca", devolver ese
  const never = result.find((r) => r.value === "Nunca");
  if (never) return never;

  // Si todos ganaron alguna vez, ordenar por mayor cantidad de días
  result.sort((a, b) => b.value - a.value);
  return result[0];
};

export const calculateLongestTimeSinceLastPlace = (matches, allPlayers) => {
  const lastLastPlaceDate = {};

  // Inicializar todos los jugadores como "Nunca"
  allPlayers.forEach((player) => {
    lastLastPlaceDate[player.name] = null;
  });

  // Ordenar partidas de más reciente a más antigua
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

  // Priorizar jugadores que nunca salieron últimos
  const never = result.find((r) => r.value === "Nunca");
  if (never) return never;

  // Si todos salieron últimos alguna vez, devolver el que más días lleva sin hacerlo
  result.sort((a, b) => b.value - a.value);
  return result[0];
};

export const calculateHighestSingleScore = (matches) => {
  let max = null;

  matches.forEach((match) => {
    match.players.forEach(({ player, score }) => {
      if (!player || !player.name || typeof score !== "number") return;

      if (!max || score > max.value) {
        max = {
          name: player.name,
          value: score,
        };
      }
    });
  });

  return max;
};

export const calculateLowestSingleScore = (matches) => {
  let min = null;

  matches.forEach((match) => {
    match.players.forEach(({ player, score }) => {
      if (!player || !player.name || typeof score !== "number") return;

      if (!min || score < min.value) {
        min = {
          name: player.name,
          value: score,
        };
      }
    });
  });

  return min;
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
