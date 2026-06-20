//Import React & Hooks
import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { getTournamentAction } from "../../../../redux/slices/tournaments/tournamentsSlices";

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentsDetail = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get tournament information from database every time the component renders
  useEffect(() => {
    dispatch(getTournamentAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.tournaments);
  const { appError, serverError } = storeData;
  const tournament = storeData?.tournament?.tournament;

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

      {appError || serverError ? (
        <p className="ctr-form-error-banner">
          {appError} {serverError}
        </p>
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
