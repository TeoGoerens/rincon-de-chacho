//Import React & Hooks
import React, { useEffect, useState } from "react";

//Import CSS & styles
import "./PodridaHomePanelStyles.css";

//Import helpers
import { regroupPlayerStats } from "../../../helpers/regroupPlayerStats";
import { matchStatsSort } from "../../../helpers/matchStatsSort";
import { countUniqueValues } from "../../../helpers/countUniqueValues";

//Import components
import PodridaMenu from "../PodridaMenu";
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

const PodridaHomePanel = () => {
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
      <PodridaMenu />
      <div className="container podrida-home-panel-container">
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}
        <h2>Récords históricos</h2>

        <div className="podrida-stats-content-card">
          <div className="podrida-stats-content-card-top">
            <h5>Asistencias</h5>
            <p>
              {matchStatsSortedByAssists[0]?.first_name}{" "}
              {matchStatsSortedByAssists[0]?.last_name}
            </p>
            <div className="podrida-stats-content-card-top-goals">
              <span>{matchStatsSortedByAssists[0]?.assists}</span>
              <p>en {matchStatsSortedByAssists[0]?.matches_played} partidos</p>
            </div>
            <div className="podrida-stats-content-card-top-average">
              {(
                matchStatsSortedByAssists[0]?.assists /
                matchStatsSortedByAssists[0]?.matches_played
              ).toFixed(2)}{" "}
              por partido
            </div>
          </div>
          <div className="podrida-stats-content-card-rest">
            {matchStatsSortedByAssists?.slice(1, 10).map((player, index) => (
              <p>
                {index + 2}. {player.first_name} {player.last_name}
                <span>{player.assists}</span>
              </p>
            ))}
          </div>
        </div>

        <h2>Ranking</h2>

        {/*         Menu desplegable para elegir el año que filtre la informacion debajo */}
        <select
          className="podrida-home-panel-container-select"
          name="tournament"
          onChange={handleTournamentChange}
        >
          <option value="" label="Selecciona un año" />
          {allTournaments &&
            allTournaments.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
        </select>

        {/*         Menu desplegable para elegir el tipo de partida que filtre la informacion debajo */}
        <select
          className="podrida-home-panel-container-select"
          name="tournament"
          onChange={handleTournamentChange}
        >
          <option value="" label="Selecciona tipo de partida" />
          {allTournaments &&
            allTournaments.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
        </select>

        {/*         Tablas de partidas jugadas y ranking */}
        <div className="podrida-points-main-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Jugador</th>
                <th>PJ</th>
                <th>1º puesto</th>
                <th>2º puesto</th>
                <th>3º puesto</th>
                <th>Highlight</th>
                <th>Último puesto</th>
                <th>Puntos</th>
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

        <h2>Centro de estadísticas</h2>

        <select
          className="podrida-home-panel-container-select"
          name="tournament"
          onChange={handleTournamentChange}
        >
          <option value="" label="Selecciona un concepto" />
          {allTournaments &&
            allTournaments.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
        </select>

        <div className="podrida-points-main-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Jugador</th>
                <th>PJ</th>
                <th>Estadística</th>
                <th>Estad / PJ</th>
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
      </div>
    </>
  );
};

export default PodridaHomePanel;
