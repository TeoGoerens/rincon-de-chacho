//Import React & Hooks
import React, { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import {
  getTeamAction,
  updateTeamAction,
} from "../../../../redux/slices/teams/teamsSlices";

//Form schema
const formSchema = Yup.object({
  avatar: Yup.string(),
  name: Yup.string().required("Por favor chacal escribi el nombre del equipo"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TeamsUpdate = () => {
  const { id } = useParams();

  //Dispatch const creation
  const dispatch = useDispatch();

  //Get category information from database every time the component renders
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

  //Navigate to index in case there is an updated category
  if (storeData?.isEdited) return <Navigate to="/admin/chachos/teams" />;

  return (
    <>
      <h2>Editar equipo</h2>
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

        <button type="submit">Editar equipo</button>
      </form>
    </>
  );
};

export default TeamsUpdate;
