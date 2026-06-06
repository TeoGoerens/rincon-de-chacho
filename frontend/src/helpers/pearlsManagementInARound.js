export const calculateTotalVotesByPearl = (votes, campo) => {
  const personMap = new Map();

  votes?.forEach((vote) => {
    const person = vote[campo];
    if (!person) return;

    const key = person._id;
    if (personMap.has(key)) {
      personMap.get(key).count += 1;
    } else {
      personMap.set(key, { player: person, count: 1 });
    }
  });

  return Array.from(personMap.values())
    .map(({ player, count }) => ({
      _id:         player._id,
      first_name:  player.first_name,
      last_name:   player.last_name,
      total_votes: count,
    }))
    .sort((a, b) => b.total_votes - a.total_votes);
};
