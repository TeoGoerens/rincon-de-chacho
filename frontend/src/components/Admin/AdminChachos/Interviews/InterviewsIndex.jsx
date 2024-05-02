//Import React & Hooks
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

//Import CSS & styles

//Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  deletePlayerAction,
  getAllPlayersAction,
} from "../../../../redux/slices/players/playersSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const InterviewsIndex = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from store
  const storeData = useSelector((store) => store.players);
  const players = storeData.players?.players;
  const { appError, serverError, isDeleted } = storeData;

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllPlayersAction());
  }, [dispatch, isDeleted]);

  const handleDelete = (id) => {
    dispatch(deletePlayerAction(id));
  };

  return (
    <>
      <Link to="/admin/chachos/players/create">Crear jugador</Link>

      {appError || serverError ? (
        <h3>
          {appError} {serverError}
        </h3>
      ) : players?.length <= 0 ? (
        <h3>No se encontraron jugadores en la base de datos</h3>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Camiseta</th>
              <th>Jugador</th>
              <th>Posicion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {players?.map((player) => (
              <tr key={player._id}>
                <td>
                  <p>{player.shirt}</p>
                </td>
                <td>
                  <p>
                    {player.first_name} {player.last_name}
                  </p>
                </td>
                <td>
                  <p>{player.field_position}</p>
                </td>
                <td className="icon-container">
                  <ViewButton
                    to={`/admin/chachos/players/view/${player._id}`}
                  />
                  <EditButton
                    to={`/admin/chachos/players/update/${player._id}`}
                  />
                  <DeleteButton onClick={handleDelete} id={player._id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};

export default InterviewsIndex;
