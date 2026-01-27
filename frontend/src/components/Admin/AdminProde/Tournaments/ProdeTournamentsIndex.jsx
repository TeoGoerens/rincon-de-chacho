import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import fetchAllProdeTournaments from "../../../../reactquery/prode/fetchAllProdeTournaments";
import deleteProdeTournament from "../../../../reactquery/prode/deleteProdeTournament";

import EditButton from "../../../Layout/Buttons/EditButton";
import DeleteButton from "../../../Layout/Buttons/DeleteButton";

const ProdeTournamentsIndex = () => {
  const queryClient = useQueryClient();

  const {
    data: tournaments,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["fetchAllProdeTournaments"],
    queryFn: fetchAllProdeTournaments,
  });

  const deleteMutation = useMutation({
    mutationFn: ({ tournamentId }) => deleteProdeTournament({ tournamentId }),
    onSuccess: () => {
      toast.success("Torneo eliminado correctamente");
      queryClient.invalidateQueries(["fetchAllProdeTournaments"]);
    },
    onError: (err) => {
      toast.error(`❌ Error al eliminar torneo: ${err.message}`);
    },
  });

  return (
    <div className="prode-page">
      <div className="prode-page-header">
        <h2>Torneos</h2>

        <Link to="crear" className="prode-primary-btn">
          <i className="fa-solid fa-plus"></i>
          Nuevo torneo
        </Link>
      </div>

      {isLoading && <p>Cargando torneos...</p>}
      {isError && <p>❌ Error: {error?.message}</p>}

      {!isLoading && !isError && (
        <div className="prode-table-wrapper">
          {/* ahora son 4 columnas */}
          <table className="prode-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Año</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {tournaments?.length === 0 && (
                <tr>
                  <td colSpan="4">No hay torneos creados</td>
                </tr>
              )}

              {tournaments?.map((tournament) => (
                <tr key={tournament._id}>
                  <td>{tournament.name}</td>
                  <td>{tournament.year}</td>

                  <td>
                    <span
                      className={`prode-status prode-status-${tournament.status}`}
                    >
                      {tournament.status}
                    </span>
                  </td>

                  <td>
                    <div className="prode-table-actions">
                      <EditButton to={`editar/${tournament._id}`} />
                      <DeleteButton
                        customCSSClass="delete-btn-custom"
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
      )}
    </div>
  );
};

export default ProdeTournamentsIndex;
