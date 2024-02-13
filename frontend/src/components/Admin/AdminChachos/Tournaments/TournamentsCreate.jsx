//Import React & Hooks
import React from "react";
import { Navigate } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { createTournamentAction } from "../../../../redux/slices/tournaments/tournamentsSlices";

//Import components
import CategoryDropdown from "../../../Layout/Dropdown/Category/CategoryDropdown";

//Form schema
const formSchema = Yup.object({
  category: Yup.string().required(
    "Por favor chacal elegi la categoria del torneo"
  ),
  name: Yup.string().required("Por favor chacal escribi el nombre del torneo"),
  year: Yup.number().required("Por favor chacal escribi el año del torneo"),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const TournamentsCreate = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Formik configuration
  const formik = useFormik({
    initialValues: {},
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(createTournamentAction(values));
    },
    validationSchema: formSchema,
  });

  //Select state from store
  const storeData = useSelector((store) => store.tournaments);
  const { appError, serverError } = storeData;

  //Navigate to index in case there is an updated category
  if (storeData?.isCreated) return <Navigate to="/admin/chachos/tournaments" />;

  return (
    <>
      <h2>Crear torneo</h2>
      {appError || serverError ? <h5>{appError}</h5> : null}

      <form onSubmit={formik.handleSubmit}>
        <label>Nombre</label>
        <input
          value={formik.values.name}
          onChange={formik.handleChange("name")}
          onBlur={formik.handleBlur("name")}
          type="text"
          name="name"
        ></input>
        <div>{formik.touched.name && formik.errors.name}</div>

        <CategoryDropdown
          field={{
            value: formik.values.category,
            onBlur: formik.handleBlur("category"),
          }}
          form={formik}
        />

        <label>Año</label>
        <input
          value={formik.values.year}
          onChange={formik.handleChange("year")}
          onBlur={formik.handleBlur("year")}
          type="text"
          name="year"
        ></input>
        <div>{formik.touched.year && formik.errors.year}</div>

        <button type="submit">Crear torneo</button>
      </form>
    </>
  );
};

export default TournamentsCreate;
