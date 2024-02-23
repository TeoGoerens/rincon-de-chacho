//Import React & Hooks
import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";

//Import CSS & styles
import "./VotesResultsStyles.css";

//Import helpers
import { formatDate } from "../../../../helpers/dateFormatter";
import { consolidateEvaluation } from "../../../../helpers/consolidateEvaluation";

//Import components
import firstPlaceSource from "../../../../assets/images/first-place.png";
import secondPlaceSource from "../../../../assets/images/second-place.png";
import secondToLastPlaceSource from "../../../../assets/images/clown.png";
import lastPlaceSource from "../../../../assets/images/black-star.png";

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
    <div className="container votes-results-container">
      <div className="votes-results-title">
        <h2>Votos de la fecha</h2>
        <Link className="return-link" to="/chachos/tournament-rounds">
          Volver
        </Link>
      </div>

      {appError || serverError ? <h5>{appError} </h5> : null}

      {!votesByRound ? (
        <>
          <h3>No hay votos registrados en esta fecha</h3>
        </>
      ) : (
        <div className="votes-results-content">
          <div className="votes-results-match-details">
            <h4>Detalles del partido:</h4>
            <p>
              Fecha: <span>{formatDate(tournamentRound?.match_date)}</span>
            </p>
            <p>
              Rival: <span>{tournamentRound?.rival?.name}</span>
            </p>
            <p>
              Resultado:{" "}
              <span>
                {tournamentRound?.score_chachos} -{" "}
                {tournamentRound?.score_rival}
              </span>
            </p>
          </div>

          <div className="votes-results-pearls-details">
            <h4>Perlas:</h4>
            <div className="pearl-container">
              <img src={firstPlaceSource} alt="First Place Badge" />
              <div className="pearl-winners">
                {tournamentRound?.white_pearl &&
                  tournamentRound.white_pearl.map((player) => (
                    <p key={player._id}>
                      {player.first_name} {player.last_name}
                    </p>
                  ))}
              </div>
            </div>
            <div className="pearl-container">
              <img src={secondPlaceSource} alt="Second Place Badge" />
              <div className="pearl-winners">
                {tournamentRound?.vanilla_pearl &&
                  tournamentRound.vanilla_pearl.map((player) => (
                    <p key={player._id}>
                      {player.first_name} {player.last_name}
                    </p>
                  ))}
              </div>
            </div>
            <div className="pearl-container">
              <img
                src={secondToLastPlaceSource}
                alt="Second To Last Place Badge"
              />
              <div className="pearl-winners">
                {tournamentRound?.ocher_pearl &&
                  tournamentRound.ocher_pearl.map((player) => (
                    <p key={player._id}>
                      {player.first_name} {player.last_name}
                    </p>
                  ))}
              </div>
            </div>
            <div className="pearl-container">
              <img src={lastPlaceSource} alt="Last Place Badge" />
              <div className="pearl-winners">
                {tournamentRound?.black_pearl &&
                  tournamentRound.black_pearl.map((player) => (
                    <p key={player._id}>
                      {player.first_name} {player.last_name}
                    </p>
                  ))}
              </div>
            </div>
          </div>

          <div className="votes-results-evaluation-container">
            <h4>Puntajes:</h4>
            <table className="votes-results-evaluation-table">
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Puntaje</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayersEvaluation &&
                  sortedPlayersEvaluation.map((player) => (
                    <tr key={player._id}>
                      <td>
                        {player.first_name} {player.last_name}
                      </td>
                      <td>{player.points.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotesResults;
