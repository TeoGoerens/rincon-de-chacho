//Import React & Hooks
import React, { useEffect, useState, useRef, useMemo } from "react";

//Import libraries
import { SwiperContainer, SwiperSlide } from "swiper/element/bundle";
import "swiper/element/bundle";
import "swiper/css";
import "swiper/css/pagination";

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

  // --------------------
  // LOCAL STATES
  // --------------------
  const [yearFilter, setYearFilter] = useState("all");
  const [tournamentFilter, setTournamentFilter] = useState("all");
  const [regroupedPlayersStats, setRegroupedPlayersStats] = useState([]);

  // --------------------
  // REDUX SELECTORS
  // --------------------
  //Select tournament information from store
  const tournamentStoreData = useSelector((store) => store.tournaments);
  const allTournaments = tournamentStoreData?.tournaments?.tournaments;

  //Select match stats information from store
  const matchStatsStoreData = useSelector((store) => store.stats);
  const allMatchStats =
    matchStatsStoreData?.filteredMatchStats?.filteredMatchStats;
  const { appError, serverError } = matchStatsStoreData;

  // --------------------
  // DATA FETCH
  // --------------------
  // 1) Al montar, obtenemos la lista de torneos para poder armar el filtro de años y torneos.
  useEffect(() => {
    dispatch(getAllTournamentsAction());
  }, [dispatch]);

  // 2) Cada vez que cambien yearFilter o tournamentFilter, disparamos getMatchStatsFilteredAction
  useEffect(() => {
    // Armamos un objeto con los filtros (sin "all")
    const filter = {};
    if (yearFilter !== "all") {
      filter.year = yearFilter;
    }
    if (tournamentFilter !== "all") {
      filter.tournament = tournamentFilter;
    }

    dispatch(getMatchStatsFilteredAction(filter));
  }, [yearFilter, tournamentFilter, dispatch]);

  // --------------------
  // LISTA DE AÑOS Y TORNEOS FILTRADOS
  // --------------------
  // yearsList: todos los años únicos en la BD (de los torneos existentes)
  const yearsList = useMemo(() => {
    if (!allTournaments) return [];
    const uniqueYears = new Set(allTournaments.map((t) => t.year));
    return [...uniqueYears].sort(); // orden ascendente, si querés
  }, [allTournaments]);

  // filteredTournaments: torneos filtrados por yearFilter
  // Si yearFilter === "all", mostramos todos
  const filteredTournamentsByYear = useMemo(() => {
    if (!allTournaments) return [];
    if (yearFilter === "all") return allTournaments;
    return allTournaments.filter(
      (tournament) => tournament.year === Number(yearFilter)
    );
  }, [allTournaments, yearFilter]);

  // --------------------
  // TRANSFORMAR Y ORDENAR STATS
  // --------------------

  //Change the layout of match stats array
  useEffect(() => {
    if (allMatchStats && Array.isArray(allMatchStats)) {
      setRegroupedPlayersStats(regroupPlayerStats(allMatchStats));
    }
  }, [allMatchStats]);

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

  // --------------------
  // SWIPER
  // --------------------
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
      spaceBetween: 2,
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

  // --------------------
  // RENDER
  // --------------------

  return (
    <>
      <ChachosMenu />
      <div className="container chachos-home-panel-container">
        <div className="chachos-filter-selection">
          {/*-------------------- Selector de años --------------------*/}
          <select
            className="chachos-home-panel-container-select"
            name="yearFilter"
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              // Al cambiar el año, reseteamos el torneo a "all" para que no quede
              // un torneo que quizás no pertenezca al año seleccionado.
              setTournamentFilter("all");
            }}
          >
            <option value="all" label="Todos los años" />
            {yearsList.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/*-------------------- Selector de torneos --------------------*/}
          <select
            className="chachos-home-panel-container-select"
            name="tournamentFilter"
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
          >
            <option value="all" label="Todos los torneos" />
            {filteredTournamentsByYear.map((tournament) => (
              <option key={tournament._id} value={tournament._id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>

        {/*-------------------- TOP 10 de categorías --------------------*/}
        <h2>Top 10 por categoria</h2>
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}

        {/*         Tablas de presencias, goleadores y asistencias */}

        <div className="chachos-swiper-container">
          <swiper-container ref={swiperElRef} class="chachos-swiper">
            <swiper-slide class="chachos-swiper-slide">
              <div className="chachos-stats-content-card">
                <h3>PRESENCIAS</h3>
                <div className="chachos-stats-content-card-top">
                  <div className="top-player">
                    <div className="player">
                      <div className="player-info">
                        <span className="player-rank">1</span>
                        <div className="player-name">
                          <h4>
                            {matchStatsSortedByMatchesPlayed[0]?.first_name}{" "}
                            {matchStatsSortedByMatchesPlayed[0]?.last_name}{" "}
                            <i class="fa-solid fa-trophy"></i>
                          </h4>
                          <p>
                            {matchStatsSortedByMatchesPlayed[0]?.field_position}
                          </p>
                        </div>
                      </div>
                      <div className="player-stat">
                        <span class="material-symbols-outlined">
                          front_hand
                        </span>
                        <strong>
                          {matchStatsSortedByMatchesPlayed[0]?.matches_played}
                        </strong>
                      </div>
                    </div>

                    <div className="top-player-average">
                      <h6>
                        <i class="fa-solid fa-star"></i> De{" "}
                        {countUniqueValues(allMatchStats, "round")} partidos:{" "}
                        <strong>
                          {(
                            (matchStatsSortedByMatchesPlayed[0]
                              ?.matches_played /
                              countUniqueValues(allMatchStats, "round")) *
                            100
                          ).toFixed(0)}
                          {"% "}
                          de asistencia
                        </strong>
                      </h6>
                    </div>
                  </div>

                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">2</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByMatchesPlayed[1]?.first_name}{" "}
                          {matchStatsSortedByMatchesPlayed[1]?.last_name}{" "}
                          <i class="fa-solid fa-medal"></i>
                        </h4>
                        <p>
                          {matchStatsSortedByMatchesPlayed[1]?.field_position}
                        </p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">front_hand</span>
                      <strong>
                        {matchStatsSortedByMatchesPlayed[1]?.matches_played}
                      </strong>
                    </div>
                  </div>
                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">3</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByMatchesPlayed[2]?.first_name}{" "}
                          {matchStatsSortedByMatchesPlayed[2]?.last_name}{" "}
                          <i class="fa-solid fa-award"></i>
                        </h4>
                        <p>
                          {matchStatsSortedByMatchesPlayed[2]?.field_position}
                        </p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">front_hand</span>
                      <strong>
                        {matchStatsSortedByMatchesPlayed[2]?.matches_played}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="chachos-stats-content-card-rest">
                  {matchStatsSortedByMatchesPlayed
                    ?.slice(3, 10)
                    .map((player, index) => (
                      <div className="player" key={index}>
                        <div className="player-info">
                          <span className="player-rank">{index + 4}</span>
                          <div className="player-name">
                            <h4>
                              {player.first_name} {player.last_name}
                            </h4>
                          </div>
                        </div>
                        <div className="player-stat">
                          <span class="material-symbols-outlined">
                            front_hand
                          </span>
                          <strong>{player.matches_played}</strong>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </swiper-slide>
            <swiper-slide class="chachos-swiper-slide">
              <div className="chachos-stats-content-card">
                <h3>GOLEADORES</h3>
                <div className="chachos-stats-content-card-top">
                  <div className="top-player">
                    <div className="player">
                      <div className="player-info">
                        <span className="player-rank">1</span>
                        <div className="player-name">
                          <h4>
                            {matchStatsSortedByGoals[0]?.first_name}{" "}
                            {matchStatsSortedByGoals[0]?.last_name}{" "}
                            <i class="fa-solid fa-trophy"></i>
                          </h4>
                          <p>{matchStatsSortedByGoals[0]?.field_position}</p>
                        </div>
                      </div>
                      <div className="player-stat">
                        <span class="material-symbols-outlined">
                          sports_soccer
                        </span>
                        <strong>{matchStatsSortedByGoals[0]?.goals}</strong>
                      </div>
                    </div>

                    <div className="top-player-average">
                      <h6>
                        <i class="fa-solid fa-star"></i> Promedio por partido:{" "}
                        <strong>
                          {(
                            matchStatsSortedByGoals[0]?.goals /
                            matchStatsSortedByGoals[0]?.matches_played
                          ).toFixed(2)}
                        </strong>
                      </h6>
                    </div>
                  </div>

                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">2</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByGoals[1]?.first_name}{" "}
                          {matchStatsSortedByGoals[1]?.last_name}{" "}
                          <i class="fa-solid fa-medal"></i>
                        </h4>
                        <p>{matchStatsSortedByGoals[1]?.field_position}</p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">
                        sports_soccer
                      </span>
                      <strong>{matchStatsSortedByGoals[1]?.goals}</strong>
                    </div>
                  </div>
                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">3</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByGoals[2]?.first_name}{" "}
                          {matchStatsSortedByGoals[2]?.last_name}{" "}
                          <i class="fa-solid fa-award"></i>
                        </h4>
                        <p>{matchStatsSortedByGoals[2]?.field_position}</p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">
                        sports_soccer
                      </span>
                      <strong>{matchStatsSortedByGoals[2]?.goals}</strong>
                    </div>
                  </div>
                </div>
                <div className="chachos-stats-content-card-rest">
                  {matchStatsSortedByGoals
                    ?.slice(3, 10)
                    .map((player, index) => (
                      <div className="player" key={index}>
                        <div className="player-info">
                          <span className="player-rank">{index + 4}</span>
                          <div className="player-name">
                            <h4>
                              {player.first_name} {player.last_name}
                            </h4>
                          </div>
                        </div>
                        <div className="player-stat">
                          <span class="material-symbols-outlined">
                            sports_soccer
                          </span>
                          <strong>{player.goals}</strong>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </swiper-slide>
            <swiper-slide class="chachos-swiper-slide">
              <div className="chachos-stats-content-card">
                <h3>ASISTENCIAS</h3>
                <div className="chachos-stats-content-card-top">
                  <div className="top-player">
                    <div className="player">
                      <div className="player-info">
                        <span className="player-rank">1</span>
                        <div className="player-name">
                          <h4>
                            {matchStatsSortedByAssists[0]?.first_name}{" "}
                            {matchStatsSortedByAssists[0]?.last_name}{" "}
                            <i class="fa-solid fa-trophy"></i>
                          </h4>
                          <p>{matchStatsSortedByAssists[0]?.field_position}</p>
                        </div>
                      </div>
                      <div className="player-stat">
                        <span class="material-symbols-outlined">
                          psychology
                        </span>
                        <strong>{matchStatsSortedByAssists[0]?.assists}</strong>
                      </div>
                    </div>

                    <div className="top-player-average">
                      <h6>
                        <i class="fa-solid fa-star"></i> Promedio por partido:{" "}
                        <strong>
                          {(
                            matchStatsSortedByAssists[0]?.assists /
                            matchStatsSortedByAssists[0]?.matches_played
                          ).toFixed(2)}
                        </strong>
                      </h6>
                    </div>
                  </div>

                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">2</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByAssists[1]?.first_name}{" "}
                          {matchStatsSortedByAssists[1]?.last_name}{" "}
                          <i class="fa-solid fa-medal"></i>
                        </h4>
                        <p>{matchStatsSortedByAssists[1]?.field_position}</p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">psychology</span>
                      <strong>{matchStatsSortedByAssists[1]?.assists}</strong>
                    </div>
                  </div>
                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">3</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByAssists[2]?.first_name}{" "}
                          {matchStatsSortedByAssists[2]?.last_name}{" "}
                          <i class="fa-solid fa-award"></i>
                        </h4>
                        <p>{matchStatsSortedByAssists[2]?.field_position}</p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">psychology</span>
                      <strong>{matchStatsSortedByAssists[2]?.assists}</strong>
                    </div>
                  </div>
                </div>
                <div className="chachos-stats-content-card-rest">
                  {matchStatsSortedByAssists
                    ?.slice(3, 10)
                    .map((player, index) => (
                      <div className="player" key={index}>
                        <div className="player-info">
                          <span className="player-rank">{index + 4}</span>
                          <div className="player-name">
                            <h4>
                              {player.first_name} {player.last_name}
                            </h4>
                          </div>
                        </div>
                        <div className="player-stat">
                          <span class="material-symbols-outlined">
                            psychology
                          </span>
                          <strong>{player.assists}</strong>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </swiper-slide>
            <swiper-slide class="chachos-swiper-slide">
              <div className="chachos-stats-content-card">
                <h3>AMARILLAS</h3>
                <div className="chachos-stats-content-card-top">
                  <div className="top-player">
                    <div className="player">
                      <div className="player-info">
                        <span className="player-rank">1</span>
                        <div className="player-name">
                          <h4>
                            {matchStatsSortedByYellowCards[0]?.first_name}{" "}
                            {matchStatsSortedByYellowCards[0]?.last_name}{" "}
                            <i class="fa-solid fa-trophy"></i>
                          </h4>
                          <p>
                            {matchStatsSortedByYellowCards[0]?.field_position}
                          </p>
                        </div>
                      </div>
                      <div className="player-stat">
                        <span class="material-symbols-outlined">warning</span>
                        <strong>
                          {matchStatsSortedByYellowCards[0]?.yellow_cards}
                        </strong>
                      </div>
                    </div>

                    <div className="top-player-average">
                      <h6>
                        <i class="fa-solid fa-star"></i> Promedio:{" "}
                        <strong>
                          1 cada{" "}
                          {(
                            matchStatsSortedByYellowCards[0]?.matches_played /
                            matchStatsSortedByYellowCards[0]?.yellow_cards
                          ).toFixed(1)}{" "}
                          partidos
                        </strong>
                      </h6>
                    </div>
                  </div>

                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">2</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByYellowCards[1]?.first_name}{" "}
                          {matchStatsSortedByYellowCards[1]?.last_name}{" "}
                          <i class="fa-solid fa-medal"></i>
                        </h4>
                        <p>
                          {matchStatsSortedByYellowCards[1]?.field_position}
                        </p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">warning</span>
                      <strong>
                        {matchStatsSortedByYellowCards[1]?.yellow_cards}
                      </strong>
                    </div>
                  </div>
                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">3</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByYellowCards[2]?.first_name}{" "}
                          {matchStatsSortedByYellowCards[2]?.last_name}{" "}
                          <i class="fa-solid fa-award"></i>
                        </h4>
                        <p>
                          {matchStatsSortedByYellowCards[2]?.field_position}
                        </p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">warning</span>
                      <strong>
                        {matchStatsSortedByYellowCards[2]?.yellow_cards}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="chachos-stats-content-card-rest">
                  {matchStatsSortedByYellowCards
                    ?.slice(3, 10)
                    .map((player, index) => (
                      <div className="player" key={index}>
                        <div className="player-info">
                          <span className="player-rank">{index + 4}</span>
                          <div className="player-name">
                            <h4>
                              {player.first_name} {player.last_name}
                            </h4>
                          </div>
                        </div>
                        <div className="player-stat">
                          <span class="material-symbols-outlined">warning</span>
                          <strong>{player.yellow_cards}</strong>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </swiper-slide>
            <swiper-slide class="chachos-swiper-slide">
              <div className="chachos-stats-content-card">
                <h3>ROJAS</h3>
                <div className="chachos-stats-content-card-top">
                  <div className="top-player">
                    <div className="player">
                      <div className="player-info">
                        <span className="player-rank">1</span>
                        <div className="player-name">
                          <h4>
                            {matchStatsSortedByRedCards[0]?.first_name}{" "}
                            {matchStatsSortedByRedCards[0]?.last_name}{" "}
                            <i class="fa-solid fa-trophy"></i>
                          </h4>
                          <p>{matchStatsSortedByRedCards[0]?.field_position}</p>
                        </div>
                      </div>
                      <div className="player-stat">
                        <span class="material-symbols-outlined">close</span>
                        <strong>
                          {matchStatsSortedByRedCards[0]?.red_cards}
                        </strong>
                      </div>
                    </div>

                    <div className="top-player-average">
                      <h6>
                        <i class="fa-solid fa-star"></i> Promedio:{" "}
                        <strong>
                          1 cada{" "}
                          {(
                            matchStatsSortedByRedCards[0]?.matches_played /
                            matchStatsSortedByRedCards[0]?.red_cards
                          ).toFixed(1)}{" "}
                          partidos
                        </strong>
                      </h6>
                    </div>
                  </div>

                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">2</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByRedCards[1]?.first_name}{" "}
                          {matchStatsSortedByRedCards[1]?.last_name}{" "}
                          <i class="fa-solid fa-medal"></i>
                        </h4>
                        <p>{matchStatsSortedByRedCards[1]?.field_position}</p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">close</span>
                      <strong>
                        {matchStatsSortedByRedCards[1]?.red_cards}
                      </strong>
                    </div>
                  </div>
                  <div className="player">
                    <div className="player-info">
                      <span className="player-rank">3</span>
                      <div className="player-name">
                        <h4>
                          {matchStatsSortedByRedCards[2]?.first_name}{" "}
                          {matchStatsSortedByRedCards[2]?.last_name}{" "}
                          <i class="fa-solid fa-award"></i>
                        </h4>
                        <p>{matchStatsSortedByRedCards[2]?.field_position}</p>
                      </div>
                    </div>
                    <div className="player-stat">
                      <span class="material-symbols-outlined">close</span>
                      <strong>
                        {matchStatsSortedByRedCards[2]?.red_cards}
                      </strong>
                    </div>
                  </div>
                </div>
                <div className="chachos-stats-content-card-rest">
                  {matchStatsSortedByRedCards
                    ?.slice(3, 10)
                    .map((player, index) => (
                      <div className="player" key={index}>
                        <div className="player-info">
                          <span className="player-rank">{index + 4}</span>
                          <div className="player-name">
                            <h4>
                              {player.first_name} {player.last_name}
                            </h4>
                          </div>
                        </div>
                        <div className="player-stat">
                          <span class="material-symbols-outlined">close</span>
                          <strong>{player.red_cards}</strong>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </swiper-slide>
          </swiper-container>

          <button onClick={handlePrevSlide} className="chachos-swiper-btn-back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button onClick={handleNextSlide} className="chachos-swiper-btn-next">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>

        {/*         Tablas de puntajes y perlas */}
        <h2>Puntajes y perlas</h2>
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
