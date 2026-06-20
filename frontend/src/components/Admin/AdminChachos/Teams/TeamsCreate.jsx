//Import React & Hooks
import React from "react";
import { Navigate, Link } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import CSS & styles
import "../TournamentRounds/TournamentRoundsFormStyle.css";
import "./TeamsFormStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { createTeamAction } from "../../../../redux/slices/teams/teamsSlices";

//Form schema
const formSchema = Yup.object({
  avatar: Yup.string(),
  name: Yup.string().required("Ingresá el nombre del equipo"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TeamsCreate = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Formik configuration
  const formik = useFormik({
    initialValues: {},
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(createTeamAction(values));
    },
    validationSchema: formSchema,
  });

  //Select state from store
  const storeData = useSelector((store) => store.teams);
  const { appError, serverError } = storeData;

  //Navigate to index in case there is a created team
  if (storeData?.isCreated) return <Navigate to="/admin/chachos/teams" />;

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Crear equipo</h1>
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
          Crear equipo
        </button>
      </form>
    </div>
  );
};

export default TeamsCreate;
