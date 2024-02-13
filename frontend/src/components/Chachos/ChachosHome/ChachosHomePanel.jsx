//Import React & Hooks
import React, { useEffect } from "react";

//Import CSS & styles
import "./ChachosHomePanelStyles.css";

//Import helpers
import { consolidateEvaluation } from "../../../helpers/consolidateEvaluation";
import { gamesPlayed } from "../../../helpers/gamesPlayed";
import { pearlsCount } from "../../../helpers/countPlayerPearlsinTournamentRounds";

//Import components
import ChachosMenu from "../ChachosMenu";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllTournamentRoundsAction } from "../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import { getAllVotesAction } from "../../../redux/slices/votes/votesSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const ChachosHomePanel = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from votes store
  const voteStoreData = useSelector((store) => store.votes);
  const allVotes = voteStoreData?.allVotes?.allVotes;
  const allEvaluation = consolidateEvaluation(allVotes);
  const sortedAllEvaluation = allEvaluation.sort((a, b) => b.points - a.points);

  //Select state from tournament rounds store
  const storeData = useSelector((store) => store.tournamentRounds);
  const allTournamentRound = storeData?.tournamentRounds?.tournamentRounds;
  const gamesByPlayer = gamesPlayed(allTournamentRound);

  const whitePearls = pearlsCount(allTournamentRound, "white_pearl").slice(
    0,
    3
  );
  const vanillaPearls = pearlsCount(allTournamentRound, "vanilla_pearl").slice(
    0,
    3
  );
  const ocherPearls = pearlsCount(allTournamentRound, "ocher_pearl").slice(
    0,
    3
  );
  const blackPearls = pearlsCount(allTournamentRound, "black_pearl").slice(
    0,
    3
  );

  const { appError, serverError } = storeData;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllVotesAction());
    dispatch(getAllTournamentRoundsAction());
  }, [dispatch]);

  return (
    <>
      <ChachosMenu />

      <h3>Performance Plantel</h3>
      {appError || serverError ? (
        <h5>
          {appError} {serverError}
        </h5>
      ) : null}

      <table>
        <thead>
          <tr>
            <th>Ranking</th>
            <th>Jugador</th>
            <th>PJ</th>
            <th>Puntaje</th>
          </tr>
        </thead>
        <tbody>
          {sortedAllEvaluation.map((player, index) => (
            <tr key={player._id}>
              <td>{index + 1}</td>
              <td>{`${player.first_name} ${player.last_name}`}</td>
              <td>
                {gamesByPlayer &&
                  gamesByPlayer.find((element) => element._id === player._id)
                    ?.gamesPlayed}
              </td>
              <td>{player.points.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="top-players-card">
        <h3>Top 3: Perla Blanca</h3>
        <ul>
          {whitePearls.map((player) => (
            <li key={player._id} className="player-item">
              <strong>{`${player.shirt} - ${player.first_name} ${player.last_name}`}</strong>
              <p>{player.timesPearl}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="top-players-card">
        <h3>Top 3: Perla Vainilla</h3>
        <ul>
          {vanillaPearls.map((player) => (
            <li key={player._id} className="player-item">
              <strong>{`${player.shirt} - ${player.first_name} ${player.last_name}`}</strong>
              <p>{player.timesPearl}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="top-players-card">
        <h3>Top 3: Perla Ocre</h3>
        <ul>
          {ocherPearls.map((player) => (
            <li key={player._id} className="player-item">
              <strong>{`${player.shirt} - ${player.first_name} ${player.last_name}`}</strong>
              <p>{player.timesPearl}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="top-players-card">
        <h3>Top 3: Perla Negra</h3>
        <ul>
          {blackPearls.map((player) => (
            <li key={player._id} className="player-item">
              <strong>{`${player.shirt} - ${player.first_name} ${player.last_name}`}</strong>
              <p>{player.timesPearl}</p>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default ChachosHomePanel;
