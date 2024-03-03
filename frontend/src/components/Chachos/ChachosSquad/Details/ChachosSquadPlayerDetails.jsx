//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "./ChachosSquadPlayerDetailsStyles.css";

//Import helpers

//Import components

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getPlayerAction } from "../../../../redux/slices/players/playersSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const ChachosSquadPlayerDetails = () => {
  //Get player id
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from players store
  const playerStoreData = useSelector((store) => store.players);

  const { appError, serverError, player } = playerStoreData;
  const selectedPlayer = player?.player;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getPlayerAction(id));
  }, [dispatch, id]);
  return (
    <>
      <div className="container chachos-player-details-container">
        <h2>Detalles</h2>
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}

        <div className="chachos-player-details-content">
          {selectedPlayer?.first_name}
        </div>
      </div>
    </>
  );
};

export default ChachosSquadPlayerDetails;
