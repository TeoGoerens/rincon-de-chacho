//Import React & Hooks
import React, { useEffect } from "react";
import { Link } from "react-router-dom";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsStyle.css";
import "./TeamsFormStyle.css";

//Import components
import DeleteButton from "../../../Layout/Buttons/DeleteButton";
import EditButton from "../../../Layout/Buttons/EditButton";
import ViewButton from "../../../Layout/Buttons/ViewButton";

//Import Redux
import { useDispatch, useSelector } from "react-redux";
import {
  deleteTeamAction,
  getAllTeamsAction,
} from "../../../../redux/slices/teams/teamsSlices";

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
    <div className="ctr">
      <div className="ctr-header">
        <div className="ctr-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-title">Equipos</h1>
          <p className="ctr-subtitle">
            {teams ? `${teams.length} equipos registrados` : "Cargando..."}
          </p>
        </div>
        <Link className="ctr-create-btn" to="/admin/chachos/teams/create">
          Crear equipo
        </Link>
      </div>

      {appError || serverError ? (
        <p className="ctr-state">
          {appError} {serverError}
        </p>
      ) : teams?.length <= 0 ? (
        <p className="ctr-state">No se encontraron equipos en la base de datos</p>
      ) : (
        <>
          {/* ── Desktop: tabla ── */}
          <div className="ctr-table-wrap ctr-desktop-only">
            <table className="ctr-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {teams?.map((team) => (
                  <tr key={team._id}>
                    <td>
                      <div className="tmf-cell-team">
                        {team.avatar ? (
                          <img
                            src={team.avatar}
                            className="tmf-avatar"
                            alt={team.name}
                          />
                        ) : (
                          <span className="tmf-avatar tmf-avatar--empty" />
                        )}
                        <span className="ctr-cell-rival">{team.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ctr-actions">
                        <ViewButton
                          to={`/admin/chachos/teams/view/${team._id}`}
                        />
                        <EditButton
                          to={`/admin/chachos/teams/update/${team._id}`}
                        />
                        <DeleteButton onClick={handleDelete} id={team._id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile: cards ── */}
          <div className="ctr-mobile-list">
            {teams?.map((team) => (
              <div className="ctr-mobile-card" key={team._id}>
                <div className="ctr-mobile-row-top">
                  <div className="tmf-cell-team">
                    {team.avatar ? (
                      <img
                        src={team.avatar}
                        className="tmf-avatar"
                        alt={team.name}
                      />
                    ) : (
                      <span className="tmf-avatar tmf-avatar--empty" />
                    )}
                    <span className="ctr-cell-rival">{team.name}</span>
                  </div>
                </div>
                <div className="ctr-mobile-row-bottom">
                  <div className="ctr-actions">
                    <ViewButton to={`/admin/chachos/teams/view/${team._id}`} />
                    <EditButton
                      to={`/admin/chachos/teams/update/${team._id}`}
                    />
                    <DeleteButton onClick={handleDelete} id={team._id} />
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

export default TeamsIndex;
