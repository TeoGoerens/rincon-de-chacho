//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { getCategoryAction } from "../../../../redux/slices/football-categories/footballCategoriesSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const FootballCategoriesDetail = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get category information from database every time the component renders
  useEffect(() => {
    dispatch(getCategoryAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.categories);
  const { appError, serverError } = storeData;
  const category = storeData?.footballCategory?.footballCategory;

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

      {appError || serverError ? (
        <p className="ctr-form-error-banner">
          {appError} {serverError}
        </p>
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
