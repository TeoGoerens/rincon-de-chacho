//Import React & Hooks
import React, { useEffect, useState } from "react";

//Import CSS & styles
import "./ChachosHomePanelStyles.css";

//Import helpers
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
  const dispatch = useDispatch();
  const [filterOptions, setFilterOptions] = useState({});
  const [regroupedPlayersStats, setRegroupedPlayersStats] = useState([]);
  const [matchStatsSortedByPoints, setMatchStatsSortedByPoints] = useState([]);
  const [matchStatsSortedByGoals, setMatchStatsSortedByGoals] = useState([]);
  const [matchStatsSortedByAssists, setMatchStatsSortedByAssists] = useState(
    []
  );
  const [matchStatsSortedByMinutes, setMatchStatsSortedByMinutes] = useState(
    []
  );
  const [matchStatsSortedByYellowCards, setMatchStatsSortedByYellowCards] =
    useState([]);
  const [matchStatsSortedByRedCards, setMatchStatsSortedByRedCards] = useState(
    []
  );
  const [matchStatsSortedByWhitePearls, setMatchStatsSortedByWhitePearls] =
    useState([]);
  const [matchStatsSortedByVanillaPearls, setMatchStatsSortedByVanillaPearls] =
    useState([]);
  const [matchStatsSortedByOcherPearls, setMatchStatsSortedByOcherPearls] =
    useState([]);
  const [matchStatsSortedByBlackPearls, setMatchStatsSortedByBlackPearls] =
    useState([]);

  const handleTournamentChange = (event) => {
    const filterSupport = { tournament: event.target.value };
    setFilterOptions(filterSupport);
  };

  useEffect(() => {
    dispatch(getAllTournamentsAction());
    dispatch(getMatchStatsFilteredAction(filterOptions));
  }, [dispatch, filterOptions]);

  const tournamentStoreData = useSelector((store) => store.tournaments);
  const allTournaments = tournamentStoreData?.tournaments?.tournaments;
  const matchStatsStoreData = useSelector((store) => store.stats);
  const allMatchStats =
    matchStatsStoreData?.filteredMatchStats?.filteredMatchStats;
  const { appError, serverError } = matchStatsStoreData;

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

  useEffect(() => {
    if (regroupedPlayersStats.length > 0) {
      setMatchStatsSortedByPoints(
        matchStatsSort(regroupedPlayersStats, "points")
      );
      setMatchStatsSortedByGoals(
        matchStatsSort(regroupedPlayersStats, "goals")
      );
      setMatchStatsSortedByAssists(
        matchStatsSort(regroupedPlayersStats, "assists")
      );
      setMatchStatsSortedByMinutes(
        matchStatsSort(regroupedPlayersStats, "minutes_played")
      );
      setMatchStatsSortedByYellowCards(
        matchStatsSort(regroupedPlayersStats, "yellow_cards")
      );
      setMatchStatsSortedByRedCards(
        matchStatsSort(regroupedPlayersStats, "red_cards")
      );
      setMatchStatsSortedByWhitePearls(
        matchStatsSort(regroupedPlayersStats, "white_pearl").filter(
          (stat) => stat.white_pearl !== 0
        )
      );
      setMatchStatsSortedByVanillaPearls(
        matchStatsSort(regroupedPlayersStats, "vanilla_pearl").filter(
          (stat) => stat.vanilla_pearl !== 0
        )
      );
      setMatchStatsSortedByOcherPearls(
        matchStatsSort(regroupedPlayersStats, "ocher_pearl").filter(
          (stat) => stat.ocher_pearl !== 0
        )
      );
      setMatchStatsSortedByBlackPearls(
        matchStatsSort(regroupedPlayersStats, "black_pearl").filter(
          (stat) => stat.black_pearl !== 0
        )
      );
    }
  }, [regroupedPlayersStats]);

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
