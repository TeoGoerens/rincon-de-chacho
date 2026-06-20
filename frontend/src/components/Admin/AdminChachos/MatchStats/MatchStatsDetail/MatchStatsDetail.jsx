//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "../../TournamentRounds/TournamentRoundsFormStyle.css";
import "../MatchStatsCreate/MatchStatsCreateStyle.css";

//Import helpers
import { formatDate } from "../../../../../helpers/dateFormatter";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { getTournamentRoundAction } from "../../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import { getMatchStatsFilteredAction } from "../../../../../redux/slices/match-stats/matchStatsSlices";

const STAT_FIELDS = [
  { key: "goals", label: "Goles" },
  { key: "assists", label: "Asist." },
  { key: "yellow_cards", label: "Amarillas" },
  { key: "red_cards", label: "Rojas" },
];

//----------------------------------------
//COMPONENT
//----------------------------------------

const MatchStatsDetail = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const { appError, serverError } = storeData;
  const tournamentRound = storeData?.tournamentRound?.tournamentRound;
  const storeDataStats = useSelector((store) => store.stats);
  const filteredMatchStats = storeDataStats?.filteredMatchStats?.filteredMatchStats;

  //Get tournament round + match stats every time the component renders
  useEffect(() => {
    dispatch(getTournamentRoundAction(id));
    dispatch(getMatchStatsFilteredAction({ round: id }));
  }, [dispatch, id]);

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Estadísticas de la fecha</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/match-stats">
          Volver
        </Link>
      </div>

      {appError || serverError ? (
        <p className="ctr-form-error-banner">{appError}</p>
      ) : null}

      <div className="msc-match-summary">
        <span className="msc-match-summary-item">
          {formatDate(tournamentRound?.match_date)}
        </span>
        <span className="msc-match-summary-sep">·</span>
        <span className="msc-match-summary-item">
          {tournamentRound?.tournament?.name}
        </span>
        <span className="msc-match-summary-sep">·</span>
        <span className="msc-match-summary-item msc-match-summary-rival">
          vs {tournamentRound?.rival?.name}
        </span>
        <span className="msc-match-summary-sep">·</span>
        <span className="msc-match-summary-score">
          {tournamentRound?.score_chachos} - {tournamentRound?.score_rival}
        </span>
      </div>

      {/* ── Desktop: grid ── */}
      <div className="msc-grid-wrap msc-desktop-only">
        <div className="msc-grid">
          <div className="msc-grid-header">
            <span className="msc-col-player">Jugador</span>
            {STAT_FIELDS.map((field) => (
              <span className="msc-col-stat" key={field.key}>
                {field.label}
              </span>
            ))}
          </div>

          {tournamentRound?.players?.map((player) => {
            const stat = filteredMatchStats?.find(
              (s) => s.player?._id === player._id
            );
            return (
              <div className="msc-grid-row" key={player._id}>
                <span className="msc-col-player msc-player-name">
                  #{player.shirt} {player.first_name} {player.last_name}
                </span>
                {STAT_FIELDS.map((field) => {
                  const value = stat?.[field.key] ?? 0;
                  return (
                    <span
                      className={`msc-col-stat msc-col-stat--readonly ${
                        value > 0 ? "msc-col-stat--highlight" : ""
                      }`}
                      key={field.key}
                    >
                      {value}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile: cards apiladas ── */}
      <div className="msc-mobile-list">
        {tournamentRound?.players?.map((player) => {
          const stat = filteredMatchStats?.find(
            (s) => s.player?._id === player._id
          );
          return (
            <div className="msc-mobile-card" key={player._id}>
              <span className="msc-mobile-card-name">
                #{player.shirt} {player.first_name} {player.last_name}
              </span>
              <div className="msc-mobile-stats-grid">
                {STAT_FIELDS.map((field) => {
                  const value = stat?.[field.key] ?? 0;
                  return (
                    <div className="msc-mobile-stat" key={field.key}>
                      <span className="msc-mobile-stat-label">
                        {field.label}
                      </span>
                      <span
                        className={`msc-col-stat--readonly ${
                          value > 0 ? "msc-col-stat--highlight" : ""
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MatchStatsDetail;
