const consolidatePearls = (votes) => {
  // Mapa para almacenar los puntos de cada jugador
  const playerPoints = new Map();

  // Recorrer cada voto
  votes.forEach((vote) => {
    // Obtener los IDs de los jugadores que recibieron votos en este voto
    const whitePearlId = vote.white_pearl;
    const vanillaPearlId = vote.vanilla_pearl;
    const ocherPearlId = vote.ocher_pearl;
    const blackPearlId = vote.black_pearl;

    // Sumar o restar puntos para cada jugador según la perla
    addPoints(playerPoints, whitePearlId, 5);
    addPoints(playerPoints, vanillaPearlId, 1);
    addPoints(playerPoints, ocherPearlId, -1);
    addPoints(playerPoints, blackPearlId, -5);
  });

  // Convertir el mapa a un array de objetos
  const results = Array.from(playerPoints, ([playerId, points]) => ({
    player_id: playerId,
    points,
  }));

  // Ordenar el array results de mayor a menor según los puntos
  results.sort(compareByPointsDesc);

  // Obtener las posiciones de los jugadores
  const firstPlace = 0;
  const secondPlace = 1;
  const penultimatePlace = results.length - 2;
  const lastPlace = results.length - 1;

  // Obtener los IDs de los jugadores
  const topPlayers = results.slice(firstPlace, secondPlace + 1);
  const bottomPlayers = results.slice(penultimatePlace, lastPlace + 1);

  // Crear el objeto finalPearls
  const finalPearls = {
    white_pearl: topPlayers[0].player_id,
    vanilla_pearl: topPlayers[1].player_id,
    ocher_pearl: bottomPlayers[0].player_id,
    black_pearl: bottomPlayers[1].player_id,
  };

  console.log(finalPearls);
  // Retornar el objeto final con los resultados
  return finalPearls;
};

// Función auxiliar para agregar puntos a un jugador en el mapa
const addPoints = (playerPoints, playerId, points) => {
  if (playerId) {
    const currentPoints = playerPoints.get(playerId) || 0;
    playerPoints.set(playerId, currentPoints + points);
  }
};

// Función auxiliar para ordenar un array de mayor a menor según los puntos de los objetos dentro
const compareByPointsDesc = (player1, player2) => {
  // Devolver un valor negativo si player1 tiene más puntos que player2
  // Devolver un valor positivo si player1 tiene menos puntos que player2
  // Devolver 0 si tienen la misma cantidad de puntos
  return player2.points - player1.points;
};

export default consolidatePearls;
