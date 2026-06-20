//Import React & Hooks
import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";

//Import React Query functions
import fetchFootballCategoryById from "../../../../reactquery/chachos/fetchFootballCategoryById";

//----------------------------------------
//COMPONENT
//----------------------------------------

const FootballCategoriesDetail = () => {
  const { id } = useParams();

  const { data: category, error } = useQuery({
    queryKey: ["football-category", id],
    queryFn: () => fetchFootballCategoryById(id),
  });

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Detalle de categoría</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/football-categories">
          Volver
        </Link>
      </div>

      {error ? (
        <p className="ctr-form-error-banner">{error.message}</p>
      ) : (
        <div className="ctr-form">
          <div className="ctr-field">
            <label>Nombre</label>
            <span className="ctr-cell-rival">{category?.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FootballCategoriesDetail;
