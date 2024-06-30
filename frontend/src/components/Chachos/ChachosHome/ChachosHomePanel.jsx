//Import React & Hooks
import React, { useEffect, useState } from "react";

//Import CSS & styles
import "./ChachosHomePanelStyles.css";

//Import helpers
import { regroupPlayerStats } from "../../../helpers/regroupPlayerStats";
import { matchStatsSort } from "../../../helpers/matchStatsSort";
import { countUniqueValues } from "../../../helpers/countUniqueValues";

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
    if (allMatchStats && Array.isArray(allMatchStats)) {
      setRegroupedPlayersStats(regroupPlayerStats(allMatchStats));
    }
  }, [allMatchStats, filterOptions]);

  //Match stats array sorted by matches played
  const matchStatsSortedByMatchesPlayed = matchStatsSort(
    regroupedPlayersStats,
    "matches_played"
  );

  //Match stats array sorted by points
  const matchStatsSortedByPoints = matchStatsSort(
    regroupedPlayersStats,
    "points"
  );

  //Match stats array sorted by goals
  const matchStatsSortedByGoals = matchStatsSort(
    regroupedPlayersStats,
    "goals"
  ).filter((stat) => stat.goals !== 0);

  //Match stats array sorted by assists
  const matchStatsSortedByAssists = matchStatsSort(
    regroupedPlayersStats,
    "assists"
  ).filter((stat) => stat.assists !== 0);

  //Match stats array sorted by minutes played
  const matchStatsSortedByMinutes = matchStatsSort(
    regroupedPlayersStats,
    "minutes_played"
  );

  //Match stats array sorted by yellow cards
  const matchStatsSortedByYellowCards = matchStatsSort(
    regroupedPlayersStats,
    "yellow_cards"
  ).filter((stat) => stat.yellow_cards !== 0);

  //Match stats array sorted by red cards
  const matchStatsSortedByRedCards = matchStatsSort(
    regroupedPlayersStats,
    "red_cards"
  ).filter((stat) => stat.red_cards !== 0);

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

  return (
    <>
      <ChachosMenu />
      <div className="container chachos-home-panel-container">
        {/*         Menu desplegable para elegir el torneo que filtre la informacion debajo */}
        <select
          className="chachos-home-panel-container-select"
          name="tournament"
          onChange={handleTournamentChange}
        >
          <option value="" label="Selecciona un torneo" />
          {allTournaments &&
            allTournaments.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
        </select>

        <h2>Performance Plantel</h2>
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}

        {/*         Tablas de presencias, goleadores y asistencias */}

        <div className="chachos-stats-content">
          <div className="chachos-stats-content-card">
            <div className="chachos-stats-content-card-top">
              <h5>Presencias</h5>
              <p>
                {matchStatsSortedByMatchesPlayed[0]?.first_name}{" "}
                {matchStatsSortedByMatchesPlayed[0]?.last_name}
              </p>
              <div className="chachos-stats-content-card-top-goals">
                <span>
                  {matchStatsSortedByMatchesPlayed[0]?.matches_played}
                </span>
                <p>de {countUniqueValues(allMatchStats, "round")} partidos</p>
              </div>
              <div className="chachos-stats-content-card-top-average">
                {(
                  (matchStatsSortedByMatchesPlayed[0]?.matches_played /
                    countUniqueValues(allMatchStats, "round")) *
                  100
                ).toFixed(0)}
                {"% "}
                de asistencia
              </div>
            </div>
            <div className="chachos-stats-content-card-rest">
              {matchStatsSortedByMatchesPlayed
                ?.slice(1, 10)
                .map((player, index) => (
                  <p>
                    {index + 2}. {player.first_name} {player.last_name}
                    <span>{player.matches_played}</span>
                  </p>
                ))}
            </div>
          </div>

          <div className="chachos-stats-content-card">
            <div className="chachos-stats-content-card-top">
              <h5>Goles</h5>
              <p>
                {matchStatsSortedByGoals[0]?.first_name}{" "}
                {matchStatsSortedByGoals[0]?.last_name}
              </p>
              <div className="chachos-stats-content-card-top-goals">
                <span>{matchStatsSortedByGoals[0]?.goals}</span>
                <p>en {matchStatsSortedByGoals[0]?.matches_played} partidos</p>
              </div>
              <div className="chachos-stats-content-card-top-average">
                {(
                  matchStatsSortedByGoals[0]?.goals /
                  matchStatsSortedByGoals[0]?.matches_played
                ).toFixed(2)}{" "}
                por partido
              </div>
            </div>
            <div className="chachos-stats-content-card-rest">
              {matchStatsSortedByGoals?.slice(1, 10).map((player, index) => (
                <p>
                  {index + 2}. {player.first_name} {player.last_name}
                  <span>{player.goals}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="chachos-stats-content-card">
            <div className="chachos-stats-content-card-top">
              <h5>Asistencias</h5>
              <p>
                {matchStatsSortedByAssists[0]?.first_name}{" "}
                {matchStatsSortedByAssists[0]?.last_name}
              </p>
              <div className="chachos-stats-content-card-top-goals">
                <span>{matchStatsSortedByAssists[0]?.assists}</span>
                <p>
                  en {matchStatsSortedByAssists[0]?.matches_played} partidos
                </p>
              </div>
              <div className="chachos-stats-content-card-top-average">
                {(
                  matchStatsSortedByAssists[0]?.assists /
                  matchStatsSortedByAssists[0]?.matches_played
                ).toFixed(2)}{" "}
                por partido
              </div>
            </div>
            <div className="chachos-stats-content-card-rest">
              {matchStatsSortedByAssists?.slice(1, 10).map((player, index) => (
                <p>
                  {index + 2}. {player.first_name} {player.last_name}
                  <span>{player.assists}</span>
                </p>
              ))}
            </div>
          </div>

          <div className="chachos-stats-content-card">
            <div className="chachos-stats-content-card-top">
              <h5>Amarillas</h5>
              <p>
                {matchStatsSortedByYellowCards[0]?.first_name}{" "}
                {matchStatsSortedByYellowCards[0]?.last_name}
              </p>
              <div className="chachos-stats-content-card-top-goals">
                <span>{matchStatsSortedByYellowCards[0]?.assists}</span>
                <p>
                  en {matchStatsSortedByYellowCards[0]?.matches_played} partidos
                </p>
              </div>
              <div className="chachos-stats-content-card-top-average">
                {(
                  (matchStatsSortedByYellowCards[0]?.yellow_cards /
                    matchStatsSortedByYellowCards[0]?.matches_played) *
                  100
                ).toFixed(0)}
                {"% "}
                de amonestaciones
              </div>
            </div>
            <div className="chachos-stats-content-card-rest">
              {matchStatsSortedByYellowCards
                ?.slice(1, 10)
                .map((player, index) => (
                  <p>
                    {index + 2}. {player.first_name} {player.last_name}
                    <span>{player.yellow_cards}</span>
                  </p>
                ))}
            </div>
          </div>
        </div>

        {/*         Tablas de puntajes y perlas */}
        <div className="chachos-points-content">
          <div className="chachos-points-main-table">
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
                {matchStatsSortedByPoints?.map((player, index) => (
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

          <div className="chachos-points-cards">
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
