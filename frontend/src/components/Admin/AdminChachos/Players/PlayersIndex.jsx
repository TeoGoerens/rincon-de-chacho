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
  deletePlayerAction,
  getAllPlayersAction,
} from "../../../../redux/slices/players/playersSlices";

//Etiquetas en español para posición y rol
import { POSITION_LABEL, ROLE_LABEL } from "../../../../helpers/playerLabels";

//----------------------------------------
//COMPONENT
//----------------------------------------

const PlayersIndex = () => {
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
    <div className="ctr">
      <div className="ctr-header">
        <div className="ctr-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-title">Jugadores</h1>
          <p className="ctr-subtitle">
            {players ? `${players.length} jugadores registrados` : "Cargando..."}
          </p>
        </div>
        <Link className="ctr-create-btn" to="/admin/chachos/players/create">
          Crear jugador
        </Link>
      </div>

      {appError || serverError ? (
        <p className="ctr-state">
          {appError} {serverError}
        </p>
      ) : players?.length <= 0 ? (
        <p className="ctr-state">No se encontraron jugadores en la base de datos</p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="ctr-table-wrap ctr-desktop-only">
            <table className="ctr-table">
              <thead>
                <tr>
                  <th>Camiseta</th>
                  <th>Jugador</th>
                  <th>Posición</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {players?.map((player) => (
                  <tr key={player._id}>
                    <td>
                      <span className="ctr-cell-score">#{player.shirt}</span>
                    </td>
                    <td>
                      <span className="ctr-cell-rival">
                        {player.first_name} {player.last_name}
                      </span>
                    </td>
                    <td>
                      <span className="ctr-cell-date">
                        {POSITION_LABEL[player.field_position] ??
                          player.field_position}
                      </span>
                    </td>
                    <td>
                      <span className="ctr-cell-date">
                        {ROLE_LABEL[player.role] ?? player.role}
                      </span>
                    </td>
                    <td>
                      <div className="ctr-actions">
                        <ViewButton
                          to={`/admin/chachos/players/view/${player._id}`}
                        />
                        <EditButton
                          to={`/admin/chachos/players/update/${player._id}`}
                        />
                        <DeleteButton
                          onClick={handleDelete}
                          id={player._id}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards de 2 renglones ── */}
          <div className="ctr-mobile-list">
            {players?.map((player) => (
              <div className="ctr-mobile-card" key={player._id}>
                <div className="ctr-mobile-row-top">
                  <span className="ctr-cell-rival">
                    #{player.shirt} {player.first_name} {player.last_name}
                  </span>
                </div>
                <div className="ctr-mobile-row-bottom">
                  <span className="ctr-cell-date">
                    {POSITION_LABEL[player.field_position] ??
                      player.field_position}{" "}
                    · {ROLE_LABEL[player.role] ?? player.role}
                  </span>
                  <div className="ctr-actions">
                    <ViewButton
                      to={`/admin/chachos/players/view/${player._id}`}
                    />
                    <EditButton
                      to={`/admin/chachos/players/update/${player._id}`}
                    />
                    <DeleteButton onClick={handleDelete} id={player._id} />
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

export default PlayersIndex;
