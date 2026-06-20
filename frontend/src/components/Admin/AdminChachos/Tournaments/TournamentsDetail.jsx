//Import React & Hooks
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";

//Import React Query functions
import fetchTournamentById from "../../../../reactquery/chachos/fetchTournamentById";

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentsDetail = () => {
  const { id } = useParams();

  const { data: tournament, error } = useQuery({
    queryKey: ["tournament", id],
    queryFn: () => fetchTournamentById(id),
  });

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Detalle de torneo</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/tournaments">
          Volver
        </Link>
      </div>

      {error ? (
        <p className="ctr-form-error-banner">{error.message}</p>
      ) : (
        <div className="ctr-form">
          <div className="ctr-form-row">
            <div className="ctr-field">
              <label>Nombre</label>
              <span className="ctr-cell-rival">{tournament?.name}</span>
            </div>

            <div className="ctr-field">
              <label>Año</label>
              <span className="ctr-cell-date">{tournament?.year}</span>
            </div>
          </div>

          <div className="ctr-field">
            <label>Categoría</label>
            <span className="ctr-cell-date">{tournament?.category?.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentsDetail;
