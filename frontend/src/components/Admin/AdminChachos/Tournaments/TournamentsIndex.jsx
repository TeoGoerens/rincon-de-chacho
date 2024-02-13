//Import React & Hooks
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./TournamentsStyle.css";

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
    <>
      <Link to="/admin/chachos/tournaments/create">Crear torneo</Link>

      {appError || serverError ? (
        <h3>
          {appError} {serverError}
        </h3>
      ) : tournaments?.length <= 0 ? (
        <h3>No se encontraron torneos en la base de datos</h3>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Año</th>
              <th>Nombre</th>
              <th>Categoria</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tournaments?.map((tournament) => (
              <tr key={tournament._id}>
                <td>
                  <p>{tournament.year}</p>
                </td>
                <td>
                  <p>{tournament.name}</p>
                </td>
                <td>
                  <p>{tournament.category?.name}</p>
                </td>
                <td className="icon-container">
                  <ViewButton
                    to={`/admin/chachos/tournaments/view/${tournament._id}`}
                  />
                  <EditButton
                    to={`/admin/chachos/tournaments/update/${tournament._id}`}
                  />
                  <DeleteButton onClick={handleDelete} id={tournament._id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export default TournamentsIndex;
