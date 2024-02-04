//Import React & Hooks
import React from "react";
import { Navigate } from "react-router-dom";

//Import Formik & Yup
import { useFormik } from "formik";
import * as Yup from "yup";

//Import redux
import { useDispatch, useSelector } from "react-redux";
import { createCategoryAction } from "../../../redux/slices/football-categories/footballCategoriesSlices";

//Form schema
const formSchema = Yup.object({
  name: Yup.string().required(
    "Por favor chacal escribi el nombre de la categoria"
  ),
});

//----------------------------------------
//COMPONENT
//----------------------------------------

const FootballCategoriesCreate = () => {
  //Dispatch const creation
  const dispatch = useDispatch();

  //Formik configuration
  const formik = useFormik({
    initialValues: {
      name: "",
    },
    onSubmit: (values) => {
      //Dispatch the action
      dispatch(createCategoryAction(values));
    },
    validationSchema: formSchema,
  });

  //Select state from store
  const storeData = useSelector((store) => store.categories);
  const { appError, serverError } = storeData;

  //Navigate to index in case there is an updated category
  if (storeData?.isCreated)
    return <Navigate to="/admin/chachos/football-categories" />;

  return (
    <>
      <h2>Crear categoria</h2>
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

        <button type="submit">Crear categoria</button>
      </form>
    </>
  );
};

export default FootballCategoriesCreate;
