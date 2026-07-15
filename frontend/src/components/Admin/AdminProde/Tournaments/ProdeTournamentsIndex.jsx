// Import React dependencies
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeIndexStyles.css";
import { TOURNAMENT_STATUSES } from "../prodeAdminConstants";

//Import React Query functions
import fetchAllProdeTournaments from "../../../../reactquery/prode/fetchAllProdeTournaments";
import deleteProdeTournament from "../../../../reactquery/prode/deleteProdeTournament";
import activateProdeTournament from "../../../../reactquery/prode/activateProdeTournament";
import finishProdeTournament from "../../../../reactquery/prode/finishProdeTournament";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

const STATUS_LABELS = Object.fromEntries(
  TOURNAMENT_STATUSES.map(({ value, label }) => [value, label]),
);

/* Transición disponible según el estado actual (finalizado es terminal) */
const TRANSITIONS = {
  draft: {
    action: "activate",
    label: "Activar",
    confirmTitle: (name) => `¿Activar el torneo ${name}?`,
    confirmBody:
      "El torneo pasa de borrador a activo y queda como torneo en curso del Prode. Sus fechas se podrán abrir para cargar pronósticos.",
    confirmCta: "Activar torneo",
    successToast: "Torneo activado",
  },
  active: {
    action: "finish",
    label: "Finalizar",
    confirmTitle: (name) => `¿Finalizar el torneo ${name}?`,
    confirmBody:
      "Es el cierre definitivo del torneo: requiere que todas sus fechas estén consolidadas, no admite fechas nuevas y no tiene vuelta atrás.",
    confirmCta: "Finalizar torneo",
    successToast: "Torneo finalizado",
  },
};

const ProdeTournamentsIndex = () => {
  const queryClient = useQueryClient();

  /* Torneo con confirmación de transición pendiente (null = sin modal) */
  const [confirmTransition, setConfirmTransition] = useState(null);

  const {
    data: tournamentsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["prode-tournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ tournamentId }) => deleteProdeTournament({ tournamentId }),
    onSuccess: () => {
      toast.success("Torneo eliminado correctamente");
      queryClient.invalidateQueries(["prode-tournaments"]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar el torneo");
    },
  });

  const transitionMutation = useMutation({
    mutationFn: ({ tournamentId, action }) =>
      action === "activate"
        ? activateProdeTournament({ tournamentId })
        : finishProdeTournament({ tournamentId }),
    onSuccess: (tournamentUpdated, { tournamentId, action }) => {
      const transition = Object.values(TRANSITIONS).find(
        (t) => t.action === action,
      );
      toast.success(transition?.successToast || "Torneo actualizado");
      queryClient.invalidateQueries(["prode-tournaments"]);
      queryClient.invalidateQueries(["prode-tournament", tournamentId]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al cambiar el estado del torneo");
    },
  });

  const handleConfirmTransition = () => {
    const transition = TRANSITIONS[confirmTransition.status];
    transitionMutation.mutate({
      tournamentId: confirmTransition._id,
      action: transition.action,
    });
    setConfirmTransition(null);
  };

  const tournaments = tournamentsData ?? [];

  const renderStatusCell = (tournament) => {
    const transition = TRANSITIONS[tournament.status];
    return (
      <div className="pri-status-cell">
        <span className={`pri-badge pri-badge--${tournament.status}`}>
          {STATUS_LABELS[tournament.status] || tournament.status}
        </span>
        {transition && (
          <button
            type="button"
            className="pri-status-btn"
            onClick={() => setConfirmTransition(tournament)}
            disabled={transitionMutation.isPending}
          >
            {transition.label}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="pri">
      <div className="pri-header">
        <div className="pri-header-text">
          <div className="pri-eyebrow">
            <span className="pri-eyebrow-dot" />
            Prode
          </div>
          <h1 className="pri-title">Torneos</h1>
          <p className="pri-subtitle">
            {tournamentsData
              ? `${tournaments.length} torneos registrados`
              : "Cargando..."}
          </p>
        </div>
        <Link className="pri-create-btn" to="crear">
          <i className="fa-solid fa-plus"></i>
          Nuevo torneo
        </Link>
      </div>

      {isError ? (
        <p className="pri-state">
          {error?.message || "Ocurrió un error al cargar los torneos."}
        </p>
      ) : isLoading ? (
        <p className="pri-state">Cargando torneos...</p>
      ) : tournaments.length <= 0 ? (
        <p className="pri-state">
          No se encontraron torneos en la base de datos
        </p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="pri-table-wrap pri-desktop-only">
            <table className="pri-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Año</th>
                  <th>Fechas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament) => (
                  <tr key={tournament._id}>
                    <td>
                      <span className="pri-cell-name">{tournament.name}</span>
                    </td>
                    <td>
                      <span className="pri-cell-date">{tournament.year}</span>
                    </td>
                    <td>
                      <span className="pri-cell-score">
                        {tournament.matchdayCount ?? 0}
                      </span>
                    </td>
                    <td>{renderStatusCell(tournament)}</td>
                    <td>
                      <div className="pri-actions">
                        <EditButton to={`editar/${tournament._id}`} />
                        <DeleteButton
                          onClick={deleteMutation.mutate}
                          id={{ tournamentId: tournament._id }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards de 2 renglones ── */}
          <div className="pri-mobile-list">
            {tournaments.map((tournament) => (
              <div className="pri-mobile-card" key={tournament._id}>
                <div className="pri-mobile-row-top">
                  <span className="pri-cell-name">{tournament.name}</span>
                  <div className="pri-actions">
                    <EditButton to={`editar/${tournament._id}`} />
                    <DeleteButton
                      onClick={deleteMutation.mutate}
                      id={{ tournamentId: tournament._id }}
                    />
                  </div>
                </div>
                <div className="pri-mobile-row-bottom">
                  <span className="pri-cell-date">
                    {tournament.year} · {tournament.matchdayCount ?? 0} fechas
                  </span>
                  {renderStatusCell(tournament)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {confirmTransition && (
        <div className="delete-confirmation-overlay">
          <div className="delete-confirmation-modal">
            <div className="delete-confirmation-icon delete-confirmation-icon--teal">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" y1="22" x2="4" y2="15" />
              </svg>
            </div>
            <h4>
              {TRANSITIONS[confirmTransition.status].confirmTitle(
                confirmTransition.name,
              )}
            </h4>
            <p>{TRANSITIONS[confirmTransition.status].confirmBody}</p>
            <div className="delete-confirmation-btn-container">
              <button
                className="delete-confirmation-btn-cancel"
                onClick={() => setConfirmTransition(null)}
              >
                Cancelar
              </button>
              <button
                className="delete-confirmation-btn-confirm"
                onClick={handleConfirmTransition}
              >
                {TRANSITIONS[confirmTransition.status].confirmCta}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdeTournamentsIndex;
