//Import React & Hooks
import React, { useEffect } from "react";

//Import CSS & styles
import "./PlayersToggleListStyle.css";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllPlayersAction } from "../../../redux/slices/players/playersSlices";

const PlayersToggleList = ({ selectedPlayers, setSelectedPlayers }) => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.players);
  const players = storeData.players?.players;
  const filteredPlayers = players?.filter(
    (player) => player.role !== "supporter"
  );

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllPlayersAction());
  }, [dispatch]);

  const ToggleButton = ({ selected, onClick }) => {
    return <button onClick={onClick}>{selected ? "Si" : "No"}</button>;
  };

  return (
    <>
      <label>Jugadores</label>
      <div>
        {filteredPlayers &&
          filteredPlayers.map((player) => (
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
