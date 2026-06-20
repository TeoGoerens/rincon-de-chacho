//Import React & Hooks
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsStyle.css";

//Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  deleteCategoryAction,
  getAllCategoriesAction,
} from "../../../../redux/slices/football-categories/footballCategoriesSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const FootballCategoriesIndex = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.categories);
  const footballCategories = storeData.footballCategories?.footballCategories;
  const { appError, serverError, isDeleted } = storeData;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllCategoriesAction());
  }, [dispatch, isDeleted]);

  const handleDelete = (id) => {
    dispatch(deleteCategoryAction(id));
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

      {appError || serverError ? (
        <p className="ctr-state">
          {appError} {serverError}
        </p>
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
