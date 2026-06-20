// Import React dependencies
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./PodridaIndexStyles.css";

//Import React Query functions
import fetchAllPodridaPlayers from "../../../../reactquery/podrida/fetchAllPodridaPlayers";
import deletePodridaPlayer from "../../../../reactquery/podrida/deletePodridaPlayer";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";

const PodridaPlayerIndex = () => {
  // React Query para invalidar o refrescar queries
  const queryClient = useQueryClient();

  // Utilizar React Query para manejar el estado de la petición de Jugadores
  const {
    data: playersData,
    isLoading: isLoadingPlayers,
    isError: isErrorPlayers,
    error: errorPlayers,
  } = useQuery({
    queryKey: ["fetchAllPodridaPlayers"],
    queryFn: fetchAllPodridaPlayers,
  });

  // Utilizar React Query para manejar el mutation que eliminará el jugador
  const deletePlayerMutation = useMutation({
    mutationFn: ({ playerId }) => deletePodridaPlayer({ playerId }),
    onSuccess: () => {
      toast.success("Jugador eliminado correctamente");
      queryClient.invalidateQueries(["fetchAllPodridaPlayers"]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar el jugador");
    },
  });

  const players = playersData ?? [];

  return (
    <div className="pdi">
      <div className="pdi-header">
        <div className="pdi-header-text">
          <div className="pdi-eyebrow">
            <span className="pdi-eyebrow-dot" />
            Podrida
          </div>
          <h1 className="pdi-title">Jugadores</h1>
          <p className="pdi-subtitle">
            {playersData ? `${players.length} jugadores registrados` : "Cargando..."}
          </p>
        </div>
        <Link className="pdi-create-btn" to="crear">
          <i className="fa-solid fa-plus"></i>
          Nuevo jugador
        </Link>
      </div>

      {isErrorPlayers ? (
        <p className="pdi-state">
          {errorPlayers?.message || "Ocurrió un error al cargar los jugadores."}
        </p>
      ) : isLoadingPlayers ? (
        <p className="pdi-state">Cargando jugadores...</p>
      ) : players.length <= 0 ? (
        <p className="pdi-state">No se encontraron jugadores en la base de datos</p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="pdi-table-wrap pdi-desktop-only">
            <table className="pdi-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player._id}>
                    <td>
                      <span className="pdi-cell-name">{player.name}</span>
                    </td>
                    <td>
                      <span className="pdi-cell-email">{player.email}</span>
                    </td>
                    <td>
                      <div className="pdi-actions">
                        <ViewButton to={`ver/${player._id}`} />
                        <EditButton to={`editar/${player._id}`} />
                        <DeleteButton
                          onClick={deletePlayerMutation.mutate}
                          id={{ playerId: player._id }}
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
            {players.map((player) => (
              <div className="pdi-mobile-card" key={player._id}>
                <div className="pdi-mobile-row-top">
                  <span className="pdi-cell-name">{player.name}</span>
                  <div className="pdi-actions">
                    <ViewButton to={`ver/${player._id}`} />
                    <EditButton to={`editar/${player._id}`} />
                    <DeleteButton
                      onClick={deletePlayerMutation.mutate}
                      id={{ playerId: player._id }}
                    />
                  </div>
                </div>
                <div className="pdi-mobile-row-bottom">
                  <span className="pdi-cell-email">{player.email}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PodridaPlayerIndex;
