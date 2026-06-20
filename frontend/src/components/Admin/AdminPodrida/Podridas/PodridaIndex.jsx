// Import React dependencies
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./PodridaIndexStyles.css";
import { formatDate } from "../../../../helpers/dateFormatter";
import { getWinnerFromMatch } from "../../../../helpers/podrida/getWinnerFromMatch";
import { getLoserFromMatch } from "../../../../helpers/podrida/getLoserFromMatch";

//Import React Query functions
import fetchAllPodridaMatches from "../../../../reactquery/podrida/fetchAllPodridaMatches";
import deletePodridaMatch from "../../../../reactquery/podrida/deletePodridaMatch";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";

const PodridaIndex = () => {
  // React Query para invalidar o refrescar queries
  const queryClient = useQueryClient();

  // Utilizar React Query para manejar el estado de la petición de Podridas
  const {
    data: podridasData,
    isLoading: isLoadingPodridas,
    isError: isErrorPodridas,
    error: errorPodridas,
  } = useQuery({
    queryKey: ["fetchAllPodridaMatches"],
    queryFn: fetchAllPodridaMatches,
  });

  // Utilizar React Query para manejar el mutation que eliminará la partida
  const deletePodridaMutation = useMutation({
    mutationFn: ({ matchId }) => deletePodridaMatch({ matchId }),
    onSuccess: () => {
      toast.success("Partida eliminada correctamente");
      queryClient.invalidateQueries(["fetchAllPodridaMatches"]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar la partida");
    },
  });

  const matches = podridasData?.matches ?? [];

  return (
    <div className="pdi">
      <div className="pdi-header">
        <div className="pdi-header-text">
          <div className="pdi-eyebrow">
            <span className="pdi-eyebrow-dot" />
            Podrida
          </div>
          <h1 className="pdi-title">Partidas</h1>
          <p className="pdi-subtitle">
            {podridasData ? `${matches.length} partidas registradas` : "Cargando..."}
          </p>
        </div>
        <Link className="pdi-create-btn" to="crear">
          <i className="fa-solid fa-plus"></i>
          Nueva partida
        </Link>
      </div>

      {isErrorPodridas ? (
        <p className="pdi-state">
          {errorPodridas?.message || "Ocurrió un error al cargar las partidas."}
        </p>
      ) : isLoadingPodridas ? (
        <p className="pdi-state">Cargando partidas...</p>
      ) : matches.length <= 0 ? (
        <p className="pdi-state">No se encontraron partidas en la base de datos</p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="pdi-table-wrap pdi-desktop-only">
            <table className="pdi-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ganador</th>
                  <th>Último</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match._id}>
                    <td>
                      <span className="pdi-cell-date">{formatDate(match.date)}</span>
                    </td>
                    <td>
                      <span className="pdi-cell-name">
                        {getWinnerFromMatch(match).name}{" "}
                        <span className="pdi-cell-score">
                          ({getWinnerFromMatch(match).score})
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="pdi-cell-name">
                        {getLoserFromMatch(match).name}{" "}
                        <span className="pdi-cell-score">
                          ({getLoserFromMatch(match).score})
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="pdi-actions">
                        <ViewButton to={`ver/${match._id}`} />
                        <EditButton to={`editar/${match._id}`} />
                        <DeleteButton
                          onClick={deletePodridaMutation.mutate}
                          id={{ matchId: match._id }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards de 2 renglones ── */}
          <div className="pdi-mobile-list">
            {matches.map((match) => (
              <div className="pdi-mobile-card" key={match._id}>
                <div className="pdi-mobile-row-top">
                  <span className="pdi-cell-name">
                    {getWinnerFromMatch(match).name}{" "}
                    <span className="pdi-cell-score">
                      ({getWinnerFromMatch(match).score})
                    </span>
                  </span>
                  <div className="pdi-actions">
                    <ViewButton to={`ver/${match._id}`} />
                    <EditButton to={`editar/${match._id}`} />
                    <DeleteButton
                      onClick={deletePodridaMutation.mutate}
                      id={{ matchId: match._id }}
                    />
                  </div>
                </div>
                <div className="pdi-mobile-row-bottom">
                  <span className="pdi-cell-date">{formatDate(match.date)}</span>
                  <span className="pdi-cell-name">
                    Último: {getLoserFromMatch(match).name}{" "}
                    <span className="pdi-cell-score">
                      ({getLoserFromMatch(match).score})
                    </span>
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

export default PodridaIndex;
