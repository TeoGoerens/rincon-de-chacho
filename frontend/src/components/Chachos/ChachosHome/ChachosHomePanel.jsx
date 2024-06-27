//Import React & Hooks
import React, { useEffect, useState } from "react";

//Import CSS & styles
import "./ChachosHomePanelStyles.css";

//Import helpers
import { consolidateEvaluation } from "../../../helpers/consolidateEvaluation";
import { gamesPlayed } from "../../../helpers/gamesPlayed";
import { pearlsCount } from "../../../helpers/countPlayerPearlsinTournamentRounds";
import { regroupPlayerStats } from "../../../helpers/regroupPlayerStats";

//Import components
import ChachosMenu from "../ChachosMenu";
import firstPlaceSource from "../../../assets/images/first-place.png";
import secondPlaceSource from "../../../assets/images/second-place.png";
import secondToLastPlaceSource from "../../../assets/images/clown.png";
import lastPlaceSource from "../../../assets/images/black-star.png";
import TournamentDropdown from "../../Layout/Dropdown/Tournament/TournamentDropdown";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllTournamentRoundsAction } from "../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import { getAllVotesAction } from "../../../redux/slices/votes/votesSlices";
import { getMatchStatsFilteredAction } from "../../../redux/slices/match-stats/matchStatsSlices";
import { getAllTournamentsAction } from "../../../redux/slices/tournaments/tournamentsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const ChachosHomePanel = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Define variables
  const [filterOptions, setFilterOptions] = useState({});
  const [regroupedPlayersStats, setRegroupedPlayersStats] = useState([]);

  //Select state from votes store
  const voteStoreData = useSelector((store) => store.votes);
  const allVotes = voteStoreData?.allVotes?.allVotes;
  const allEvaluation = consolidateEvaluation(allVotes);
  const sortedAllEvaluation = allEvaluation.sort((a, b) => b.points - a.points);

  //Select state from tournament rounds store
  const storeData = useSelector((store) => store.tournamentRounds);
  const allTournamentRound = storeData?.tournamentRounds?.tournamentRounds;
  const gamesByPlayer = gamesPlayed(allTournamentRound);

  const whitePearls = pearlsCount(allTournamentRound, "white_pearl");
  const vanillaPearls = pearlsCount(allTournamentRound, "vanilla_pearl");
  const ocherPearls = pearlsCount(allTournamentRound, "ocher_pearl");
  const blackPearls = pearlsCount(allTournamentRound, "black_pearl");

  const { appError, serverError } = storeData;

  //Select tournament information from store
  const tournamentStoreData = useSelector((store) => store.tournaments);
  const allTournaments = tournamentStoreData?.tournaments?.tournaments;

  //Select match stats information from store
  const matchStatsStoreData = useSelector((store) => store.stats);
  const allMatchStats =
    matchStatsStoreData?.filteredMatchStats?.filteredMatchStats;

  useEffect(() => {
    if (
      allMatchStats &&
      Array.isArray(allMatchStats) &&
      allMatchStats.length > 0
    ) {
      const newStatsLayout = regroupPlayerStats(allMatchStats);
      setRegroupedPlayersStats(newStatsLayout);
    }
  }, [allMatchStats]);
  //const regroupedStats = regroupPlayerStats(allMatchStats);
  console.log(regroupedPlayersStats);

  // Function to handle dropdown change
  const handleTournamentChange = (event) => {
    const filterSupport = { tournament: event.target.value };
    setFilterOptions(filterSupport);
  };

  //
  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllVotesAction(filterOptions));
    dispatch(getAllTournamentRoundsAction());
    dispatch(getAllTournamentsAction());
    dispatch(getMatchStatsFilteredAction(filterOptions));
  }, [dispatch, filterOptions]);

  return (
    <>
      <ChachosMenu />
      <div className="container chachos-home-panel-container">
        <select name="tournament" onChange={handleTournamentChange}>
          <option value="" label="Selecciona un torneo" />
          {allTournaments &&
            allTournaments.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
        </select>

        {allMatchStats?.map((stat) => stat.minutes_played)}

        <h2>Performance Plantel</h2>
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}

        <div className="chachos-panel-content">
          <div className="chachos-panel-main-table">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
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
                        gamesByPlayer.find(
                          (element) => element._id === player._id
                        )?.gamesPlayed}
                    </td>
                    <td>{player.points.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="chachos-panel-cards">
            <div className="top-players-card">
              <img src={firstPlaceSource} alt="First Place Badge" />
              <h5>Perla Blanca</h5>
              <ul>
                {whitePearls.map((player) => (
                  <li key={player._id} className="player-item">
                    <p>{player.timesPearl}</p>
                    <span>{`${player.first_name} ${player.last_name}`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="top-players-card">
              <img src={secondPlaceSource} alt="Second Place Badge" />
              <h5>Perla Vainilla</h5>
              <ul>
                {vanillaPearls.map((player) => (
                  <li key={player._id} className="player-item">
                    <p>{player.timesPearl}</p>
                    <span>{`${player.first_name} ${player.last_name}`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="top-players-card">
              <img
                src={secondToLastPlaceSource}
                alt="Second To Last Place Badge"
              />
              <h5>Perla Ocre</h5>
              <ul>
                {ocherPearls.map((player) => (
                  <li key={player._id} className="player-item">
                    <p>{player.timesPearl}</p>
                    <span>{`${player.first_name} ${player.last_name}`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="top-players-card">
              <img src={lastPlaceSource} alt="Last Place Badge" />
              <h5>Perla Negra</h5>
              <ul>
                {blackPearls.map((player) => (
                  <li key={player._id} className="player-item">
                    <p>{player.timesPearl}</p>
                    <span>{`${player.first_name} ${player.last_name}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChachosHomePanel;
