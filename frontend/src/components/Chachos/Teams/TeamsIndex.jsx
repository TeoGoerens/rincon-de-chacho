//Import React & Hooks
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./TeamsStyle.css";

//Import components
import DeleteButton from "../../Layout/Buttons/DeleteButton";
import EditButton from "../../Layout/Buttons/EditButton";
import ViewButton from "../../Layout/Buttons/ViewButton";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  deleteTeamAction,
  getAllTeamsAction,
} from "../../../redux/slices/teams/teamsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const TeamsIndex = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.teams);
  const teams = storeData.teams?.rivalTeams;
  const { appError, serverError, isDeleted } = storeData;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllTeamsAction());
  }, [dispatch, isDeleted]);

  const handleDelete = (id) => {
    dispatch(deleteTeamAction(id));
  };

  return (
    <>
      <Link to="/admin/chachos/teams/create">Crear equipo</Link>

      {appError || serverError ? (
        <h3>
          {appError} {serverError}
        </h3>
      ) : teams?.length <= 0 ? (
        <h3>No se encontraron jugadores en la base de datos</h3>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {teams?.map((team) => (
              <tr key={team._id}>
                <td>
                  <p>{team.avatar}</p>
                </td>
                <td>
                  <p>{team.name}</p>
                </td>
                <td className="icon-container">
                  <ViewButton to={`/admin/chachos/teams/view/${team._id}`} />
                  <EditButton to={`/admin/chachos/teams/update/${team._id}`} />
                  <DeleteButton onClick={handleDelete} id={team._id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export default TeamsIndex;
