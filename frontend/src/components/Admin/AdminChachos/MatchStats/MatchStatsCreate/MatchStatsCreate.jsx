//Import React & Hooks
import React, { useState, useEffect } from "react";
import { Navigate, Link, useParams } from "react-router-dom";

//Import CSS & styles
import "../../TournamentRounds/TournamentRoundsFormStyle.css";
import "./MatchStatsCreateStyle.css";

//Import helpers
import { formatDate } from "../../../../../helpers/dateFormatter";
import { emptyStats } from "../../../../../helpers/matchStatsFields";

//Import components
import MatchStatsGrid from "../MatchStatsGrid";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { getTournamentRoundAction } from "../../../../../redux/slices/tournament-rounds/tournamentRoundsSlices";
import { createMatchStatAction } from "../../../../../redux/slices/match-stats/matchStatsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const MatchStatsCreate = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.tournamentRounds);
  const { appError, serverError } = storeData;
  const tournamentRound = storeData?.tournamentRound?.tournamentRound;
  const storeDataStats = useSelector((store) => store.stats);

  //Estadísticas por jugador, inicializadas en 0 para todos los convocados
  const [statsByPlayer, setStatsByPlayer] = useState({});

  //Get tournament round information from database every time the component renders
  useEffect(() => {
    dispatch(getTournamentRoundAction(id));
  }, [dispatch, id]);

  //Inicializar el estado en 0 para cada jugador convocado
  useEffect(() => {
    if (tournamentRound?.players) {
      const initial = {};
      tournamentRound.players.forEach((player) => {
        initial[player._id] = emptyStats();
      });
      setStatsByPlayer(initial);
    }
  }, [tournamentRound?.players]);

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
    dispatch(createMatchStatAction(payload));
  };

  //Navigate to index in case there is an updated category
  if (storeDataStats?.isCreated)
    return <Navigate to="/admin/chachos/match-stats" />;

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

      <form className="msc-form" onSubmit={handleSubmit}>
        <MatchStatsGrid
          players={tournamentRound?.players}
          statsByPlayer={statsByPlayer}
          onFieldChange={handleFieldChange}
        />

        <button className="ctr-submit-btn" type="submit">
          Guardar estadísticas
        </button>
      </form>
    </div>
  );
};

export default MatchStatsCreate;
