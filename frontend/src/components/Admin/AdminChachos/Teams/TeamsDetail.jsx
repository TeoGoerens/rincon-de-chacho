//Import React & Hooks
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";
import "./TeamsFormStyle.css";

//Import React Query functions
import fetchTeamById from "../../../../reactquery/chachos/fetchTeamById";

//----------------------------------------
//COMPONENT
//----------------------------------------

const TeamsDetail = () => {
  const { id } = useParams();

  const { data: team, error } = useQuery({
    queryKey: ["team", id],
    queryFn: () => fetchTeamById(id),
  });

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

      {error ? (
        <p className="ctr-form-error-banner">{error.message}</p>
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
