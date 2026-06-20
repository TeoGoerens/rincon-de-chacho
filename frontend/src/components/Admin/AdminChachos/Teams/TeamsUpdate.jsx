//Import React & Hooks
import React, { useEffect } from "react";
import { Navigate, useParams, Link } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";
import "./TeamsFormStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import {
  getTeamAction,
  updateTeamAction,
} from "../../../../redux/slices/teams/teamsSlices";

//Form schema
const formSchema = Yup.object({
  avatar: Yup.string(),
  name: Yup.string().required("Ingresá el nombre del equipo"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TeamsUpdate = () => {
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
  const avatar = storeData?.team?.rivalTeam?.avatar;
  const name = storeData?.team?.rivalTeam?.name;

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      avatar,
      name,
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(
        updateTeamAction({
          avatar: values.avatar,
          name: values.name,
          id,
        })
      );
    },
    validationSchema: formSchema,
  });

  //Navigate to index in case there is an updated team
  if (storeData?.isEdited) return <Navigate to="/admin/chachos/teams" />;

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Editar equipo</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/teams">
          Volver
        </Link>
      </div>

      {appError || serverError ? (
        <p className="ctr-form-error-banner">{appError}</p>
      ) : null}

      <form className="ctr-form" onSubmit={formik.handleSubmit}>
        <div className="tmf-avatar-preview-row">
          {formik.values.avatar ? (
            <img
              src={formik.values.avatar}
              className="tmf-avatar-preview"
              alt="Preview"
            />
          ) : (
            <span className="tmf-avatar-preview tmf-avatar-preview--empty">
              Sin logo
            </span>
          )}

          <div className="ctr-field tmf-avatar-field">
            <label>Avatar (URL)</label>
            <input
              value={formik.values.avatar ?? ""}
              onChange={formik.handleChange("avatar")}
              onBlur={formik.handleBlur("avatar")}
              type="text"
              name="avatar"
            />
            <div className="error-message">
              {formik.touched.avatar && formik.errors.avatar}
            </div>
          </div>
        </div>

        <div className="ctr-field">
          <label>Nombre</label>
          <input
            value={formik.values.name ?? ""}
            onChange={formik.handleChange("name")}
            onBlur={formik.handleBlur("name")}
            type="text"
            name="name"
          />
          <div className="error-message">
            {formik.touched.name && formik.errors.name}
          </div>
        </div>

        <button className="ctr-submit-btn" type="submit">
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default TeamsUpdate;
