//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "../../TournamentRounds/TournamentRoundsFormStyle.css";
import "../PlayersFormStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { getPlayerAction } from "../../../../../redux/slices/players/playersSlices";

//Etiquetas en español para posición y rol
const POSITION_LABEL = {
  goalkeeper: "Arquero",
  defender: "Defensor",
  midfielder: "Volante",
  forward: "Delantero",
};

const ROLE_LABEL = {
  team: "Jugador fijo",
  extra: "Refuerzo",
  supporter: "Hinchada",
};

//----------------------------------------
//COMPONENT
//----------------------------------------

const PlayersDetail = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get player information from database every time the component renders
  useEffect(() => {
    dispatch(getPlayerAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.players);
  const { appError, serverError } = storeData;
  const player = storeData?.player?.player;

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Detalle de jugador</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/players">
          Volver
        </Link>
      </div>

      {appError || serverError ? (
        <p className="ctr-form-error-banner">
          {appError} {serverError}
        </p>
      ) : (
        <div className="plfd-card">
          <div className="plfd-head">
            <span className="plfd-shirt">#{player?.shirt}</span>
            <h2 className="plfd-name">
              {player?.first_name} {player?.last_name}
            </h2>
          </div>

          <div className="plfd-meta">
            <span className="plfd-chip">
              {POSITION_LABEL[player?.field_position] ??
                player?.field_position}
            </span>
            <span className="plfd-chip">
              {ROLE_LABEL[player?.role] ?? player?.role}
            </span>
          </div>

          <div>
            <span className="plfd-section-title">Bio</span>
            {player?.bio ? (
              <p className="plfd-bio">{player.bio}</p>
            ) : (
              <p className="plfd-empty">Sin bio registrada</p>
            )}
          </div>

          <div>
            <span className="plfd-section-title">Entrevista</span>
            {player?.interview ? (
              <div
                className="plfd-interview"
                dangerouslySetInnerHTML={{ __html: player.interview }}
              />
            ) : (
              <p className="plfd-empty">Sin entrevista registrada</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersDetail;
