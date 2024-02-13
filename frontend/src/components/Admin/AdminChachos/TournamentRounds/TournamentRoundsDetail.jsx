//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "./TournamentRoundsStyle.css";

//Import helpers
import { formatDate } from "../../../../helpers/dateFormatter";

//Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  getTournamentRoundAction,
  consolidatePearlsAction,
} from "../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import {
  deleteVoteByIdAction,
  getVotesFromTournamentRoundAction,
} from "../../../../redux/slices/votes/votesSlices";

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
  const { appError, serverError, arePearlsConsolidated } = storeData;

  //Select vote state from store
  const VotesStoreData = useSelector((store) => store.votes);
  const votesByRound = VotesStoreData?.votesFromRound?.allVotesForRound;
  const isVoteDeleted = VotesStoreData?.isDeleted;

  //Functions assigned to buttons
  const handleDelete = (id) => {
    console.log(id);
    dispatch(deleteVoteByIdAction(id));
  };

  const handleConsolidatePearls = () => {
    dispatch(consolidatePearlsAction(id));
  };

  //Constant definitions to place in view
  const match_date = formatDate(
    storeData?.tournamentRound?.tournamentRound?.match_date
  );
  const rival = storeData?.tournamentRound?.tournamentRound?.rival?.name;
  const score_chachos =
    storeData?.tournamentRound?.tournamentRound?.score_chachos;
  const score_rival = storeData?.tournamentRound?.tournamentRound?.score_rival;
  const players = storeData?.tournamentRound?.tournamentRound?.players;

  const white_pearl = storeData?.tournamentRound?.tournamentRound?.white_pearl;
  const vanilla_pearl =
    storeData?.tournamentRound?.tournamentRound?.vanilla_pearl;
  const ocher_pearl = storeData?.tournamentRound?.tournamentRound?.ocher_pearl;
  const black_pearl = storeData?.tournamentRound?.tournamentRound?.black_pearl;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getTournamentRoundAction(id));
    dispatch(getVotesFromTournamentRoundAction(id));
  }, [dispatch, id, isVoteDeleted, arePearlsConsolidated]);

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
              <p key={player._id}>
                {player.shirt} - {player.first_name} {player.last_name}
              </p>
            ))}
          <p>Perla Blanca:</p>
          {white_pearl &&
            white_pearl.map((player) => (
              <p key={player._id}>
                {player.first_name} {player.last_name}
              </p>
            ))}
          <p>Perla Vainilla:</p>
          {vanilla_pearl &&
            vanilla_pearl.map((player) => (
              <p key={player._id}>
                {player.first_name} {player.last_name}
              </p>
            ))}
          <p>Perla Ocre:</p>
          {ocher_pearl &&
            ocher_pearl.map((player) => (
              <p key={player._id}>
                {player.first_name} {player.last_name}
              </p>
            ))}
          <p>Perla Negra:</p>
          {black_pearl &&
            black_pearl.map((player) => (
              <p key={player._id}>
                {player.first_name} {player.last_name}
              </p>
            ))}
        </div>
      )}
      <>
        <h5>Votos totales:</h5>
        <button onClick={handleConsolidatePearls}>Consolidar perlas</button>
        {votesByRound &&
          votesByRound.map((vote) => (
            <div key={vote._id}>
              <p>
                {vote.voter.first_name} {vote.voter.last_name}
              </p>
              <DeleteButton onClick={handleDelete} id={vote._id} />
              <p>
                Perla Blanca: {vote.white_pearl.first_name}{" "}
                {vote.white_pearl.last_name}
              </p>
              <p>
                Perla Vainilla: {vote.vanilla_pearl.first_name}{" "}
                {vote.vanilla_pearl.last_name}
              </p>
              <p>
                Perla Ocre: {vote.ocher_pearl.first_name}{" "}
                {vote.ocher_pearl.last_name}
              </p>
              <p>
                Perla Negra: {vote.black_pearl.first_name}{" "}
                {vote.black_pearl.last_name}
              </p>
              {vote.evaluation &&
                vote.evaluation.map((ev) => (
                  <p key={ev._id}>
                    {ev.player.first_name} {ev.player.last_name}: {ev.points}
                  </p>
                ))}
            </div>
          ))}
      </>
    </>
  );
};

export default TournamentRoundsDetail;
