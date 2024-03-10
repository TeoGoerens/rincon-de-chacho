export const calculateTotalVotesByPearl = (votes, campo) => {
  const personMap = new Map();

  votes?.forEach((vote) => {
    const person = vote[campo];

    if (person) {
      const { _id } = person;
      const key = _id; // Utilizar _id como clave

      if (personMap.has(key)) {
        personMap.set(key, personMap.get(key) + 1);
      } else {
        personMap.set(key, 1);
      }
    }
  });

  const personArray = Array.from(personMap.entries()).map(
    ([key, total_votes]) => {
      const person = votes.find((vote) => vote[campo]?._id === key);
      const { _id, first_name, last_name } = person[campo];
      return { _id, first_name, last_name, total_votes };
    }
  );

  // Ordenar el array por total_votes en orden descendente
  const sortedArray = personArray.sort((a, b) => b.total_votes - a.total_votes);

  return sortedArray;
};
