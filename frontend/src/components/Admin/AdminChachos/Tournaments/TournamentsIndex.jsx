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
  deleteTournamentAction,
  getAllTournamentsAction,
} from "../../../../redux/slices/tournaments/tournamentsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentsIndex = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.tournaments);
  const tournaments = storeData.tournaments?.tournaments;
  const { appError, serverError, isDeleted } = storeData;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllTournamentsAction());
  }, [dispatch, isDeleted]);

  const handleDelete = (id) => {
    dispatch(deleteTournamentAction(id));
  };

  return (
    <div className="ctr">
      <div className="ctr-header">
        <div className="ctr-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-title">Torneos</h1>
          <p className="ctr-subtitle">
            {tournaments
              ? `${tournaments.length} torneos registrados`
              : "Cargando..."}
          </p>
        </div>
        <Link className="ctr-create-btn" to="/admin/chachos/tournaments/create">
          Crear torneo
        </Link>
      </div>

      {appError || serverError ? (
        <p className="ctr-state">
          {appError} {serverError}
        </p>
      ) : tournaments?.length <= 0 ? (
        <p className="ctr-state">No se encontraron torneos en la base de datos</p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="ctr-table-wrap ctr-desktop-only">
            <table className="ctr-table">
              <thead>
                <tr>
                  <th>Año</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tournaments?.map((tournament) => (
                  <tr key={tournament._id}>
                    <td>
                      <span className="ctr-cell-date">{tournament.year}</span>
                    </td>
                    <td>
                      <span className="ctr-cell-rival">{tournament.name}</span>
                    </td>
                    <td>
                      <span className="ctr-cell-date">
                        {tournament.category?.name}
                      </span>
                    </td>
                    <td>
                      <div className="ctr-actions">
                        <ViewButton
                          to={`/admin/chachos/tournaments/view/${tournament._id}`}
                        />
                        <EditButton
                          to={`/admin/chachos/tournaments/update/${tournament._id}`}
                        />
                        <DeleteButton
                          onClick={handleDelete}
                          id={tournament._id}
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
            {tournaments?.map((tournament) => (
              <div className="ctr-mobile-card" key={tournament._id}>
                <div className="ctr-mobile-row-top">
                  <span className="ctr-cell-rival">{tournament.name}</span>
                  <span className="ctr-cell-date">{tournament.year}</span>
                </div>
                <div className="ctr-mobile-row-bottom">
                  <span className="ctr-cell-date">
                    {tournament.category?.name}
                  </span>
                  <div className="ctr-actions">
                    <ViewButton
                      to={`/admin/chachos/tournaments/view/${tournament._id}`}
                    />
                    <EditButton
                      to={`/admin/chachos/tournaments/update/${tournament._id}`}
                    />
                    <DeleteButton
                      onClick={handleDelete}
                      id={tournament._id}
                    />
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

export default TournamentsIndex;
