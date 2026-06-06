export const consolidateEvaluation = (votes) => {
  if (!Array.isArray(votes) || votes.length === 0) return [];

  const playerMap = {};

  votes.forEach((vote) => {
    vote.evaluation.forEach((evaluation) => {
      const playerId = evaluation.player._id;
      const points   = evaluation.points;

      if (playerMap[playerId]) {
        playerMap[playerId].totalPoints += points;
        playerMap[playerId].voteCount   += 1;
      } else {
        playerMap[playerId] = {
          totalPoints: points,
          voteCount:   1,
          player:      evaluation.player,
        };
      }
    });
  });

  return Object.values(playerMap).map(({ totalPoints, voteCount, player }) => ({
    _id:        player._id,
    first_name: player.first_name  || "Undefined",
    last_name:  player.last_name   || "Undefined",
    shirt:      player.shirt       || "Undefined",
    points:     voteCount > 0 ? totalPoints / voteCount : 0,
  }));
};
