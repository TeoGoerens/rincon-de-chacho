//Import React & Hooks
import React, { useEffect, useState } from "react";

//Import CSS & styles
import "./ChachosHomePanelStyles.css";

//Import helpers
import { consolidateEvaluation } from "../../../helpers/consolidateEvaluation";
import { gamesPlayed } from "../../../helpers/gamesPlayed";
import { pearlsCount } from "../../../helpers/countPlayerPearlsinTournamentRounds";
import { regroupPlayerStats } from "../../../helpers/regroupPlayerStats";
import { matchStatsSort } from "../../../helpers/matchStatsSort";

//Import components
import ChachosMenu from "../ChachosMenu";
import firstPlaceSource from "../../../assets/images/first-place.png";
import secondPlaceSource from "../../../assets/images/second-place.png";
import secondToLastPlaceSource from "../../../assets/images/clown.png";
import lastPlaceSource from "../../../assets/images/black-star.png";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
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

  // Function to handle dropdown change
  const handleTournamentChange = (event) => {
    const filterSupport = { tournament: event.target.value };
    setFilterOptions(filterSupport);
  };

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllTournamentsAction());
    dispatch(getMatchStatsFilteredAction(filterOptions));
  }, [dispatch, filterOptions]);

  //Select tournament information from store
  const tournamentStoreData = useSelector((store) => store.tournaments);
  const allTournaments = tournamentStoreData?.tournaments?.tournaments;

  //Select match stats information from store
  const matchStatsStoreData = useSelector((store) => store.stats);
  const allMatchStats =
    matchStatsStoreData?.filteredMatchStats?.filteredMatchStats;
  const { appError, serverError } = matchStatsStoreData;

  //Change the layout of match stats array
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

  //Match stats array sorted by points
  const matchStatsSortedByPoints = matchStatsSort(
    regroupedPlayersStats,
    "points"
  );

  //Match stats array sorted by goals
  const matchStatsSortedByGoals = matchStatsSort(
    regroupedPlayersStats,
    "goals"
  );

  //Match stats array sorted by assists
  const matchStatsSortedByAssists = matchStatsSort(
    regroupedPlayersStats,
    "assists"
  );

  //Match stats array sorted by minutes played
  const matchStatsSortedByMinutes = matchStatsSort(
    regroupedPlayersStats,
    "minutes_played"
  );

  //Match stats array sorted by yellow cards
  const matchStatsSortedByYellowCards = matchStatsSort(
    regroupedPlayersStats,
    "yellow_cards"
  );

  //Match stats array sorted by red cards
  const matchStatsSortedByRedCards = matchStatsSort(
    regroupedPlayersStats,
    "red_cards"
  );

  //Match stats array sorted by white pearl
  const matchStatsSortedByWhitePearls = matchStatsSort(
    regroupedPlayersStats,
    "white_pearl"
  ).filter((stat) => stat.white_pearl !== 0);

  //Match stats array sorted by vanilla pearl
  const matchStatsSortedByVanillaPearls = matchStatsSort(
    regroupedPlayersStats,
    "vanilla_pearl"
  ).filter((stat) => stat.vanilla_pearl !== 0);

  //Match stats array sorted by ocher pearl
  const matchStatsSortedByOcherPearls = matchStatsSort(
    regroupedPlayersStats,
    "ocher_pearl"
  ).filter((stat) => stat.ocher_pearl !== 0);

  //Match stats array sorted by black pearl
  const matchStatsSortedByBlackPearls = matchStatsSort(
    regroupedPlayersStats,
    "black_pearl"
  ).filter((stat) => stat.black_pearl !== 0);

  console.log(allMatchStats);
  console.log(matchStatsSortedByPoints);
  console.log(matchStatsSortedByWhitePearls);

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
                {matchStatsSortedByPoints.map((player, index) => (
                  <tr key={player._id}>
                    <td>{index + 1}</td>
                    <td>{`${player.first_name} ${player.last_name}`}</td>
                    <td>{player.matches_played}</td>
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
                {matchStatsSortedByWhitePearls.map((player) => (
                  <li key={player._id} className="player-item">
                    <p>{player.white_pearl}</p>
                    <span>{`${player.first_name} ${player.last_name}`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="top-players-card">
              <img src={secondPlaceSource} alt="Second Place Badge" />
              <h5>Perla Vainilla</h5>
              <ul>
                {matchStatsSortedByVanillaPearls.map((player) => (
                  <li key={player._id} className="player-item">
                    <p>{player.vanilla_pearl}</p>
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
                {matchStatsSortedByOcherPearls.map((player) => (
                  <li key={player._id} className="player-item">
                    <p>{player.ocher_pearl}</p>
                    <span>{`${player.first_name} ${player.last_name}`}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="top-players-card">
              <img src={lastPlaceSource} alt="Last Place Badge" />
              <h5>Perla Negra</h5>
              <ul>
                {matchStatsSortedByBlackPearls.map((player) => (
                  <li key={player._id} className="player-item">
                    <p>{player.black_pearl}</p>
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
