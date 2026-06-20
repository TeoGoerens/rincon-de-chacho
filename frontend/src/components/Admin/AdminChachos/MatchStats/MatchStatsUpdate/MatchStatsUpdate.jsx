//Import React & Hooks
import React, { useState, useEffect } from "react";
import { Navigate, Link, useParams } from "react-router-dom";

//Import CSS & styles
import "../../TournamentRounds/TournamentRoundsFormStyle.css";
import "../MatchStatsCreate/MatchStatsCreateStyle.css";

//Import helpers
import { formatDate } from "../../../../../helpers/dateFormatter";
import { emptyStats } from "../../../../../helpers/matchStatsFields";

//Import components
import MatchStatsGrid from "../MatchStatsGrid";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { getTournamentRoundAction } from "../../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import {
  getMatchStatsFilteredAction,
  updateMatchStatAction,
} from "../../../../../redux/slices/match-stats/matchStatsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const MatchStatsUpdate = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const { appError, serverError } = storeData;
  const tournamentRound = storeData?.tournamentRound?.tournamentRound;
  const storeDataStats = useSelector((store) => store.stats);
  const filteredMatchStats = storeDataStats?.filteredMatchStats?.filteredMatchStats;

  //Estadísticas por jugador
  const [statsByPlayer, setStatsByPlayer] = useState({});

  //Get tournament round + existing match stats every time the component renders
  useEffect(() => {
    dispatch(getTournamentRoundAction(id));
    dispatch(getMatchStatsFilteredAction({ round: id }));
  }, [dispatch, id]);

  //Inicializar el estado con las estadísticas ya guardadas para cada jugador convocado
  useEffect(() => {
    if (tournamentRound?.players) {
      const initial = {};
      tournamentRound.players.forEach((player) => {
        const existingStat = filteredMatchStats?.find(
          (stat) => stat.player?._id === player._id
        );
        initial[player._id] = existingStat
          ? {
              goals: existingStat.goals ?? 0,
              assists: existingStat.assists ?? 0,
              yellow_cards: existingStat.yellow_cards ?? 0,
              red_cards: existingStat.red_cards ?? 0,
            }
          : emptyStats();
      });
      setStatsByPlayer(initial);
    }
  }, [tournamentRound?.players, filteredMatchStats]);

  const handleFieldChange = (playerId, field, value) => {
    const numericValue = value === "" ? 0 : Math.max(0, Number(value));
    setStatsByPlayer((prev) => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: numericValue },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = Object.entries(statsByPlayer).map(([playerId, stats]) => ({
      playerId,
      ...stats,
    }));
    dispatch(updateMatchStatAction(payload));
  };

  //Navigate to index once the stats have been updated
  if (storeDataStats?.isUpdated)
    return <Navigate to="/admin/chachos/match-stats" />;

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Editar estadísticas de la fecha</h1>
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

      <form className="msc-form" onSubmit={handleSubmit}>
        <MatchStatsGrid
          players={tournamentRound?.players}
          statsByPlayer={statsByPlayer}
          onFieldChange={handleFieldChange}
        />

        <button className="ctr-submit-btn" type="submit">
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default MatchStatsUpdate;
