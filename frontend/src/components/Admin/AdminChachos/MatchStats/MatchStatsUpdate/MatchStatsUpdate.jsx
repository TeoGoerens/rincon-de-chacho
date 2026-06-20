//Import React & Hooks
import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

//Import CSS & styles
import "../../TournamentRounds/TournamentRoundsFormStyle.css";
import "../MatchStatsCreate/MatchStatsCreateStyle.css";

//Import helpers
import { formatDate } from "../../../../../helpers/dateFormatter";
import { emptyStats } from "../../../../../helpers/matchStatsFields";

//Import components
import MatchStatsGrid from "../MatchStatsGrid";

//Import React Query functions
import fetchRoundById from "../../../../../reactquery/chachos/fetchRoundById";
import fetchMatchStatsFiltered from "../../../../../reactquery/chachos/fetchMatchStatsFiltered";
import updateMatchStats from "../../../../../reactquery/chachos/updateMatchStats";

//----------------------------------------
//COMPONENT
//----------------------------------------

const MatchStatsUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: roundData, error } = useQuery({
    queryKey: ["tournament-round", id],
    queryFn: () => fetchRoundById(id),
  });
  const tournamentRound = roundData?.tournamentRound;

  const { data: filteredMatchStats } = useQuery({
    queryKey: ["match-stats-filtered", { round: id }],
    queryFn: () => fetchMatchStatsFiltered({ round: id }),
  });

  //Estadísticas por jugador
  const [statsByPlayer, setStatsByPlayer] = useState({});

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

  const mutation = useMutation({
    mutationFn: updateMatchStats,
    onSuccess: () => {
      queryClient.invalidateQueries(["match-stats-filtered", { round: id }]);
      navigate("/admin/chachos/match-stats");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Error al guardar los cambios"
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = Object.entries(statsByPlayer).map(([playerId, stats]) => ({
      playerId,
      ...stats,
    }));
    mutation.mutate({ tournamentRoundId: id, stats: payload });
  };

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

      {error || mutation.isError ? (
        <p className="ctr-form-error-banner">
          {error?.message ?? mutation.error?.response?.data?.message}
        </p>
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
