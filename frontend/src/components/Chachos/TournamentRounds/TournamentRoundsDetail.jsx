//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "./TournamentRoundsStyle.css";

//Import helpers
import { formatDate } from "../../../helpers/dateFormatter";

//Import components

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getTournamentRoundAction } from "../../../redux/slices/tournament-rounds/tournamentRoundsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentRoundsDetail = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const tournamentRound = storeData.tournamentRound?.tournamentRound;
  const { appError, serverError } = storeData;

  //Constant definitions to place in view
  const match_date = formatDate(
    storeData?.tournamentRound?.tournamentRound?.match_date
  );
  const rival = storeData?.tournamentRound?.tournamentRound?.rival?.name;
  const score_chachos =
    storeData?.tournamentRound?.tournamentRound?.score_chachos;
  const score_rival = storeData?.tournamentRound?.tournamentRound?.score_rival;
  const players = storeData?.tournamentRound?.tournamentRound?.players;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getTournamentRoundAction(id));
  }, [dispatch, id]);

  return (
    <>
      <Link to="/admin/chachos/tournament-rounds">Volver a fechas</Link>

      {appError || serverError ? (
        <h3>
          {appError} {serverError}
        </h3>
      ) : tournamentRound?.length <= 0 ? (
        <h3>No se encontraron fechas en la base de datos</h3>
      ) : (
        <div>
          <h3>Detalle de la fecha</h3>
          <p>Fecha: {match_date}</p>
          <p>Rival: {rival}</p>
          <p>
            Resultado: {score_chachos} - {score_rival}
          </p>
          {players &&
            players.map((player) => (
              <p>
                {player.shirt} - {player.first_name} {player.last_name}
              </p>
            ))}
        </div>
      )}
    </>
  );
};

export default TournamentRoundsDetail;
