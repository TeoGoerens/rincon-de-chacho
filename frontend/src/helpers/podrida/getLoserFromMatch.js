export const getLoserFromMatch = (match) => {
  if (!match || !Array.isArray(match.players) || match.players.length === 0) {
    return null;
  }

  const loser = match.players.reduce((min, current) => {
    return current.score < min.score ? current : min;
  });

  return {
    name: loser.player.name,
    score: loser.score,
  };
};
