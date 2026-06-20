//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "../../TournamentRounds/TournamentRoundsFormStyle.css";
import "../MatchStatsCreate/MatchStatsCreateStyle.css";

//Import helpers
import { formatDate } from "../../../../../helpers/dateFormatter";

//Import components
import MatchStatsGrid from "../MatchStatsGrid";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { getTournamentRoundAction } from "../../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import { getMatchStatsFilteredAction } from "../../../../../redux/slices/match-stats/matchStatsSlices";

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

  //Indexar las estadísticas guardadas por jugador para alimentar MatchStatsGrid
  const statsByPlayer = {};
  filteredMatchStats?.forEach((stat) => {
    if (stat.player?._id) statsByPlayer[stat.player._id] = stat;
  });

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

      <MatchStatsGrid
        players={tournamentRound?.players}
        statsByPlayer={statsByPlayer}
        readOnly
      />
    </div>
  );
};

export default MatchStatsDetail;
