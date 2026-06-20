//Import React & Hooks
import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsStyle.css";

//Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";

//Import React Query functions
import fetchAllFootballCategories from "../../../../reactquery/chachos/fetchAllFootballCategories";
import deleteFootballCategory from "../../../../reactquery/chachos/deleteFootballCategory";

//----------------------------------------
//COMPONENT
//----------------------------------------

const FootballCategoriesIndex = () => {
  const queryClient = useQueryClient();

  const { data: footballCategories, error } = useQuery({
    queryKey: ["football-categories"],
    queryFn: fetchAllFootballCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFootballCategory,
    onSuccess: () => {
      queryClient.invalidateQueries(["football-categories"]);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Error al eliminar la categoría");
    },
  });

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="ctr">
      <div className="ctr-header">
        <div className="ctr-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-title">Categorías</h1>
          <p className="ctr-subtitle">
            {footballCategories
              ? `${footballCategories.length} categorías registradas`
              : "Cargando..."}
          </p>
        </div>
        <Link
          className="ctr-create-btn"
          to="/admin/chachos/football-categories/create"
        >
          Crear categoría
        </Link>
      </div>

      {error ? (
        <p className="ctr-state">{error.message}</p>
      ) : footballCategories?.length <= 0 ? (
        <p className="ctr-state">
          No se encontraron categorías en la base de datos
        </p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="ctr-table-wrap ctr-desktop-only">
            <table className="ctr-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {footballCategories?.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <span className="ctr-cell-rival">{category.name}</span>
                    </td>
                    <td>
                      <div className="ctr-actions">
                        <ViewButton
                          to={`/admin/chachos/football-categories/view/${category._id}`}
                        />
                        <EditButton
                          to={`/admin/chachos/football-categories/update/${category._id}`}
                        />
                        <DeleteButton
                          onClick={handleDelete}
                          id={category._id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards ── */}
          <div className="ctr-mobile-list">
            {footballCategories?.map((category) => (
              <div className="ctr-mobile-card" key={category._id}>
                <div className="ctr-mobile-row-top">
                  <span className="ctr-cell-rival">{category.name}</span>
                </div>
                <div className="ctr-mobile-row-bottom">
                  <div className="ctr-actions">
                    <ViewButton
                      to={`/admin/chachos/football-categories/view/${category._id}`}
                    />
                    <EditButton
                      to={`/admin/chachos/football-categories/update/${category._id}`}
                    />
                    <DeleteButton onClick={handleDelete} id={category._id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FootballCategoriesIndex;
