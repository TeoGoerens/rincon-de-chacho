//Import React & Hooks
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "../../TournamentRounds/TournamentRoundsFormStyle.css";
import "../MatchStatsCreate/MatchStatsCreateStyle.css";

//Import helpers
import { formatDate } from "../../../../../helpers/dateFormatter";

//Import components
import MatchStatsGrid from "../MatchStatsGrid";

//Import React Query functions
import fetchRoundById from "../../../../../reactquery/chachos/fetchRoundById";
import fetchMatchStatsFiltered from "../../../../../reactquery/chachos/fetchMatchStatsFiltered";

//----------------------------------------
//COMPONENT
//----------------------------------------

const MatchStatsDetail = () => {
  const { id } = useParams();

  const { data: roundData, error } = useQuery({
    queryKey: ["tournament-round", id],
    queryFn: () => fetchRoundById(id),
  });
  const tournamentRound = roundData?.tournamentRound;

  const { data: filteredMatchStats } = useQuery({
    queryKey: ["match-stats-filtered", { round: id }],
    queryFn: () => fetchMatchStatsFiltered({ round: id }),
  });

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

      {error ? (
        <p className="ctr-form-error-banner">{error.message}</p>
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
