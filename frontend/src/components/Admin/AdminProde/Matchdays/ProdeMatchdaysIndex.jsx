import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import fetchAllProdeTournaments from "../../../../reactquery/prode/fetchAllProdeTournaments";
import fetchProdeMatchdaysByTournament from "../../../../reactquery/prode/fetchProdeMatchdaysByTournament";
import deleteProdeMatchday from "../../../../reactquery/prode/deleteProdeMatchday";

import EditButton from "../../../Layout/Buttons/EditButton";
import DeleteButton from "../../../Layout/Buttons/DeleteButton";

const ProdeMatchdaysIndex = () => {
  const queryClient = useQueryClient();
  const [selectedTournamentId, setSelectedTournamentId] = useState("");

  const {
    data: tournaments,
    isLoading: isLoadingTournaments,
    isError: isErrorTournaments,
    error: errorTournaments,
  } = useQuery({
    queryKey: ["fetchAllProdeTournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const defaultTournamentId = useMemo(() => {
    if (!tournaments || tournaments.length === 0) return "";
    return tournaments[0]._id;
  }, [tournaments]);

  const tournamentIdToUse = selectedTournamentId || defaultTournamentId;

  const {
    data: matchdays,
    isLoading: isLoadingMatchdays,
    isError: isErrorMatchdays,
    error: errorMatchdays,
  } = useQuery({
    queryKey: ["fetchProdeMatchdaysByTournament", tournamentIdToUse],
    queryFn: () => fetchProdeMatchdaysByTournament(tournamentIdToUse),
    enabled: Boolean(tournamentIdToUse),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ matchdayId }) => deleteProdeMatchday({ matchdayId }),
    onSuccess: () => {
      toast.success("Fecha eliminada correctamente");
      queryClient.invalidateQueries([
        "fetchProdeMatchdaysByTournament",
        tournamentIdToUse,
      ]);
    },
    onError: (err) => {
      toast.error(`❌ Error al eliminar fecha: ${err.message}`);
    },
  });

  return (
    <div className="prode-page">
      <div className="prode-page-header">
        <h2>Fechas</h2>

        <Link to="crear" className="prode-primary-btn">
          <i className="fa-solid fa-plus"></i>
          Nueva fecha
        </Link>
      </div>

      {/* Selector Torneo */}
      <div className="prode-form" style={{ marginBottom: "1rem" }}>
        <label>Torneo</label>

        {isLoadingTournaments && <p>Cargando torneos...</p>}
        {isErrorTournaments && <p>❌ Error: {errorTournaments?.message}</p>}

        {!isLoadingTournaments && !isErrorTournaments && (
          <select
            value={tournamentIdToUse}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
          >
            {tournaments?.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name} ({t.year})
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoadingMatchdays && <p>Cargando fechas...</p>}
      {isErrorMatchdays && <p>❌ Error: {errorMatchdays?.message}</p>}

      {!isLoadingMatchdays && !isErrorMatchdays && (
        <div className="prode-table-wrapper">
          <table className="prode-table">
            <thead>
              <tr>
                <th>Ronda</th>
                <th>Mes</th>
                <th>Estado</th>
                <th>Actualizado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {matchdays?.length === 0 && (
                <tr>
                  <td colSpan="5">No hay fechas creadas para este torneo.</td>
                </tr>
              )}

              {matchdays?.map((md) => (
                <tr key={md._id}>
                  <td>{md.roundNumber}</td>
                  <td>{md.month || "-"}</td>
                  <td>
                    <span className={`prode-status prode-status-${md.status}`}>
                      {md.status}
                    </span>
                  </td>
                  <td>
                    {md.updatedAt
                      ? new Date(md.updatedAt).toLocaleDateString("es-AR")
                      : "-"}
                  </td>
                  <td>
                    <div className="prode-table-actions">
                      <EditButton to={`editar/${md._id}`} />
                      <Link to={`${md._id}`}>
                        <i
                          class="fa-solid fa-pen-to-square"
                          style={{ color: "#3498db", marginInline: "0.2rem" }}
                        ></i>
                        <span className="tooltip-text">Full Edit</span>
                      </Link>
                      <DeleteButton
                        customCSSClass="delete-btn-custom"
                        onClick={deleteMutation.mutate}
                        id={{ matchdayId: md._id }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="prode-help" style={{ marginTop: "0.75rem" }}>
            Tip: El botón amarillo edita información básica de la fecha. El
            botón celeste edita los duelos y desafíos de una fecha.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProdeMatchdaysIndex;
