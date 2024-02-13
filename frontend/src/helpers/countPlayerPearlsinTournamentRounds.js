export const pearlsCount = (tournamentRounds, pearl) => {
  const playerCounts = {};

  if (!Array.isArray(tournamentRounds) || tournamentRounds.length === 0) {
    return [];
  }

  for (const tournamentRound of tournamentRounds) {
    const pearlArray = tournamentRound[pearl];

    if (Array.isArray(pearlArray)) {
      for (const pearlPlayer of pearlArray) {
        const _id = pearlPlayer._id;

        if (playerCounts[_id]) {
          playerCounts[_id].timesPearl += 1;
        } else {
          playerCounts[_id] = {
            _id,
            timesPearl: 1,
            first_name: pearlPlayer.first_name,
            last_name: pearlPlayer.last_name,
            shirt: pearlPlayer.shirt,
          };
        }
      }
    }
  }

  const sortedPlayerCounts = Object.values(playerCounts).sort(
    (a, b) => b.timesPearl - a.timesPearl
  );

  return sortedPlayerCounts;
};
