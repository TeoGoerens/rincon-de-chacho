export const consolidateEvaluation = (votes) => {
  const playerPoints = {};
  //let totalVotes = 0;

  // Verificación de que votes es un arreglo y tiene elementos
  if (!Array.isArray(votes) || votes.length === 0) {
    return [];
  }

  votes.forEach((vote) => {
    vote.evaluation.forEach((evaluation) => {
      // Verificación de que evaluation y player están definidos
      const playerId = evaluation.player._id;
      const points = evaluation.points;

      if (playerPoints[playerId]) {
        playerPoints[playerId].totalPoints += points;
        playerPoints[playerId].voteCount += 1;
      } else {
        playerPoints[playerId] = {
          totalPoints: points,
          voteCount: 1,
        };
      }

      //totalVotes += 1;
    });
  });

  const consolidatedResults = Object.keys(playerPoints).map((playerId) => {
    const { totalPoints, voteCount } = playerPoints[playerId];

    // Buscar la información del jugador en todos los votos
    const playerInfo = votes.reduce((foundPlayer, vote) => {
      const evaluation = vote.evaluation.find(
        (evaluation) => evaluation.player._id === playerId
      );

      if (evaluation) {
        foundPlayer = evaluation.player;
      }

      return foundPlayer;
    }, null) || { first_name: "Undefined", last_name: "Undefined" };

    const averagePoints = voteCount > 0 ? totalPoints / voteCount : 0;

    return {
      _id: playerId,
      first_name: playerInfo.first_name || "Undefined",
      last_name: playerInfo.last_name || "Undefined",
      shirt: playerInfo.shirt || "Undefined",
      points: averagePoints,
    };
  });

  return consolidatedResults;
};
