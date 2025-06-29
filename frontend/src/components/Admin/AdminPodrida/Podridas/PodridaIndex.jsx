// Import React dependencies
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Imports CSS & helpers
import "./PodridaIndexStyles.css";
import { formatDate } from "../../../../helpers/dateFormatter";
import { getWinnerFromMatch } from "../../../../helpers/podrida/getWinnerFromMatch";
import { getLoserFromMatch } from "../../../../helpers/podrida/getLoserFromMatch";

//Import React Query functions
import fetchAllPodridaMatches from "../../../../reactquery/podrida/fetchAllPodridaMatches";
import fetchAllCronicas from "../../../../reactquery/cronica/fetchAllCronicas";
import deleteCronica from "../../../../reactquery/cronica/deleteCronica";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

const PodridaIndex = () => {
  // React Query para invalidar o refrescar queries
  const queryClient = useQueryClient();

  // Utilizar React Query para manejar el estado de la petición de Cronicas
  const {
    data: cronicasData,
    isLoading: isLoadingCronicas,
    isError: isErrorCronicas,
    error: errorCronicas,
  } = useQuery({
    queryKey: ["fetchAllCronicas"],
    queryFn: fetchAllCronicas,
  });

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

  console.log(podridasData);

  // Mutación para eliminar una cronica
  const deleteCronicaMutation = useMutation({
    mutationFn: ({ cronicaId }) => deleteCronica({ cronicaId }),
    onSuccess: () => {
      // Una vez borrado, invalida la query para refrescar la lista de comentarios
      queryClient.invalidateQueries(["fetchAllCronicas"]);
    },
    onError: (error) => {
      console.error("Error al eliminar la cronica:", error.message);
    },
  });

  // Manejar estados de carga y error de ambas queries
  if (isLoadingCronicas) return <p>Cargando crónicas...</p>;
  if (isErrorCronicas) return <p>Error en crónicas: {errorCronicas.message}</p>;

  const allCronicas = cronicasData.cronicas;

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
                <td>{new Date(match.date).toLocaleDateString("es-AR")}</td>
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
                      onClick={deleteCronicaMutation.mutate}
                      id={{ cronicaId: match._id }}
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
