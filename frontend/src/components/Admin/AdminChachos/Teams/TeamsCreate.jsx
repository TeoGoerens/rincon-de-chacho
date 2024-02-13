//Import React & Hooks
import React from "react";
import { Navigate } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { createTeamAction } from "../../../../redux/slices/teams/teamsSlices";

//Form schema
const formSchema = Yup.object({
  avatar: Yup.string(),
  name: Yup.string().required("Por favor chacal escribi el nombre del equipo"),
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

  //Navigate to index in case there is an updated category
  if (storeData?.isCreated) return <Navigate to="/admin/chachos/teams" />;

  return (
    <>
      <h2>Crear equipo</h2>
      {appError || serverError ? <h5>{appError}</h5> : null}

      <form onSubmit={formik.handleSubmit}>
        <label>Avatar</label>
        <input
          value={formik.values.avatar}
          onChange={formik.handleChange("avatar")}
          onBlur={formik.handleBlur("avatar")}
          type="text"
          name="avatar"
        ></input>
        <div>{formik.touched.avatar && formik.errors.avatar}</div>
        <label>Nombre</label>
        <input
          value={formik.values.name}
          onChange={formik.handleChange("name")}
          onBlur={formik.handleBlur("name")}
          type="text"
          name="name"
        ></input>
        <div>{formik.touched.name && formik.errors.name}</div>

        <button type="submit">Crear equipo</button>
      </form>
    </>
  );
};

export default TeamsCreate;
