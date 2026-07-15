/* Versionado DENSO de GdtSquad (decisión canónica 2026-07-09): cada cierre
   de ventana crea la versión del mes para TODOS los participantes. La
   versión base del draft es month: null. La "vigente" de un participante es
   la de mes más avanzado según el ORDEN de months del torneo. */

export const monthIndexOf = (months, month) =>
  month == null ? -1 : (months ?? []).indexOf(month);

export const squadOwnerId = (squad) =>
  String(squad.player?._id ?? squad.player);

/* Mapa playerId → versión vigente. Con beforeMonth, resuelve la vigente
   ANTERIOR a ese mes (p. ej. para vedar salientes de la ventana en curso). */
export const latestSquadsByPlayer = (squads, months, { beforeMonth } = {}) => {
  const limit =
    beforeMonth === undefined ? Infinity : monthIndexOf(months, beforeMonth);
  const map = new Map();
  for (const squad of squads) {
    const index = monthIndexOf(months, squad.month);
    if (index >= limit) continue;
    const existing = map.get(squadOwnerId(squad));
    if (!existing || index > monthIndexOf(months, existing.month)) {
      map.set(squadOwnerId(squad), squad);
    }
  }
  return map;
};

/* IDs de todos los jugadores presentes en un set de versiones */
export const playerIdsInSquads = (squads) => {
  const ids = new Set();
  for (const squad of squads) {
    for (const slot of squad.slots ?? []) {
      ids.add(String(slot.realPlayer?._id ?? slot.realPlayer));
    }
  }
  return ids;
};

/* Slots INCONSISTENTES de un plantel (requiere slots.realPlayer populado
   con club y position): posición del jugador que ya no coincide con la del
   slot, o dos slots del mismo club — se marcan ambos, reponer uno
   resuelve. Es el alcance de la "corrección" habilitada por el admin. */
export const inconsistentSlotNumbers = (squad) => {
  const normClub = (club) => (club ?? "").trim().toLowerCase();
  const result = new Set();
  const slotsByClub = new Map();
  for (const slot of squad?.slots ?? []) {
    const player = slot.realPlayer;
    if (player?.position && player.position !== slot.position) {
      result.add(slot.slotNumber);
    }
    const clubKey = normClub(player?.club);
    if (!clubKey) continue;
    if (!slotsByClub.has(clubKey)) slotsByClub.set(clubKey, []);
    slotsByClub.get(clubKey).push(slot.slotNumber);
  }
  for (const slotNumbers of slotsByClub.values()) {
    if (slotNumbers.length > 1) {
      slotNumbers.forEach((slotNumber) => result.add(slotNumber));
    }
  }
  return result;
};
