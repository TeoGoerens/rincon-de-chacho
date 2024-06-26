//Import React & Hooks
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "./ChachosSquadStyles.css";

//Import helpers

//Import components
import ChachosMenu from "../ChachosMenu";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import { getAllPlayersAction } from "../../../redux/slices/players/playersSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const ChachosSquad = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Select state from players store
  const playerStoreData = useSelector((store) => store.players);

  const { appError, serverError, players } = playerStoreData;
  const chachosSquad = players?.players;

  //Filter players that have bio or interview values and sort based on updatedAt timestamps
  const teamSquad = chachosSquad?.filter((player) => player?.role === "team");

  const extraSquad = chachosSquad?.filter((player) => player?.role === "extra");

  const supporterSquad = chachosSquad?.filter(
    (player) => player?.role === "supporter"
  );

  //Dispatch action from store with useEffect()
  useEffect(() => {
    dispatch(getAllPlayersAction());
  }, [dispatch]);
  return (
    <>
      <ChachosMenu />
      <div className="container chachos-squad-container">
        <h2>Plantel Chachos</h2>
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}

        <div className="chachos-squad-main-table">
          <table>
            <thead>
              <tr>
                <th>Camiseta</th>
                <th>Jugador</th>
                <th>Perfil</th>
              </tr>
            </thead>
            <tbody>
              {teamSquad?.map((player) => (
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
                    {player.bio ? (
                      <Link className="view-profile" to={`${player._id}`}>
                        Ver
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Refuerzos clave</h2>
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}

        <div className="chachos-squad-main-table">
          <table>
            <thead>
              <tr>
                <th>Camiseta</th>
                <th>Jugador</th>
                <th>Perfil</th>
              </tr>
            </thead>
            <tbody>
              {extraSquad?.map((player) => (
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
                    {player.bio ? (
                      <Link className="view-profile" to={`${player._id}`}>
                        Ver
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Hinchada</h2>
        {appError || serverError ? (
          <h5>
            {appError} {serverError}
          </h5>
        ) : null}

        <div className="chachos-squad-main-table">
          <table>
            <thead>
              <tr>
                <th>Camiseta</th>
                <th>Nombre</th>
                <th>Perfil</th>
              </tr>
            </thead>
            <tbody>
              {supporterSquad?.map((player) => (
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
                    {player.bio ? (
                      <Link className="view-profile" to={`${player._id}`}>
                        Ver
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ChachosSquad;
