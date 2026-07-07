// Import React dependencies
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeIndexStyles.css";

//Import React Query functions
import fetchAllProdeTournaments from "../../../../reactquery/prode/fetchAllProdeTournaments";
import deleteProdeTournament from "../../../../reactquery/prode/deleteProdeTournament";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

const STATUS_LABELS = {
  draft: "Borrador",
  active: "Activo",
  finished: "Finalizado",
};

const formatMonths = (months = []) => {
  if (months.length === 0) return "—";
  if (months.length === 1) return months[0];
  return `${months[0]} – ${months[months.length - 1]}`;
};

const ProdeTournamentsIndex = () => {
  const queryClient = useQueryClient();

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

  const tournaments = tournamentsData ?? [];

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
                  <th>Meses</th>
                  <th>Participantes</th>
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
                      <span className="pri-cell-date">
                        {formatMonths(tournament.months)}
                      </span>
                    </td>
                    <td>
                      <span className="pri-cell-score">
                        {tournament.participants?.length || 0}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`pri-badge pri-badge--${tournament.status}`}
                      >
                        {STATUS_LABELS[tournament.status] || tournament.status}
                      </span>
                    </td>
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
                    {tournament.year} · {formatMonths(tournament.months)} ·{" "}
                    {tournament.participants?.length || 0} participantes
                  </span>
                  <span
                    className={`pri-badge pri-badge--${tournament.status}`}
                  >
                    {STATUS_LABELS[tournament.status] || tournament.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProdeTournamentsIndex;
