//Import React & Hooks
import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "./PlayersToggleListStyle.css";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllPlayersAction } from "../../../redux/slices/players/playersSlices";

//Import React Query functions
import fetchStatsSummary from "../../../reactquery/chachos/fetchStatsSummary";

const PlayersToggleList = ({ selectedPlayers, setSelectedPlayers }) => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.players);
  const players = storeData.players?.players;
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
    matchesByPlayer[entry._id] = entry.matches;
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

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllPlayersAction());
  }, [dispatch]);

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
