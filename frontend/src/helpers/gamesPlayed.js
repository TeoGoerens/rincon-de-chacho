export const gamesPlayed = (tournamentRounds) => {
  const playerGamesCount = {};

  if (!Array.isArray(tournamentRounds) || tournamentRounds.length === 0) {
    return [];
  }

  for (const tournamentRound of tournamentRounds) {
    for (const player of tournamentRound.players) {
      const playerId = player._id;
      playerGamesCount[playerId] = (playerGamesCount[playerId] || 0) + 1;
    }
  }

  return Object.keys(playerGamesCount).map((playerId) => ({
    _id: playerId,
    gamesPlayed: playerGamesCount[playerId],
  }));
};
