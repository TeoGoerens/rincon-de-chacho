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

  //Swiper set up and params
  const swiperElRef = useRef(null);

  useEffect(() => {
    const swiperParams = {
      modules: [SwiperContainer.Pagination],
      pagination: {
        clickable: true, // Hace que los bullets sean clickeables
        dynamicBullets: true, // Puedes activar bullets dinámicos si lo deseas
      },
      loop: true,
      spaceBetween: 5,
      breakpoints: {
        0: {
          slidesPerView: 1,
        },
        800: {
          slidesPerView: 2,
        },
        1200: {
          slidesPerView: 3,
        },
      },
    };
    Object.assign(swiperElRef.current, swiperParams);
    swiperElRef.current.initialize();
  }, []);

  const handlePrevSlide = () => {
    swiperElRef.current.swiper.slidePrev();
  };
  const handleNextSlide = () => {
    swiperElRef.current.swiper.slideNext();
  };

  return (
    <>
      <PodridaMenu />
      <div className="container podrida-home-panel-container">
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}

        {/* <<<-------------------- SWIPER APPLIED TO HISTORICAL RECORDS -------------------->>> */}
        <h2>Récords históricos</h2>
        <div className="podrida-swiper-container">
          <swiper-container ref={swiperElRef} class="podrida-swiper">
            <swiper-slide class="podrida-swiper-slide">
              <RecordsSlide
                customClass="red"
                category="Mayor cantidad de partidas jugadas"
                medal={matchesMedal}
                character={marioImage}
              />
            </swiper-slide>
            <swiper-slide class="podrida-swiper-slide">
              <RecordsSlide
                customClass="orange"
                category="Mayor cantidad de titulos"
                medal={titlesMedal}
                character={peachImage}
              />
            </swiper-slide>
            <swiper-slide class="podrida-swiper-slide">
              <RecordsSlide
                customClass="grey"
                category="Mayor cantidad de últimos puestos"
                medal={lastsMedal}
                character={bowserImage}
              />
            </swiper-slide>
            <swiper-slide class="podrida-swiper-slide">
              <RecordsSlide
                customClass="green"
                category="Mayor cantidad de highlights"
                medal={highlightsMedal}
                character={yoshiImage}
              />
            </swiper-slide>
            <swiper-slide class="podrida-swiper-slide">
              <RecordsSlide
                customClass="blue"
                category="Mayor % de cumplimiento"
                medal={accuracyMedal}
                character={luigiImage}
              />
            </swiper-slide>
            <swiper-slide class="podrida-swiper-slide">
              <RecordsSlide
                customClass="violet"
                category="Puntos en una partida"
                medal={pointsMedal}
                character={warioImage}
              />
            </swiper-slide>
            <swiper-slide class="podrida-swiper-slide">
              <RecordsSlide
                customClass="brown"
                category="Basas pedidas en una partida"
                medal={requestsMedal}
                character={goombaImage}
              />
            </swiper-slide>
          </swiper-container>
          <button onClick={handlePrevSlide} className="podrida-swiper-btn-back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button onClick={handleNextSlide} className="podrida-swiper-btn-next">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        {/* <<<-------------------- TABLE REFLECTING PODRIDA RANKING -------------------->>> */}
        <h2>Ranking</h2>

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

        {/* ----- Menu desplegable para elegir tipo de partida ----- */}
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

        {/* ----- Tabla de partidas jugadas y ranking ----- */}
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

        {/* <<<-------------------- TABLE REFLECTING HISTORICAL STATS -------------------->>> */}
        <h2>Centro de estadísticas</h2>

        {/* ----- Menu desplegable para elegir tipo de estadistica ----- */}
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
