export const regroupPlayerStats = (playersStats) => {
  // Check if playersStats is empty array
  if (
    !playersStats ||
    !Array.isArray(playersStats) ||
    playersStats.length === 0
  ) {
    return []; // Return empty array if input is not a valid array or empty
  }

  const groupedPlayersStats = playersStats.reduce((acc, current) => {
    const playerId = current.player.id;

    if (!acc[playerId]) {
      acc[playerId] = {
        id_player: playerId,
        first_name: current.player.first_name,
        last_name: current.player.last_name,
        field_position: current.player.field_position,
        matches_played: 0,
        minutes_played: 0,
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        points: [],
        white_pearl: 0,
        vanilla_pearl: 0,
        ocher_pearl: 0,
        black_pearl: 0,
      };
    }

    // Sumar goles, minutos, asistencias, tarjetas
    acc[playerId].goals += current.goals;
    acc[playerId].minutes_played += current.minutes_played;
    acc[playerId].assists += current.assists;
    acc[playerId].yellow_cards += current.yellow_cards;
    acc[playerId].red_cards += current.red_cards;

    // Agregar puntos si no son 0 o null
    if (current.points !== 0 && current.points !== null) {
      acc[playerId].points.push(current.points);
      acc[playerId].matches_played += 1;
    }

    // Contar perlas
    if (current.white_pearl) {
      acc[playerId].white_pearl += 1;
    }
    if (current.vanilla_pearl) {
      acc[playerId].vanilla_pearl += 1;
    }
    if (current.ocher_pearl) {
      acc[playerId].ocher_pearl += 1;
    }
    if (current.black_pearl) {
      acc[playerId].black_pearl += 1;
    }

    return acc;
  }, {});

  // Convertir los puntos en promedio
  for (let playerId in groupedPlayersStats) {
    const player = groupedPlayersStats[playerId];
    const totalPoints = player.points.reduce((sum, p) => sum + p, 0);
    const pointsCount = player.points.length;

    player.points = pointsCount > 0 ? totalPoints / pointsCount : 0;
  }

  // Convertir el objeto en array
  return Object.values(groupedPlayersStats);
};
