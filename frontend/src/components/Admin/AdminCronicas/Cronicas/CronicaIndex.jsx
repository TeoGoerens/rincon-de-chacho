// Import React dependencies
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Imports CSS & helpers
import "./CronicaIndexStyles.css";
import { formatDate } from "../../../../helpers/dateFormatter";

//Import React Query functions
import fetchAllCronicas from "../../../../reactquery/cronica/fetchAllCronicas";
import deleteCronica from "../../../../reactquery/cronica/deleteCronica";

// Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";

const CronicaIndex = () => {
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
    <div className="cronica-index-container">
      <div className="cronica-index-head">
        <h3>Cronicas</h3>
        <Link to="crear">
          <i class="fa-solid fa-plus"></i>
          <p>Nueva cronica</p>
        </Link>
      </div>
      <div className="cronica-index-content">
        <table>
          <thead>
            <tr>
              <th>Año</th>
              <th>Titulo</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {allCronicas?.map((cronica) => (
              <tr key={cronica._id}>
                <td>{cronica.year}</td>
                <td>{cronica.title}</td>
                <td>{formatDate(cronica.publishedDate)}</td>
                <td>
                  <div className="cronica-index-table-actions">
                    <EditButton to={"editar"} />
                    <DeleteButton
                      customCSSClass="delete-btn-custom"
                      onClick={deleteCronicaMutation.mutate}
                      id={{ cronicaId: cronica._id }}
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

export default CronicaIndex;
