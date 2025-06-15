//Import React & Hooks
import React, { useEffect, useState, useRef } from "react";

//Import libraries
import { SwiperContainer, SwiperSlide } from "swiper/element/bundle";
import "swiper/element/bundle";
import "swiper/css";
import "swiper/css/pagination";

//Import CSS & styles
import "./PodridaHomePanelStyles.css";

//Import helpers
import { regroupPlayerStats } from "../../../helpers/regroupPlayerStats";
import { matchStatsSort } from "../../../helpers/matchStatsSort";

//Import components
import PodridaMenu from "../PodridaMenu";
import RecordsSlide from "../../Layout/Podrida/RecordsSlide/RecordsSlide";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getMatchStatsFilteredAction } from "../../../redux/slices/match-stats/matchStatsSlices";
import { getAllTournamentsAction } from "../../../redux/slices/tournaments/tournamentsSlices";

//Import assets - MEDALS
import matchesMedal from "../../../assets/images/podrida/medals/matches.png";
import titlesMedal from "../../../assets/images/podrida/medals/titles.png";
import lastsMedal from "../../../assets/images/podrida/medals/lasts.png";
import pointsMedal from "../../../assets/images/podrida/medals/points.png";
import accuracyMedal from "../../../assets/images/podrida/medals/accuracy.png";
import requestsMedal from "../../../assets/images/podrida/medals/requests.png";
import highlightsMedal from "../../../assets/images/podrida/medals/highlights.png";

//Import assets - CHARACTERS
import marioImage from "../../../assets/images/podrida/mario.png";
import yoshiImage from "../../../assets/images/podrida/yoshi.png";
import peachImage from "../../../assets/images/podrida/peach.png";
import luigiImage from "../../../assets/images/podrida/luigi.png";
import goombaImage from "../../../assets/images/podrida/goomba.png";
import warioImage from "../../../assets/images/podrida/wario.png";
import bowserImage from "../../../assets/images/podrida/bowser.png";

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

        {/* ----- Menu desplegable para elegir año ----- */}
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

        {/* ----- Menu desplegable para elegir año ----- */}
      </div>
    </>
  );
};

export default PodridaHomePanel;
