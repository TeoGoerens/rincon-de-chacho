export const simplifyPointsInformation = (votes) => {
  const playerAveragePoints = [];

  for (const vote of votes) {
    for (const evaluation of vote.evaluation) {
      const playerId = evaluation.player._id;
      const playerPoints = evaluation.points;

      // Check if player exists in playerAveragePoints array
      let playerEntry = playerAveragePoints.find(
        (playerObj) => playerObj.player === playerId
      );

      if (!playerEntry) {
        // Create a new entry for the player if not found
        playerEntry = {
          player: playerId,
          totalPoints: 0,
          voteCount: 0,
          averagePoints: 0,
        };
        playerAveragePoints.push(playerEntry);
      }

      // Update player's total points and vote count
      playerEntry.totalPoints += playerPoints;
      playerEntry.voteCount += 1;

      // Calculate and update average points
      playerEntry.averagePoints =
        playerEntry.totalPoints / playerEntry.voteCount;
    }
  }

  return playerAveragePoints;
};
