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
import "./PlayersUpdateStyle.css";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import {
  getPlayerAction,
  updatePlayerAction,
} from "../../../../../redux/slices/players/playersSlices";

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
  nickname: Yup.string().required(
    "Por favor chacal escribi el apodo del jugador"
  ),
  email: Yup.string().required("Por favor chacal escribi el mail del jugador"),
  field_position: Yup.string().required(
    "Por favor chacal escribi la posicion del jugador"
  ),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const PlayersUpdate = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get category information from database every time the component renders
  useEffect(() => {
    dispatch(getPlayerAction(id));
  }, [dispatch, id]);

  //Select state from store
  const storeData = useSelector((store) => store.players);
  const { appError, serverError } = storeData;
  const shirt = storeData?.player?.player?.shirt;
  const first_name = storeData?.player?.player?.first_name;
  const last_name = storeData?.player?.player?.last_name;
  const nickname = storeData?.player?.player?.nickname;
  const email = storeData?.player?.player?.email;
  const field_position = storeData?.player?.player?.field_position;
  const is_permanent = storeData?.player?.player?.is_permanent;
  const bio = storeData?.player?.player?.bio;
  const interviewFromDB = storeData?.player?.player?.interview;

  //Define the features of React Quill
  const [interview, setInterview] = useState("");
  useEffect(() => {
    setInterview(interviewFromDB);
  }, [interviewFromDB]);

  const handleChangeInterview = (value) => {
    setInterview(value);
    formik.values.interview = value;
  };

  //Formik configuration
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      shirt,
      first_name,
      last_name,
      nickname,
      email,
      field_position,
      is_permanent,
      bio,
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(
        updatePlayerAction({
          shirt: values.shirt,
          first_name: values.first_name,
          last_name: values.last_name,
          nickname: values.nickname,
          email: values.email,
          field_position: values.field_position,
          is_permanent: values.is_permanent,
          bio: values.bio,
          interview: interview,
          id,
        })
      );
    },
    validationSchema: formSchema,
  });

  //Navigate to index in case there is an updated category
  if (storeData?.isEdited) return <Navigate to="/admin/chachos/players" />;

  return (
    <div className="container update-player-container">
      <div className="update-player-title">
        <h2>Editar jugador de Chachos</h2>
        <Link className="return-link" to="/admin/chachos/players">
          Volver
        </Link>
      </div>

      {appError || serverError ? (
        <h5 className="error-message">{appError}</h5>
      ) : null}
      <form className="update-player-form" onSubmit={formik.handleSubmit}>
        <label>Camiseta</label>
        <input
          value={formik.values.shirt}
          onChange={formik.handleChange("shirt")}
          onBlur={formik.handleBlur("shirt")}
          type="text"
          name="shirt"
        ></input>
        <div>{formik.errors.shirt}</div>
        <label>Nombre</label>
        <input
          value={formik.values.first_name}
          onChange={formik.handleChange("first_name")}
          onBlur={formik.handleBlur("first_name")}
          type="text"
          name="first_name"
        ></input>
        <div>{formik.errors.first_name}</div>
        <label>Apellido</label>
        <input
          value={formik.values.last_name}
          onChange={formik.handleChange("last_name")}
          onBlur={formik.handleBlur("last_name")}
          type="text"
          name="last_name"
        ></input>
        <div>{formik.errors.last_name}</div>
        <label>Apodo</label>
        <input
          value={formik.values.nickname}
          onChange={formik.handleChange("nickname")}
          onBlur={formik.handleBlur("nickname")}
          type="text"
          name="nickname"
        ></input>
        <div>{formik.errors.nickname}</div>
        <label>Email</label>
        <input
          value={formik.values.email}
          onChange={formik.handleChange("email")}
          onBlur={formik.handleBlur("email")}
          type="text"
          name="email"
        ></input>
        <div>{formik.errors.email}</div>
        <label>Posicion</label>
        <input
          value={formik.values.field_position}
          onChange={formik.handleChange("field_position")}
          onBlur={formik.handleBlur("field_position")}
          type="text"
          name="field_position"
        ></input>
        <div>{formik.errors.field_position}</div>

        <label>¿Es jugador fijo?</label>
        <select
          name="is_permanent"
          value={formik.values.is_permanent}
          onChange={formik.handleChange("is_permanent")}
          onBlur={formik.handleBlur("is_permanent")}
        >
          <option value="">Selecciona la opción</option>
          <option value="true">Si</option>
          <option value="false">No</option>
        </select>

        <label>Bio (max 1.000 caracteres)</label>
        <div className="update-player-form-bio">
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

        <button type="submit">Editar jugador</button>
      </form>
    </div>
  );
};

export default PlayersUpdate;
