//Campos editables por jugador (los minutos no se usan en ningún lado del sitio)
export const STAT_FIELDS = [
  { key: "goals", label: "Goles" },
  { key: "assists", label: "Asist." },
  { key: "yellow_cards", label: "Amarillas" },
  { key: "red_cards", label: "Rojas" },
];

export const emptyStats = () => ({
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
});
