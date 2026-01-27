import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import fetchAllProdePlayers from "../../../../reactquery/prode/fetchAllProdePlayers";
import deleteProdePlayer from "../../../../reactquery/prode/deleteProdePlayer";

import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

const ProdePlayersIndex = () => {
  const queryClient = useQueryClient();

  const {
    data: playersData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fetchAllProdePlayers"],
    queryFn: fetchAllProdePlayers,
  });

  const deletePlayerMutation = useMutation({
    mutationFn: ({ playerId }) => deleteProdePlayer({ playerId }),
    onSuccess: () => {
      toast.success("Jugador eliminado correctamente");
      queryClient.invalidateQueries(["fetchAllProdePlayers"]);
    },
    onError: (err) => {
      toast.error(`❌ Error al eliminar el jugador: ${err.message}`);
    },
  });

  return (
    <div className="prode-page">
      <div className="prode-page-header">
        <h2>Jugadores</h2>

        <Link to="crear" className="prode-primary-btn">
          <i className="fa-solid fa-plus"></i>
          Nuevo jugador
        </Link>
      </div>

      {isLoading && <p>Cargando...</p>}
      {isError && <p>❌ Error: {error?.message}</p>}

      {!isLoading && !isError && (
        <div className="prode-table-wrapper">
          <table className="prode-table prode-table--3cols">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {playersData?.map((player) => (
                <tr key={player._id}>
                  <td>{player.name}</td>
                  <td
                    className={`prode-status ${player.active ? `prode-status-active` : `prode-status-finished`}`}
                  >
                    {player.active ? "Yes" : "No"}
                  </td>
                  <td>
                    <div className="prode-table-actions">
                      <EditButton to={`editar/${player._id}`} />
                      <DeleteButton
                        customCSSClass="delete-btn-custom"
                        onClick={deletePlayerMutation.mutate}
                        id={{ playerId: player._id }}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {playersData?.length === 0 && (
                <tr>
                  <td colSpan="3">No hay jugadores cargados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProdePlayersIndex;
