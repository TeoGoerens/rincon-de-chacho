export const calculateMostWins = (matches) => {
  const winCounts = {};

  matches.forEach((match) => {
    const winner = match.players.find((p) => p.position === 1);
    if (winner?.player?.name) {
      const name = winner.player.name;
      winCounts[name] = (winCounts[name] || 0) + 1;
    }
  });

  return Object.entries(winCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export const calculateMostLastPlaces = (matches) => {
  const lastPlaceCounts = {};

  matches.forEach((match) => {
    const maxPosition = Math.max(...match.players.map((p) => p.position));
    const lastPlayer = match.players.find((p) => p.position === maxPosition);

    if (lastPlayer?.player?.name) {
      const name = lastPlayer.player.name;
      lastPlaceCounts[name] = (lastPlaceCounts[name] || 0) + 1;
    }
  });

  return Object.entries(lastPlaceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, value]) => ({ name, value }));
};


export const calculateLongestStreakOnTime = (matches) => {
  const streakMap = {};

  matches.forEach((match) => {
    const streak = match.longestStreakOnTime;
    if (streak?.player?.name && typeof streak.count === "number") {
      const name = streak.player.name;
      if (!streakMap[name] || streak.count > streakMap[name]) {
        streakMap[name] = streak.count;
      }
    }
  });

  return Object.entries(streakMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export const calculateLongestStreakFailing = (matches) => {
  const streakMap = {};

  matches.forEach((match) => {
    const streak = match.longestStreakFailing;
    if (streak?.player?.name && typeof streak.count === "number") {
      const name = streak.player.name;
      if (!streakMap[name] || streak.count > streakMap[name]) {
        streakMap[name] = streak.count;
      }
    }
  });

  return Object.entries(streakMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export const calculateMostHighlights = (matches) => {
  const counts = {};

  matches.forEach((match) => {
    if (match.highlight?.player?.name) {
      const name = match.highlight.player.name;
      counts[name] = (counts[name] || 0) + 1;
    }
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export const calculateHighestHighlight = (matches) => {
  return matches
    .filter((m) => m.highlight?.player?.name && typeof m.highlight.score === "number")
    .map((m) => ({ name: m.highlight.player.name, value: m.highlight.score }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

// Mejor tramo histórico de partidas consecutivas sin ganar (negativo)
// "Active" = ese mejor tramo es el que está vigente hoy
export const calculateDroughtSinceFirstPlace = (matches) => {
  const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));

  const playerData = {};

  sortedMatches.forEach((match, idx) => {
    match.players.forEach(({ player, position }) => {
      if (!player?.name) return;
      const name = player.name;
      if (!playerData[name]) playerData[name] = { name, matchIndices: [], winIndices: [] };
      playerData[name].matchIndices.push(idx);
      if (position === 1) playerData[name].winIndices.push(idx);
    });
  });

  const now = new Date();

  return Object.values(playerData)
    .map((p) => {
      const checkpoints = [-1, ...p.winIndices];
      let bestGap = 0;
      let bestActive = false;
      let bestStartDate = null;
      let bestEndDate = null;

      for (let i = 0; i < checkpoints.length; i++) {
        const from = checkpoints[i];
        const to = checkpoints[i + 1] ?? Infinity;
        const gapIndices = p.matchIndices.filter((mi) => mi > from && mi < to);
        const gap = gapIndices.length;
        const isActive = to === Infinity;

        if (gap > bestGap || (gap === bestGap && isActive)) {
          bestGap = gap;
          bestActive = isActive;
          // inicio del tramo: match que abrió la sequía, o primer match del jugador si nunca ganó
          const startIdx = from >= 0 ? from : (gapIndices[0] ?? null);
          bestStartDate = startIdx !== null ? new Date(sortedMatches[startIdx].date) : null;
          bestEndDate = isActive ? now : (to < Infinity ? new Date(sortedMatches[to].date) : null);
        }
      }

      const days = (bestStartDate && bestEndDate)
        ? Math.floor((bestEndDate - bestStartDate) / (1000 * 60 * 60 * 24))
        : null;

      return { name: p.name, value: bestGap, days, active: bestActive };
    })
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

// Mejor tramo histórico de partidas consecutivas sin salir último (positivo)
// "Active" = ese mejor tramo es el que está vigente hoy
export const calculateDroughtSinceLastPlace = (matches) => {
  const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));

  const playerData = {};

  sortedMatches.forEach((match, idx) => {
    const maxPosition = Math.max(...match.players.map((p) => p.position));

    match.players.forEach(({ player, position }) => {
      if (!player?.name) return;
      const name = player.name;
      if (!playerData[name]) playerData[name] = { name, matchIndices: [], lastIndices: [] };
      playerData[name].matchIndices.push(idx);
      if (position === maxPosition) playerData[name].lastIndices.push(idx);
    });
  });

  const now = new Date();

  return Object.values(playerData)
    .map((p) => {
      const checkpoints = [-1, ...p.lastIndices];
      let bestGap = 0;
      let bestActive = false;
      let bestStartDate = null;
      let bestEndDate = null;

      for (let i = 0; i < checkpoints.length; i++) {
        const from = checkpoints[i];
        const to = checkpoints[i + 1] ?? Infinity;
        const gapIndices = p.matchIndices.filter((mi) => mi > from && mi < to);
        const gap = gapIndices.length;
        const isActive = to === Infinity;

        if (gap > bestGap || (gap === bestGap && isActive)) {
          bestGap = gap;
          bestActive = isActive;
          const startIdx = from >= 0 ? from : (gapIndices[0] ?? null);
          bestStartDate = startIdx !== null ? new Date(sortedMatches[startIdx].date) : null;
          bestEndDate = isActive ? now : (to < Infinity ? new Date(sortedMatches[to].date) : null);
        }
      }

      const days = (bestStartDate && bestEndDate)
        ? Math.floor((bestEndDate - bestStartDate) / (1000 * 60 * 60 * 24))
        : null;

      return { name: p.name, value: bestGap, days, active: bestActive };
    })
    .filter((p) => p.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export const calculateHighestSingleScore = (matches) => {
  return matches
    .flatMap((m) =>
      m.players
        .filter((p) => p.player?.name && typeof p.score === "number")
        .map((p) => ({ name: p.player.name, value: p.score }))
    )
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);
};

export const calculateLowestSingleScore = (matches) => {
  return matches
    .flatMap((m) =>
      m.players
        .filter((p) => p.player?.name && typeof p.score === "number")
        .map((p) => ({ name: p.player.name, value: p.score }))
    )
    .sort((a, b) => a.value - b.value)
    .slice(0, 5);
};

export const calculateRanking = (matches) => {
  const playerStats = {};

  matches.forEach((match) => {
    const worstPosition = Math.max(...match.players.map((p) => p.position));

    match.players.forEach(({ player, position }) => {
      const name = player.name;
      if (!playerStats[name]) {
        playerStats[name] = { name, played: 0, firsts: 0, seconds: 0, thirds: 0, lasts: 0, highlights: 0 };
      }

      const stats = playerStats[name];
      stats.played += 1;
      if (position === 1) stats.firsts += 1;
      else if (position === 2) stats.seconds += 1;
      else if (position === 3) stats.thirds += 1;
      if (position === worstPosition) stats.lasts += 1;
    });

    if (match.highlight?.player?.name) {
      const name = match.highlight.player.name;
      if (!playerStats[name]) {
        playerStats[name] = { name, played: 0, firsts: 0, seconds: 0, thirds: 0, lasts: 0, highlights: 0 };
      }
      playerStats[name].highlights += 1;
    }
  });

  return Object.values(playerStats)
    .map((stats) => {
      const points = stats.firsts * 3 + stats.seconds * 2 + stats.thirds + stats.highlights - stats.lasts;
      return { ...stats, points, average: stats.played ? parseFloat((points / stats.played).toFixed(2)) : 0 };
    })
    .sort((a, b) => b.points - a.points);
};

export const calculatePlayerProfiles = (matches) => {
  const playerStats = {};

  matches.forEach((match) => {
    const worstPosition = Math.max(...match.players.map((p) => p.position));
    const matchDate = new Date(match.date);

    match.players.forEach(({ player, position, score }) => {
      const id = player._id.toString();
      const name = player.name;

      if (!playerStats[id]) {
        playerStats[id] = {
          id,
          name,
          played: 0,
          firsts: 0,
          seconds: 0,
          thirds: 0,
          lasts: 0,
          highlights: 0,
          totalScore: 0,
          firstMatch: matchDate,
          lastMatch: matchDate,
        };
      }

      const s = playerStats[id];
      s.played += 1;
      s.totalScore += score;
      if (position === 1) s.firsts += 1;
      else if (position === 2) s.seconds += 1;
      else if (position === 3) s.thirds += 1;
      if (position === worstPosition) s.lasts += 1;
      if (matchDate < s.firstMatch) s.firstMatch = matchDate;
      if (matchDate > s.lastMatch) s.lastMatch = matchDate;
    });

    if (match.highlight?.player?._id) {
      const id = match.highlight.player._id.toString();
      if (playerStats[id]) playerStats[id].highlights += 1;
    }
  });

  return Object.values(playerStats).map((s) => {
    const points = s.firsts * 3 + s.seconds * 2 + s.thirds + s.highlights - s.lasts;
    return {
      id: s.id,
      name: s.name,
      played: s.played,
      firsts: s.firsts,
      seconds: s.seconds,
      thirds: s.thirds,
      lasts: s.lasts,
      highlights: s.highlights,
      totalScore: s.totalScore,
      points,
      average: s.played ? parseFloat((points / s.played).toFixed(2)) : 0,
      winRatio: s.played ? Math.round((s.firsts / s.played) * 100) : 0,
      lastRatio: s.played ? Math.round((s.lasts / s.played) * 100) : 0,
      highlightRatio: s.played ? Math.round((s.highlights / s.played) * 100) : 0,
      firstMatch: s.firstMatch,
      lastMatch: s.lastMatch,
    };
  });
};
