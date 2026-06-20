//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";
import "./TeamsFormStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { getTeamAction } from "../../../../redux/slices/teams/teamsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const TeamsDetail = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get team information from database every time the component renders
  useEffect(() => {
    dispatch(getTeamAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.teams);
  const { appError, serverError } = storeData;
  const team = storeData?.team?.rivalTeam;

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Detalle de equipo</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/teams">
          Volver
        </Link>
      </div>

      {appError || serverError ? (
        <p className="ctr-form-error-banner">
          {appError} {serverError}
        </p>
      ) : (
        <div className="tmfd-card">
          {team?.avatar ? (
            <img src={team.avatar} className="tmfd-avatar" alt={team.name} />
          ) : (
            <span className="tmf-avatar-preview tmf-avatar-preview--empty tmfd-avatar">
              Sin logo
            </span>
          )}
          <h2 className="tmfd-name">{team?.name}</h2>
        </div>
      )}
    </div>
  );
};

export default TeamsDetail;
