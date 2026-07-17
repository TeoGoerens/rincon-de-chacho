// Import React dependencies
import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeIndexStyles.css";
import { MATCHDAY_PHASES, formatDeadline } from "../prodeAdminConstants";

//Import React Query functions
import fetchAllProdeTournaments from "../../../../reactquery/prode/fetchAllProdeTournaments";
import superDeleteProdeEntity from "../../../../reactquery/prode/superDeleteProdeEntity";
import fetchProdeMatchdaysByTournament from "../../../../reactquery/prode/fetchProdeMatchdaysByTournament";
import deleteProdeMatchday from "../../../../reactquery/prode/deleteProdeMatchday";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import SuperDeleteButton from "../../../Layout/Buttons/SuperDeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

const MATCHDAY_SUPER_DELETE_WARNING =
  "Borra la fecha en cualquier fase —consolidada incluida— junto con todos sus pronósticos. Sus puntos desaparecen de la tabla, los records y el H2H.";

const ProdeMatchdaysIndex = () => {
  const queryClient = useQueryClient();
  const [tournamentId, setTournamentId] = useState("");

  const { data: tournamentsData } = useQuery({
    queryKey: ["prode-tournaments"],
    queryFn: fetchAllProdeTournaments,
  });
  const tournaments = useMemo(() => tournamentsData ?? [], [tournamentsData]);

  /* Torneo por defecto: el activo más reciente; si no hay, el primero */
  useEffect(() => {
    if (!tournamentId && tournaments.length > 0) {
      const active = tournaments.find((t) => t.status === "active");
      setTournamentId((active ?? tournaments[0])._id);
    }
  }, [tournaments, tournamentId]);

  const {
    data: matchdaysData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-matchdays", tournamentId],
    queryFn: () => fetchProdeMatchdaysByTournament(tournamentId),
    enabled: !!tournamentId,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ matchdayId }) => deleteProdeMatchday({ matchdayId }),
    onSuccess: () => {
      toast.success("Fecha eliminada correctamente");
      queryClient.invalidateQueries(["prode-matchdays", tournamentId]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar la fecha");
    },
  });

  const superDeleteMutation = useMutation({
    mutationFn: (matchdayId) =>
      superDeleteProdeEntity({ kind: "matchday", id: matchdayId }),
    onSuccess: () => {
      toast.success("Super eliminación completada");
      queryClient.invalidateQueries(["prode-matchdays", tournamentId]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error en la super eliminación");
    },
  });

  const matchdays = matchdaysData ?? [];

  return (
    <div className="pri">
      <div className="pri-header">
        <div className="pri-header-text">
          <div className="pri-eyebrow">
            <span className="pri-eyebrow-dot" />
            Prode
          </div>
          <h1 className="pri-title">Fechas</h1>
          <p className="pri-subtitle">
            {matchdaysData
              ? `${matchdays.length} fechas en el torneo`
              : "Seleccioná un torneo"}
          </p>
        </div>
        <Link className="pri-create-btn" to="crear">
          <i className="fa-solid fa-plus"></i>
          Nueva fecha
        </Link>
      </div>

      <div className="pri-filter">
        <select
          value={tournamentId}
          onChange={(e) => setTournamentId(e.target.value)}
        >
          {tournaments.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name} ({t.year})
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <p className="pri-state">
          {error?.message || "Ocurrió un error al cargar las fechas."}
        </p>
      ) : !tournamentId || isLoading ? (
        <p className="pri-state">Cargando fechas...</p>
      ) : matchdays.length <= 0 ? (
        <p className="pri-state">Este torneo todavía no tiene fechas</p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="pri-table-wrap pri-desktop-only">
            <table className="pri-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Mes</th>
                  <th>Deadline</th>
                  <th>Duelos</th>
                  <th>Ítems</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matchdays.map((matchday) => {
                  const phase =
                    MATCHDAY_PHASES[matchday.phase] ?? MATCHDAY_PHASES.draft;
                  return (
                    <tr key={matchday._id}>
                      <td>
                        <span className="pri-cell-name">
                          Fecha {matchday.roundNumber}
                        </span>
                      </td>
                      <td>
                        <span className="pri-cell-date">{matchday.month}</span>
                      </td>
                      <td>
                        <span className="pri-cell-date">
                          {formatDeadline(matchday.predictionsDeadline)}
                        </span>
                      </td>
                      <td>
                        <span className="pri-cell-score">
                          {matchday.duels?.length || 0}
                        </span>
                      </td>
                      <td>
                        <span className="pri-cell-score">
                          {matchday.items?.length || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`pri-badge ${phase.badge}`}>
                          {phase.label}
                        </span>
                      </td>
                      <td>
                        <div className="pri-actions">
                          <EditButton to={`editar/${matchday._id}`} />
                          <DeleteButton
                            onClick={deleteMutation.mutate}
                            id={{ matchdayId: matchday._id }}
                          />
                          <SuperDeleteButton
                            onClick={superDeleteMutation.mutate}
                            id={matchday._id}
                            warning={MATCHDAY_SUPER_DELETE_WARNING}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards de 2 renglones ── */}
          <div className="pri-mobile-list">
            {matchdays.map((matchday) => {
              const phase =
                MATCHDAY_PHASES[matchday.phase] ?? MATCHDAY_PHASES.draft;
              return (
                <div className="pri-mobile-card" key={matchday._id}>
                  <div className="pri-mobile-row-top">
                    <span className="pri-cell-name">
                      Fecha {matchday.roundNumber} · {matchday.month}
                    </span>
                    <div className="pri-actions">
                      <EditButton to={`editar/${matchday._id}`} />
                      <DeleteButton
                        onClick={deleteMutation.mutate}
                        id={{ matchdayId: matchday._id }}
                      />
                      <SuperDeleteButton
                        onClick={superDeleteMutation.mutate}
                        id={matchday._id}
                        warning={MATCHDAY_SUPER_DELETE_WARNING}
                      />
                    </div>
                  </div>
                  <div className="pri-mobile-row-bottom">
                    <span className="pri-cell-date">
                      {formatDeadline(matchday.predictionsDeadline)}
                    </span>
                    <span className={`pri-badge ${phase.badge}`}>
                      {phase.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ProdeMatchdaysIndex;
