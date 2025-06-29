export const getWinnerFromMatch = (match) => {
  if (!match || !Array.isArray(match.players) || match.players.length === 0) {
    return null;
  }

  const winner = match.players.reduce((max, current) => {
    return current.score > max.score ? current : max;
  });

  return {
    name: winner.player.name,
    score: winner.score,
  };
};
