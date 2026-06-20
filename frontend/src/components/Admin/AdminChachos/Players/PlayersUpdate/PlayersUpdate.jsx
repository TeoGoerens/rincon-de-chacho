//Import React & Hooks
import React, { useState, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Navigate, useParams, Link } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import helpers
import { toolbarReactQuill } from "../../../../../helpers/reactQuillModules";

//Import CSS & styles
import "../../TournamentRounds/TournamentRoundsFormStyle.css";
import "../PlayersFormStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import {
  getPlayerAction,
  updatePlayerAction,
} from "../../../../../redux/slices/players/playersSlices";

//Form schema
const formSchema = Yup.object({
  shirt: Yup.number().required("Ingresá el número de camiseta del jugador"),
  first_name: Yup.string().required("Ingresá el nombre del jugador"),
  last_name: Yup.string().required("Ingresá el apellido del jugador"),
  field_position: Yup.string().required("Seleccioná la posición del jugador"),
  role: Yup.string().required("Seleccioná el rol del jugador"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const PlayersUpdate = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get player information from database every time the component renders
  useEffect(() => {
    dispatch(getPlayerAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.players);
  const { appError, serverError } = storeData;
  const shirt = storeData?.player?.player?.shirt;
  const first_name = storeData?.player?.player?.first_name;
  const last_name = storeData?.player?.player?.last_name;
  const field_position = storeData?.player?.player?.field_position;
  const role = storeData?.player?.player?.role;
  const bio = storeData?.player?.player?.bio;
  const interviewFromDB = storeData?.player?.player?.interview;

  //Define the features of React Quill
  const [interview, setInterview] = useState("");
  useEffect(() => {
    setInterview(interviewFromDB ?? "");
  }, [interviewFromDB]);

  const handleChangeInterview = (value) => {
    setInterview(value);
  };

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      shirt,
      first_name,
      last_name,
      field_position,
      role,
      bio,
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(
        updatePlayerAction({
          shirt: values.shirt,
          first_name: values.first_name,
          last_name: values.last_name,
          field_position: values.field_position,
          role: values.role,
          bio: values.bio,
          interview,
          id,
        })
      );
    },
    validationSchema: formSchema,
  });

  //Navigate to index in case there is an updated player
  if (storeData?.isEdited) return <Navigate to="/admin/chachos/players" />;

  return (
    <div className="ctr-form-page">
      <div className="ctr-form-header">
        <div className="ctr-form-header-text">
          <div className="ctr-eyebrow">
            <span className="ctr-eyebrow-dot" />
            Chachos
          </div>
          <h1 className="ctr-form-title">Editar jugador</h1>
        </div>
        <Link className="ctr-back-link" to="/admin/chachos/players">
          Volver
        </Link>
      </div>

      {appError || serverError ? (
        <p className="ctr-form-error-banner">{appError}</p>
      ) : null}

      <form className="ctr-form" onSubmit={formik.handleSubmit}>
        <div className="ctr-form-row">
          <div className="ctr-field">
            <label>Camiseta</label>
            <input
              value={formik.values.shirt ?? ""}
              onChange={formik.handleChange("shirt")}
              onBlur={formik.handleBlur("shirt")}
              type="number"
              min="0"
              name="shirt"
            />
            <div className="error-message">{formik.errors.shirt}</div>
          </div>

          <div className="ctr-field">
            <label>Nombre</label>
            <input
              value={formik.values.first_name ?? ""}
              onChange={formik.handleChange("first_name")}
              onBlur={formik.handleBlur("first_name")}
              type="text"
              name="first_name"
            />
            <div className="error-message">{formik.errors.first_name}</div>
          </div>

          <div className="ctr-field">
            <label>Apellido</label>
            <input
              value={formik.values.last_name ?? ""}
              onChange={formik.handleChange("last_name")}
              onBlur={formik.handleBlur("last_name")}
              type="text"
              name="last_name"
            />
            <div className="error-message">{formik.errors.last_name}</div>
          </div>
        </div>

        <div className="ctr-form-row">
          <div className="ctr-field">
            <label>Posición</label>
            <select
              name="field_position"
              value={formik.values.field_position ?? ""}
              onChange={formik.handleChange("field_position")}
              onBlur={formik.handleBlur("field_position")}
            >
              <option value="">Selecciona la opción</option>
              <option value="goalkeeper">Arquero</option>
              <option value="defender">Defensor</option>
              <option value="midfielder">Volante</option>
              <option value="forward">Delantero</option>
            </select>
            <div className="error-message">{formik.errors.field_position}</div>
          </div>

          <div className="ctr-field">
            <label>Rol</label>
            <select
              name="role"
              value={formik.values.role ?? ""}
              onChange={formik.handleChange("role")}
              onBlur={formik.handleBlur("role")}
            >
              <option value="">Selecciona la opción</option>
              <option value="team">Jugador fijo</option>
              <option value="extra">Refuerzo</option>
              <option value="supporter">Hinchada</option>
            </select>
            <div className="error-message">{formik.errors.role}</div>
          </div>
        </div>

        <div className="ctr-field plf-bio-wrap">
          <label>Bio (máx. 1.000 caracteres)</label>
          <textarea
            name="bio"
            value={formik.values.bio ?? ""}
            onChange={formik.handleChange("bio")}
            onBlur={formik.handleBlur("bio")}
            maxLength={1000}
            rows={5}
          />
          <span className="plf-bio-counter">
            {formik.values.bio ? formik.values.bio?.length : 0}/1000
          </span>
        </div>

        <div className="ctr-field plf-quill-wrap">
          <label>Entrevista</label>
          <ReactQuill
            value={interview}
            onChange={handleChangeInterview}
            modules={toolbarReactQuill}
          />
        </div>

        <button className="ctr-submit-btn" type="submit">
          Guardar cambios
        </button>
      </form>
    </div>
  );
};

export default PlayersUpdate;
