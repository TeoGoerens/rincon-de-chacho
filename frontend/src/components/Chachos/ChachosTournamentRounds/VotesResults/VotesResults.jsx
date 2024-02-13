//Import React & Hooks
import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";

//Import CSS & styles
import "./VotesResultsStyles.css";

//Import helpers
import { formatDate } from "../../../../helpers/dateFormatter";
import { consolidateEvaluation } from "../../../../helpers/consolidateEvaluation";

//Import components

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getTournamentRoundAction } from "../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import { getVotesFromTournamentRoundAction } from "../../../../redux/slices/votes/votesSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------
const VotesResults = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getTournamentRoundAction(id));
    dispatch(getVotesFromTournamentRoundAction(id));
  }, [dispatch, id]);

  //Select tournament round state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const tournamentRound = storeData.tournamentRound?.tournamentRound;

  const { appError, serverError } = storeData;

  //Select vote state from store
  const VotesStoreData = useSelector((store) => store.votes);
  const votesByRound = VotesStoreData?.votesFromRound?.allVotesForRound;
  const playersEvaluation = consolidateEvaluation(votesByRound);
  const sortedPlayersEvaluation = playersEvaluation.sort(
    (a, b) => b.points - a.points
  );

  return (
    <>
      <h3>Votos para la fecha</h3>
      {appError || serverError ? (
        <h5>
          {appError} {serverError}
        </h5>
      ) : null}

      {!votesByRound ? (
        <>
          <h4>No hay votos registrados en esta fecha</h4>
          <Link className="return-link" to="/chachos/tournament-rounds">
            Volver
          </Link>
        </>
      ) : (
        <>
          <p>Fecha: {formatDate(tournamentRound?.match_date)}</p>
          <p>Rival: {tournamentRound?.rival?.name}</p>
          <p>
            Resultado: {tournamentRound?.score_chachos} -{" "}
            {tournamentRound?.score_rival}
          </p>
          <div className="pearl-container">
            <p>Perla Blanca:</p>
            {tournamentRound.white_pearl &&
              tournamentRound.white_pearl.map((player) => (
                <p key={player._id}>
                  {player.first_name} {player.last_name}
                </p>
              ))}
          </div>
          <div className="pearl-container">
            <p>Perla Vainilla:</p>
            {tournamentRound.vanilla_pearl &&
              tournamentRound.vanilla_pearl.map((player) => (
                <p key={player._id}>
                  {player.first_name} {player.last_name}
                </p>
              ))}
          </div>
          <div className="pearl-container">
            <p>Perla Ocre:</p>
            {tournamentRound.ocher_pearl &&
              tournamentRound.ocher_pearl.map((player) => (
                <p key={player._id}>
                  {player.first_name} {player.last_name}
                </p>
              ))}
          </div>
          <div className="pearl-container">
            <p>Perla Negra:</p>
            {tournamentRound.black_pearl &&
              tournamentRound.black_pearl.map((player) => (
                <p key={player._id}>
                  {player.first_name} {player.last_name}
                </p>
              ))}
          </div>

          <div className="evaluation-container">
            <p>Puntajes:</p>
            {sortedPlayersEvaluation &&
              sortedPlayersEvaluation.map((player) => (
                <p key={player._id}>
                  {player.first_name} {player.last_name}: {player.points}
                </p>
              ))}
          </div>
        </>
      )}
    </>
  );
};

export default VotesResults;
