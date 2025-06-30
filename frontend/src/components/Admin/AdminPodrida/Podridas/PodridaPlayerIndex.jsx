// Import React dependencies
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./PodridaPlayerIndexStyles.css";

//Import React Query functions
import fetchAllPodridaPlayers from "../../../../reactquery/podrida/fetchAllPodridaPlayers";
import deletePodridaPlayer from "../../../../reactquery/podrida/deletePodridaPlayer";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

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
      toast.error(`❌ Error al eliminar el jugador: ${error.message}`);
    },
  });

  return (
    <div className="podrida-index-container">
      <div className="podrida-index-head">
        <h3>Jugadores</h3>
        <Link to="crear">
          <i class="fa-solid fa-plus"></i>
          <p>Nuevo jugador</p>
        </Link>
      </div>
      <div className="podrida-index-content">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {playersData?.map((player) => (
              <tr key={player._id}>
                <td>{player.name}</td>
                <td>{player.email}</td>

                <td>
                  <div className="podrida-index-table-actions">
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PodridaPlayerIndex;
