//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "./ChachosSquadPlayerDetailsStyles.css";

//Import helpers

//Import components
import chachosSquadImages from "./ChachosSquadPlayerDetailsSupport";

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

  const playerInfo = chachosSquadImages.find(
    (jugador) => jugador.shirt === selectedPlayer?.shirt
  );
  const imgSource = playerInfo?.img;

  return (
    <>
      <div className="container chachos-player-details-container">
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}
        <div className="chachos-player-details-link">
          <Link className="return-link" to="/chachos/squad">
            Volver
          </Link>
        </div>

        <div className="chachos-player-details-content">
          <div className="chachos-player-details-title">
            <h6>Entrevista | Chachos</h6>
            <h2>
              Conociendo a{" "}
              <span>
                {selectedPlayer?.first_name} {selectedPlayer?.last_name}
              </span>
            </h2>
            <h4>{selectedPlayer?.bio}</h4>
          </div>

          <div className="chachos-player-details-image">
            <img src={imgSource} alt="Jugador" />
          </div>

          {selectedPlayer?.shirt === 15 ? (
            <div className="chachos-player-details-others">
              <iframe
                src="https://www.youtube.com/embed/LUID0jSh2Ic?si=AmlSjSn8iDr9_oPg"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
            </div>
          ) : null}

          <div className="chachos-player-details-interview">
            <div
              dangerouslySetInnerHTML={{ __html: selectedPlayer?.interview }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ChachosSquadPlayerDetails;
