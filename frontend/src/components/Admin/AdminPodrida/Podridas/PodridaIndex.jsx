// Import React dependencies
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

// Imports CSS & helpers
import "./PodridaIndexStyles.css";
import { getWinnerFromMatch } from "../../../../helpers/podrida/getWinnerFromMatch";
import { getLoserFromMatch } from "../../../../helpers/podrida/getLoserFromMatch";

//Import React Query functions
import fetchAllPodridaMatches from "../../../../reactquery/podrida/fetchAllPodridaMatches";
import deletePodridaMatch from "../../../../reactquery/podrida/deletePodridaMatch";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

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
      toast.error(`❌ Error al eliminar la partida: ${error.message}`);
    },
  });

  return (
    <div className="podrida-index-container">
      <div className="podrida-index-head">
        <h3>Partidas</h3>
        <Link to="crear">
          <i class="fa-solid fa-plus"></i>
          <p>Nueva podrida</p>
        </Link>
      </div>
      <div className="podrida-index-content">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ganador</th>
              <th>Último</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {podridasData?.matches?.map((match) => (
              <tr key={match._id}>
                <td>
                  {match.date.slice(0, 10).split("-").reverse().join("/")}
                </td>
                <td>
                  {getWinnerFromMatch(match).name}{" "}
                  <strong>({getWinnerFromMatch(match).score})</strong>
                </td>
                <td>
                  {getLoserFromMatch(match).name}{" "}
                  <strong>({getLoserFromMatch(match).score})</strong>
                </td>
                <td>
                  <div className="podrida-index-table-actions">
                    <EditButton to={`editar/${match._id}`} />
                    <DeleteButton
                      customCSSClass="delete-btn-custom"
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
    </div>
  );
};

export default PodridaIndex;
