// Import React dependencies
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "../ProdeIndexStyles.css";

//Import React Query functions
import fetchAllProdePlayers from "../../../../reactquery/prode/fetchAllProdePlayers";
import deleteProdePlayer from "../../../../reactquery/prode/deleteProdePlayer";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

const ProdePlayersIndex = () => {
  const queryClient = useQueryClient();

  const {
    data: playersData,
    isLoading: isLoadingPlayers,
    isError: isErrorPlayers,
    error: errorPlayers,
  } = useQuery({
    queryKey: ["prode-players"],
    queryFn: fetchAllProdePlayers,
  });

  const deletePlayerMutation = useMutation({
    mutationFn: ({ playerId }) => deleteProdePlayer({ playerId }),
    onSuccess: () => {
      toast.success("Jugador eliminado correctamente");
      queryClient.invalidateQueries(["prode-players"]);
    },
    onError: (error) => {
      toast.error(error?.message || "Error al eliminar el jugador");
    },
  });

  const players = playersData ?? [];

  return (
    <div className="pri">
      <div className="pri-header">
        <div className="pri-header-text">
          <div className="pri-eyebrow">
            <span className="pri-eyebrow-dot" />
            Prode
          </div>
          <h1 className="pri-title">Jugadores</h1>
          <p className="pri-subtitle">
            {playersData
              ? `${players.length} jugadores registrados`
              : "Cargando..."}
          </p>
        </div>
        <Link className="pri-create-btn" to="crear">
          <i className="fa-solid fa-plus"></i>
          Nuevo jugador
        </Link>
      </div>

      {isErrorPlayers ? (
        <p className="pri-state">
          {errorPlayers?.message || "Ocurrió un error al cargar los jugadores."}
        </p>
      ) : isLoadingPlayers ? (
        <p className="pri-state">Cargando jugadores...</p>
      ) : players.length <= 0 ? (
        <p className="pri-state">
          No se encontraron jugadores en la base de datos
        </p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="pri-table-wrap pri-desktop-only">
            <table className="pri-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player._id}>
                    <td>
                      <span className="pri-cell-name">{player.name}</span>
                    </td>
                    <td>
                      <span
                        className={`pri-badge ${
                          player.active
                            ? "pri-badge--active"
                            : "pri-badge--inactive"
                        }`}
                      >
                        {player.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <div className="pri-actions">
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
          <div className="pri-mobile-list">
            {players.map((player) => (
              <div className="pri-mobile-card" key={player._id}>
                <div className="pri-mobile-row-top">
                  <span className="pri-cell-name">{player.name}</span>
                  <div className="pri-actions">
                    <EditButton to={`editar/${player._id}`} />
                    <DeleteButton
                      onClick={deletePlayerMutation.mutate}
                      id={{ playerId: player._id }}
                    />
                  </div>
                </div>
                <div className="pri-mobile-row-bottom">
                  <span
                    className={`pri-badge ${
                      player.active ? "pri-badge--active" : "pri-badge--inactive"
                    }`}
                  >
                    {player.active ? "Activo" : "Inactivo"}
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

export default ProdePlayersIndex;
