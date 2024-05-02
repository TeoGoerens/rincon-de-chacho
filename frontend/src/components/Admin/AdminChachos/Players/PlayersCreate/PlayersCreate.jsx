//Import React & Hooks
import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Navigate, Link } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import helpers
import { toolbarReactQuill } from "../../../../../helpers/reactQuillModules";

//Import CSS & styles
import "./PlayersCreateStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { createPlayerAction } from "../../../../../redux/slices/players/playersSlices";

//Form schema
const formSchema = Yup.object({
  shirt: Yup.number().required(
    "Por favor chacal escribi el numero de camiseta del jugador"
  ),
  first_name: Yup.string().required(
    "Por favor chacal escribi el nombre del jugador"
  ),
  last_name: Yup.string().required(
    "Por favor chacal escribi el apellido del jugador"
  ),
  field_position: Yup.string().required(
    "Por favor chacal escribi la posicion del jugador"
  ),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const PlayersCreate = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Formik configuration
  const formik = useFormik({
    initialValues: {},
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(createPlayerAction(values));
    },
    validationSchema: formSchema,
  });

  //Define the features of React Quill
  const [interview, setInterview] = useState("");
  const handleChangeInterview = (value) => {
    setInterview(value);
    formik.values.interview = value;
  };

  //Select state from store
  const storeData = useSelector((store) => store.players);
  const { appError, serverError } = storeData;

  //Navigate to index in case there is an updated category
  if (storeData?.isCreated) return <Navigate to="/admin/chachos/players" />;

  return (
    <div className="container create-player-container">
      <div className="create-player-title">
        <h2>Crear jugador de Chachos</h2>
        <Link className="return-link" to="/admin/chachos/players">
          Volver
        </Link>
      </div>

      {appError || serverError ? (
        <h5 className="error-message">{appError}</h5>
      ) : null}

      <form className="create-player-form" onSubmit={formik.handleSubmit}>
        <label>Camiseta</label>
        <input
          value={formik.values.shirt}
          onChange={formik.handleChange("shirt")}
          onBlur={formik.handleBlur("shirt")}
          type="text"
          name="shirt"
        ></input>
        <div className="error-message">{formik.errors.shirt}</div>
        <label>Nombre</label>
        <input
          value={formik.values.first_name}
          onChange={formik.handleChange("first_name")}
          onBlur={formik.handleBlur("first_name")}
          type="text"
          name="first_name"
        ></input>
        <div className="error-message">{formik.errors.first_name}</div>
        <label>Apellido</label>
        <input
          value={formik.values.last_name}
          onChange={formik.handleChange("last_name")}
          onBlur={formik.handleBlur("last_name")}
          type="text"
          name="last_name"
        ></input>
        <div className="error-message">{formik.errors.last_name}</div>
        <label>Posición</label>
        <input
          value={formik.values.field_position}
          onChange={formik.handleChange("field_position")}
          onBlur={formik.handleBlur("field_position")}
          type="text"
          name="field_position"
        ></input>
        <div className="error-message">{formik.errors.field_position}</div>
        <label>Rol</label>
        <select
          name="role"
          value={formik.values.role}
          onChange={formik.handleChange("role")}
          onBlur={formik.handleBlur("role")}
        >
          <option value="">Selecciona la opción</option>
          <option value="team">Jugador fijo</option>
          <option value="extra">Refuerzo</option>
          <option value="supporter">Hinchada</option>
        </select>

        <label>Bio (max 1.000 caracteres)</label>
        <div className="create-player-form-bio">
          <textarea
            name="bio"
            value={formik.values.bio}
            onChange={formik.handleChange("bio")}
            onBlur={formik.handleBlur("bio")}
            maxLength={1000}
            rows={5}
            cols={50}
          />
          <p>{formik.values.bio ? formik.values.bio?.length : 0}/1000</p>
        </div>
        <label>Entrevista</label>
        <ReactQuill
          value={interview}
          onChange={handleChangeInterview}
          modules={toolbarReactQuill}
        />

        <button type="submit">Crear jugador</button>
      </form>
    </div>
  );
};

export default PlayersCreate;
