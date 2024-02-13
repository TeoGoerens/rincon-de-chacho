//Import React & Hooks
import React from "react";
import { Navigate } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { createPlayerAction } from "../../../../redux/slices/players/playersSlices";

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

  //Select state from store
  const storeData = useSelector((store) => store.players);
  const { appError, serverError } = storeData;

  //Navigate to index in case there is an updated category
  if (storeData?.isCreated) return <Navigate to="/admin/chachos/players" />;

  return (
    <>
      <h2>Crear jugador</h2>
      {appError || serverError ? <h5>{appError}</h5> : null}

      <form onSubmit={formik.handleSubmit}>
        <label>Camiseta</label>
        <input
          value={formik.values.shirt}
          onChange={formik.handleChange("shirt")}
          onBlur={formik.handleBlur("shirt")}
          type="text"
          name="shirt"
        ></input>
        <div>{formik.touched.shirt && formik.errors.shirt}</div>
        <label>Nombre</label>
        <input
          value={formik.values.first_name}
          onChange={formik.handleChange("first_name")}
          onBlur={formik.handleBlur("first_name")}
          type="text"
          name="first_name"
        ></input>
        <div>{formik.touched.first_name && formik.errors.first_name}</div>
        <label>Apellido</label>
        <input
          value={formik.values.last_name}
          onChange={formik.handleChange("last_name")}
          onBlur={formik.handleBlur("last_name")}
          type="text"
          name="last_name"
        ></input>
        <div>{formik.touched.last_name && formik.errors.last_name}</div>
        <label>Apodo</label>
        <input
          value={formik.values.nickname}
          onChange={formik.handleChange("nickname")}
          onBlur={formik.handleBlur("nickname")}
          type="text"
          name="nickname"
        ></input>
        <div>{formik.touched.nickname && formik.errors.nickname}</div>
        <label>Email</label>
        <input
          value={formik.values.email}
          onChange={formik.handleChange("email")}
          onBlur={formik.handleBlur("email")}
          type="text"
          name="email"
        ></input>
        <div>{formik.touched.email && formik.errors.email}</div>
        <label>Posicion</label>
        <input
          value={formik.values.field_position}
          onChange={formik.handleChange("field_position")}
          onBlur={formik.handleBlur("field_position")}
          type="text"
          name="field_position"
        ></input>
        <div>
          {formik.touched.field_position && formik.errors.field_position}
        </div>

        <button type="submit">Crear jugador</button>
      </form>
    </>
  );
};

export default PlayersCreate;
