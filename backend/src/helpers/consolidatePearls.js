const consolidatePearls = (votes) => {
  //Crear un objeto para almacenar la consolidación de datos
  const consolidatedVotes = {
    white_pearl: [],
    vanilla_pearl: [],
    ocher_pearl: [],
    black_pearl: [],
  };

  // Iterar sobre cada voto
  votes.forEach((vote) => {
    // Obtener la información relevante de cada voto
    const whitePearlId = vote.white_pearl._id;
    const vanillaPearlId = vote.vanilla_pearl._id;
    const ocherPearlId = vote.ocher_pearl._id;
    const blackPearlId = vote.black_pearl._id;

    // Añadir los _id a los arrays correspondientes en consolidatedVotes
    consolidatedVotes.white_pearl.push(whitePearlId);
    consolidatedVotes.vanilla_pearl.push(vanillaPearlId);
    consolidatedVotes.ocher_pearl.push(ocherPearlId);
    consolidatedVotes.black_pearl.push(blackPearlId);
  });

  // Encontrar el _id más votado para cada categoría
  const mostVotedWhitePearl = findMostVoted(consolidatedVotes.white_pearl);
  const mostVotedVanillaPearl = findMostVoted(consolidatedVotes.vanilla_pearl);
  const mostVotedOcherPearl = findMostVoted(consolidatedVotes.ocher_pearl);
  const mostVotedBlackPearl = findMostVoted(consolidatedVotes.black_pearl);

  // Asignar los resultados al objeto final
  consolidatedVotes.white_pearl = mostVotedWhitePearl;
  consolidatedVotes.vanilla_pearl = mostVotedVanillaPearl;
  consolidatedVotes.ocher_pearl = mostVotedOcherPearl;
  consolidatedVotes.black_pearl = mostVotedBlackPearl;

  // Devolver los datos consolidados
  return consolidatedVotes;
};

// Función auxiliar para encontrar el _id más votado o empates
function findMostVoted(arr) {
  const counts = {};
  let maxCount = 0;

  // Contar la frecuencia de cada elemento
  arr.forEach((id) => {
    counts[id] = (counts[id] || 0) + 1;
    maxCount = Math.max(maxCount, counts[id]);
  });

  // Filtrar los elementos con la misma frecuencia máxima
  const mostVoted = Object.keys(counts).filter((id) => counts[id] === maxCount);

  return mostVoted;
}

export default consolidatePearls;
