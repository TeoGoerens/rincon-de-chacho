//Import React & Hooks
import React from "react";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "./PlayersToggleListStyle.css";

//Import React Query functions
import fetchAllChachosPlayers from "../../../reactquery/chachos/fetchAllChachosPlayers";
import fetchStatsSummary from "../../../reactquery/chachos/fetchStatsSummary";

const PlayersToggleList = ({ selectedPlayers, setSelectedPlayers }) => {
  const { data: players } = useQuery({
    queryKey: ["chachos-players"],
    queryFn: fetchAllChachosPlayers,
  });
  const filteredPlayers = players?.filter(
    (player) => player.role !== "supporter"
  );

  //Partidos jugados históricamente por jugador (todos los años)
  const { data: statsSummary } = useQuery({
    queryKey: ["chachos-stats-summary", "all-time"],
    queryFn: () => fetchStatsSummary({}),
  });

  const matchesByPlayer = {};
  statsSummary?.individualRankings?.forEach((entry) => {
    matchesByPlayer[entry.player?._id] = entry.matches;
  });

  //Ordenar por partidos jugados (desc) y, en caso de igualdad, por camiseta (asc)
  const sortedPlayers = filteredPlayers
    ?.slice()
    .sort((a, b) => {
      const matchesDiff =
        (matchesByPlayer[b._id] || 0) - (matchesByPlayer[a._id] || 0);
      if (matchesDiff !== 0) return matchesDiff;
      return a.shirt - b.shirt;
    });

  const ToggleButton = ({ selected, onClick }) => {
    return (
      <button
        className={`players-toggle-btn${selected ? " players-toggle-btn--selected" : ""}`}
        onClick={onClick}
      >
        {selected ? "Si" : "No"}
      </button>
    );
  };

  return (
    <>
      <label>Jugadores</label>
      <div>
        {sortedPlayers &&
          sortedPlayers.map((player) => (
            <div key={player._id}>
              <div className="players_details">
                <span>{player.shirt}</span> {player.first_name}{" "}
                {player.last_name}
                <ToggleButton
                  selected={selectedPlayers.includes(player._id)}
                  onClick={() => {
                    if (selectedPlayers.includes(player._id)) {
                      setSelectedPlayers(
                        selectedPlayers.filter((id) => id !== player._id)
                      );
                    } else {
                      setSelectedPlayers([...selectedPlayers, player._id]);
                    }
                  }}
                />
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default PlayersToggleList;
